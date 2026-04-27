import privateAxios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';

export interface IOrganizer {
  organizerId: string;
  organizerName: string;
  description?: string;
  userId: string;
}

export const organizerApi = {
  getAll: (): Promise<IBackendRes<{ organizers: IOrganizer[] }>> =>
    privateAxios.get('/organizers'),
};
