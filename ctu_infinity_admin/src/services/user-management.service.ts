import privateAxios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';
import {
    IUserManageData,
    IUserManage,
    IUpdateBasicInfo,
    ICreateStudentProfile,
    IUpdateStudentProfile,
    ICreateOrganizerProfile,
    IUpdateOrganizerProfile,
} from '@/types/user.type';

export const UserManagementService = {
    // ─── Users ────────────────────────────────────────────────────────────────
    CallGetAllUsersWithProfiles: (
        page: number = 1,
        limit: number = 10,
        accountType?: string,
    ): Promise<IBackendRes<IUserManageData>> => {
        const params: Record<string, string | number> = { page, limit };
        if (accountType && accountType !== 'all') {
            params.accountType = accountType;
        }
        return privateAxios.get('/users/manage', { params });
    },

    CallGetUserDetailWithProfile: (userId: string): Promise<IBackendRes<{ user: IUserManage }>> => {
        return privateAxios.get(`/users/${userId}/profile`);
    },

    CallUpdateUserBasicInfo: (
        userId: string,
        data: IUpdateBasicInfo,
    ): Promise<IBackendRes<{ userId: string }>> => {
        return privateAxios.patch(`/users/${userId}/basic-info`, data);
    },

    CallDeleteUser: (userId: string): Promise<IBackendRes<{ userId: string }>> => {
        return privateAxios.delete(`/users/${userId}`);
    },

    CallRestoreUser: (userId: string): Promise<IBackendRes<{ userId: string }>> => {
        return privateAxios.patch(`/users/${userId}/restore`);
    },

    CallAdminCreateUser: (data: {
        email: string;
        fullName: string;
        password: string;
        phoneNumber: string;
        age?: number;
        gender?: string;
        roleId: string;
    }): Promise<IBackendRes<{ userId: string }>> => {
        return privateAxios.post('/users/admin-create', data);
    },


    // ─── Students ─────────────────────────────────────────────────────────────
    CallCreateStudentProfile: (
        data: ICreateStudentProfile,
    ): Promise<IBackendRes<{ studentId: string }>> => {
        return privateAxios.post('/student', data);
    },

    CallUpdateStudentProfile: (
        studentId: string,
        data: IUpdateStudentProfile,
    ): Promise<IBackendRes<{ studentId: string }>> => {
        return privateAxios.patch(`/student/${studentId}`, data);
    },

    // ─── Organizers ───────────────────────────────────────────────────────────
    CallCreateOrganizerProfile: (
        data: ICreateOrganizerProfile,
    ): Promise<IBackendRes<{ organizerId: string }>> => {
        return privateAxios.post('/organizers', data);
    },

    CallUpdateOrganizerProfile: (
        organizerId: string,
        data: IUpdateOrganizerProfile,
    ): Promise<IBackendRes<{ organizerId: string }>> => {
        return privateAxios.patch(`/organizers/${organizerId}`, data);
    },
};
