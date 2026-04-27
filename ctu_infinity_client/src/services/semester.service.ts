import privateAxios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';
import { ISemester } from '@/types/semester.type';

export const semesterService = {
  getByYear: (
    yearId: string,
  ): Promise<IBackendRes<{ semesters: ISemester[] }>> => {
    return privateAxios.get(`/semesters/${yearId}/semesters-in-year`);
  },

  getCurrent: (): Promise<IBackendRes<ISemester>> => {
    return privateAxios.get('/semesters/in-year/current');
  },
};
