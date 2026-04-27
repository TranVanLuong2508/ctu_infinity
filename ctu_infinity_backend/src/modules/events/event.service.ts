import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ApproveEventDto } from './dto/approve-event.dto';
import { Event, EVENT_STATUS } from './entities/event.entity';
import { EventCategory } from 'src/modules/event_category/entities/event_category.entity';
import { CriteriasService } from 'src/modules/criterias/criterias.service';
import { ApiConfigService } from 'src/shared/services/api-config.service';
import { excludeFields, filterResponse } from 'src/common/filerRespone';
import { generateUniqueSlug } from 'src/common/generateSlug';
import { validateUUID } from 'src/common/validateUUID';
import {
  EventRegistration,
  REGISTRATION_STATUS,
} from 'src/modules/event-registration/entities/event-registration.entity';
import { Student } from 'src/modules/students/entities/student.entity';
import { EmailQueueService } from 'src/modules/email/email.queue.service';
import { SubscriptionsService } from 'src/modules/subscriptions/subscriptions.service';
import { Semester } from 'src/modules/semesters/entities/semester.entity';

const ACTIVE_SLOT_STATUSES = new Set([
  REGISTRATION_STATUS.REGISTERED,
  REGISTRATION_STATUS.ATTENDED,
]);

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  /**
   * Tìm semester phù hợp dựa trên startDate của event.
   * Nếu event.startDate nằm trong khoảng [startDate, endDate] của semester → trả về semester đó.
   */
  private async findSemesterByEventDate(eventStartDate: Date): Promise<string | null> {
    const semesters = await this.semesterRepository.find();
    for (const sem of semesters) {
      if (sem.startDate && sem.endDate) {
        const start = new Date(sem.startDate);
        const end = new Date(sem.endDate);
        const evtDate = new Date(eventStartDate);
        if (evtDate >= start && evtDate <= end) {
          return sem.semesterId;
        }
      }
    }
    // Fallback: lấy semester hiện tại
    const currentSem = semesters.find((s) => s.isCurrent);
    return currentSem?.semesterId ?? null;
  }

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(EventCategory)
    private readonly categoryRepository: Repository<EventCategory>,
    @InjectRepository(EventRegistration)
    private readonly eventRegistrationRepository: Repository<EventRegistration>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Semester)
    private readonly semesterRepository: Repository<Semester>,
    private readonly criteriasService: CriteriasService,
    private readonly jwtService: JwtService,
    private readonly configService: ApiConfigService,
    private readonly emailQueueService: EmailQueueService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  // ─── CREATE ───────────────────────────────────────────────────────────────────

  async create(createEventDto: CreateEventDto, userId?: string) {
    try {
      const newSlug = generateUniqueSlug(createEventDto.eventName);

      const existingEvent = await this.eventRepository.findOne({
        where: { eventSlug: newSlug },
      });

      if (existingEvent) {
        return {
          EC: 0,
          EM: `Sự kiện với tên "${createEventDto.eventName}" đã tồn tại`,
        };
      }

      // Lấy categories nếu có categoryIds
      let categories: EventCategory[] = [];
      if (createEventDto.categoryIds && createEventDto.categoryIds.length > 0) {
        categories = await this.categoryRepository.find({
          where: { categoryId: In(createEventDto.categoryIds) as any },
        });
      }

      const { categoryIds, ...eventData } = createEventDto;

      const newEvent = this.eventRepository.create({
        ...eventData,
        eventSlug: newSlug,
        status: EVENT_STATUS.DRAFT, // Bắt đầu bằng DRAFT, cần đăng ký duyệt
        criteriaId: null,
        score: null,
        categories, // Gán categories
        createdBy: userId || null, // Lưu user ID của người tạo
        approvedBy: null,
        approvedAt: null,
      });

      const savedEvent = await this.eventRepository.save(newEvent);
      const dataReturn = filterResponse(savedEvent, ['eventId', 'createdAt']);

      return {
        EC: 1,
        EM: 'Tạo sự kiện thành công',
        ...dataReturn,
      };
    } catch (error) {
      console.error('Error creating event:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi tạo sự kiện' });
    }
  }

  // ─── SUBMIT FOR APPROVAL (Organizer) ──────────────────────────────────────────

  /**
   * Organizer đăng ký duyệt sự kiện: chuyển từ DRAFT → PENDING
   */
  async submitForApproval(eventId: string) {
    try {
      validateUUID(eventId, 'event ID');

      const event = await this.eventRepository.findOne({ where: { eventId } });

      if (!event) {
        throw new NotFoundException({ EC: 0, EM: 'Không tìm thấy sự kiện' });
      }

      if (event.status !== EVENT_STATUS.DRAFT) {
        throw new BadRequestException({
          EC: 0,
          EM: `Không thể đăng ký duyệt sự kiện với trạng thái hiện tại: ${event.status}`,
        });
      }

      await this.eventRepository.update({ eventId }, { status: EVENT_STATUS.PENDING });

      return {
        EC: 1,
        EM: 'Đăng ký duyệt sự kiện thành công',
        updated: { eventId, status: EVENT_STATUS.PENDING },
      };
    } catch (error) {
      console.error('Error submitting event for approval:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi đăng ký duyệt sự kiện' });
    }
  }

  // ─── APPROVE EVENT (Admin) ────────────────────────────────────────────────────

  /**
   * Admin duyệt sự kiện:
   *  1. Kiểm tra sự kiện tồn tại và đang ở trạng thái PENDING
   *  2. Lấy criteria tương ứng để lấy maxScore
   *  3. Validate score <= maxScore (throw BadRequestException nếu vi phạm)
   *  4. Cập nhật status = APPROVED, lưu criteriaId, score, approvedBy và approvedAt
   */
  async approveEvent(eventId: string, dto: ApproveEventDto, userId?: string) {
    try {
      validateUUID(eventId, 'event ID');

      const event = await this.eventRepository.findOne({ where: { eventId } });

      if (!event) {
        throw new NotFoundException({ EC: 0, EM: 'Không tìm thấy sự kiện' });
      }

      if (event.status !== EVENT_STATUS.PENDING) {
        throw new BadRequestException({
          EC: 0,
          EM: `Không thể duyệt sự kiện với trạng thái hiện tại: ${event.status}`,
        });
      }

      // Lấy criteria để kiểm tra maxScore
      const criteriaData = await this.criteriasService.findOne(dto.criteriaId);
      if (!criteriaData || criteriaData.EC === 0) {
        throw new NotFoundException({ EC: 0, EM: 'Không tìm thấy tiêu chí' });
      }

      const criteria = criteriaData as any;
      const rawMaxScore = criteria.maxScore ?? criteria.criteriaData?.maxScore;
      const maxScore =
        rawMaxScore === null || rawMaxScore === undefined ? null : Number(rawMaxScore);

      if (
        maxScore !== null &&
        (!Number.isFinite(maxScore) || !Number.isInteger(maxScore) || maxScore < 0)
      ) {
        throw new BadRequestException({
          EC: 0,
          EM: 'maxScore của tiêu chí không hợp lệ',
        });
      }

      if (!Number.isInteger(dto.score) || dto.score < 0) {
        throw new BadRequestException({
          EC: 0,
          EM: 'score phải là số nguyên không âm',
        });
      }

      // Bắt buộc: score không được vượt quá maxScore của criteria
      if (maxScore !== null && dto.score > maxScore) {
        throw new BadRequestException({
          EC: 0,
          EM: `Số điểm (${dto.score}) vượt quá maxScore của tiêu chí (${maxScore})`,
        });
      }

      // Tự động xác định semesterId từ startDate của event
      const semesterId = await this.findSemesterByEventDate(event.startDate);

      await this.eventRepository.update(
        { eventId },
        {
          status: EVENT_STATUS.APPROVED,
          criteriaId: dto.criteriaId,
          score: dto.score,
          approvedBy: userId || null,
          approvedAt: new Date(),
          semesterId,
        },
      );

      // Load lại event đầy đủ sau khi update để có categories, organizer và criteria cho email
      const approvedEvent = await this.eventRepository.findOne({
        where: { eventId },
        relations: ['categories', 'organizer', 'criteria'],
      });

      // Fire-and-forget: gửi email thông báo tới subscribers, không block response
      if (approvedEvent) {
        this.sendApprovalNotificationsAsync(approvedEvent, dto).catch((err) =>
          this.logger.error('[approveEvent] Failed to send approval notifications:', err?.message),
        );
      }

      return {
        EC: 1,
        EM: 'Duyệt sự kiện thành công',
        updated: {
          eventId,
          status: EVENT_STATUS.APPROVED,
          criteriaId: dto.criteriaId,
          score: dto.score,
          approvedBy: userId,
          approvedAt: new Date(),
          semesterId,
        },
      };
    } catch (error) {
      console.error('Error approving event:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi duyệt sự kiện' });
    }
  }

  /**
   * Gửi email thông báo tới tất cả subscribers phù hợp sau khi sự kiện được duyệt.
   * Chạy bất đồng bộ – KHÔNG ảnh hưởng tới response của approveEvent().
   *
   * Logic match:
   *  1. Match theo criteriaId: sinh viên đăng ký theo dõi tiêu chí mà sự kiện vừa được gán.
   *  2. Match theo category: sinh viên đăng ký theo dõi bất kỳ danh mục nào của sự kiện.
   * Dùng Set để loại trùng (một sinh viên có thể match cả hai loại).
   */
  private async sendApprovalNotificationsAsync(
    event: Event,
    dto: ApproveEventDto,
  ): Promise<void> {
    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:3001';
    const eventUrl = `${clientUrl}/events/${event.eventId}`;
    const formatDateTime = (dateStr: Date | null | undefined) => {
      if (!dateStr) return null;
      return new Date(dateStr).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    };

    const startDateStr = formatDateTime(event.startDate)!;
    const endDateStr = formatDateTime(event.endDate)!;
    const deadlineStr = formatDateTime(event.registrationDeadline);

    // Map studentId → tích lũy tất cả lý do match
    const jobMap = new Map<
      string,
      { email: string; fullName: string; criteriaMatch?: string; categoryMatches: Set<string> }
    >();

    const getOrCreate = (studentId: string, email: string, fullName: string) => {
      if (!jobMap.has(studentId)) {
        jobMap.set(studentId, { email, fullName, categoryMatches: new Set() });
      }
      return jobMap.get(studentId)!;
    };

    // ─── Match theo tiêu chí (criteria) ────────────────────────────────────────
    if (dto.criteriaId) {
      try {
        const criteriaResult = await this.subscriptionsService.getSubscribersByCriteria(
          dto.criteriaId,
        );
        const subscribers = (criteriaResult as any)?.data ?? [];

        for (const sub of subscribers) {
          if (!sub.email) continue;
          const entry = getOrCreate(sub.studentId, sub.email, sub.fullName ?? 'Bạn');
          entry.criteriaMatch = event.criteria
            ? `${event.criteria.criteriaCode} - ${event.criteria.criteriaName}`
            : dto.criteriaId;
        }
      } catch (err) {
        this.logger.warn('[sendApprovalNotificationsAsync] Failed to get criteria subscribers:', err?.message);
      }
    }

    // ─── Match theo danh mục (category) ────────────────────────────────────────
    const categoryIds = (event.categories ?? []).map((c) => String(c.categoryId));
    for (const categoryId of categoryIds) {
      try {
        const categoryResult = await this.subscriptionsService.getSubscribersByCategory(categoryId);
        const subscribers = (categoryResult as any)?.data ?? [];
        const category = event.categories?.find((c) => c.categoryId === categoryId);

        const categoryName = category?.categoryName ? String(category.categoryName) : categoryId;

        for (const sub of subscribers) {
          if (!sub.email) continue;
          const entry = getOrCreate(sub.studentId, sub.email, sub.fullName ?? 'Bạn');
          entry.categoryMatches.add(categoryName);
        }
      } catch (err) {
        this.logger.warn(
          `[sendApprovalNotificationsAsync] Failed to get category (${categoryId}) subscribers:`,
          err?.message,
        );
      }
    }

    if (jobMap.size === 0) {
      this.logger.log(`[sendApprovalNotificationsAsync] No subscribers found for event: ${event.eventId}`);
      return;
    }

    this.logger.log(
      `[sendApprovalNotificationsAsync] Queueing ${jobMap.size} email(s) for event: ${event.eventName}`,
    );

    // Add jobs vào queue – 1 email/sinh viên với đầy đủ lý do match
    const jobs = Array.from(jobMap.entries()).map(([, info]) =>
      this.emailQueueService.addEventApprovedNotificationJob({
        to: info.email,
        studentName: info.fullName,
        eventName: event.eventName,
        startDate: startDateStr,
        endDate: endDateStr,
        registrationDeadline: deadlineStr,
        eventLocation: event.location ?? 'Chưa cập nhật',
        organizerName: event.organizer?.organizerName,
        criteriaMatch: info.criteriaMatch,
        categoryMatches: Array.from(info.categoryMatches),
        criteriaName: event.criteria?.criteriaName,
        criteriaCode: event.criteria?.criteriaCode,
        score: dto.score,
        eventUrl,
      }),
    );

    await Promise.allSettled(jobs);
  }

  // ─── REJECT EVENT (Admin)

  async rejectEvent(eventId: string) {
    try {
      validateUUID(eventId, 'event ID');

      const event = await this.eventRepository.findOne({ where: { eventId } });

      if (!event) {
        throw new NotFoundException({ EC: 0, EM: 'Không tìm thấy sự kiện' });
      }

      await this.eventRepository.update({ eventId }, { status: EVENT_STATUS.REJECTED });

      return {
        EC: 1,
        EM: 'Từ chối sự kiện thành công',
        updated: { eventId, status: EVENT_STATUS.REJECTED },
      };
    } catch (error) {
      console.error('Error rejecting event:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi từ chối sự kiện' });
    }
  }

  //  READ

  async findAll(
    createdBy?: string,
    organizerId?: string,
  ) {
    try {
      const where: any = {};
      if (createdBy) where.createdBy = createdBy;
      if (organizerId) where.organizer = { organizerId };

      const rawData = await this.eventRepository.find({
        where: Object.keys(where).length > 0 ? where : undefined,
        relations: ['categories', 'organizer'],
        order: { createdAt: 'DESC' },
      });

      const enrichedData = await this.enrichWithParticipants(rawData);
      const mapped = enrichedData.map((item) => excludeFields(item, ['organizerId']));

      return {
        EC: 1,
        EM: 'Lấy danh sách sự kiện thành công',
        events: mapped,
      };
    } catch (error) {
      console.error('Error getting all events:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi lấy danh sách sự kiện' });
    }
  }

  async findOne(id: string, userId?: string) {
    try {
      validateUUID(id, 'event ID');

      const found = await this.eventRepository.findOne({
        where: { eventId: id },
        relations: ['categories', 'organizer'],
      });

      if (!found) {
        throw new NotFoundException({ EC: 0, EM: 'Không tìm thấy sự kiện' });
      }

      const [enrichedFound] = await this.enrichWithParticipants([found]);

      let userRegistrationStatus: REGISTRATION_STATUS | null = null;
      if (userId) {
        const student = await this.studentRepository.findOne({
          where: { userId },
          select: ['studentId'],
        });

        if (student) {
          const registration = await this.eventRegistrationRepository.findOne({
            where: { eventId: id, studentId: student.studentId },
            select: ['status'],
          });

          if (registration) {
            userRegistrationStatus = registration.status;
          }
        }
      }

      return {
        EC: 1,
        EM: 'Lấy thông tin sự kiện thành công',
        ...excludeFields(enrichedFound, ['organizerId']),
        userRegistrationStatus,
      };
    } catch (error) {
      console.error('Error finding one event:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi tìm sự kiện' });
    }
  }

  async findBySlug(slug: string) {
    try {
      const found = await this.eventRepository.findOne({
        where: { eventSlug: slug },
        relations: ['categories', 'organizer'],
      });

      if (!found) {
        throw new NotFoundException({ EC: 0, EM: 'Không tìm thấy sự kiện' });
      }

      return {
        EC: 1,
        EM: 'Tìm sự kiện theo slug thành công',
        ...found,
      };
    } catch (error) {
      console.error('Error finding event by slug:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi tìm sự kiện theo slug' });
    }
  }

  async findByStatus(
    status: EVENT_STATUS,
    createdBy?: string,
    organizerId?: string,
  ) {
    try {
      const where: any = { status };
      if (createdBy) where.createdBy = createdBy;
      if (organizerId) where.organizer = { organizerId };

      const events = await this.eventRepository.find({
        where,
        relations: ['categories', 'organizer'],
        order: { createdAt: 'DESC' },
      });

      const enrichedEvents = await this.enrichWithParticipants(events);

      return {
        EC: 1,
        EM: `Lấy sự kiện theo trạng thái ${status} thành công`,
        events: enrichedEvents,
      };
    } catch (error) {
      console.error('Error finding events by status:', error.message);
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi lấy sự kiện theo trạng thái' });
    }
  }

  // ─── UPDATE / DELETE ──────────────────────────────────────────────────────────

  async update(id: string, updateEventDto: UpdateEventDto) {
    try {
      validateUUID(id, 'event ID');

      const foundEvent = await this.eventRepository.findOne({ where: { eventId: id } });

      if (!foundEvent) {
        throw new NotFoundException({ EC: 0, EM: 'Không tìm thấy sự kiện' });
      }

      const newSlug = updateEventDto.eventName
        ? generateUniqueSlug(updateEventDto.eventName)
        : foundEvent.eventSlug;

      await this.eventRepository.update({ eventId: id }, { ...updateEventDto, eventSlug: newSlug });

      return {
        EC: 1,
        EM: 'Cập nhật sự kiện thành công',
        updated: { eventId: id },
      };
    } catch (error) {
      console.error('Error updating event:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi cập nhật sự kiện' });
    }
  }

  async remove(id: string) {
    try {
      validateUUID(id, 'event ID');

      const foundEvent = await this.eventRepository.findOne({ where: { eventId: id } });

      if (!foundEvent) {
        throw new NotFoundException({ EC: 0, EM: 'Không tìm thấy sự kiện' });
      }

      await this.eventRepository.delete({ eventId: id });

      return {
        EC: 1,
        EM: 'Xóa sự kiện thành công',
        deleted: { eventId: id },
      };
    } catch (error) {
      console.error('Error deleting event:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi xóa sự kiện' });
    }
  }

  /**
   * Generate JWT token for QR code check-in.
   * Token expires after specified minutes (default 120).
   */
  async generateQrToken(eventId: string, expiresInMinutes: number = 120): Promise<string> {
    try {
      validateUUID(eventId, 'event ID');

      // Kiểm tra event tồn tại
      const event = await this.eventRepository.findOne({ where: { eventId } });
      if (!event) {
        throw new NotFoundException({ EC: 0, EM: 'Không tìm thấy sự kiện' });
      }

      // Kiểm tra event đã được duyệt
      if (event.status !== EVENT_STATUS.APPROVED) {
        throw new BadRequestException({
          EC: 0,
          EM: 'Chỉ có thể tạo mã QR cho sự kiện đã được duyệt',
        });
      }

      // Tạo JWT token
      const payload = { eventId };
      const token = this.jwtService.sign(payload, {
        secret: this.configService.authConfig.access_token_key,
        expiresIn: `${expiresInMinutes}m`,
      });

      return token;
    } catch (error) {
      console.error('Error generating QR token:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi tạo mã QR' });
    }
  }

  /**
   * Helper: Tìm event theo eventId để lấy criteriaId + score.
   * Dùng nội bộ bởi EventAttendanceService khi duyệt attendance.
   * Trả về entity Event hoặc null (không wrap EC/EM).
   */
  async findEventEntity(eventId: string): Promise<Event | null> {
    return this.eventRepository.findOne({ where: { eventId } });
  }

  private async enrichWithParticipants(events: Event[]): Promise<any[]> {
    if (!events.length) return [];

    const eventIds = events.map((e) => e.eventId);
    const registrations = await this.eventRegistrationRepository.find({
      where: { eventId: In(eventIds) as any },
      select: ['eventId', 'status'],
    });

    const registrationCountMap = registrations.reduce<Map<string, number>>((countMap, reg) => {
      if (!ACTIVE_SLOT_STATUSES.has(reg.status)) return countMap;
      countMap.set(reg.eventId, (countMap.get(reg.eventId) || 0) + 1);
      return countMap;
    }, new Map());

    return events.map((event) => ({
      ...event,
      currentParticipants: registrationCountMap.get(event.eventId) ?? 0,
    }));
  }
}
