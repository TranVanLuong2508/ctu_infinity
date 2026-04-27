import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Student } from './entities/student.entity';
import { excludeFields, filterResponse } from 'src/common/filerRespone';
import { validateUUID } from 'src/common/validateUUID';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) { }

  async create(createStudentDto: CreateStudentDto) {
    try {
      // Check if student code already exists
      const existingStudent = await this.studentRepository.findOne({
        where: { studentCode: createStudentDto.studentCode },
      });

      if (existingStudent) {
        return {
          EC: 0,
          EM: `Student code "${createStudentDto.studentCode}" already exists`,
        };
      }

      // Check if userId already has a student record
      const existingUserStudent = await this.studentRepository.findOne({
        where: { userId: createStudentDto.userId },
      });

      if (existingUserStudent) {
        return {
          EC: 0,
          EM: 'This user already has a student record',
        };
      }

      // Create new student
      const newStudent = this.studentRepository.create(createStudentDto);
      const savedStudent = await this.studentRepository.save(newStudent);

      const dataReturn = filterResponse(savedStudent, ['studentId', 'createdAt']);

      return {
        EC: 1,
        EM: 'Created Student Successfully',
        ...dataReturn,
      };
    } catch (error) {
      console.log('Error creating student:', error.message);
      return {
        EC: 0,
        EM: 'An error occurred while creating student',
      };
    }
  }

  async findAll(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const queryBuilder = this.studentRepository
        .createQueryBuilder('student')
        .leftJoinAndSelect('student.user', 'user')
        .leftJoinAndSelect('student.class', 'class')
        .leftJoinAndSelect('class.major', 'major')
        .leftJoinAndSelect('major.falculty', 'falculty')
        .where('user.isDeleted = :isDeleted', { isDeleted: false })
        .skip(skip)
        .take(limit)
        .orderBy('user.createdAt', 'DESC');

      const [students, total] = await queryBuilder.getManyAndCount();

      return {
        EC: 1,
        EM: 'Fetch All Students Successfully',
        students,
        pagination: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.log('Error fetching all students:', error.message);
      return {
        EC: 0,
        EM: 'An error occurred while fetching all students',
      };
    }
  }

  async findOne(id: string) {
    try {
      validateUUID(id, 'Student ID');

      const found = await this.studentRepository.findOne({
        where: { studentId: id },
        relations: ['user', 'class', 'class.major', 'class.major.falculty'],
      });

      if (!found) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Student not found',
        });
      }

      const mapped = excludeFields(found, ['userId', 'classId',]);
      const mapppedUser = excludeFields(found.user, ["refreshToken", "roleId"]);
      mapped.user = mapppedUser;
      return {
        EC: 1,
        EM: 'Find One Student Successfully',
        ...mapped,
      };
    } catch (error) {
      console.log('Error finding one student:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while finding one student',
      });
    }
  }

  //  Get student profile
  async findByUserId(userId: string) {
    try {
      validateUUID(userId, 'User ID');

      const found = await this.studentRepository.findOne({
        where: { userId },
        relations: ['user', 'class', 'class.major', 'class.major.falculty'],
      });

      if (!found) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Student not found',
        });
      }

      const mapped = excludeFields(found, ['userId', 'classId']);
      const mapppedUser = excludeFields(found.user, ["refreshToken", "roleId"]);
      mapped.user = mapppedUser;
      return {
        EC: 1,
        EM: 'Find Student by User ID Successfully',
        ...mapped,
      };
    } catch (error) {
      console.log('Error finding student by user ID:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while finding student by user ID',
      });
    }
  }

  async findByStudentCode(studentCode: string) {
    try {
      const student = await this.studentRepository
        .createQueryBuilder('student')
        .leftJoinAndSelect('student.user', 'user')
        .leftJoinAndSelect('student.class', 'class')
        .leftJoinAndSelect('class.major', 'major')
        .leftJoinAndSelect('major.falculty', 'falculty')
        .where('student.studentCode = :studentCode', { studentCode })
        .andWhere('user.isDeleted = :isDeleted', { isDeleted: false })
        .getOne();

      if (!student) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Student not found',
        });
      }

      return {
        EC: 1,
        EM: 'Find Student by Code Successfully',
        ...student,
      };
    } catch (error) {
      console.log('Error finding student by code:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while finding student by code',
      });
    }
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    try {
      validateUUID(id, 'Student ID');

      const found = await this.studentRepository
        .createQueryBuilder('student')
        .leftJoinAndSelect('student.user', 'user')
        .where('student.studentId = :id', { id })
        .andWhere('user.isDeleted = :isDeleted', { isDeleted: false })
        .getOne();

      if (!found) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Student not found',
        });
      }

      // Check if updating studentCode and if it conflicts
      if (updateStudentDto.studentCode && updateStudentDto.studentCode !== found.studentCode) {
        const existingStudent = await this.studentRepository.findOne({
          where: { studentCode: updateStudentDto.studentCode },
        });

        if (existingStudent) {
          return {
            EC: 0,
            EM: `Student code "${updateStudentDto.studentCode}" already exists`,
          };
        }
      }

      await this.studentRepository.update(
        { studentId: id },
        { ...updateStudentDto },
      );

      return {
        EC: 1,
        EM: 'Update Student Successfully',
        updated: {
          studentId: id,
        },
      };
    } catch (error) {
      console.log('Error updating student:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while updating student',
      });
    }
  }

  async remove(id: string) {
    try {
      validateUUID(id, 'Student ID');

      const student = await this.studentRepository
        .createQueryBuilder('student')
        .leftJoinAndSelect('student.user', 'user')
        .where('student.studentId = :id', { id })
        .andWhere('user.isDeleted = :isDeleted', { isDeleted: false })
        .getOne();

      if (!student) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Student not found',
        });
      }

      // Soft delete by updating the user
      await this.studentRepository.manager.update(
        'users',
        { userId: student.userId },
        {
          isDeleted: true,
          deletedAt: new Date(),
        },
      );

      return {
        EC: 1,
        EM: 'Delete Student Successfully',
        deleted: {
          studentId: id,
        },
      };
    } catch (error) {
      console.log('Error deleting student:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while deleting student',
      });
    }
  }

  async restore(id: string) {
    try {
      validateUUID(id, 'Student ID');

      const student = await this.studentRepository
        .createQueryBuilder('student')
        .leftJoinAndSelect('student.user', 'user')
        .where('student.studentId = :id', { id })
        .andWhere('user.isDeleted = :isDeleted', { isDeleted: true })
        .getOne();

      if (!student) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Deleted student not found',
        });
      }

      // Restore by updating the user
      await this.studentRepository.manager.update(
        'users',
        { userId: student.userId },
        {
          isDeleted: false,
          deletedAt: null,
        },
      );

      return {
        EC: 1,
        EM: 'Restore Student Successfully',
        restored: {
          studentId: id,
        },
      };
    } catch (error) {
      console.log('Error restoring student:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while restoring student',
      });
    }
  }
}
