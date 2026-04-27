import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MajorService } from './major.service';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { Permission } from 'src/decorators/permission.decorator';
import { SYSTEM_MODULE } from 'src/common/module';
import { ResponseMessage } from 'src/decorators/customize';

@Controller('majors')
export class MajorController {
  constructor(private readonly majorService: MajorService) {}

  @Post()
  @Permission('Create a major', SYSTEM_MODULE.MAJOR)
  @ResponseMessage('Create a major')
  create(@Body() createMajorDto: CreateMajorDto) {
    return this.majorService.create(createMajorDto);
  }

  @Get()
  @Permission('Get all majors', SYSTEM_MODULE.MAJOR)
  @ResponseMessage('Get all majors')
  findAll() {
    return this.majorService.findAll();
  }

  @Get('faculty/:falcultyId')
  @Permission('Get major by Falculty', SYSTEM_MODULE.MAJOR)
  @ResponseMessage('Get major by Falculty')
  findByFaculty(@Param('falcultyId') falcultyId: string) {
    return this.majorService.findByFaculty(falcultyId);
  }

  @Get(':id')
  @Permission('Get a major by ID', SYSTEM_MODULE.MAJOR)
  @ResponseMessage('Get a major by ID')
  findOne(@Param('id') id: string) {
    return this.majorService.findOne(id);
  }

  @Patch(':id')
  @Permission('Update a major', SYSTEM_MODULE.MAJOR)
  @ResponseMessage('Update a major')
  update(@Param('id') id: string, @Body() updateMajorDto: UpdateMajorDto) {
    return this.majorService.update(id, updateMajorDto);
  }

  @Delete(':id')
  @Permission('Delete a major', SYSTEM_MODULE.MAJOR)
  @ResponseMessage('Delete a major')
  remove(@Param('id') id: string) {
    return this.majorService.remove(id);
  }
}
