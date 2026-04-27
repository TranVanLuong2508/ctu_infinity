import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { EventAttendanceService } from './event-attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckInByUserDto } from './dto/check-in-by-user.dto';
import { ManualCheckInDto } from './dto/manual-check-in.dto';
import { Permission } from 'src/decorators/permission.decorator';
import { SYSTEM_MODULE } from 'src/common/module';
import { ResponseMessage, User } from 'src/decorators/customize';
import type { IUser } from '../users/interface/user.interface';

@Controller('event-attendances')
export class EventAttendanceController {
  constructor(private readonly eventAttendanceService: EventAttendanceService) {}

  /**
   * Sinh viên check-in sự kiện bằng QR code.
   * Body: { qrToken, studentId }
   */
  @Post('check-in')
  @Permission('Check-in event', SYSTEM_MODULE.EVENT_ATTENDANCE)
  @ResponseMessage('Check-in event')
  checkIn(@Body() dto: CheckInDto) {
    return this.eventAttendanceService.checkIn(dto);
  }

  /**
   * Sinh viên tự check-in bằng QR (studentId tự động lấy từ JWT)
   * Body: { qrToken }
   */
  @Post('check-in-by-user')
  @Permission('Check-in event', SYSTEM_MODULE.EVENT_ATTENDANCE)
  @ResponseMessage('Student check-in event by QR')
  checkInByUser(@User() user: IUser, @Body() dto: CheckInByUserDto) {
    return this.eventAttendanceService.checkInByUser(user.userId, dto);
  }

  /**
   * Admin điểm danh thủ công cho sinh viên (khi không quét được QR).
   * Sinh viên phải đã đăng ký sự kiện (status = REGISTERED).
   * Body: { studentId, eventId }
   */
  @Post('manual-check-in')
  @Permission('Manual check-in event', SYSTEM_MODULE.EVENT_ATTENDANCE)
  @ResponseMessage('Manual check-in event')
  manualCheckIn(@Body() dto: ManualCheckInDto) {
    return this.eventAttendanceService.manualCheckIn(dto);
  }

  /**
   * Lấy toàn bộ danh sách điểm danh (admin).
   */
  @Get()
  @Permission('Get all event attendances', SYSTEM_MODULE.EVENT_ATTENDANCE)
  @ResponseMessage('Get all event attendances')
  findAll() {
    return this.eventAttendanceService.findAll();
  }

  /**
   * Lấy danh sách điểm danh theo sự kiện.
   * @param eventId - ID của sự kiện
   */
  @Get('event/:eventId')
  @Permission('Get attendances by event', SYSTEM_MODULE.EVENT_ATTENDANCE)
  @ResponseMessage('Get attendances by event')
  findByEvent(@Param('eventId') eventId: string) {
    return this.eventAttendanceService.findByEvent(eventId);
  }

  /**
   * Admin duyệt attendance → cộng điểm cho sinh viên.
   * @param id - ID của bản ghi attendance
   */
  @Patch(':id/approve')
  @Permission('Approve attendance', SYSTEM_MODULE.EVENT_ATTENDANCE)
  @ResponseMessage('Approve attendance')
  approveAttendance(@Param('id') id: string) {
    return this.eventAttendanceService.approveAttendance(id);
  }

  /**
   * Admin từ chối attendance.
   * @param id - ID của bản ghi attendance
   */
  @Patch(':id/reject')
  @Permission('Reject attendance', SYSTEM_MODULE.EVENT_ATTENDANCE)
  @ResponseMessage('Reject attendance')
  rejectAttendance(@Param('id') id: string) {
    return this.eventAttendanceService.rejectAttendance(id);
  }
}
