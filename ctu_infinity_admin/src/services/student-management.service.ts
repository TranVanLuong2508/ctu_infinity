import privateAxios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IStudentItem {
    studentId: string;
    studentCode: string;
    enrollmentYear: number;
    classId?: string;
    userId: string;
    user?: {
        userId: string;
        fullName: string;
        email: string;
        avatarUrl?: string | null;
        isDeleted?: boolean;
    };
    class?: {
        classId: string;
        className: string;
        major?: {
            majorId: string;
            majorName: string;
            falculty?: {
                falcultyId: string;
                falcultyName: string;
            };
        };
    };
}

export interface IStudentListData {
    students: IStudentItem[];
    total: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const studentManagementApi = {
    /**
     * Lấy danh sách tất cả sinh viên – có phân trang.
     * GET /student?page=&limit=
     */
    getAll: (
        page: number = 1,
        limit: number = 20,
    ): Promise<IBackendRes<IStudentListData>> =>
        privateAxios.get('/student', { params: { page, limit } }),

    /**
     * Lấy chi tiết một sinh viên theo studentId.
     * GET /student/:id
     */
    getOne: (studentId: string): Promise<IBackendRes<IStudentItem>> =>
        privateAxios.get(`/student/${studentId}`),

    /**
     * Soft-delete sinh viên.
     * DELETE /student/:id
     */
    remove: (studentId: string): Promise<IBackendRes<{ studentId: string }>> =>
        privateAxios.delete(`/student/${studentId}`),

    /**
     * Khôi phục sinh viên đã bị xoá mềm.
     * PATCH /student/:id/restore
     */
    restore: (studentId: string): Promise<IBackendRes<{ studentId: string }>> =>
        privateAxios.patch(`/student/${studentId}/restore`),
};
