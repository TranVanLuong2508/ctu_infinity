import { IsOptional, IsString, IsDateString } from 'class-validator';

export class MyScoresFilterDto {
  @IsOptional()
  @IsDateString({}, { message: 'startDate phải là định dạng ISO8601' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'endDate phải là định dạng ISO8601' })
  endDate?: string;

  /** Lọc điểm theo semesterId (ưu tiên hơn startDate/endDate) */
  @IsOptional()
  @IsString()
  semesterId?: string;
}
