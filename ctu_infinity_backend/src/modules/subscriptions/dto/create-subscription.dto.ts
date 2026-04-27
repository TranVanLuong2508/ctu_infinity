import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class CreateSubscriptionDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  criteriaIds?: string[];
}
