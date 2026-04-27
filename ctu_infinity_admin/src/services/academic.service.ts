import privateAxios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';
import {
    IFacultiesRes,
    IMajorsRes,
    IClassesRes,
    ICreateFaculty,
    IUpdateFaculty,
    ICreateMajor,
    IUpdateMajor,
    ICreateClass,
    IUpdateClass,
} from '@/types/academic.type';

export const AcademicService = {
    // ─── Faculties ────────────────────────────────────────────────────────────
    CallGetAllFaculties: (): Promise<IBackendRes<IFacultiesRes>> => {
        return privateAxios.get('/falculties');
    },

    CallCreateFaculty: (data: ICreateFaculty): Promise<IBackendRes<{ falcultyId: string }>> => {
        return privateAxios.post('/falculties', data);
    },

    CallUpdateFaculty: (
        id: string,
        data: IUpdateFaculty,
    ): Promise<IBackendRes<{ falcultyId: string }>> => {
        return privateAxios.patch(`/falculties/${id}`, data);
    },

    CallDeleteFaculty: (id: string): Promise<IBackendRes<{ falcultyId: string }>> => {
        return privateAxios.delete(`/falculties/${id}`);
    },

    // ─── Majors ───────────────────────────────────────────────────────────────
    CallGetAllMajors: (): Promise<IBackendRes<IMajorsRes>> => {
        return privateAxios.get('/majors');
    },

    CallCreateMajor: (data: ICreateMajor): Promise<IBackendRes<{ majorId: string }>> => {
        return privateAxios.post('/majors', data);
    },

    CallUpdateMajor: (
        id: string,
        data: IUpdateMajor,
    ): Promise<IBackendRes<{ majorId: string }>> => {
        return privateAxios.patch(`/majors/${id}`, data);
    },

    CallDeleteMajor: (id: string): Promise<IBackendRes<{ majorId: string }>> => {
        return privateAxios.delete(`/majors/${id}`);
    },

    // ─── Classes ──────────────────────────────────────────────────────────────
    CallGetAllClasses: (
        page: number = 1,
        limit: number = 10,
    ): Promise<IBackendRes<IClassesRes>> => {
        return privateAxios.get('/class', { params: { page, limit } });
    },

    CallCreateClass: (data: ICreateClass): Promise<IBackendRes<{ classId: string }>> => {
        return privateAxios.post('/class', data);
    },

    CallUpdateClass: (
        id: string,
        data: IUpdateClass,
    ): Promise<IBackendRes<{ classId: string }>> => {
        return privateAxios.patch(`/class/${id}`, data);
    },

    CallDeleteClass: (id: string): Promise<IBackendRes<{ classId: string }>> => {
        return privateAxios.delete(`/class/${id}`);
    },
};
