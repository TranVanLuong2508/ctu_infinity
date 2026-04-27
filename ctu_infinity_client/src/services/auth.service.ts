import privateAxios from '@/lib/axios/privateAxios';
import publicAxios from '@/lib/axios/publicAxios';
import { IAccount, IGetAccount, LoginInput } from '@/types/authen.type';
import { IBackendRes } from '@/types/backend.type';

export const authService = {
  callLogin: (credentials: LoginInput): Promise<IBackendRes<IAccount>> => {
    return publicAxios.post(`/auth/login`, credentials);
  },

  callLogout: (): Promise<IBackendRes<IAccount>> => {
    return privateAxios.post(`/auth/logout`);
  },

  CallRefreshToken: (): Promise<IBackendRes<IAccount>> => {
    return privateAxios.get(`/auth/refreshToken`);
  },

  callFetchAccount: (): Promise<IBackendRes<IGetAccount>> => {
    return privateAxios.get('/auth/account');
  },
};
