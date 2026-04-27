import { IsEnum, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { FrameworkStatus } from 'src/common/enums/framework-status.enum';

export class QueryCriteriaDto {
  @IsOptional()
  @IsUUID('4', { message: 'Framework ID must be a valid UUID' })
  frameworkId?: string;

  @IsOptional()
  @IsEnum(FrameworkStatus, { message: 'Status must be DRAFT, ACTIVE, or ARCHIVED' })
  status?: FrameworkStatus;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isLeaf?: boolean;
}
