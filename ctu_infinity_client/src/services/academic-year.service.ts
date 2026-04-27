import privateAxios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';
import { IAcademicYear } from '@/types/semester.type';

export const academicYearService = {
  getAll: (): Promise<IBackendRes<{ academicYears: IAcademicYear[] }>> => {
    return privateAxios.get('/academic-year');
  },
};
