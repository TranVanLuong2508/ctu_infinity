import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * DTO để sinh viên tự đăng ký sự kiện
 * Chỉ cần eventId, studentId sẽ được tự động lấy từ JWT token
 */
export class RegisterEventByUserDto {
  @IsNotEmpty()
  @IsUUID()
  eventId: string;
}
