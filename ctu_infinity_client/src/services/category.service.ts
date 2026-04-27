import privateAxios from '@/lib/axios/privateAxios';
import publicAxios from '@/lib/axios/publicAxios';
import { IBackendRes } from '@/types/backend.type';

export interface IEventCategory {
  categoryId: string;
  categoryName: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export const categoryService = {
  /**
   * Lấy danh sách tất cả event categories
   * Note: Backend trả về { categories: [] } và interceptor wrap vào data
   */
  getAllCategories: (): Promise<
    IBackendRes<{ categories: IEventCategory[] }>
  > => {
    return publicAxios.get('/event-category');
  },

  /**
   * Lấy chi tiết một category theo ID
   */
  getCategoryById: (
    categoryId: string,
  ): Promise<IBackendRes<IEventCategory>> => {
    return publicAxios.get(`/event-category/${categoryId}`);
  },
};
