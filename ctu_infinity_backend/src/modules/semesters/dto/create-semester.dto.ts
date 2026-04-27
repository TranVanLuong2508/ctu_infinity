import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSemesterDto {
  @IsString()
  @IsNotEmpty({ message: 'Semester name is required' })
  semesterName: string;

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

  @IsUUID('4', { message: 'Year ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Year ID is required' })
  yearId: string;
}
