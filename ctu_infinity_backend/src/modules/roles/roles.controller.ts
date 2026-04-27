import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  SerializeOptions,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Public, ResponseMessage, SkipCheckPermission, User } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';
import type { IUser } from '../users/interface/user.interface';
import { ReassignRoleDto } from './dto/reassign-role.dto';
import { SYSTEM_MODULE } from 'src/common/module';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @SkipCheckPermission()
  @Permission('Create a role', SYSTEM_MODULE.ROLES)
  @ResponseMessage('Create a Role')
  create(@Body() createRoleDto: CreateRoleDto, @User() user: IUser) {
    return this.rolesService.create(createRoleDto, user);
  }

  @Get()
  @SkipCheckPermission()
  @ResponseMessage('Get all roles')
  @Permission('Get all role', SYSTEM_MODULE.ROLES)
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @SkipCheckPermission()
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ excludeExtraneousValues: true, enableImplicitConversion: true })
  @Permission('Get a role by ID', SYSTEM_MODULE.ROLES)
  @ResponseMessage('Get a role by id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Get('get-by-id/:id')
  @SkipCheckPermission()
  @Permission('Get a role by ID', SYSTEM_MODULE.ROLES)
  GetById(@Param('id') id: string) {
    return this.rolesService.finOneById(id);
  }

  @Patch(':id')
  @SkipCheckPermission()
  @ResponseMessage('Update a role')
  @Permission('Update a role', SYSTEM_MODULE.ROLES)
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto, @User() user: IUser) {
    return this.rolesService.update(id, updateRoleDto, user);
  }

  @Delete(':id')
  @SkipCheckPermission()
  @ResponseMessage('Delete a role')
  @Permission('Delete a role', SYSTEM_MODULE.ROLES)
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.rolesService.remove(id, user);
  }

  @Get(':id/check-delete')
  @ResponseMessage('Check role before delete')
  @Permission('Check role infor before delete', SYSTEM_MODULE.ROLES)
  checkBeforeDelete(@Param('id') id: string) {
    return this.rolesService.checkRoleBeforDelete(id);
  }

  @Post(':id/reassign-and-delete')
  @ResponseMessage('Reassign users and delete role')
  @Permission('Reassign users and delete role', SYSTEM_MODULE.ROLES)
  reassignAndDelete(@Param('id') id: string, @Body() dto: ReassignRoleDto, @User() user: IUser) {
    return this.rolesService.reassignAndDelete(id, dto, user);
  }

  @Patch(':id/restore')
  @ResponseMessage('Restore a role')
  restore(@Param('id') id: string, @User() user: IUser) {
    return this.rolesService.restore(id, user);
  }
}
