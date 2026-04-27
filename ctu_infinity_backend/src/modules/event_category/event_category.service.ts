import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateEventCategoryDto } from './dto/create-event_category.dto';
import { UpdateEventCategoryDto } from './dto/update-event_category.dto';
import { EventCategory } from './entities/event_category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { filterResponse } from 'src/common/filerRespone';
import { generateUniqueSlug } from 'src/common/generateSlug';
import { validateUUID } from 'src/common/validateUUID';

@Injectable()
export class EventCategoryService {
  constructor(
    @InjectRepository(EventCategory)
    private eventCategoryRepository: Repository<EventCategory>,
  ) {}

  async create(createEventCategoryDto: CreateEventCategoryDto) {
    try {
      const newSlug = generateUniqueSlug(createEventCategoryDto.categoryName);

      const existingCategory = await this.eventCategoryRepository.findOne({
        where: {
          slug: newSlug,
        },
      });

      if (existingCategory) {
        return {
          EC: 0,
          EM: `Category with name "${createEventCategoryDto.categoryName}" already exists`,
        };
      }

      const data = { ...createEventCategoryDto, slug: newSlug };

      // Tạo mới category
      const newCategory = this.eventCategoryRepository.create(data);
      const savedCategory = await this.eventCategoryRepository.save(newCategory);

      const dataReturn = filterResponse(savedCategory, ['categoryId', 'createdAt']);

      return {
        EC: 1,
        EM: 'Create event category successfully',
        data: dataReturn,
      };
    } catch (error) {
      console.error('Error creating event category:', error.message);
      return {
        EC: 0,
        EM: 'An error occurred while creating event category',
      };
    }
  }

  async findAll() {
    try {
      const rawData = await this.eventCategoryRepository.find({});
      if (rawData) {
        return {
          EC: 1,
          EM: 'Fetch All Event Category Sucess',
          categories: rawData,
        };
      }
    } catch (error) {
      console.error('Error get all event category:', error.message);
      return {
        EC: 0,
        EM: 'An error occurred while getting all event category',
      };
    }
  }

  async findOne(id: string) {
    try {
      validateUUID(id, id);
      const found = await this.eventCategoryRepository.findOne({
        where: { categoryId: id },
      });
      if (found) {
        return {
          EC: 1,
          EM: 'Find One Event Category Sucess',
          ...found,
        };
      } else {
        return {
          EC: 0,
          EM: 'Event category not found',
        };
      }
    } catch (error) {
      console.error('Error Find One Event Category:', error.message);
      return {
        EC: 0,
        EM: 'An error occurred while Find One Event Category',
      };
    }
  }

  async update(id: string, updateEventCategoryDto: UpdateEventCategoryDto) {
    try {
      validateUUID(id, id);
      const foundCategory = await this.eventCategoryRepository.findOne({
        where: { categoryId: id },
      });

      if (!foundCategory) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Event category not found',
        });
      }

      const newSlug = updateEventCategoryDto.categoryName
        ? generateUniqueSlug(updateEventCategoryDto.categoryName)
        : foundCategory.slug;

      await this.eventCategoryRepository.update(
        { categoryId: id },
        {
          ...updateEventCategoryDto,
          slug: newSlug,
        },
      );

      return {
        EC: 1,
        EM: 'Update Event Category Success',
        updated: {
          categoryId: id,
        },
      };
    } catch (error) {
      console.error('Error update Event Category:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while updating One Event Category',
      });
    }
  }

  async remove(id: string) {
    try {
      validateUUID(id, id);
      const foundCategory = await this.eventCategoryRepository.findOne({
        where: { categoryId: id },
      });

      if (!foundCategory) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Event category not found',
        });
      }

      await this.eventCategoryRepository.delete({ categoryId: id });

      return {
        EC: 1,
        EM: 'Delete Event Category Success',
        deleted: {
          categoryId: id,
        },
      };
    } catch (error) {
      console.error('Error delete Event Category:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while deleting Event Category',
      });
    }
  }
}
