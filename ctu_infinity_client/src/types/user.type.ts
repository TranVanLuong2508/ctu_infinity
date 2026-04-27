export interface IUser {
  userId: number;
  email: string;
  fullName: string;
  roleId: string;
  roleName: string;
  gender: string;
  avatarUrl: string;
  permissions?: {
    name: string;
    apiPath: string;
    method: string;
    module: string;
  }[];
}
