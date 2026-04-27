import privateAxios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface IAcademicYear {
  yearId: string;
  yearName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface ISemester {
  semesterId: string;
  semesterName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  yearId: string;
  academicYear?: IAcademicYear;
}

export interface ICreateAcademicYearPayload {
  yearName: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
}

export interface ICreateSemesterPayload {
  semesterName: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  yearId: string;
}

// ── Academic Year ─────────────────────────────────────────────────────────────

export const academicYearApi = {
  getAll: (): Promise<IBackendRes<{ academicYears: IAcademicYear[] }>> =>
    privateAxios.get('/academic-year'),

  getOne: (id: string): Promise<IBackendRes<{ academicYear: IAcademicYear }>> =>
    privateAxios.get(`/academic-year/${id}`),

  create: (
    payload: ICreateAcademicYearPayload,
  ): Promise<IBackendRes<IAcademicYear>> =>
    privateAxios.post('/academic-year', payload),

  update: (
    id: string,
    payload: Partial<ICreateAcademicYearPayload>,
  ): Promise<IBackendRes<IAcademicYear>> =>
    privateAxios.patch(`/academic-year/${id}`, payload),

  remove: (id: string): Promise<IBackendRes<unknown>> =>
    privateAxios.delete(`/academic-year/${id}`),
};

// ── Semesters ─────────────────────────────────────────────────────────────────

export const semestersApi = {
  getAll: (): Promise<IBackendRes<{ semesters: ISemester[] }>> =>
    privateAxios.get('/semesters'),

  getCurrent: (): Promise<IBackendRes<{ semester: ISemester }>> =>
    privateAxios.get('/semesters/in-year/current'),

  getOne: (id: string): Promise<IBackendRes<{ semester: ISemester }>> =>
    privateAxios.get(`/semesters/${id}`),

  getByYear: (
    yearId: string,
  ): Promise<IBackendRes<{ semesters: ISemester[] }>> =>
    privateAxios.get(`/semesters/${yearId}/semesters-in-year`),

  create: (payload: ICreateSemesterPayload): Promise<IBackendRes<ISemester>> =>
    privateAxios.post('/semesters', payload),

  update: (
    id: string,
    payload: Partial<ICreateSemesterPayload>,
  ): Promise<IBackendRes<ISemester>> =>
    privateAxios.patch(`/semesters/${id}`, payload),

  remove: (id: string): Promise<IBackendRes<unknown>> =>
    privateAxios.delete(`/semesters/${id}`),
};
