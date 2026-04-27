import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventCategoryService } from './event_category.service';
import { EventCategoryController } from './event_category.controller';
import { EventCategory } from './entities/event_category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EventCategory])],
  controllers: [EventCategoryController],
  providers: [EventCategoryService],
  exports: [EventCategoryService],
})
export class EventCategoryModule {}
