import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ApproveEventDto } from './dto/approve-event.dto';
import { GenerateQrTokenDto } from './dto/generate-qr-token.dto';
import { EVENT_STATUS } from './entities/event.entity';
import { Permission } from 'src/decorators/permission.decorator';
import { SYSTEM_MODULE } from 'src/common/module';
import { ResponseMessage, User } from 'src/decorators/customize';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @Permission('Create a event', SYSTEM_MODULE.EVENT)
  @ResponseMessage('Create a event')
  create(@Body() createEventDto: CreateEventDto, @User() user: any) {
    return this.eventService.create(createEventDto, user?.userId);
  }

  @Get()
  @Permission('Get all events', SYSTEM_MODULE.EVENT)
  @ResponseMessage('Get all events')
  findAll(
    @Query('status') status?: EVENT_STATUS,
    @Query('createdBy') createdBy?: string,
    @Query('organizerId') organizerId?: string,
  ) {
    if (status) {
      return this.eventService.findByStatus(status, createdBy, organizerId);
    }
    return this.eventService.findAll(createdBy, organizerId);
  }

  @Get('slug/:slug')
  @Permission('Get an event by slug', SYSTEM_MODULE.EVENT)
  @ResponseMessage('Get an event by slug')
  findBySlug(@Param('slug') slug: string) {
    return this.eventService.findBySlug(slug);
  }

  @Get(':id')
  @Permission('Get an event by ID', SYSTEM_MODULE.EVENT)
  @ResponseMessage('Get an event by ID')
  findOne(@Param('id') id: string, @User() user: any) {
    return this.eventService.findOne(id, user?.userId);
  }

  @Patch(':id')
  @Permission('Update an event by ID', SYSTEM_MODULE.EVENT)
  @ResponseMessage('Update an event by ID')
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventService.update(id, updateEventDto);
  }

  /** Organizer đăng ký duyệt sự kiện: chuyển từ DRAFT → PENDING */
  @Patch(':id/submit-for-approval')
  @Permission('Submit event for approval', SYSTEM_MODULE.EVENT)
  @ResponseMessage('Submit event for approval')
  submitForApproval(@Param('id') id: string) {
    return this.eventService.submitForApproval(id);
  }

  /** Admin duyệt sự kiện: chọn criteriaId + nhập score */
  @Patch(':id/approve')
  @Permission('Approve an event', SYSTEM_MODULE.EVENT)
  @ResponseMessage('Approve an event')
  approveEvent(
    @Param('id') id: string,
    @Body() approveEventDto: ApproveEventDto,
    @User() user: any,
  ) {
    return this.eventService.approveEvent(id, approveEventDto, user?.userId);
  }

  /** Admin từ chối sự kiện */
  @Patch(':id/reject')
  @Permission('Reject an event', SYSTEM_MODULE.EVENT)
  @ResponseMessage('Reject an event')
  rejectEvent(@Param('id') id: string) {
    return this.eventService.rejectEvent(id);
  }

  /** Admin tạo QR token cho sự kiện check-in */
  @Post(':id/generate-qr-token')
  @Permission('Generate QR token', SYSTEM_MODULE.EVENT)
  @ResponseMessage('Generate QR token')
  async generateQrToken(@Param('id') eventId: string, @Body() dto: GenerateQrTokenDto) {
    const token = await this.eventService.generateQrToken(eventId, dto.expiresInMinutes);
    return {
      EC: 1,
      EM: 'Tạo mã QR thành công',
      token,
    };
  }

  @Delete(':id')
  @Permission('Delete an event', SYSTEM_MODULE.EVENT)
  @ResponseMessage('Delete an event')
  remove(@Param('id') id: string) {
    return this.eventService.remove(id);
  }
}
