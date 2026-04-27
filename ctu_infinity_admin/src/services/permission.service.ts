import privateAxios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';
import {
  IPermissionCreate,
  IPermissionData,
  IPermissionUpdate,
} from '@/types/permission.type';

export const PermmissionService = {
  CallFetchPermissionList: (): Promise<IBackendRes<IPermissionData>> => {
    return privateAxios.get(`/permissions`);
  },

  CallCreatePermission: (
    payload: IPermissionCreate
  ): Promise<IBackendRes<{ permissionId: string; createAt: string }>> => {
    return privateAxios.post(`/permissions`, payload);
  },

  CallGetPermissionDetail: (
    permissionId: string
  ): Promise<IBackendRes<any>> => {
    return privateAxios.get(`/permissions/${permissionId}`);
  },

  CallUpdatePermission: (
    permissionId: string,
    payload: IPermissionUpdate
  ): Promise<IBackendRes<{ permissionId: string }>> => {
    return privateAxios.patch(`/permissions/${permissionId}`, payload);
  },

  CallDeletePermission: (
    permissionId: string
  ): Promise<IBackendRes<{ permissionId: string }>> => {
    return privateAxios.delete(`/permissions/${permissionId}`);
  },
};
