import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { EventRegistrationService } from './event-registration.service';
import { CreateEventRegistrationDto } from './dto/create-event-registration.dto';
import { RegisterEventByUserDto } from './dto/register-event-by-user.dto';
import { CancelEventByUserDto } from './dto/cancel-event-by-user.dto';
import { MyEventsFilterDto } from './dto/my-events-filter.dto';
import { REGISTRATION_STATUS } from './entities/event-registration.entity';
import { Permission } from 'src/decorators/permission.decorator';
import { SYSTEM_MODULE } from 'src/common/module';
import { ResponseMessage, User } from 'src/decorators/customize';
import type { IUser } from '../users/interface/user.interface';

@Controller('event-registrations')
export class EventRegistrationController {
  constructor(private readonly eventRegistrationService: EventRegistrationService) { }

  /**
   * Admin tạo đăng ký cho sinh viên.
   * Body: { studentId, eventId }
   */
  @Post()
  @Permission('Register event', SYSTEM_MODULE.EVENT_REGISTRATION)
  @ResponseMessage('Register event')
  register(@Body() dto: CreateEventRegistrationDto) {
    return this.eventRegistrationService.registerEvent(dto);
  }

  /**
   * Sinh viên tự đăng ký sự kiện.
   * studentId tự động lấy từ JWT token (không cần truyền tay).
   * Body: { eventId }
   */
  @Post('register')
  @Permission('Register event', SYSTEM_MODULE.EVENT_REGISTRATION)
  @ResponseMessage('Student register event')
  registerByUser(@User() user: IUser, @Body() dto: RegisterEventByUserDto) {
    return this.eventRegistrationService.registerEventByUser(user.userId, dto);
  }

  /**
   * Sinh viên tự hủy đăng ký sự kiện qua JWT.
   * studentId tự động lấy từ JWT token (không cần truyền tay).
   * Body: { eventId }
   */
  @Patch('cancel')
  @Permission('Cancel event registration', SYSTEM_MODULE.EVENT_REGISTRATION)
  @ResponseMessage('Cancel event registration')
  cancel(@User() user: IUser, @Body() dto: CancelEventByUserDto) {
    return this.eventRegistrationService.cancelRegistrationByUser(user.userId, dto.eventId);
  }

  /**
   * Lấy danh sách sự kiện của sinh viên (my-events) có bộ lọc.
   */
  @Get('my-events')
  @Permission('Get my events', SYSTEM_MODULE.EVENT_REGISTRATION)
  @ResponseMessage('Get my events')
  findMyEvents(@User() user: IUser, @Query() filterDto: MyEventsFilterDto) {
    return this.eventRegistrationService.findMyEvents(user.userId, filterDto);
  }

  /**
   * Lấy toàn bộ danh sách đăng ký (admin).
   */
  @Get()
  @Permission('Get all event registrations', SYSTEM_MODULE.EVENT_REGISTRATION)
  @ResponseMessage('Get all event registrations')
  findAll() {
    return this.eventRegistrationService.findAll();
  }

  /**
   * Lấy danh sách sinh viên tham gia một sự kiện.
   * Có thể lọc theo trạng thái qua query param ?status=REGISTERED|ATTENDED|CANCELLED|ABSENT
   *
   * @param eventId - ID của sự kiện
   * @param status  - (tùy chọn) lọc theo trạng thái tham gia
   */
  @Get('event/:eventId')
  @Permission('Get registrations by event', SYSTEM_MODULE.EVENT_REGISTRATION)
  @ResponseMessage('Get registrations by event')
  findByEvent(
    @Param('eventId') eventId: string,
    @Query('status') status?: REGISTRATION_STATUS,
  ) {
    return this.eventRegistrationService.findByEvent(eventId, status);
  }

  /**
   * Lấy danh sách đăng ký của một sinh viên.
   *
   * @param studentId - ID của sinh viên
   */
  @Get('student/:studentId')
  @Permission('Get registrations by student', SYSTEM_MODULE.EVENT_REGISTRATION)
  @ResponseMessage('Get registrations by student')
  findByStudent(@Param('studentId') studentId: string) {
    return this.eventRegistrationService.findByStudent(studentId);
  }

  /**
   * Admin đánh dấu vắng mặt (ABSENT) cho tất cả sinh viên REGISTERED không điểm danh.
   * Gọi sau khi sự kiện đã kết thúc.
   *
   * @param eventId - ID của sự kiện
   */
  @Patch('event/:eventId/mark-absent')
  @Permission('Mark absent for event', SYSTEM_MODULE.EVENT_REGISTRATION)
  @ResponseMessage('Mark absent for event')
  markAbsent(@Param('eventId') eventId: string) {
    return this.eventRegistrationService.markAbsent(eventId);
  }
}
