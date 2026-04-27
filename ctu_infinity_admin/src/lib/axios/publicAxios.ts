import axios from 'axios';

const publicAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BACKEND_URL,
  withCredentials: true,
});

publicAxios.interceptors.response.use((response) => {
  // const { data } = response
  return response.data;
});

export default publicAxios;
