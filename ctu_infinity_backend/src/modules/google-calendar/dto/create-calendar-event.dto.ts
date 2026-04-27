import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCalendarEventDto {
    @IsNotEmpty({ message: 'Tiêu đề sự kiện không được để trống' })
    @IsString()
    summary: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsNotEmpty({ message: 'Thời gian bắt đầu không được để trống' })
    @IsISO8601({}, { message: 'startTime phải là định dạng ISO8601 (ví dụ: 2026-04-01T08:00:00+07:00)' })
    startTime: string;

    @IsNotEmpty({ message: 'Thời gian kết thúc không được để trống' })
    @IsISO8601({}, { message: 'endTime phải là định dạng ISO8601 (ví dụ: 2026-04-01T10:00:00+07:00)' })
    endTime: string;
}
