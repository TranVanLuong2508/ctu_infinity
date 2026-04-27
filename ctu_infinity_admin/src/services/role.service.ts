import privateAxios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';
import {
  ModalRoleData,
  IRole,
  IRoleData,
  CheckRole,
  IAssignData,
  IReturnRole,
} from '@/types/role.type';

export const RoleService = {
  CallFetchRolesList: (): Promise<IBackendRes<IRoleData>> => {
    return privateAxios.get(`/roles`);
  },

  CallCreateRole: (roleData: ModalRoleData): Promise<IBackendRes<IRole>> => {
    return privateAxios.post('/roles', roleData);
  },

  CallGetRoleDetail: (roleId: string): Promise<IBackendRes<IRole>> => {
    return privateAxios.get(`/roles/get-by-id/${roleId}`);
  },

  CallUpdateRole: (
    roleId: string,
    payload: ModalRoleData
  ): Promise<IBackendRes<{ roleId: string }>> => {
    return privateAxios.patch(`/roles/${roleId}`, payload);
  },

  CallCheckRoleBeforeDelete(roleId: string): Promise<IBackendRes<CheckRole>> {
    return privateAxios.get(`/roles/${roleId}/check-delete`);
  },

  CallReassignAndDeleteRole(
    roleId: string,
    targetRoleId: string
  ): Promise<IBackendRes<IAssignData>> {
    return privateAxios.post(`/roles/${roleId}/reassign-and-delete`, {
      targetRoleId,
    });
  },

  CallDeleteRole(roleId: string): Promise<IBackendRes<null>> {
    return privateAxios.delete(`/roles/${roleId}`);
  },

  CallRestoreRole(roleId: string): Promise<IBackendRes<IReturnRole>> {
    return privateAxios.patch(`/roles/${roleId}/restore`);
  },
};
