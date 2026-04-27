import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  EventAttendance,
  ATTENDANCE_STATUS,
  CHECK_IN_METHOD,
} from './entities/event-attendance.entity';
import {
  EventRegistration,
  REGISTRATION_STATUS,
} from 'src/modules/event-registration/entities/event-registration.entity';
import { Student } from '../students/entities/student.entity';
import { CheckInDto } from './dto/check-in.dto';
import { CheckInByUserDto } from './dto/check-in-by-user.dto';
import { ManualCheckInDto } from './dto/manual-check-in.dto';
import { EventService } from 'src/modules/events/event.service';
import { StudentScoreService } from 'src/modules/student-score/student-score.service';
import { ApiConfigService } from 'src/shared/services/api-config.service';
import { EVENT_STATUS } from 'src/modules/events/entities/event.entity';

@Injectable()
export class EventAttendanceService {
  constructor(
    @InjectRepository(EventAttendance)
    private readonly attendanceRepository: Repository<EventAttendance>,
    @InjectRepository(EventRegistration)
    private readonly registrationRepository: Repository<EventRegistration>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly eventService: EventService,
    private readonly studentScoreService: StudentScoreService,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ApiConfigService,
  ) {}

  private normalizeEventScore(score: unknown): number {
    const normalized = Number(score);
    if (!Number.isFinite(normalized) || !Number.isInteger(normalized) || normalized < 0) {
      throw new BadRequestException({
        EC: 0,
        EM: 'Điểm sự kiện phải là số nguyên không âm',
      });
    }
    return normalized;
  }

  // ─── CHECK-IN BẰNG QR CODE ────────────────────────────────────────────────────

