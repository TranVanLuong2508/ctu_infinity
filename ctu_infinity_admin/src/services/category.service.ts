import privateAxios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';

export interface ICategory {
  categoryId: string;
  categoryName: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateCategory {
  categoryName: string;
  description?: string;
}

export interface IUpdateCategory {
  categoryName?: string;
  description?: string;
}

export const categoryApi = {
  getAll: (): Promise<IBackendRes<{ categories: ICategory[] }>> =>
    privateAxios.get('/event-category'),

  getOne: (id: string): Promise<IBackendRes<ICategory>> =>
    privateAxios.get(`/event-category/${id}`),

  create: (data: ICreateCategory): Promise<IBackendRes<ICategory>> =>
    privateAxios.post('/event-category', data),

  update: (
    id: string,
    data: IUpdateCategory,
  ): Promise<IBackendRes<ICategory>> =>
    privateAxios.patch(`/event-category/${id}`, data),

  delete: (id: string): Promise<IBackendRes<null>> =>
    privateAxios.delete(`/event-category/${id}`),
};
