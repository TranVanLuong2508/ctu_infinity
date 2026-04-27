import privateAxios from '@/lib/axios/privateAxios';
import publicAxios from '@/lib/axios/publicAxios';
import { IBackendRes } from '@/types/backend.type';
import { IEvent, IEventListResponse, EventStatus } from '@/types/event.type';

export const eventService = {
  /**
   * Lấy danh sách tất cả sự kiện (có thể filter theo status)
   */
  getAllEvents: (
    status?: EventStatus,
  ): Promise<IBackendRes<IEventListResponse>> => {
    return privateAxios.get('/events', {
      params: status ? { status } : {},
    });
  },

  /**
   * Lấy chi tiết một sự kiện theo ID
   */
  getEventById: (eventId: string): Promise<IBackendRes<IEvent>> => {
    return privateAxios.get(`/events/${eventId}`);
  },

  /**
   * Lấy danh sách sự kiện public (không cần auth) - nếu có
   */
  getPublicEvents: (): Promise<IBackendRes<IEventListResponse>> => {
    return publicAxios.get('/events/public');
  },

  /**
   * Sinh viên đăng ký tham gia sự kiện
   */
  registerEvent: (
    eventId: string,
  ): Promise<IBackendRes<{ message: string }>> => {
    return privateAxios.post(`/event-registrations/register`, { eventId });
  },
};
