import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';
import { Mutex } from 'async-mutex';
import { IBackendRes } from '@/types/backend.type';
import { IAccount } from '@/types/authen.type';

const mutex = new Mutex();
const NO_RETRY_HEADER = 'x-no-retry';

const privateAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BACKEND_URL,
  withCredentials: true,
});

const handleRefreshToken = async (): Promise<string | null> => {
  return await mutex.runExclusive(async () => {
    const res = (await privateAxios.get(
      '/auth/refreshToken'
    )) as IBackendRes<IAccount>;
    if (res && res.EC === 1 && res.data) {
      return res.data?.access_token;
    } else return null;
  });
};

privateAxios.interceptors.request.use((config) => {
  const access_token = useAuthStore.getState().access_token;
  if (access_token) {
    config.headers.Authorization = `Bearer ${access_token}`;
  }
  return config;
});

privateAxios.interceptors.response.use(
  (response) => {
    // const { data } = response
    return response.data;
  },

  async (error) => {
    if (
      error.config &&
      error.response &&
      +error.response.status === 401 &&
      error.config.url !== '/auth/login' &&
      !error.config.headers[NO_RETRY_HEADER]
    ) {
      const access_token = await handleRefreshToken();
      error.config.headers[NO_RETRY_HEADER] = 'true';
      if (access_token) {
        error.config.headers['Authorization'] = `Bearer ${access_token}`;
        useAuthStore.setState({ access_token: access_token });
        return privateAxios.request(error.config);
      }
    }

    if (
      error.config &&
      error.response &&
      +error.response.status === 400 &&
      error.config.url === '/auth/refreshToken'
    ) {
      const message =
        error?.error?.response?.data?.message ??
        'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập.';
      useAuthStore.getState().setRefreshTokenAction(true, message);
    }
    return error?.response?.data ?? Promise.reject(error);
  }
);

export default privateAxios;
