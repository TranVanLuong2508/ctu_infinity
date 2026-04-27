import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { Class } from './entities/class.entity';
import { filterResponse } from 'src/common/filerRespone';
import { validateUUID } from 'src/common/validateUUID';

@Injectable()
export class ClassService {
  constructor(
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
  ) { }

  async create(createClassDto: CreateClassDto) {
    try {
      // Check if class name already exists
      const existingClass = await this.classRepository.findOne({
        where: { className: createClassDto.className },
      });

      if (existingClass) {
        return {
          EC: 0,
          EM: `Class "${createClassDto.className}" already exists`,
        };
      }

      // Create new class
      const newClass = this.classRepository.create(createClassDto);
      const savedClass = await this.classRepository.save(newClass);

      const dataReturn = filterResponse(savedClass, ['classId', 'createdAt']);

      return {
        EC: 1,
        EM: 'Created Class Successfully',
        ...dataReturn,
      };
    } catch (error) {
      console.log('Error creating class:', error.message);
      return {
        EC: 0,
        EM: 'An error occurred while creating class',
      };
    }
  }

  async findAll(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const [classes, total] = await this.classRepository.findAndCount({
        relations: ['major', 'major.falculty', 'students'],
        skip,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      return {
        EC: 1,
        EM: 'Fetch All Classes Successfully',
        classes,
        pagination: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.log('Error fetching all classes:', error.message);
      return {
        EC: 0,
        EM: 'An error occurred while fetching all classes',
      };
    }
  }

  async findOne(id: string) {
    try {
      validateUUID(id, 'Class ID');

      const found = await this.classRepository.findOne({
        where: { classId: id },
        relations: ['major', 'major.falculty', 'students', 'students.user'],
      });

      if (!found) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Class not found',
        });
      }

      return {
        EC: 1,
        EM: 'Find One Class Successfully',
        ...found,
      };
    } catch (error) {
      console.log('Error finding one class:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while finding one class',
      });
    }
  }

  async update(id: string, updateClassDto: UpdateClassDto) {
    try {
      validateUUID(id, 'Class ID');

      const found = await this.classRepository.findOne({
        where: { classId: id },
      });

      if (!found) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Class not found',
        });
      }

      // Check if updating className and if it conflicts
      if (updateClassDto.className && updateClassDto.className !== found.className) {
        const existingClass = await this.classRepository.findOne({
          where: { className: updateClassDto.className },
        });

        if (existingClass) {
          return {
            EC: 0,
            EM: `Class name "${updateClassDto.className}" already exists`,
          };
        }
      }

      await this.classRepository.update(
        { classId: id },
        { ...updateClassDto },
      );

      return {
        EC: 1,
        EM: 'Update Class Successfully',
        updated: {
          classId: id,
        },
      };
    } catch (error) {
      console.log('Error updating class:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while updating class',
      });
    }
  }

  async remove(id: string) {
    try {
      validateUUID(id, 'Class ID');

      const found = await this.classRepository.findOne({
        where: { classId: id },
        relations: ['students'],
      });

      if (!found) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Class not found',
        });
      }

      // Check if class has students
      if (found.students && found.students.length > 0) {
        return {
          EC: 0,
          EM: `Cannot delete class. It has ${found.students.length} student(s) enrolled`,
        };
      }

      await this.classRepository.delete({ classId: id });

      return {
        EC: 1,
        EM: 'Delete Class Successfully',
        deleted: {
          classId: id,
        },
      };
    } catch (error) {
      console.log('Error deleting class:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while deleting class',
      });
    }
  }
}
