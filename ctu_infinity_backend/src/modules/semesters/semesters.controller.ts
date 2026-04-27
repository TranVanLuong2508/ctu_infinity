import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SemestersService } from './semesters.service';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';
import { Permission } from 'src/decorators/permission.decorator';
import { SYSTEM_MODULE } from 'src/common/module';
import { Public, ResponseMessage } from 'src/decorators/customize';

@Controller('semesters')
export class SemestersController {
  constructor(private readonly semestersService: SemestersService) {}

  @Post()
  @Permission('Create a semester', SYSTEM_MODULE.SEMESTER)
  @ResponseMessage('Create a semester')
  create(@Body() createSemesterDto: CreateSemesterDto) {
    return this.semestersService.create(createSemesterDto);
  }

  @Get()
  @Permission('Get all semester', SYSTEM_MODULE.SEMESTER)
  @ResponseMessage('Get all semester')
  findAll() {
    return this.semestersService.findAll();
  }

  @Public()
  @Get('in-year/current')
  @ResponseMessage('Get current semester')
  findCurrentSemester() {
    return this.semestersService.getCurrent();
  }

  @Get(':id')
  @Permission('Get a semester by ID', SYSTEM_MODULE.SEMESTER)
  @ResponseMessage('Get a semester by ID')
  findOne(@Param('id') id: string) {
    return this.semestersService.findOne(id);
  }

  @Public()
  @Get(':id/semesters-in-year')
  @ResponseMessage('Get semesters for a year')
  findSemesterInyear(@Param('id') yearId: string) {
    return this.semestersService.getSemesterByYear(yearId);
  }

  @Patch(':id')
  @Permission('Update a semster by ID', SYSTEM_MODULE.SEMESTER)
  @ResponseMessage('Update a semster by ID')
  update(@Param('id') id: string, @Body() updateSemesterDto: UpdateSemesterDto) {
    return this.semestersService.update(id, updateSemesterDto);
  }

  @Delete(':id')
  @Permission('Delete a semester by ID', SYSTEM_MODULE.SEMESTER)
  @ResponseMessage('Delte a semster by ID')
  remove(@Param('id') id: string) {
    return this.semestersService.remove(id);
  }
}
