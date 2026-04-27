import privateAxios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';

export const attendanceService = {
  /**
   * Sinh viên check-in bằng QR code
   * studentId tự động lấy từ JWT token
   */
  checkInByQR: (
    qrToken: string,
  ): Promise<
    IBackendRes<{
      attendanceId: string;
      status: string;
      eventName: string;
      score: number;
    }>
  > => {
    return privateAxios.post('/event-attendances/check-in-by-user', {
      qrToken,
    });
  },
};
