import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from 'src/decorators/customize';
import { EmailService } from './email.service';
import { TestEventApprovedNotificationDto } from './dto/test-event-approved-notification.dto';

/** ────────────────────────────────────────────────────────────────────────────
 * EmailController
 *
 * Hiện chỉ chứa route test độc lập để verify email template + SendGrid config.
 * Route thật (production) sẽ được trigger qua EmailQueueService từ EventService.
 * ──────────────────────────────────────────────────────────────────────────── */
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) { }

  /**
   * POST /api/v1/email/test-event-approved-notification
   *
   * Route TEST – chỉ dùng để verify template và cấu hình SendGrid.
   * Email luôn gửi tới địa chỉ cố định (hard-code theo yêu cầu giai đoạn test).
   * KHÔNG dùng trong production flow.
   */
  @Public()
  @Post('test-event-approved-notification')
  @HttpCode(HttpStatus.OK)
  async testEventApprovedNotification(
    @Body() dto: TestEventApprovedNotificationDto,
  ) {
    await this.emailService.sendEventApprovedNotification({
      to: 'luong03510@gmail.com',
      studentName: dto.studentName,
      eventName: dto.eventName,
      startDate: dto.startDate,
      endDate: dto.endDate,
      registrationDeadline: dto.registrationDeadline,
      eventLocation: dto.eventLocation,
      organizerName: dto.organizerName,
      criteriaMatch: dto.criteriaMatch,
      categoryMatches: dto.categoryMatches,
      criteriaName: dto.criteriaName,
      criteriaCode: dto.criteriaCode,
      score: dto.score,
      eventUrl: dto.eventUrl,
    });

    return {
      EC: 1,
      EM: 'Gửi email test thành công',
      to: 'luong03510@gmail.com',
      criteriaMatch: dto.criteriaMatch,
      categoryMatches: dto.categoryMatches,
    };
  }
}
