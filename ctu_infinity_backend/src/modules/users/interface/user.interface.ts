export interface IUser {
  userId: string;
  email: string;
  password?: string;
  fullName: string;
  roleId: string;
  roleName: string;
  gender: string;
  avatarUrl: string;
  refreshToken?: string;
  permissions?: {
    name: string;
    apiPath: string;
    method: string;
    module: string;
  }[];
}
