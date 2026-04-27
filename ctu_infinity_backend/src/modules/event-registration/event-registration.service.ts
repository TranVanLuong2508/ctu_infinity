import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventRegistration, REGISTRATION_STATUS } from './entities/event-registration.entity';
import { CreateEventRegistrationDto } from './dto/create-event-registration.dto';
import { RegisterEventByUserDto } from './dto/register-event-by-user.dto';
import { Event } from '../events/entities/event.entity';
import { Student } from '../students/entities/student.entity';
import { EmailQueueService } from 'src/modules/email/email.queue.service';

@Injectable()
export class EventRegistrationService {
  private readonly logger = new Logger(EventRegistrationService.name);

  constructor(
    @InjectRepository(EventRegistration)
    private readonly registrationRepository: Repository<EventRegistration>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly emailQueueService: EmailQueueService,
  ) { }

  // ─── ĐĂNG KÝ SỰ KIỆN ─────────────────────────────────────────────────────────

  /**
   * Sinh viên đăng ký tham gia sự kiện.
   *
   * Validate:
   *  - Sự kiện phải tồn tại
   *  - Chưa quá hạn đăng ký (registrationDeadline)
   *  - Nếu đã đăng ký (REGISTERED) → báo lỗi xung đột
   *  - Nếu đã hủy trước đó (CANCELLED) → cho phép đăng ký lại (reset về REGISTERED)
   *
   * @param dto - chứa studentId và eventId
   */
  async registerEvent(dto: CreateEventRegistrationDto) {
    try {
      const event = await this.eventRepository.findOne({
        where: { eventId: dto.eventId },
      });

      if (!event) {
        throw new NotFoundException({ EC: 0, EM: 'Không tìm thấy sự kiện' });
      }

      // Kiểm tra hạn chót đăng ký
      if (event.registrationDeadline) {
        const now = new Date();
        if (now > new Date(event.registrationDeadline)) {
          throw new BadRequestException({ EC: 0, EM: 'Đã quá hạn đăng ký sự kiện này' });
        }
      }

      const existing = await this.registrationRepository.findOne({
        where: { studentId: dto.studentId, eventId: dto.eventId },
      });

      if (existing) {
        if (existing.status === REGISTRATION_STATUS.REGISTERED) {
          throw new ConflictException({ EC: 0, EM: 'Sinh viên đã đăng ký sự kiện này rồi' });
        }
        // Đã CANCELLED → cho đăng ký lại, reset trạng thái và xóa cancelledAt
        await this.registrationRepository.update(
          { id: existing.id },
          { status: REGISTRATION_STATUS.REGISTERED, cancelledAt: null },
        );

        // Fire-and-forget email xác nhận đăng ký lại
        this.sendRegistrationConfirmationAsync(event, dto.studentId).catch((err) =>
          this.logger.error('[registerEvent] Failed to send re-registration email:', err?.message),
        );

        return { EC: 1, EM: 'Đăng ký lại sự kiện thành công' };
      }

      const registration = this.registrationRepository.create({
        studentId: dto.studentId,
        eventId: dto.eventId,
        status: REGISTRATION_STATUS.REGISTERED,
      });

      await this.registrationRepository.save(registration);

      // Fire-and-forget email xác nhận đăng ký mới
      this.sendRegistrationConfirmationAsync(event, dto.studentId).catch((err) =>
        this.logger.error('[registerEvent] Failed to send registration email:', err?.message),
      );

      return { EC: 1, EM: 'Đăng ký sự kiện thành công', registrationId: registration.id };
    } catch (error) {
      console.error('[EventRegistrationService.registerEvent] Error:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi đăng ký sự kiện' });
    }
  }

  /**
   * Gửi email xác nhận đăng ký cho sinh viên.
   * Chạy bất đồng bộ – KHÔNG block response của registerEvent().
   */
  private async sendRegistrationConfirmationAsync(
    event: Event,
    studentId: string,
  ): Promise<void> {
    try {
      const student = await this.studentRepository.findOne({
        where: { studentId },
        relations: ['user'],
      });

      if (!student?.user?.email) {
        this.logger.warn(
          `[sendRegistrationConfirmationAsync] Không tìm thấy email của student: ${studentId}`,
        );
        return;
      }

      await this.emailQueueService.addRegistrationConfirmationJob({
        to: student.user.email,
        studentName: student.user.fullName ?? 'Bạn',
        eventName: event.eventName,
        eventDate: new Date(event.startDate).toLocaleString('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
        }),
        eventLocation: event.location ?? 'Chưa cập nhật',
      });
    } catch (err) {
      this.logger.error(
        `[sendRegistrationConfirmationAsync] Error for student ${studentId}:`,
        err?.message,
      );
    }
  }

  /**
   * Sinh viên tự đăng ký sự kiện qua JWT token.
   * Tự động lấy studentId từ userId được decode từ token.
   *
   * @param userId - userId lấy từ JWT (không phải studentId)
   * @param dto    - chứa eventId
   */
  async registerEventByUser(userId: string, dto: RegisterEventByUserDto) {
    try {
      const student = await this.studentRepository.findOne({ where: { userId } });

      if (!student) {
        throw new NotFoundException({ EC: 0, EM: 'Không tìm thấy thông tin sinh viên' });
      }

      return await this.registerEvent({ studentId: student.studentId, eventId: dto.eventId });
    } catch (error) {
      console.error('[EventRegistrationService.registerEventByUser] Error:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi đăng ký sự kiện' });
    }
  }

  // ─── HỦY ĐĂNG KÝ ─────────────────────────────────────────────────────────────

  /**
   * Sinh viên tự hủy đăng ký sự kiện qua JWT token.
   * Tự động lấy studentId từ userId được decode từ token.
   *
   * @param userId  - userId lấy từ JWT (không phải studentId)
   * @param eventId - ID của sự kiện cần hủy
   */
  async cancelRegistrationByUser(userId: string, eventId: string) {
    try {
      const student = await this.studentRepository.findOne({ where: { userId } });

      if (!student) {
        throw new NotFoundException({ EC: 0, EM: 'Không tìm thấy thông tin sinh viên' });
      }

      return await this.cancelRegistration(student.studentId, eventId);
    } catch (error) {
      console.error('[EventRegistrationService.cancelRegistrationByUser] Error:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi hủy đăng ký' });
    }
  }

  /**
   * Core logic hủy đăng ký sự kiện.
   * Query không filter theo status để phân nhánh message lỗi chính xác theo trạng thái thực tế.
   * Kiểm tra rule thời gian: chỉ cho hủy trong thời hạn đăng ký.
   *
   * @param studentId - ID của sinh viên
   * @param eventId   - ID của sự kiện
   */
  async cancelRegistration(studentId: string, eventId: string) {
    try {
      // Query KHÔNG filter theo status để phân nhánh message theo trạng thái thực tế
      const registration = await this.registrationRepository.findOne({
        where: { studentId, eventId },
      });

      if (!registration) {
        throw new NotFoundException({ EC: 0, EM: 'Bạn chưa đăng ký sự kiện này' });
      }

      // Phân nhánh theo status hiện tại
      if (registration.status === REGISTRATION_STATUS.CANCELLED) {
        throw new BadRequestException({ EC: 0, EM: 'Đăng ký đã được hủy trước đó' });
      }
      if (registration.status === REGISTRATION_STATUS.ATTENDED) {
        throw new BadRequestException({ EC: 0, EM: 'Không thể hủy vì bạn đã tham gia sự kiện' });
      }
      if (registration.status === REGISTRATION_STATUS.ABSENT) {
        throw new BadRequestException({ EC: 0, EM: 'Không thể hủy vì đăng ký đã được chốt sau sự kiện' });
      }

      // Lúc này status === REGISTERED: kiểm tra rule thời gian
      const event = await this.eventRepository.findOne({ where: { eventId } });

      if (!event) {
        throw new NotFoundException({ EC: 0, EM: 'Không tìm thấy sự kiện' });
      }

      const now = new Date();
      const deadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
      const startDate = new Date(event.startDate);

      const isWithinCancelWindow = deadline ? now <= deadline : now < startDate;

      if (!isWithinCancelWindow) {
        throw new BadRequestException({ EC: 0, EM: 'Đã quá thời hạn hủy đăng ký sự kiện' });
      }

      await this.registrationRepository.update(
        { id: registration.id },
        { status: REGISTRATION_STATUS.CANCELLED, cancelledAt: new Date() },
      );

      return { EC: 1, EM: 'Hủy đăng ký thành công' };
    } catch (error) {
      console.error('[EventRegistrationService.cancelRegistration] Error:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi hủy đăng ký' });
    }
  }

  // ─── FIND ─────────────────────────────────────────────────────────────────────

  /**
   * Lấy danh sách sinh viên tham gia/đăng ký một sự kiện.
   * Join với bảng students và users để trả về đầy đủ thông tin sinh viên.
   * Có thể lọc theo trạng thái (status).
   *
   * @param eventId - ID của sự kiện
   * @param status  - (tùy chọn) lọc theo trạng thái: REGISTERED | ATTENDED | CANCELLED | ABSENT
   */
  async findByEvent(eventId: string, status?: REGISTRATION_STATUS) {
    try {
      // ── Query 1: Lấy danh sách đăng ký theo sự kiện (+ filter status) ──────
      const whereCondition: Record<string, any> = { eventId };
      if (status) whereCondition.status = status;

      const registrations = await this.registrationRepository.find({
        where: whereCondition,
        order: { registeredAt: 'DESC' },
      });

      if (registrations.length === 0) {
        return { EC: 1, EM: 'Lấy danh sách sinh viên theo sự kiện thành công', registrations: [], total: 0 };
      }

      // ── Query 2: Batch-load thông tin sinh viên theo danh sách studentId ───
      // Dùng relation để lấy thêm user.fullName, user.email, user.avatarUrl
      const studentIds = [...new Set(registrations.map((r) => r.studentId))];

      const students = await this.studentRepository.find({
        where: studentIds.map((id) => ({ studentId: id })),
        relations: ['user'], // ← join sang bảng users qua TypeORM relation
      });

      // Map studentId → student để tra cứu nhanh O(1)
      const studentMap = new Map(students.map((s) => [s.studentId, s]));

      // ── Merge dữ liệu ─────────────────────────────────────────────────────
      const result = registrations.map((reg) => {
        const student = studentMap.get(reg.studentId);
        return {
          id: reg.id,
          studentId: reg.studentId,
          eventId: reg.eventId,
          status: reg.status,
          registeredAt: reg.registeredAt,
          attendedAt: reg.attendedAt,
          cancelledAt: reg.cancelledAt,
          // Thông tin sinh viên (null-safe nếu SV bị xóa)
          studentCode: student?.studentCode ?? null,
          fullName: student?.user?.fullName ?? null,
          email: student?.user?.email ?? null,
          avatarUrl: student?.user?.avatarUrl ?? null,
        };
      });

      return {
        EC: 1,
        EM: 'Lấy danh sách sinh viên theo sự kiện thành công',
        registrations: result,
        total: result.length,
      };
    } catch (error) {
      console.error('[EventRegistrationService.findByEvent] Error:', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi lấy danh sách sinh viên theo sự kiện' });
    }
  }

  /**
   * Đánh dấu vắng mặt (ABSENT) cho tất cả sinh viên đã đăng ký (REGISTERED)
   * nhưng không điểm danh sau khi sự kiện kết thúc.
   * Admin gọi thủ công sau khi sự kiện kết thúc.
   *
   * @param eventId - ID của sự kiện cần đánh dấu vắng mặt
   */
  async markAbsent(eventId: string) {
    try {
      const result = await this.registrationRepository
        .createQueryBuilder()
        .update(EventRegistration)
        .set({ status: REGISTRATION_STATUS.ABSENT })
        .where('eventId = :eventId', { eventId })
        .andWhere('status = :status', { status: REGISTRATION_STATUS.REGISTERED })
        .execute();

      return {
        EC: 1,
        EM: `Đã đánh dấu vắng mặt cho ${result.affected ?? 0} sinh viên`,
        affected: result.affected ?? 0,
      };
    } catch (error) {
      console.error('[EventRegistrationService.markAbsent] Error:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi đánh dấu vắng mặt' });
    }
  }

  /**
   * Lấy danh sách sự kiện của sinh viên (my-events) có bộ lọc.
   *
   * @param userId - ID của user đăng nhập
   * @param filter - MyEventsFilterDto
   */
  async findMyEvents(userId: string, filter: any) {
    try {
      const student = await this.studentRepository.findOne({ where: { userId } });
      if (!student) {
        throw new NotFoundException({ EC: 0, EM: 'Không tìm thấy thông tin sinh viên' });
      }

      const query = this.registrationRepository
        .createQueryBuilder('reg')
        .leftJoinAndSelect('reg.event', 'event')
        .leftJoinAndSelect('event.categories', 'category')
        .leftJoinAndSelect('event.organizer', 'organizer')
        .leftJoinAndSelect('event.criteria', 'criteria')
        .where('reg.studentId = :studentId', { studentId: student.studentId });

      if (filter.status) {
        query.andWhere('reg.status = :status', { status: filter.status });
      }

      if (filter.startDate) {
        query.andWhere('event.startDate >= :startDate', { startDate: filter.startDate });
      }

      if (filter.endDate) {
        query.andWhere('event.startDate <= :endDate', { endDate: filter.endDate });
      }

      if (filter.criteriaIds) {
        const cIds = filter.criteriaIds.split(',').map((id: string) => id.trim());
        query.andWhere('event.criteriaId IN (:...cIds)', { cIds });
      }

      if (filter.categoryIds) {
        const catIds = filter.categoryIds.split(',').map((id: string) => id.trim());
        query.innerJoin(
          'event_categories_mapping',
          'ecm',
          'ecm.eventId = event.eventId AND ecm.categoryId IN (:...catIds)',
          { catIds }
        );
      }

      query.orderBy('event.startDate', 'DESC');

      const registrations = await query.getMany();

      return {
        EC: 1,
        EM: 'Lấy danh sách sự kiện thành công',
        registrations,
      };
    } catch (error) {
      console.error('[EventRegistrationService.findMyEvents] Error:', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi lấy danh sách sự kiện' });
    }
  }

  /**
   * Lấy danh sách đăng ký của một sinh viên (tất cả sự kiện).
   *
   * @param studentId - ID của sinh viên
   */
  async findByStudent(studentId: string) {
    try {
      const registrations = await this.registrationRepository.find({
        where: { studentId },
        relations: ['event'],
        order: { registeredAt: 'DESC' },
      });

      return {
        EC: 1,
        EM: 'Lấy danh sách đăng ký của sinh viên thành công',
        registrations,
      };
    } catch (error) {
      console.error('[EventRegistrationService.findByStudent] Error:', error.message);
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi lấy danh sách đăng ký' });
    }
  }

  /**
   * Lấy toàn bộ danh sách đăng ký (admin).
   */
  async findAll() {
    try {
      const registrations = await this.registrationRepository.find({
        relations: ['event'],
        order: { registeredAt: 'DESC' },
      });
      return { EC: 1, EM: 'Lấy danh sách đăng ký thành công', registrations };
    } catch (error) {
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi lấy danh sách đăng ký' });
    }
  }
}
