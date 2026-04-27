import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateAcademicYearDto } from './dto/create-academic_year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic_year.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AcademicYear } from './entities/academic_year.entity';
import { Repository } from 'typeorm';
import { filterResponse } from 'src/common/filerRespone';
import { validateUUID } from 'src/common/validateUUID';

@Injectable()
export class AcademicYearService {
  constructor(
    @InjectRepository(AcademicYear)
    private academicYearRepository: Repository<AcademicYear>,
  ) {}

  async create(createAcademicYearDto: CreateAcademicYearDto) {
    try {
      const existingYear = await this.academicYearRepository.findOne({
        where: {
          yearName: createAcademicYearDto.yearName,
        },
      });

      if (existingYear) {
        return {
          EC: 0,
          EM: `Academic year ${createAcademicYearDto.yearName} already exists`,
        };
      }

      // If setting this year as current, unset other current years
      if (createAcademicYearDto.isCurrent) {
        await this.academicYearRepository.update({ isCurrent: true }, { isCurrent: false });
      }

      // Create new academic year
      const newYear = this.academicYearRepository.create(createAcademicYearDto);
      const savedYear = await this.academicYearRepository.save(newYear);

      const dataReturn = filterResponse(savedYear, ['yearId', 'createdAt']);

      return {
        EC: 1,
        EM: 'Created academic year successfully',
        ...dataReturn,
      };
    } catch (error) {
      console.log('Error creating academic year:', error.message);
      return {
        EC: 0,
        EM: 'An error occurred while creating academic year',
      };
    }
  }

  async findAll() {
    try {
      const listYears = await this.academicYearRepository.find({
        order: {
          startDate: 'DESC',
        },
      });

      return {
        EC: 1,
        EM: 'Fetch list academic years successfully',
        academicYears: listYears,
      };
    } catch (error) {
      console.log('Error fetching all academic years:', error.message);
      return {
        EC: 0,
        EM: 'An error occurred while fetching all academic years',
      };
    }
  }

  async findOne(id: string) {
    try {
      validateUUID(id, 'yearId');
      const found = await this.academicYearRepository.findOne({
        where: { yearId: id as any },
      });

      if (!found) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Academic year not found',
        });
      }

      return {
        EC: 1,
        EM: 'Find one academic year successfully',
        ...found,
      };
    } catch (error) {
      console.log('Error finding one academic year:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while finding one academic year',
      });
    }
  }

  async update(id: string, updateAcademicYearDto: UpdateAcademicYearDto) {
    try {
      validateUUID(id, 'yearId');
      const found = await this.academicYearRepository.findOne({
        where: { yearId: id as any },
      });

      if (!found) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Academic year not found',
        });
      }

      // If setting this year as current, unset other current years
      if (updateAcademicYearDto.isCurrent) {
        await this.academicYearRepository.update({ isCurrent: true }, { isCurrent: false });
      }

      await this.academicYearRepository.update({ yearId: id }, { ...updateAcademicYearDto });

      return {
        EC: 1,
        EM: 'Update academic year successfully',
        updated: {
          yearId: id,
        },
      };
    } catch (error) {
      console.log('Error updating academic year:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while updating academic year',
      });
    }
  }

  async remove(id: string) {
    try {
      validateUUID(id, 'yearId');
      const found = await this.academicYearRepository.findOne({
        where: { yearId: id as any },
      });

      if (!found) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Academic year not found',
        });
      }

      await this.academicYearRepository.delete({ yearId: id });

      return {
        EC: 1,
        EM: 'Delete academic year successfully',
        deleted: {
          yearId: id,
        },
      };
    } catch (error) {
      console.log('Error deleting academic year:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while deleting academic year',
      });
    }
  }
}
