import {
  Injectable,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { google } from 'googleapis';
import { ApiConfigService } from 'src/shared';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { randomUUID } from 'crypto';
import { parseMarkdownToPlainText } from './utils/markdown-parser';

// Interface cho pending user event (lưu tạm trong memory)
interface PendingUserEvent {
  eventData: CreateCalendarEventDto;
  sourceEventId?: string; // ID của event trong hệ thống CTU (để redirect về đúng trang)
}

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  // Map tạm để lưu event data cho user OAuth flow (key: state UUID, value: pending event)
  // Chỉ dùng để demo, không lưu vào DB
  private readonly pendingUserEvents = new Map<string, PendingUserEvent>();

  constructor(private readonly configService: ApiConfigService) {}

  /**
   * Khởi tạo OAuth flow cho user.
   * Lưu event data vào memory với UUID làm key, trả về auth URL với state=UUID.
   * User sẽ được redirect tới Google để authorize.
   *
   * @param eventData - Thông tin sự kiện cần tạo
   * @param sourceEventId - ID của event trong hệ thống CTU (để redirect về đúng trang)
   */
  initiateUserAuth(eventData: CreateCalendarEventDto, sourceEventId?: string): string {
    const { clientId, clientSecret, redirectUri } = this.configService.googleCalendarConfig;

    // Tạo redirect URI cho user OAuth flow (khác với setup flow)
    // Thay /auth-callback thành /user/callback
    const userRedirectUri = redirectUri.replace('/auth-callback', '/user/callback');

    this.logger.log(`User OAuth redirect URI: ${userRedirectUri}`);
    this.logger.warn(
      `Đảm bảo URI này đã được thêm vào Google Cloud Console → OAuth 2.0 Client → Authorized redirect URIs`,
    );

    // Tạo UUID để làm state parameter
    const state = randomUUID();

    // Lưu event data và sourceEventId vào memory với key là state
    this.pendingUserEvents.set(state, {
      eventData,
      sourceEventId,
    });

    // Tự động xóa sau 10 phút để tránh memory leak
    setTimeout(
      () => {
        this.pendingUserEvents.delete(state);
        this.logger.debug(`Cleaned up pending event with state: ${state}`);
      },
      10 * 60 * 1000,
    ); // 10 phút

    // Tạo OAuth client riêng cho user với redirect URI mới
    const userOAuthClient = new google.auth.OAuth2(clientId, clientSecret, userRedirectUri);

    // Tạo authorization URL với state
    const authUrl = userOAuthClient.generateAuthUrl({
      access_type: 'online', // Chỉ cần access_token, không cần refresh_token
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      state: state,
      prompt: 'select_account', // Cho phép user chọn account
    });

    this.logger.log(
      `User OAuth flow initiated with state: ${state}, redirect URI: ${userRedirectUri}`,
    );

    return authUrl;
  }

  /**
   * Xử lý callback từ Google OAuth.
   * Nhận code và state, đổi code lấy access_token, tạo event vào calendar của user.
   */
  async handleUserCallback(code: string, state: string) {
    try {
      // Kiểm tra state có tồn tại không
      const pendingEvent = this.pendingUserEvents.get(state);

      if (!pendingEvent) {
        this.logger.error(`Invalid or expired state: ${state}`);
        throw new BadRequestException({
          EC: 0,
          EM: 'State không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.',
        });
      }

      const { eventData, sourceEventId } = pendingEvent;

      const { clientId, clientSecret, redirectUri } = this.configService.googleCalendarConfig;

      // Tạo redirect URI cho user OAuth flow (giống với initiateUserAuth)
      const userRedirectUri = redirectUri.replace('/auth-callback', '/user/callback');

      // Tạo OAuth client mới để đổi code lấy token
      const userOAuthClient = new google.auth.OAuth2(clientId, clientSecret, userRedirectUri);

      // Đổi authorization code lấy access token
      const { tokens } = await userOAuthClient.getToken(code);

      this.logger.log(`Access token retrieved for state: ${state}`);

      // Set credentials với access_token vừa lấy được
      userOAuthClient.setCredentials(tokens);

      // Tạo calendar client với user's access token
      const calendar = google.calendar({ version: 'v3', auth: userOAuthClient });

      // Parse markdown description thành plain text
      const plainDescription = parseMarkdownToPlainText(eventData.description);

      // Tạo event body
      const eventBody = {
        summary: eventData.summary,
        description: plainDescription,
        location: eventData.location,
        start: {
          dateTime: eventData.startTime,
          timeZone: 'Asia/Ho_Chi_Minh',
        },
        end: {
          dateTime: eventData.endTime,
          timeZone: 'Asia/Ho_Chi_Minh',
        },
      };

      // Tạo sự kiện trên calendar của user
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: eventBody,
      });

      const createdEvent = response.data;

      this.logger.log(
        `Event created on user's calendar: ${createdEvent.id} - "${createdEvent.summary}"`,
      );

      // Xóa event data khỏi memory
      this.pendingUserEvents.delete(state);

      return {
        EC: 1,
        EM: 'Tạo sự kiện trên Google Calendar của bạn thành công',
        data: {
          eventId: createdEvent.id,
          htmlLink: createdEvent.htmlLink,
          summary: createdEvent.summary,
          start: createdEvent.start,
          end: createdEvent.end,
          sourceEventId, // Trả về sourceEventId để controller redirect về đúng trang
        },
      };
    } catch (error) {
      this.logger.error('Error in user OAuth callback', error?.message);

      // Xóa state nếu có lỗi
      if (state) {
        this.pendingUserEvents.delete(state);
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Lỗi khi tạo sự kiện trên Google Calendar',
      });
    }
  }
}
