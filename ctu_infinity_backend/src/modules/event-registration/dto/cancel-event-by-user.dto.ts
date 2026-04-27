import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * DTO để sinh viên tự hủy đăng ký sự kiện.
 * Chỉ cần eventId, studentId được tự động lấy từ JWT token.
 */
export class CancelEventByUserDto {
  @IsNotEmpty()
  @IsUUID()
  eventId: string;
}
