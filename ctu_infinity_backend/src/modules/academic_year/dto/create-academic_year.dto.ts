import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAcademicYearDto {
  @IsString()
  @IsNotEmpty({ message: 'Year name is required' })
  yearName: string;

  @IsDateString({}, { message: 'Start date must be in YYYY-MM-DD format' })
  @IsNotEmpty({ message: 'Start date is required' })
  startDate: string;

  @IsDateString({}, { message: 'End date must be in YYYY-MM-DD format' })
  @IsNotEmpty({ message: 'End date is required' })
  endDate: string;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'isCurrent must be a boolean' })
  @IsOptional()
  isCurrent?: boolean;
}
