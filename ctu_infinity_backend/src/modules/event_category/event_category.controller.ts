import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EventCategoryService } from './event_category.service';
import { CreateEventCategoryDto } from './dto/create-event_category.dto';
import { UpdateEventCategoryDto } from './dto/update-event_category.dto';
import { Public, ResponseMessage } from 'src/decorators/customize';

@Controller('event-category')
export class EventCategoryController {
  constructor(private readonly eventCategoryService: EventCategoryService) { }

  @Post()
  @Public()
  @ResponseMessage('Create a event category')
  create(@Body() createEventCategoryDto: CreateEventCategoryDto) {
    return this.eventCategoryService.create(createEventCategoryDto);
  }

  @Get()
  @Public()
  @ResponseMessage('Get all event categories')
  findAll() {
    return this.eventCategoryService.findAll();
  }

  @Get(':id')
  @Public()
  @ResponseMessage('Find One Event Category by ID')
  findOne(@Param('id') id: string) {
    return this.eventCategoryService.findOne(id);
  }

  @Patch(':id')
  @Public()
  @ResponseMessage('Update One Event Category by ID')
  update(@Param('id') id: string, @Body() updateEventCategoryDto: UpdateEventCategoryDto) {
    return this.eventCategoryService.update(id, updateEventCategoryDto);
  }

  @Delete(':id')
  @Public()
  @ResponseMessage('Delete One Event Category by ID')
  remove(@Param('id') id: string) {
    return this.eventCategoryService.remove(id);
  }
}
