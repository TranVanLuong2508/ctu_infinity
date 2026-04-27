export interface IStudent {
  studentId?: string;
  studentCode: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  address?: string;
  classId?: string;
  majorId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
