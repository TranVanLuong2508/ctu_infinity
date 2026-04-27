import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class TestEventApprovedNotificationDto {
  @IsString()
  studentName: string;

  @IsString()
  eventName: string;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  @IsString()
  registrationDeadline: string | null;

  @IsString()
  eventLocation: string;

  @IsOptional()
  @IsString()
  organizerName?: string;

  /**
   * Tên tiêu chí khớp subscription (nếu có).
   * Ví dụ: "Hoạt động tình nguyện"
   */
  @IsOptional()
  @IsString()
  criteriaMatch?: string;

  /**
   * Danh sách tên các danh mục khớp subscription.
   * Ví dụ: ["Kỹ năng - Học thuật", "Tình nguyện"]
   */
  @IsArray()
  @IsString({ each: true })
  categoryMatches: string[];

  @IsOptional()
  @IsString()
  criteriaName?: string;

  @IsOptional()
  @IsString()
  criteriaCode?: string;

  @IsNumber()
  score: number;

  @IsString()
  eventUrl: string;
}
