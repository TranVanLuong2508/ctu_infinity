import axios from 'axios';

/**
 * Public axios instance — không cần auth token.
 * Dùng cho các API public như event-templates (demo).
 */
const publicAxios = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BACKEND_URL,
    withCredentials: true,
});

publicAxios.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error?.response?.data ?? error),
);

export default publicAxios;
