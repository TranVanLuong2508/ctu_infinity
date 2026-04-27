import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { GoogleCalendarService } from './google-calendar.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { Public, ResponseMessage } from 'src/decorators/customize';

@Controller('google-calendar')
export class GoogleCalendarController {
  constructor(private readonly googleCalendarService: GoogleCalendarService) {}

  // ─── USER OAUTH ENDPOINTS ────────────────────────────────────────────────────

  /**
   * POST /google-calendar/user/initiate
   * Khởi tạo OAuth flow cho user.
   * Nhận event data và sourceEventId, trả về Google OAuth URL để redirect user.
   */
  @Post('user/initiate')
  @Public()
  @ResponseMessage('User OAuth flow initiated')
  initiateUserAuth(@Body() body: { eventData: CreateCalendarEventDto; sourceEventId?: string }) {
    const authUrl = this.googleCalendarService.initiateUserAuth(body.eventData, body.sourceEventId);
    return {
      EC: 1,
      EM: 'URL xác thực đã được tạo',
      authUrl,
    };
  }

  /**
   * GET /google-calendar/user/callback?code=...&state=...
   * Callback endpoint sau khi user authorize với Google.
   * Nhận code và state, tạo event vào calendar của user, redirect về client với kết quả.
   */
  @Get('user/callback')
  @Public()
  @ResponseMessage('User calendar event created')
  async userCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.googleCalendarService.handleUserCallback(code, state);

      // Lấy client URL từ env
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

      // Redirect về trang event detail nếu có sourceEventId, ngược lại về trang events
      let redirectUrl: string;
      if (result.data.sourceEventId) {
        redirectUrl = `${clientUrl}/events/${result.data.sourceEventId}?calendar_success=true&event_id=${result.data.eventId}`;
      } else {
        redirectUrl = `${clientUrl}/events?calendar_success=true&event_id=${result.data.eventId}`;
      }

      res.redirect(redirectUrl);
    } catch (error) {
      // Redirect về client với error
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const redirectUrl = `${clientUrl}/events?calendar_success=false&error=${encodeURIComponent(error.message || 'Unknown error')}`;

      res.redirect(redirectUrl);
    }
  }
}
