import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO cho sinh viên tự check-in bằng QR code
 * Chỉ cần qrToken, studentId sẽ được lấy từ userId trong JWT
 */
export class CheckInByUserDto {
  @IsNotEmpty()
  @IsString()
  qrToken: string;
}
