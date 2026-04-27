import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { EventTemplateService } from './event-template.service';
import { CreateEventTemplateDto } from './dto/create-event-template.dto';
import { UpdateEventTemplateDto } from './dto/update-event-template.dto';
import { ApplyTemplateDto } from './dto/apply-template.dto';
import { Public, ResponseMessage } from 'src/decorators/customize';

@Controller('event-templates')
export class EventTemplateController {
  constructor(private readonly eventTemplateService: EventTemplateService) { }

  /** POST /event-templates — create from raw markdown */
  @Post()
  @Public()
  @ResponseMessage('Create event template')
  create(@Body() dto: CreateEventTemplateDto) {
    return this.eventTemplateService.create(dto);
  }

  /** POST /event-templates/import — upload .md/.txt/.docx → convert → save */
  @Post('import')
  @Public()
  @ResponseMessage('Import template from file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok =
          ['text/plain', 'text/markdown',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ].includes(file.mimetype) ||
          /\.(md|txt|docx)$/.test(file.originalname);
        ok ? cb(null, true) : cb(new Error('Only .md, .txt, .docx allowed'), false);
      },
    }),
  )
  importFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Body('type') type?: string,
    @Body('organizerId') organizerId?: string,
  ) {
    return this.eventTemplateService.importFromFile(
      file.buffer, file.mimetype, file.originalname,
      name, type, organizerId,
    );
  }

  /** GET /event-templates?organizerId= */
  @Get()
  @Public()
  @ResponseMessage('Get all event templates')
  findAll(@Query('organizerId') organizerId?: string) {
    return this.eventTemplateService.findAll(organizerId);
  }

  /** GET /event-templates/:id */
  @Get(':id')
  @Public()
  @ResponseMessage('Get event template by ID')
  findOne(@Param('id') id: string) {
    return this.eventTemplateService.findOne(id);
  }

  /** PATCH /event-templates/:id */
  @Patch(':id')
  @Public()
  @ResponseMessage('Update event template')
  update(@Param('id') id: string, @Body() dto: UpdateEventTemplateDto) {
    return this.eventTemplateService.update(id, dto);
  }

  /** DELETE /event-templates/:id */
  @Delete(':id')
  @Public()
  @ResponseMessage('Delete event template')
  remove(@Param('id') id: string) {
    return this.eventTemplateService.remove(id);
  }

  /** POST /event-templates/apply — inject vars + optional AI */
  @Post('apply')
  @Public()
  @ResponseMessage('Apply template and generate description')
  apply(@Body() dto: ApplyTemplateDto) {
    return this.eventTemplateService.applyAndGenerate(dto);
  }
}
