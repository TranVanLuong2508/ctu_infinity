import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as mammoth from 'mammoth';
import { EventTemplate } from './entities/event-template.entity';
import { CreateEventTemplateDto } from './dto/create-event-template.dto';
import { UpdateEventTemplateDto } from './dto/update-event-template.dto';
import { ApplyTemplateDto } from './dto/apply-template.dto';
import { validateUUID } from 'src/common/validateUUID';

@Injectable()
export class EventTemplateService {
  constructor(
    @InjectRepository(EventTemplate)
    private readonly repo: Repository<EventTemplate>,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  /** trích xuất các biến dạng {{variable}} từ một chuỗi text và trả về danh sách các biến không trùng nhau */
  private parseVariables(content: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const vars = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = regex.exec(content)) !== null) vars.add(m[1]);
    return Array.from(vars);
  }

  /** Replace {{variable}} with actual values */
  private applyVars(content: string, data: Record<string, string | number | undefined>): string {
    return content.replace(/\{\{(\w+)\}\}/g, (_, k) =>
      data[k] !== undefined ? String(data[k]) : `{{${k}}}`,
    );
  }

  /** Format ISO date string to Vietnamese locale */
  private formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /** Convert uploaded file buffer to markdown string */
  private async fileToMarkdown(
    buffer: Buffer,
    mimetype: string,
    originalname: string,
  ): Promise<string> {
    const isDocx =
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      originalname.endsWith('.docx');

    if (isDocx) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    if (
      ['text/plain', 'text/markdown'].includes(mimetype) ||
      originalname.endsWith('.md') ||
      originalname.endsWith('.txt')
    ) {
      return buffer.toString('utf-8');
    }

    throw new BadRequestException('Unsupported file type. Only .md, .txt, .docx are accepted.');
  }

  /** [MOCK] Generate description via AI. Replace with real OpenAI call in prod. */
  async generateWithAI(
    prompt: string,
    templateContent: string,
    data: Record<string, string | number | undefined>,
  ): Promise<string> {
    const applied = this.applyVars(templateContent, data);
    return `${applied}\n\n---\n> *📝 Ghi chú AI: "${prompt}"*`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD
  // ─────────────────────────────────────────────────────────────────────────

  async create(dto: CreateEventTemplateDto) {
    try {
      const variables = this.parseVariables(dto.content);
      const entity = this.repo.create({ ...dto, variables });
      const saved = await this.repo.save(entity);
      return { EC: 1, EM: 'Create template successfully', template: saved };
    } catch (error) {
      console.error('Create template error:', error.message);
      throw new InternalServerErrorException('An error occurred while creating template');
    }
  }

  async importFromFile(
    buffer: Buffer,
    mimetype: string,
    originalname: string,
    name: string,
    type?: string,
    organizerId?: string,
  ) {
    try {
      const content = await this.fileToMarkdown(buffer, mimetype, originalname);
      const variables = this.parseVariables(content);
      const entity = this.repo.create({ name, type, organizerId, content, variables });
      const saved = await this.repo.save(entity);
      return { EC: 1, EM: 'Import template successfully', template: saved };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Import template error:', error.message);
      throw new InternalServerErrorException('An error occurred while importing template');
    }
  }

  async findAll(organizerId?: string) {
    try {
      const where = organizerId ? { organizerId } : {};
      const templates = await this.repo.find({
        where,
        order: { createdAt: 'DESC' },
      });
      return { EC: 1, EM: 'Fetch templates successfully', templates };
    } catch (error) {
      console.error('Fetch templates error:', error.message);
      throw new InternalServerErrorException('An error occurred while fetching templates');
    }
  }

  async findOne(id: string) {
    try {
      validateUUID(id, 'template ID');
      const template = await this.repo.findOne({ where: { id } });
      if (!template) throw new NotFoundException('Template not found');
      return { EC: 1, EM: 'Find template successfully', template };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('An error occurred while finding template');
    }
  }

  async update(id: string, dto: UpdateEventTemplateDto) {
    try {
      validateUUID(id, 'template ID');
      const existing = await this.repo.findOne({ where: { id } });
      if (!existing) throw new NotFoundException('Template not found');
      const variables = dto.content ? this.parseVariables(dto.content) : existing.variables;
      await this.repo.update({ id }, { ...dto, variables });
      return { EC: 1, EM: 'Update template successfully', updated: { id } };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('An error occurred while updating template');
    }
  }

  async remove(id: string) {
    try {
      validateUUID(id, 'template ID');
      const existing = await this.repo.findOne({ where: { id } });
      if (!existing) throw new NotFoundException('Template not found');
      await this.repo.delete({ id });
      return { EC: 1, EM: 'Delete template successfully', deleted: { id } };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('An error occurred while deleting template');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // APPLY TEMPLATE → generate event description
  // ─────────────────────────────────────────────────────────────────────────

  async applyAndGenerate(dto: ApplyTemplateDto) {
    try {
      validateUUID(dto.templateId, 'template ID');
      const template = await this.repo.findOne({ where: { id: dto.templateId } });
      if (!template) throw new NotFoundException('Template not found');

      const data: Record<string, string | number | undefined> = {
        eventName: dto.eventName,
        organizer: dto.organizer,
        location: dto.location,
        startDate: dto.startDate ? this.formatDate(dto.startDate) : undefined,
        endDate: dto.endDate ? this.formatDate(dto.endDate) : undefined,
        maxParticipants: dto.maxParticipants,
      };

      let description: string;
      let usedAI = false;

      if (dto.aiPrompt) {
        description = await this.generateWithAI(dto.aiPrompt, template.content, data);
        usedAI = true;
      } else {
        description = this.applyVars(template.content, data);
      }

      return {
        EC: 1,
        EM: 'Generate description successfully',
        description,
        usedAI,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Apply template error:', error.message);
      throw new InternalServerErrorException('An error occurred while generating description');
    }
  }
}
