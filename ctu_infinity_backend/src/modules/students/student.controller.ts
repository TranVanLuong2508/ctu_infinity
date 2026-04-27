import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Permission } from 'src/decorators/permission.decorator';
import { ResponseMessage } from 'src/decorators/customize';
import { SYSTEM_MODULE } from 'src/common/module';
import { User } from 'src/decorators/customize';
import type { IUser } from 'src/modules/users/interface/user.interface';

@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) { }

  @Post()
  @Permission('Create a student', SYSTEM_MODULE.STUDENTS)
  @ResponseMessage('Create a student')
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentService.create(createStudentDto);
  }

  @Get()
  @Permission('Get all students', SYSTEM_MODULE.STUDENTS)
  @ResponseMessage('Get all students')
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.studentService.findAll(page, limit);
  }

  @Get('me')
  @Permission('Get my student profile', SYSTEM_MODULE.STUDENTS)
  @ResponseMessage('Get my student profile')
  findMyProfile(@User() user: IUser) {
    return this.studentService.findByUserId(user.userId);
  }

  @Get(':id')
  @Permission('Get a student by ID', SYSTEM_MODULE.STUDENTS)
  @ResponseMessage('Get a student by ID')
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(id);
  }

  @Patch(':id')
  @Permission('Update a student', SYSTEM_MODULE.STUDENTS)
  @ResponseMessage('Update a student')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentService.update(id, updateStudentDto);
  }

  @Patch(':id/restore')
  @Permission('Restore a student', SYSTEM_MODULE.STUDENTS)
  @ResponseMessage('Restore a student')
  restore(@Param('id') id: string) {
    return this.studentService.restore(id);
  }

  @Delete(':id')
  @Permission('Delete a student', SYSTEM_MODULE.STUDENTS)
  @ResponseMessage('Delete a student')
  remove(@Param('id') id: string) {
    return this.studentService.remove(id);
  }
}
