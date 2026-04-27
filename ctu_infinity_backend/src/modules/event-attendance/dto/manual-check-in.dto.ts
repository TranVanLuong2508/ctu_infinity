import { IsUUID } from 'class-validator';

/**
 * DTO cho endpoint điểm danh thủ công của admin.
 * Admin cần truyền studentId và eventId của sinh viên cần điểm danh.
 */
export class ManualCheckInDto {
    @IsUUID()
    studentId: string;

    @IsUUID()
    eventId: string;
}
