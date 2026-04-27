import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreateStudentScoreDto {
  @IsNotEmpty()
  @IsUUID()
  studentId: string;

  @IsNotEmpty()
  @IsUUID()
  eventId: string;

  @IsNotEmpty()
  @IsUUID()
  criteriaId: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt({ message: 'scoreValue phải là số nguyên' })
  @Min(0)
  scoreValue: number;
}
