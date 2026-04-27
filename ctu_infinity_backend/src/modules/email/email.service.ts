import { Injectable, Logger } from '@nestjs/common';
import sgMail from '@sendgrid/mail';
import {
  EmailJobPayload,
  EventApprovedEmailPayload,
  RegistrationConfirmationEmailPayload,
  GenericEmailPayload,
} from './dto/email-job.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  }

  private get defaultFrom() {
    return {
      email: process.env.SENDGRID_FROM_EMAIL ?? 'noreply@ctu-infinity.edu.vn',
      name: process.env.SENDGRID_FROM_NAME ?? 'CTU Infinity',
    };
  }

  async dispatch(payload: EmailJobPayload): Promise<void> {
    switch (payload.jobType) {
      case 'event_approved_notification':
        return this.sendEventApprovedNotification(payload);
      case 'registration_confirmation':
        return this.sendRegistrationConfirmation(payload);
      case 'send_generic':
        return this.sendGenericEmail(payload);
      default:
        this.logger.warn(`Unknown jobType: ${(payload as any).jobType}`);
    }
  }

  async sendEventApprovedNotification(
    params: Omit<EventApprovedEmailPayload, 'jobType'>,
  ): Promise<void> {
    const msg: sgMail.MailDataRequired = {
      to: params.to,
      from: this.defaultFrom,
      subject: `[CTU Infinity] Sự kiện mới phù hợp với bạn: "${params.eventName}"`,
      html: this.buildEventApprovedHtml(params),
    };

    try {
      await sgMail.send(msg);
      this.logger.log(
        `[SendGrid] event_approved_notification → ${params.to} | event: ${params.eventName}`,
      );
    } catch (error: any) {
      const statusCode = error?.response?.status ?? error?.code;

      if (statusCode === 401 || statusCode === 403) {
        this.logger.error(
          `[SendGrid] Auth error (${statusCode}) – check SENDGRID_API_KEY. Will NOT retry.`,
        );
        return;
      }

      const detail = error?.response?.body?.errors ?? error?.message ?? error;
      this.logger.error(
        `[SendGrid] FAILED event_approved_notification → ${params.to}`,
        JSON.stringify(detail),
      );
      throw error;
    }
  }

  async sendRegistrationConfirmation(
    params: Omit<RegistrationConfirmationEmailPayload, 'jobType'>,
  ): Promise<void> {
    const msg: sgMail.MailDataRequired = {
      to: params.to,
      from: this.defaultFrom,
      subject: `[CTU Infinity] Xác nhận đăng ký: "${params.eventName}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a56db;">Xác nhận đăng ký thành công</h2>
          <p>Xin chào <strong>${params.studentName}</strong>,</p>
          <p>Bạn đã đăng ký tham gia sự kiện <strong>${params.eventName}</strong>.</p>
          <ul>
            <li><strong>Thời gian:</strong> ${params.eventDate}</li>
            <li><strong>Địa điểm:</strong> ${params.eventLocation}</li>
          </ul>
          <p>Trân trọng,<br/><strong>Ban Quản Trị CTU Infinity</strong></p>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(
        `[SendGrid] registration_confirmation → ${params.to} | event: ${params.eventName}`,
      );
    } catch (error: any) {
      const statusCode = error?.response?.status ?? error?.code;

      if (statusCode === 401 || statusCode === 403) {
        this.logger.error(
          `[SendGrid] Auth error (${statusCode}) – check SENDGRID_API_KEY. Will NOT retry.`,
        );
        return;
      }

      const detail = error?.response?.body?.errors ?? error?.message ?? error;
      this.logger.error(
        `[SendGrid] FAILED registration_confirmation → ${params.to}`,
        JSON.stringify(detail),
      );
      throw error;
    }
  }

  async sendGenericEmail(params: Omit<GenericEmailPayload, 'jobType'>): Promise<void> {
    const msg: sgMail.MailDataRequired = {
      to: params.to,
      from: this.defaultFrom,
      subject: params.subject,
      html: params.html,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`[SendGrid] generic → ${params.to} | subject: ${params.subject}`);
    } catch (error: any) {
      const statusCode = error?.response?.status ?? error?.code;

      if (statusCode === 401 || statusCode === 403) {
        this.logger.error(
          `[SendGrid] Auth error (${statusCode}) – check SENDGRID_API_KEY. Will NOT retry.`,
        );
        return;
      }

      const detail = error?.response?.body?.errors ?? error?.message ?? error;
      this.logger.error(
        `[SendGrid] FAILED generic → ${params.to}`,
        JSON.stringify(detail),
      );
      throw error;
    }
  }

  private buildEventApprovedHtml(
    params: Omit<EventApprovedEmailPayload, 'jobType'>,
  ): string {
    // ── Xây dựng phần lý do match ─────────────────────────────────────────────
    const reasonParts: string[] = [];

    if (params.criteriaMatch) {
      reasonParts.push(
        `<strong>Tiêu chí:</strong> <span style="color:#2563eb;">${params.criteriaMatch}</span>`,
      );
    }

    if (params.categoryMatches && params.categoryMatches.length > 0) {
      reasonParts.push(
        `<strong>Danh mục:</strong> <span style="color:#2563eb;">${params.categoryMatches.join(', ')}</span>`,
      );
    }

    const reasonHtml = reasonParts.length > 0
      ? `<p style="margin: 0 0 8px 0; color: #404040;">Hệ thống phát hiện sự kiện này phù hợp với đăng ký theo dõi của bạn:</p>
         <ul style="margin: 0; padding-left: 20px; color: #404040;">
           ${reasonParts.map((r) => `<li style="margin-bottom: 4px;">${r}</li>`).join('')}
         </ul>`
      : `<p style="margin: 0; color: #404040;">Hệ thống phát hiện một sự kiện mới vừa được duyệt phù hợp với bạn.</p>`;

    return `
      <div style="font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 10px; overflow: hidden;">
        <!-- Header -->
        <div style="background-color: #0f172a; padding: 24px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">CTU Infinity</h2>
        </div>
        
        <!-- Body -->
        <div style="padding: 32px 24px;">
          <h3 style="color: #171717; margin-top: 0; font-size: 18px;">Sự kiện mới phù hợp với bạn!</h3>
          <p style="color: #404040; line-height: 1.6; margin-bottom: 24px;">
            Xin chào <strong>${params.studentName}</strong>,
          </p>
          
          <div style="color: #404040; line-height: 1.6; margin-bottom: 24px;">
            ${reasonHtml}
          </div>

          <!-- Event Detail Card -->
          <div style="background-color: #f9fafb; border: 1px solid #eaeaea; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 12px 0;"><strong style="color: #171717;">Tên sự kiện:</strong> <span style="color: #404040;">${params.eventName}</span></p>
            <p style="margin: 0 0 12px 0;"><strong style="color: #171717;">Thời gian bắt đầu:</strong> <span style="color: #404040;">${params.startDate}</span></p>
            <p style="margin: 0 0 12px 0;"><strong style="color: #171717;">Thời gian kết thúc:</strong> <span style="color: #404040;">${params.endDate}</span></p>
            ${params.registrationDeadline ? `<p style="margin: 0 0 12px 0;"><strong style="color: #171717;">Thời hạn đăng ký:</strong> <span style="color: #dc2626;">${params.registrationDeadline}</span></p>` : ''}
            <p style="margin: 0 0 12px 0;"><strong style="color: #171717;">Địa điểm:</strong> <span style="color: #404040;">${params.eventLocation}</span></p>
            <p style="margin: 0 0 12px 0;"><strong style="color: #171717;">Ban tổ chức:</strong> <span style="color: #404040;">${params.organizerName ?? 'Chưa cập nhật'}</span></p>
            ${params.criteriaName ? `<p style="margin: 0 0 12px 0;"><strong style="color: #171717;">Tiêu chí ĐRL:</strong> <span style="color: #404040;">${params.criteriaCode ? `${params.criteriaCode} - ` : ''}${params.criteriaName}</span></p>` : ''}
            <p style="margin: 0;"><strong style="color: #171717;">Điểm rèn luyện:</strong> <span style="color: #16a34a; font-weight: 600;">+${params.score} điểm</span></p>
          </div>

          <!-- Call to action -->
          <div style="text-align: center; margin-top: 32px;">
            <a href="${params.eventUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 500; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 6px;">
              Xem chi tiết trên hệ thống
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #fafafa; border-top: 1px solid #eaeaea; padding: 24px; text-align: center;">
          <p style="color: #737373; font-size: 12px; margin: 0; line-height: 1.5;">
            Email này được gửi tự động từ hệ thống CTU Infinity.<br/>
            Bạn nhận được email này vì đã đăng ký nhận thông báo sự kiện.
          </p>
        </div>
      </div>
    `;
  }
}
