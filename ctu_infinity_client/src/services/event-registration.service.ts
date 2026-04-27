import privateAxios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';
import { IEvent } from '@/types/event.type';

export enum REGISTRATION_STATUS {
  REGISTERED = 'REGISTERED',
  CANCELLED = 'CANCELLED',
  ATTENDED = 'ATTENDED',
  ABSENT = 'ABSENT',
}

export interface IMyEventRegistration {
  id: string;
  studentId: string;
  eventId: string;
  status: REGISTRATION_STATUS;
  registeredAt: string;
  attendedAt: string | null;
  cancelledAt: string | null;
  event: IEvent & {
    categories?: { categoryId: string; categoryName: string }[];
    organizer?: { organizerId: string; name: string };
    criteria?: { criteriaId: string; criteriaName: string; criteriaCode: string; maxScore: number | null };
  };
}

export interface IMyEventsFilter {
  startDate?: string;
  endDate?: string;
  categoryIds?: string;
  criteriaIds?: string;
  status?: REGISTRATION_STATUS;
}

export const eventRegistrationService = {
  getMyEvents: (
    filter: IMyEventsFilter = {}
  ): Promise<IBackendRes<{ registrations: IMyEventRegistration[] }>> => {
    return privateAxios.get('/event-registrations/my-events', {
      params: filter,
    });
  },

  cancelMyRegistration: (eventId: string): Promise<IBackendRes<null>> => {
    return privateAxios.patch('/event-registrations/cancel', { eventId });
  },
};
