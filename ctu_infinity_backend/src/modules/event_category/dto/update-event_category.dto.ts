import { PartialType } from '@nestjs/mapped-types';
import { CreateEventCategoryDto } from './create-event_category.dto';

export class UpdateEventCategoryDto extends PartialType(CreateEventCategoryDto) {}
