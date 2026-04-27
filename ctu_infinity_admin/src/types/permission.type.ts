export interface IPermissionn {
  permissionId: string;
  name: string;
  apiPath: string;
  method: string;
  module: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPermissionCreate {
  name: string;
  apiPath: string;
  method: string;
  module: string;
}

export interface IPermissionUpdate {
  name: string;
  apiPath: string;
  method: string;
  module: string;
}

export interface IPermissionData {
  permissions: IPermissionn[];
}

export interface PermissionModule {
  module: string;
  permissions: IPermissionn[];
}
