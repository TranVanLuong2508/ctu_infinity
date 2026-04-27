import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteRolePermissionDto {
  @IsNumber()
  @Type(() => String)
  @IsNotEmpty({ message: 'roleId  must be not empty' })
  roleId: string;

  @IsNumber()
  @IsNotEmpty({ message: 'permissionId  must be not empty' })
  @Type(() => String)
  permissionId: string;
}
