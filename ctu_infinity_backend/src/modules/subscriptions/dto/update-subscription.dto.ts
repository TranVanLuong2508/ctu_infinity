import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  criteriaIds?: string[];
}
