import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CriteriaFrameService } from './criteria-frame.service';
import { CreateCriteriaFrameDto } from './dto/create-criteria-frame.dto';
import { UpdateCriteriaFrameDto } from './dto/update-criteria-frame.dto';
import { CloneCriteriaFrameworkDto } from './dto/clone-criteria-framework.dto';
import { Permission } from 'src/decorators/permission.decorator';
import { ResponseMessage } from 'src/decorators/customize';
import { SYSTEM_MODULE } from 'src/common/module';

@Controller('criteria-frame')
export class CriteriaFrameController {
  constructor(private readonly criteriaFrameService: CriteriaFrameService) {}

  @Post()
  @Permission('Create Criteria Framework', SYSTEM_MODULE.CRITERIA)
  @ResponseMessage('Create a criteria framework')
  create(@Body() createCriteriaFrameDto: CreateCriteriaFrameDto) {
    return this.criteriaFrameService.create(createCriteriaFrameDto);
  }

  @Get()
  @Permission('Get all criteria frameworks', SYSTEM_MODULE.CRITERIA)
  @ResponseMessage('Get all criteria frameworks')
  findAll() {
    return this.criteriaFrameService.findAll();
  }

  @Get('active')
  @Permission('Get active criteria framework', SYSTEM_MODULE.CRITERIA)
  @ResponseMessage('Get active criteria framework')
  findActiveFramework() {
    return this.criteriaFrameService.findActiveFrame();
  }

  @Get(':id')
  @Permission('Get a criteria framework', SYSTEM_MODULE.CRITERIA)
  @ResponseMessage('Get a criteria framework')
  findOne(@Param('id') id: string) {
    return this.criteriaFrameService.findOne(id);
  }

  @Patch(':id')
  @Permission('Update a criteria framework', SYSTEM_MODULE.CRITERIA)
  @ResponseMessage('Update a criteria framework')
  update(@Param('id') id: string, @Body() updateCriteriaFrameDto: UpdateCriteriaFrameDto) {
    return this.criteriaFrameService.update(id, updateCriteriaFrameDto);
  }

  @Delete(':id')
  @Permission('Delete a criteria framework', SYSTEM_MODULE.CRITERIA)
  @ResponseMessage('Delete a criteria framework')
  remove(@Param('id') id: string) {
    return this.criteriaFrameService.remove(id);
  }

  @Post(':id/approve')
  @Permission('Approve a criteria framework', SYSTEM_MODULE.CRITERIA)
  @ResponseMessage('Approve a criteria framework')
  approve(@Param('id') id: string) {
    return this.criteriaFrameService.approve(id);
  }

  @Post(':id/archive')
  @Permission('Archive a criteria framework', SYSTEM_MODULE.CRITERIA)
  @ResponseMessage('Archive a criteria framework')
  archive(@Param('id') id: string) {
    return this.criteriaFrameService.archive(id);
  }

  @Post(':id/clone')
  @Permission('Clone a criteria framework', SYSTEM_MODULE.CRITERIA)
  @ResponseMessage('Clone a criteria framework')
  cloneFramework(@Param('id') id: string, @Body() cloneDto: CloneCriteriaFrameworkDto) {
    return this.criteriaFrameService.cloneFrame(id, cloneDto);
  }
}
