import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ClassService } from './class.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { Permission } from 'src/decorators/permission.decorator';
import { SYSTEM_MODULE } from 'src/common/module';

@Controller('class')
export class ClassController {
  constructor(private readonly classService: ClassService) { }

  @Post()
  @Permission("Create a class", SYSTEM_MODULE.CLASS)
  create(@Body() createClassDto: CreateClassDto) {
    return this.classService.create(createClassDto);
  }

  @Get()
  @Permission("Get all classes", SYSTEM_MODULE.CLASS)
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.classService.findAll(page, limit);
  }

  @Get(':id')
  @Permission("Get a class", SYSTEM_MODULE.CLASS)
  findOne(@Param('id') id: string) {
    return this.classService.findOne(id);
  }

  @Patch(':id')
  @Permission("Update a class", SYSTEM_MODULE.CLASS)
  update(@Param('id') id: string, @Body() updateClassDto: UpdateClassDto) {
    return this.classService.update(id, updateClassDto);
  }

  @Delete(':id')
  @Permission("Delete a class", SYSTEM_MODULE.CLASS)
  remove(@Param('id') id: string) {
    return this.classService.remove(id);
  }
}
