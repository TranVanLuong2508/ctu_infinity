import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CriteriasService } from './criterias.service';
import { CreateCriteriaDto } from './dto/create-criteria.dto';
import { UpdateCriteriaDto } from './dto/update-criteria.dto';
import { QueryCriteriaDto } from './dto/query-criteria.dto';
import { Public, ResponseMessage } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';
import { SYSTEM_MODULE } from 'src/common/module';

@Controller('criterias')
export class CriteriasController {
  constructor(private readonly criteriasService: CriteriasService) { }

  @Post()
  @Permission("Create Criteria", SYSTEM_MODULE.CRITERIA)
  @ResponseMessage("Create a criteria")
  create(@Body() createCriteriaDto: CreateCriteriaDto) {
    return this.criteriasService.create(createCriteriaDto);
  }

  @Get()
  @Permission("Get all criterias", SYSTEM_MODULE.CRITERIA)
  @ResponseMessage("Get all criterias")
  findAll(@Query() query: QueryCriteriaDto) {
    return this.criteriasService.findAll(query);
  }

  @Get('tree')
  @Permission("Get all criterias", SYSTEM_MODULE.CRITERIA)
  @ResponseMessage("Get all criterias")
  findTree(@Query() query: QueryCriteriaDto) {
    return this.criteriasService.findTree(query);
  }

  @Get(':id')
  @Permission("Get a criteria", SYSTEM_MODULE.CRITERIA)
  @ResponseMessage("Get a criteria")
  findOne(@Param('id') id: string) {
    return this.criteriasService.findOne(id);
  }

  @Patch(':id')
  @Permission("Update a criteria", SYSTEM_MODULE.CRITERIA)
  @ResponseMessage("Update a criteria")
  update(@Param('id') id: string, @Body() updateCriteriaDto: UpdateCriteriaDto) {
    return this.criteriasService.update(id, updateCriteriaDto);
  }

  @Delete(':id')
  @Permission("Delete a criteria", SYSTEM_MODULE.CRITERIA)
  @ResponseMessage("Delete a criteria")
  remove(@Param('id') id: string) {
    return this.criteriasService.remove(id);
  }
}
