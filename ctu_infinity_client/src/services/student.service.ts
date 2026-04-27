import privateAxios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';

export interface IStudentProfile {
  studentId: string;
  studentCode: string;
  enrollmentYear: number;
  class: {
    classId: string;
    className: string;
    major: {
      majorId: string;
      majorName: string;
      falculty: {
        falcultyId: string;
        falcultyName: string;
      }
    }
  };
  user: {
    userId: string;
    email: string;
    fullName: string;
    gender: string;
    avatarUrl: string;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export const studentService = {
  getMyProfile: (): Promise<IBackendRes<IStudentProfile>> => {
    return privateAxios.get('/student/me');
  },
};
