import privateAxios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';
import {
  ISubscriptionResponse,
  ICreateSubscriptionDto,
  IUpdateSubscriptionDto,
  ISubscriber,
} from '@/types/subscription.type';

export const subscriptionService = {
  /**
   * Tạo hoặc cập nhật subscription của sinh viên hiện tại
   */
  createOrUpdateSubscription: (
    data: ICreateSubscriptionDto,
  ): Promise<IBackendRes<ISubscriptionResponse>> => {
    return privateAxios.post('/subscriptions', data);
  },

  /**
   * Lấy thông tin subscription của sinh viên hiện tại
   */
  getMySubscription: (): Promise<IBackendRes<ISubscriptionResponse>> => {
    return privateAxios.get('/subscriptions/me');
  },

  /**
   * Cập nhật subscription của sinh viên hiện tại
   */
  updateMySubscription: (
    data: IUpdateSubscriptionDto,
  ): Promise<IBackendRes<ISubscriptionResponse>> => {
    return privateAxios.put('/subscriptions/me', data);
  },

  /**
   * Xóa subscription của sinh viên hiện tại
   */
  deleteMySubscription: (): Promise<IBackendRes<void>> => {
    return privateAxios.delete('/subscriptions/me');
  },

  /**
   * Admin: Lấy tất cả subscriptions
   */
  getAllSubscriptions: (): Promise<
    IBackendRes<
      Array<
        ISubscriptionResponse & {
          student: {
            studentId: string;
            studentCode: string;
            fullName: string;
            email: string;
          };
        }
      >
    >
  > => {
    return privateAxios.get('/subscriptions');
  },

  /**
   * Admin: Lấy danh sách sinh viên đăng ký theo category
   */
  getSubscribersByCategory: (
    categoryId: string,
  ): Promise<IBackendRes<ISubscriber[]>> => {
    return privateAxios.get(`/subscriptions/category/${categoryId}`);
  },

  /**
   * Admin: Lấy danh sách sinh viên đăng ký theo criteria
   */
  getSubscribersByCriteria: (
    criteriaId: string,
  ): Promise<IBackendRes<ISubscriber[]>> => {
    return privateAxios.get(`/subscriptions/criteria/${criteriaId}`);
  },
};
