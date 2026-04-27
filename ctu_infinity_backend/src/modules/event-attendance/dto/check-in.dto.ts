import { IsNotEmpty, IsUUID } from 'class-validator';

export class CheckInDto {
    @IsNotEmpty()
    @IsUUID()
    studentId: string;

    /** QR token của sự kiện, nhận được khi sinh viên quét QR */
    @IsNotEmpty()
    qrToken: string;
}
