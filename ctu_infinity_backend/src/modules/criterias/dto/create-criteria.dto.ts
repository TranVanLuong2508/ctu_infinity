import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCriteriaDto {
  @IsNotEmpty({ message: 'Criteria name is required' })
  @IsString({ message: 'Criteria name must be a string' })
  @MaxLength(200, { message: 'Criteria name cannot exceed 200 characters' })
  criteriaName: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsOptional()
  @IsInt({ message: 'Max score must be an integer' })
  @Min(0, { message: 'Max score must be at least 0' })
  @Max(25, { message: 'Max score cannot exceed 25' })
  maxScore?: number | null;

  @IsOptional()
  @IsUUID('4', { message: 'Parent ID must be a valid UUID' })
  parentId?: string;

  @IsNotEmpty({ message: 'Framework ID is required' })
  @IsUUID('4', { message: 'Framework ID must be a valid UUID' })
  frameworkId: string;

  @IsOptional()
  @IsInt({ message: 'Display order must be an integer' })
  @Min(0, { message: 'Display order must be at least 0' })
  displayOrder?: number;
}