  /**
   * Sinh viên check-in sự kiện bằng QR code.
   *
   * Các bước validate:
   *  1. Verify JWT token và lấy eventId từ payload
   *  2. Tìm event theo eventId (phải tồn tại và APPROVED)
   *  3. Kiểm tra sinh viên chưa check-in trước đó
   *  4. Tạo EventAttendance với checkInMethod = QR
   *  5. Cập nhật EventRegistration.status = ATTENDED + attendedAt = now
   *  6. Nếu event.requiresApproval = false → cộng điểm ngay vào student_scores
   *     Nếu event.requiresApproval = true  → attendance = PENDING, chờ admin duyệt
   *
   * @param dto - chứa qrToken và studentId
   */
  async checkIn(dto: CheckInDto) {
    try {
      // 1. Verify JWT token và lấy eventId
      let eventId: string;
      try {
        const payload = this.jwtService.verify(dto.qrToken, {
          secret: this.configService.authConfig.access_token_key,
        });
        eventId = payload.eventId;
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          throw new BadRequestException({
            EC: 0,
            EM: 'Mã QR đã hết hạn',
          });
        }
        throw new BadRequestException({
          EC: 0,
          EM: 'Mã QR không hợp lệ',
        });
      }

      // 2. Tìm event theo eventId
      const event = await this.eventService.findEventEntity(eventId);

      console.log('[checkIn] event.semesterId =', event?.semesterId, '| event.score =', event?.score);

      if (!event) {
        throw new NotFoundException({ EC: 0, EM: 'Sự kiện không tồn tại' });
      }

      if (event.status !== EVENT_STATUS.APPROVED) {
        throw new BadRequestException({ EC: 0, EM: 'Sự kiện chưa được duyệt, không thể check-in' });
      }

      // 3. Kiểm tra sinh viên chưa check-in
      const existingAttendance = await this.attendanceRepository.findOne({
        where: { studentId: dto.studentId, eventId: event.eventId },
      });

      if (existingAttendance) {
        throw new ConflictException({ EC: 0, EM: 'Sinh viên đã check-in sự kiện này rồi' });
      }

      // 4. Xác định trạng thái attendance dựa trên requiresApproval
      const initialStatus = event.requiresApproval
        ? ATTENDANCE_STATUS.PENDING
        : ATTENDANCE_STATUS.APPROVED;

      // Tạo record attendance với checkInMethod = QR
      const attendance = this.attendanceRepository.create({
        studentId: dto.studentId,
        eventId: event.eventId,
        status: initialStatus,
        checkInMethod: CHECK_IN_METHOD.QR,
      });

      await this.attendanceRepository.save(attendance);

      // 5. Cập nhật trạng thái đăng ký → ATTENDED
      await this.registrationRepository.update(
        { studentId: dto.studentId, eventId: event.eventId },
        { status: REGISTRATION_STATUS.ATTENDED, attendedAt: new Date() },
      );

      // 6. Nếu không yêu cầu duyệt → cộng điểm ngay (scoreValue = event.score chính xác)
      if (!event.requiresApproval && event.criteriaId && event.score !== null) {
        await this.studentScoreService.addScoreForEvent(
          dto.studentId,
          event.eventId,
          event.criteriaId,
          this.normalizeEventScore(event.score),
          event.semesterId,
        );
      }

      return {
        EC: 1,
        EM: event.requiresApproval
          ? 'Check-in thành công. Điểm sẽ được cộng sau khi admin duyệt.'
          : 'Check-in thành công. Điểm đã được cộng tự động.',
        attendanceId: attendance.id,
        status: initialStatus,
        eventName: event.eventName,
        score: event.score,
      };
    } catch (error) {
      console.error('[EventAttendanceService.checkIn] Error:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi check-in' });
    }
  }

  /**
   * Sinh viên tự check-in bằng QR (endpoint dành cho student)
   * Tự động lấy studentId từ userId trong JWT token
   */
  async checkInByUser(userId: string, dto: CheckInByUserDto) {
    try {
      // 1. Tìm student từ userId
      const student = await this.studentRepository.findOne({
        where: { userId },
      });

      if (!student) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Không tìm thấy thông tin sinh viên',
        });
      }

      // 2. Gọi lại method checkIn với studentId
      return await this.checkIn({
        studentId: student.studentId,
        qrToken: dto.qrToken,
      });
    } catch (error) {
      console.error('[EventAttendanceService.checkInByUser] Error:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi check-in' });
    }
  }

  // ─── ĐIỂM DANH THỦ CÔNG (Admin) ───────────────────────────────────────────────

  /**
   * Admin điểm danh thủ công cho sinh viên (khi sinh viên không quét được QR).
   *
   * Điều kiện:
   *  - Sự kiện phải đã được duyệt (APPROVED)
   *  - Sinh viên phải đã đăng ký sự kiện (status = REGISTERED) — chưa đăng ký thì báo lỗi
   *  - Sinh viên chưa có bản ghi attendance (chưa check-in trước đó bằng bất kỳ phương thức nào)
   *
   * Sau khi điểm danh thủ công thành công:
   *  - Tạo EventAttendance với checkInMethod = MANUAL
   *  - Cập nhật EventRegistration.status = ATTENDED + attendedAt = now
   *  - Nếu event.requiresApproval = false → cộng điểm ngay
   *
   * @param dto - chứa studentId và eventId
   */
  async manualCheckIn(dto: ManualCheckInDto) {
    try {
      // 1. Kiểm tra sự kiện tồn tại và đã được duyệt
      const event = await this.eventService.findEventEntity(dto.eventId);

      if (!event) {
        throw new NotFoundException({ EC: 0, EM: 'Không tìm thấy sự kiện' });
      }

      if (event.status !== EVENT_STATUS.APPROVED) {
        throw new BadRequestException({
          EC: 0,
          EM: 'Sự kiện chưa được duyệt, không thể điểm danh',
        });
      }

      // 2. Kiểm tra sinh viên đã đăng ký sự kiện (phải có REGISTERED)
      const registration = await this.registrationRepository.findOne({
        where: { studentId: dto.studentId, eventId: dto.eventId },
      });

      if (!registration) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Sinh viên chưa đăng ký sự kiện này, không thể điểm danh',
        });
      }

      if (registration.status === REGISTRATION_STATUS.CANCELLED) {
        throw new BadRequestException({
          EC: 0,
          EM: 'Sinh viên đã hủy đăng ký, không thể điểm danh',
        });
      }

      if (registration.status === REGISTRATION_STATUS.ATTENDED) {
        throw new ConflictException({
          EC: 0,
          EM: 'Sinh viên đã được điểm danh trước đó',
        });
      }

      // 3. Kiểm tra chưa có bản ghi attendance (tránh trùng)
      const existingAttendance = await this.attendanceRepository.findOne({
        where: { studentId: dto.studentId, eventId: dto.eventId },
      });

      if (existingAttendance) {
        throw new ConflictException({
          EC: 0,
          EM: 'Sinh viên đã có bản ghi check-in cho sự kiện này',
        });
      }

      // 4. Tạo attendance với checkInMethod = MANUAL
      const initialStatus = event.requiresApproval
        ? ATTENDANCE_STATUS.PENDING
        : ATTENDANCE_STATUS.APPROVED;

      const attendance = this.attendanceRepository.create({
        studentId: dto.studentId,
        eventId: dto.eventId,
        status: initialStatus,
        checkInMethod: CHECK_IN_METHOD.MANUAL,
      });

      await this.attendanceRepository.save(attendance);

      // 5. Cập nhật trạng thái đăng ký → ATTENDED
      await this.registrationRepository.update(
        { id: registration.id },
        { status: REGISTRATION_STATUS.ATTENDED, attendedAt: new Date() },
      );

      // 6. Nếu không yêu cầu duyệt → cộng điểm ngay (scoreValue = event.score chính xác)
      if (!event.requiresApproval && event.criteriaId && event.score !== null) {
        await this.studentScoreService.addScoreForEvent(
          dto.studentId,
          dto.eventId,
          event.criteriaId,
          this.normalizeEventScore(event.score),
          event.semesterId,
        );
      }

      return {
        EC: 1,
        EM: event.requiresApproval
          ? 'Điểm danh thủ công thành công. Điểm sẽ được cộng sau khi admin duyệt.'
          : 'Điểm danh thủ công thành công. Điểm đã được cộng tự động.',
        attendanceId: attendance.id,
        status: initialStatus,
      };
    } catch (error) {
      console.error('[EventAttendanceService.manualCheckIn] Error:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi điểm danh thủ công' });
    }
  }

  // ─── DUYỆT ATTENDANCE (Admin) ─────────────────────────────────────────────────

  /**
   * Admin duyệt attendance → cộng điểm cho sinh viên.
   * Dùng transaction để đảm bảo tính nhất quán: cập nhật status + addScore đồng thời.
   *
   * @param attendanceId - ID của bản ghi attendance cần duyệt
   */
  async approveAttendance(attendanceId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const attendance = await manager.findOne(EventAttendance, {
        where: { id: attendanceId },
      });

      if (!attendance) {
        throw new NotFoundException({ EC: 0, EM: 'Không tìm thấy bản ghi điểm danh' });
      }

      if (attendance.status !== ATTENDANCE_STATUS.PENDING) {
        throw new BadRequestException({
          EC: 0,
          EM: `Không thể duyệt attendance với trạng thái: ${attendance.status}`,
        });
      }

      // Cập nhật status → APPROVED trong transaction
      await manager.update(
        EventAttendance,
        { id: attendanceId },
        { status: ATTENDANCE_STATUS.APPROVED },
      );

      // Lấy thông tin event để biết criteriaId và score
      const event = await this.eventService.findEventEntity(attendance.eventId);

      // Cộng điểm nếu event có gắn criteria và score (scoreValue = event.score chính xác)
      if (event && event.criteriaId && event.score !== null) {
        await this.studentScoreService.addScoreForEvent(
          attendance.studentId,
          attendance.eventId,
          event.criteriaId,
          this.normalizeEventScore(event.score),
          event.semesterId,
        );
      }

      return {
        EC: 1,
        EM: 'Duyệt điểm danh và cộng điểm thành công',
        attendanceId,
        status: ATTENDANCE_STATUS.APPROVED,
      };
    });
  }

  // ─── TỪ CHỐI ATTENDANCE (Admin) ───────────────────────────────────────────────

  /**
   * Admin từ chối attendance của sinh viên.
   *
   * @param attendanceId - ID của bản ghi attendance cần từ chối
   */
  async rejectAttendance(attendanceId: string) {
    try {
      const attendance = await this.attendanceRepository.findOne({
        where: { id: attendanceId },
      });

      if (!attendance) {
        throw new NotFoundException({ EC: 0, EM: 'Không tìm thấy bản ghi điểm danh' });
      }

      await this.attendanceRepository.update(
        { id: attendanceId },
        { status: ATTENDANCE_STATUS.REJECTED },
      );

      return { EC: 1, EM: 'Từ chối điểm danh thành công', attendanceId };
    } catch (error) {
      console.error('[EventAttendanceService.rejectAttendance] Error:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi từ chối điểm danh' });
    }
  }

  // ─── FIND ─────────────────────────────────────────────────────────────────────

  /**
   * Lấy toàn bộ danh sách attendance (admin).
   */
  async findAll() {
    try {
      const list = await this.attendanceRepository.find({
        relations: ['event'],
        order: { checkInTime: 'DESC' },
      });
      return { EC: 1, EM: 'Lấy danh sách điểm danh thành công', attendances: list };
    } catch (error) {
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi lấy danh sách điểm danh' });
    }
  }

  /**
   * Lấy danh sách attendance theo sự kiện.
   *
   * @param eventId - ID của sự kiện
   */
  async findByEvent(eventId: string) {
    try {
      const list = await this.attendanceRepository.find({
        where: { eventId },
        order: { checkInTime: 'DESC' },
      });
      return { EC: 1, EM: 'Lấy điểm danh theo sự kiện thành công', attendances: list };
    } catch (error) {
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi lấy điểm danh' });
    }
  }
}
