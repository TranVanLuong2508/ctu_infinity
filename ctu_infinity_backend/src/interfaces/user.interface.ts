export enum UserGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export interface IUser {
  userId?: string;
  email: string;
  fullName: string;
  password?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  gender?: UserGender;
  avatar?: string;
  address?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  refreshToken?: string;
  roleId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
