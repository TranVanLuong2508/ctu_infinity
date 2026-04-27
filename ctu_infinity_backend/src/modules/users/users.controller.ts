import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Public, ResponseMessage, User } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';
import type { IUser } from 'src/modules/users/interface/user.interface';
import { UpdateUserDto } from 'src/modules/users/dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateBasicInfoDto } from './dto/update-basic-info.dto';
import { SYSTEM_MODULE } from 'src/common/module';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @Public()
  @Permission('Create a user', SYSTEM_MODULE.USERS)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // ─── Admin create user (protected, requires authentication) ──────────
  @Post('admin-create')
  @Permission('Admin create a user', SYSTEM_MODULE.USERS)
  @ResponseMessage('Admin create a user')
  adminCreate(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('get-user-with-pagination')
  @ResponseMessage('Fetch user with pagination')
  @Permission('Fetch user with pagination', SYSTEM_MODULE.USERS)
  getUsersWithPagination(
    @Query('current') currentPage: string,
    @Query('pageSize') limit: string,
    @Query() qs: string,
  ) {
    return this.usersService.getUsersWithPagination(+currentPage, +limit, qs);
  }

  // ─── Manage endpoint (for admin user management panel) ───────────────
  @Get('manage')
  @ResponseMessage('Get all users with profiles')
  @Permission('Get all users with profiles', SYSTEM_MODULE.USERS)
  getAllUsersWithProfiles(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('accountType') accountType?: string,
  ) {
    return this.usersService.getAllUsersWithProfiles(+page, +limit, accountType);
  }

  // ─── Detail with profile ──────────────────────────────────────────────
  @Get(':id/profile')
  @ResponseMessage('Get user detail with profile')
  @Permission('Get user detail with profile', SYSTEM_MODULE.USERS)
  getUserDetailWithProfile(@Param('id') id: string) {
    return this.usersService.getUserDetailWithProfile(id);
  }

  @Get()
  @ResponseMessage('get All Users')
  @Permission('get All Users', SYSTEM_MODULE.USERS)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ResponseMessage('Fetch user by id')
  @Permission('Fetch user by id', SYSTEM_MODULE.USERS)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('update')
  @Permission('Update a user by ID', SYSTEM_MODULE.USERS)
  @ResponseMessage('Update a user')
  update(@Body() updateUserDto: UpdateUserDto, @User() user: IUser) {
    return this.usersService.update(updateUserDto, user);
  }

  @Patch('update-profile')
  @Permission('Update profile', SYSTEM_MODULE.USERS)
  @ResponseMessage('Update profile a user')
  updateProfile(@Body() updateProfileDto: UpdateProfileDto, @User() user: IUser) {
    return this.usersService.updateProfile(updateProfileDto, user);
  }

  // ─── Basic Info update (admin) ────────────────────────────────────────
  @Patch(':id/basic-info')
  @Permission('Update user basic info', SYSTEM_MODULE.USERS)
  @ResponseMessage('Update user basic info')
  updateUserBasicInfo(
    @Param('id') id: string,
    @Body() dto: UpdateBasicInfoDto,
    @User() user: IUser,
  ) {
    return this.usersService.updateUserBasicInfo(id, dto, user);
  }

  // ─── Restore ─────────────────────────────────────────────────────────
  @Patch(':id/restore')
  @Permission('Restore a user', SYSTEM_MODULE.USERS)
  @ResponseMessage('Restore a user')
  restoreUser(@Param('id') id: string, @User() user: IUser) {
    return this.usersService.restoreUser(id, user);
  }

  // ─── Soft delete ──────────────────────────────────────────────────────
  @Delete(':id')
  @ResponseMessage('Delete a user')
  @Permission('Delete a user', SYSTEM_MODULE.USERS)
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.usersService.softDeleteUser(id, user);
  }
}
