import { IsEnum, IsOptional, IsString } from 'class-validator';
import { REGISTRATION_STATUS } from '../entities/event-registration.entity';

export class MyEventsFilterDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  categoryIds?: string;

  @IsOptional()
  @IsString()
  criteriaIds?: string;

  @IsOptional()
  @IsEnum(REGISTRATION_STATUS)
  status?: REGISTRATION_STATUS;
}
