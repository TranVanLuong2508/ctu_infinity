import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FalcultiesService } from './falculties.service';
import { CreateFalcultyDto } from './dto/create-falculty.dto';
import { UpdateFalcultyDto } from './dto/update-falculty.dto';
import { ResponseMessage } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';
import { SYSTEM_MODULE } from 'src/common/module';

@Controller('falculties')
export class FalcultiesController {
  constructor(private readonly falcultiesService: FalcultiesService) {}

  @Post()
  @Permission('Create a falculty', SYSTEM_MODULE.FALCULTY)
  @ResponseMessage('Create a falculty')
  create(@Body() createFalcultyDto: CreateFalcultyDto) {
    return this.falcultiesService.create(createFalcultyDto);
  }

  @Get()
  @Permission('Fetch All falculties', SYSTEM_MODULE.FALCULTY)
  @ResponseMessage('Fetch All falculties')
  findAll() {
    return this.falcultiesService.findAll();
  }

  @Get(':id')
  @Permission('Get one falculty by ID', SYSTEM_MODULE.FALCULTY)
  @ResponseMessage('Fetch one falculty')
  findOne(@Param('id') id: string) {
    return this.falcultiesService.findOne(id);
  }

  @Patch(':id')
  @Permission('Update a falculty', SYSTEM_MODULE.FALCULTY)
  @ResponseMessage('Update a falculty')
  update(@Param('id') id: string, @Body() updateFalcultyDto: UpdateFalcultyDto) {
    return this.falcultiesService.update(id, updateFalcultyDto);
  }

  @Delete(':id')
  @Permission('Delete a falculty', SYSTEM_MODULE.FALCULTY)
  @ResponseMessage('Delete a falculty')
  remove(@Param('id') id: string) {
    return this.falcultiesService.remove(id);
  }
}
