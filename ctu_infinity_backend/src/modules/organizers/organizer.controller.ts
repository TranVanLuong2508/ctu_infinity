import { Controller, Get, Post, Body, Patch, Param, Delete, Response, Query } from '@nestjs/common';
import { OrganizerService } from './organizer.service';
import { CreateOrganizerDto } from './dto/create-organizer.dto';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';
import { Permission } from 'src/decorators/permission.decorator';
import { SYSTEM_MODULE } from 'src/common/module';
import { ResponseMessage } from 'src/decorators/customize';

@Controller('organizers')
export class OrganizerController {
  constructor(private readonly organizerService: OrganizerService) { }

  @Post()
  @Permission('Create a Organizer', SYSTEM_MODULE.ORGANIZER)
  @ResponseMessage('Create a organizer')
  create(@Body() createOrganizerDto: CreateOrganizerDto) {
    return this.organizerService.create(createOrganizerDto);
  }

  @Get()
  @ResponseMessage('Get all organizers')
  @Permission('Get all organizers', SYSTEM_MODULE.ORGANIZER)
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.organizerService.findAll(page, limit);
  }

  @Get(':id')
  @Permission('Get an organizer by ID', SYSTEM_MODULE.ORGANIZER)
  @ResponseMessage('Get an organizer by ID')
  findOne(@Param('id') id: string) {
    return this.organizerService.findOne(id);
  }

  @Patch(':id')
  @Permission('Update an organizer', SYSTEM_MODULE.ORGANIZER)
  @ResponseMessage('Update an organizer')
  update(@Param('id') id: string, @Body() updateOrganizerDto: UpdateOrganizerDto) {
    return this.organizerService.update(id, updateOrganizerDto);
  }

  @Patch(':id/restore')
  @Permission('Restore an organizer', SYSTEM_MODULE.ORGANIZER)
  @ResponseMessage('Restore an organizer')
  restore(@Param('id') id: string) {
    return this.organizerService.restore(id);
  }

  @Delete(':id')
  @Permission('Delete an organizer', SYSTEM_MODULE.ORGANIZER)
  @ResponseMessage('Delete an organizer')
  remove(@Param('id') id: string) {
    return this.organizerService.remove(id);
  }
}

