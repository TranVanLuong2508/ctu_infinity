import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AcademicYearService } from './academic_year.service';
import { CreateAcademicYearDto } from './dto/create-academic_year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic_year.dto';
import { ResponseMessage } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';
import { SYSTEM_MODULE } from 'src/common/module';

@Controller('academic-year')
export class AcademicYearController {
  constructor(private readonly academicYearService: AcademicYearService) {}

  @Post()
  @ResponseMessage('Create an academic year')
  @Permission('Create an academic year', SYSTEM_MODULE.ACADEMIC_YEAR)
  create(@Body() createAcademicYearDto: CreateAcademicYearDto) {
    return this.academicYearService.create(createAcademicYearDto);
  }

  @Get()
  @ResponseMessage('Get all academic years')
  @Permission('Get all academic years', SYSTEM_MODULE.ACADEMIC_YEAR)
  findAll() {
    return this.academicYearService.findAll();
  }

  @Get(':id')
  @ResponseMessage('Get an academic year by ID')
  @Permission('Get an academic year by ID', SYSTEM_MODULE.ACADEMIC_YEAR)
  findOne(@Param('id') id: string) {
    return this.academicYearService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage('Delete an academic year')
  @Permission('Delete an academic year', SYSTEM_MODULE.ACADEMIC_YEAR)
  update(@Param('id') id: string, @Body() updateAcademicYearDto: UpdateAcademicYearDto) {
    return this.academicYearService.update(id, updateAcademicYearDto);
  }

  @Delete(':id')
  @ResponseMessage('Delete an academic year')
  @Permission('Delete an academic year', SYSTEM_MODULE.ACADEMIC_YEAR)
  remove(@Param('id') id: string) {
    return this.academicYearService.remove(id);
  }
}
