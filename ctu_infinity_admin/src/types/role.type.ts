export interface IRole {
  roleId: string;
  roleName: string;
  description: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  rolePermission?: any;
}

export interface IRoleData {
  roles: IRole[];
}

export interface ModalRoleData {
  roleName: string;
  description: string;
  isActive: boolean;
  permissionIds: string[];
}

export interface IReturnRole {
  roleId: string;
  roleName: string;
}

export interface CheckRole {
  userCount: number;
  alternativeRoles: IReturnRole[];
}

export interface IAssignData {
  roleId: string;
  targetRoleId: string;
}

export type filteType = 'all' | 'active' | 'deleted';
