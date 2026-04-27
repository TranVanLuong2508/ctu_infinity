import publicAxios from '@/lib/axios/publicAxios';
import { IBackendRes } from '@/types/backend.type';

export interface CreateCalendarEventDto {
  summary: string;
  description?: string;
  location?: string;
  startTime: string; // ISO8601 format
  endTime: string; // ISO8601 format
}

export interface InitiateUserAuthPayload {
  eventData: CreateCalendarEventDto;
  sourceEventId?: string; // ID của event trong hệ thống CTU
}

export interface InitiateUserAuthResponse {
  authUrl: string;
}

/**
 * Service để tương tác với Google Calendar API thông qua backend
 */
export const googleCalendarService = {
  /**
   * Khởi tạo OAuth flow cho user.
   * Nhận event data và sourceEventId, backend sẽ trả về Google OAuth URL để redirect user.
   */
  initiateUserAuth: (
    payload: InitiateUserAuthPayload,
  ): Promise<IBackendRes<InitiateUserAuthResponse>> => {
    return publicAxios.post('/google-calendar/user/initiate', payload);
  },
};
