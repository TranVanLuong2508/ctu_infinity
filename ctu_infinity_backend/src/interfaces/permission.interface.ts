export interface IPermission {
  permissionId?: string;
  permissionName: string;
  apiPath: string;
  method: string;
  module: string;
  createdAt?: Date;
  updatedAt?: Date;
}
