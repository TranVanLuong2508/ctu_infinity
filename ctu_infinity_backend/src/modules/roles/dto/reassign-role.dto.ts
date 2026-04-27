import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReassignRoleDto {
  @Type(() => String)
  targetRoleId: string;
}
