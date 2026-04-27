import { IsBooleanString, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetRecommendationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  topK?: number;

  @IsOptional()
  @IsBooleanString()
  debug?: string;

  @IsOptional()
  @IsString()
  semesterId?: string;
}

