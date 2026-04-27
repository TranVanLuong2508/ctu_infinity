import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Semester } from './entities/semester.entity';
import { Repository } from 'typeorm';
import { filterResponse } from 'src/common/filerRespone';
import { validateUUID } from 'src/common/validateUUID';
import { AcademicYear } from '../academic_year/entities/academic_year.entity';

@Injectable()
export class SemestersService {
  constructor(
    @InjectRepository(Semester)
    private semesterRepository: Repository<Semester>,
    @InjectRepository(AcademicYear)
    private academicYearRepository: Repository<AcademicYear>,
  ) {}

  async create(createSemesterDto: CreateSemesterDto) {
    try {
      // Kiểm tra academic year có tồn tại không
      const academicYear = await this.academicYearRepository.findOne({
        where: { yearId: createSemesterDto.yearId },
      });

      if (!academicYear) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Academic year not found',
        });
      }

      // Kiểm tra semester đã tồn tại trong academic year này chưa
      const existingSemester = await this.semesterRepository.findOne({
        where: {
          semesterName: createSemesterDto.semesterName,
          yearId: createSemesterDto.yearId,
        },
      });

      if (existingSemester) {
        return {
          EC: 0,
          EM: `Semester ${createSemesterDto.semesterName} already exists in this academic year`,
        };
      }

      // Kiểm tra ngày của semester phải nằm trong khoảng academic year
      const semesterStart = new Date(createSemesterDto.startDate);
      const semesterEnd = new Date(createSemesterDto.endDate);
      const yearStart = new Date(academicYear.startDate);
      const yearEnd = new Date(academicYear.endDate);

      if (semesterStart < yearStart || semesterEnd > yearEnd) {
        return {
          EC: 0,
          EM: 'Semester dates must be within the academic year period',
        };
      }

      if (createSemesterDto.isCurrent) {
        await this.semesterRepository.update(
          { isCurrent: true, yearId: createSemesterDto.yearId },
          { isCurrent: false },
        );
      }

      // Create new semester
      const newSemester = this.semesterRepository.create(createSemesterDto);
      const savedSemester = await this.semesterRepository.save(newSemester);

      const dataReturn = filterResponse(savedSemester, ['semesterId', 'createdAt']);

      return {
        EC: 1,
        EM: 'Created semester successfully',
        ...dataReturn,
      };
    } catch (error) {
      console.log('Error creating semester:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while creating semester',
      });
    }
  }

  async findAll() {
    try {
      const listSemesters = await this.semesterRepository.find({
        // relations: ['academicYear'],
        order: {
          startDate: 'DESC',
        },
      });

      return {
        EC: 1,
        EM: 'Fetch list semesters successfully',
        semesters: listSemesters,
      };
    } catch (error) {
      console.log('Error fetching all semesters:', error.message);
      return {
        EC: 0,
        EM: 'An error occurred while fetching all semesters',
      };
    }
  }

  async findOne(id: string) {
    try {
      validateUUID(id, 'semesterId');
      const found = await this.semesterRepository.findOne({
        where: { semesterId: id },
        relations: ['academicYear'],
      });

      if (!found) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Semester not found',
        });
      }

      return {
        EC: 1,
        EM: 'Find one semester successfully',
        ...found,
      };
    } catch (error) {
      console.log('Error finding one semester:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while finding one semester',
      });
    }
  }

  async update(id: string, updateSemesterDto: UpdateSemesterDto) {
    try {
      validateUUID(id, 'semesterId');
      const found = await this.semesterRepository.findOne({
        where: { semesterId: id },
        relations: ['academicYear'],
      });

      if (!found) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Semester not found',
        });
      }

      // Nếu cập nhật yearId, kiểm tra academic year mới có tồn tại không
      if (updateSemesterDto.yearId && updateSemesterDto.yearId !== found.yearId) {
        const academicYear = await this.academicYearRepository.findOne({
          where: { yearId: updateSemesterDto.yearId },
        });

        if (!academicYear) {
          throw new NotFoundException({
            EC: 0,
            EM: 'Academic year not found',
          });
        }

        // Kiểm tra ngày tháng nếu có cập nhật
        const semesterStart = updateSemesterDto.startDate
          ? new Date(updateSemesterDto.startDate)
          : new Date(found.startDate);
        const semesterEnd = updateSemesterDto.endDate
          ? new Date(updateSemesterDto.endDate)
          : new Date(found.endDate);
        const yearStart = new Date(academicYear.startDate);
        const yearEnd = new Date(academicYear.endDate);

        if (semesterStart < yearStart || semesterEnd > yearEnd) {
          return {
            EC: 0,
            EM: 'Semester dates must be within the academic year period',
          };
        }
      }

      // If setting this semester as current, unset other current semesters in the same academic year
      if (updateSemesterDto.isCurrent) {
        const targetYearId = updateSemesterDto.yearId || found.yearId;
        await this.semesterRepository.update(
          { isCurrent: true, yearId: targetYearId },
          { isCurrent: false },
        );
      }

      await this.semesterRepository.update({ semesterId: id }, { ...updateSemesterDto });

      return {
        EC: 1,
        EM: 'Update semester successfully',
        updated: {
          semesterId: id,
        },
      };
    } catch (error) {
      console.log('Error updating semester:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while updating semester',
      });
    }
  }

  async remove(id: string) {
    try {
      validateUUID(id, 'semesterId');
      const found = await this.semesterRepository.findOne({
        where: { semesterId: id },
      });

      if (!found) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Semester not found',
        });
      }

      await this.semesterRepository.delete({ semesterId: id });

      return {
        EC: 1,
        EM: 'Delete semester successfully',
        deleted: {
          semesterId: id,
        },
      };
    } catch (error) {
      console.log('Error deleting semester:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while deleting semester',
      });
    }
  }

  async getSemesterByYear(id: string) {
    try {
      validateUUID(id, 'year ID');
      const foundYear = await this.academicYearRepository.findOne({
        where: { yearId: id },
      });

      if (!foundYear) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Academic year not found',
        });
      }

      const semestersInYear = await this.semesterRepository.find({
        where: { yearId: id },
      });

      if (!semestersInYear) {
        return {
          EC: 0,
          EM: 'Get semesters for a year failed',
        };
      } else {
        return {
          EC: 1,
          EM: 'Get semesters for a year success',
          semesters: semestersInYear,
        };
      }
    } catch (error) {
      console.log('Error from get semesters for year: ', error.message);

      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from server while Getting semesters for a year',
      });
    }
  }

  async getCurrent() {
    try {
      const currentSemester = await this.semesterRepository.findOne({
        where: { isCurrent: true },
        relations: ['academicYear'],
      });
      if (!currentSemester) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Semester not found',
        });
      }

      return {
        EC: 1,
        EM: 'Get current semester success',
        ...currentSemester,
      };
    } catch (error) {
      console.log('Error from get currentr semester: ', error.message);

      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from server while geting current semester',
      });
    }
  }
}
