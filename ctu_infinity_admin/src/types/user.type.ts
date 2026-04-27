// Account Types
export type AccountType = 'STUDENT' | 'ORGANIZER' | 'USER';

// Nested profile types
export interface IFaculty {
  falcultyId: string;
  falcultyName: string;
}

export interface IMajor {
  majorId: string;
  majorName: string;
  falculty?: IFaculty;
}

export interface IClass {
  classId: string;
  className: string;
  major?: IMajor;
}

export interface IStudentProfile {
  studentId: string;
  studentCode: string;
  enrollmentYear: number;
  classId?: string;
  class?: IClass;
}

export interface IOrganizerProfile {
  organizerId: string;
  organizerName: string;
  description?: string;
}

export interface IRole {
  roleId: string;
  roleName: string;
}

// Main user manage type
export interface IUserManage {
  userId: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  gender?: string;
  birthDate?: string;
  age?: number;
  roleId: string;
  role?: IRole;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;
  student?: IStudentProfile;
  organizer?: IOrganizerProfile;
  accountType: AccountType;
}

// Paginated response
export interface IUserManagePagination {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface IUserManageData {
  users: IUserManage[];
  pagination: IUserManagePagination;
}

// Create/Update DTOs
export interface IUpdateBasicInfo {
  fullName?: string;
  phoneNumber?: string;
  gender?: string;
  birthDate?: string;
  age?: number;
  roleId?: string;
  avatarUrl?: string;
}

export interface ICreateStudentProfile {
  userId: string;
  studentCode: string;
  enrollmentYear: number;
  classId?: string;
}

export interface IUpdateStudentProfile {
  studentCode?: string;
  enrollmentYear?: number;
  classId?: string;
}

export interface ICreateOrganizerProfile {
  userId: string;
  organizerName: string;
  description?: string;
}

export interface IUpdateOrganizerProfile {
  organizerName?: string;
  description?: string;
}

// Legacy types (keep for compatibility)
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

export interface IUserBasic {
  userId: number;
  email: string;
  fullName: string;
  phoneNumber: string;
  avatarUrl: string;
  genderCode: string;
  age: number;
  roleId: string;
  birthDate: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
  createdBy: string;
  updatedBy: string;
  deletedBy: string;
}

export interface UserData {
  users: IUserBasic[];
}

export interface IUserCreate {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  age: number;
  genderCode: string;
  roleId: string;
}

export interface IUserUpdate {
  userId: number;
  fullName: string;
  phoneNumber: string;
  age: number;
  genderCode: string;
  roleId: string;
}
