import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Major } from './entities/major.entity';
import { Repository } from 'typeorm';
import { Falculty } from '../falculties/entities/falculty.entity';
import { filterResponse } from 'src/common/filerRespone';
import { validateUUID } from 'src/common/validateUUID';

@Injectable()
export class MajorService {
  constructor(
    @InjectRepository(Major)
    private majorRepository: Repository<Major>,
    @InjectRepository(Falculty)
    private falcultyRepository: Repository<Falculty>,
  ) { }

  async create(createMajorDto: CreateMajorDto) {
    try {
      // Check if major code already exists
      const existingMajor = await this.majorRepository.findOne({
        where: {
          majorName: createMajorDto.majorName,
        },
      });

      if (existingMajor) {
        return {
          EC: 0,
          EM: `Major name ${createMajorDto.majorName} already exists`,
        };
      }

      // Validate faculty exists
      const faculty = await this.falcultyRepository.findOne({
        where: { falcultyId: createMajorDto.falcultyId },
      });

      if (!faculty) {
        return {
          EC: 0,
          EM: 'Faculty not found',
        };
      }

      // Create new major
      const newMajor = this.majorRepository.create(createMajorDto);
      const savedMajor = await this.majorRepository.save(newMajor);

      const dataReturn = filterResponse(savedMajor, ['majorId', 'createdAt']);

      return {
        EC: 1,
        EM: 'Created major successfully',
        ...dataReturn,
      };
    } catch (error) {
      console.log('Error creating major:', error.message);
      return {
        EC: 0,
        EM: 'An error occurred while creating major',
      };
    }
  }

  async findAll() {
    try {
      const listMajors = await this.majorRepository.find({
        relations: ['falculty'],
        order: {
          createdAt: 'DESC',
        },
      });

      return {
        EC: 1,
        EM: 'Fetched majors successfully',
        majors: listMajors,
      };
    } catch (error) {
      console.log('Error fetching all majors:', error.message);
      return {
        EC: 0,
        EM: 'An error occurred while fetching majors',
      };
    }
  }

  async findByFaculty(falcultyId: string) {
    try {
      validateUUID(falcultyId, 'falcultyId');

      const majors = await this.majorRepository.find({
        where: { falcultyId: falcultyId },
        order: {
          majorName: 'ASC',
        },
        select: {
          majorId: true,
          majorName: true,
        },
      });

      return {
        EC: 1,
        EM: 'Fetched majors by faculty successfully',
        majors: majors,
      };
    } catch (error) {
      console.log('Error fetching majors by faculty:', error.message);
      return {
        EC: 0,
        EM: 'An error occurred while fetching majors',
      };
    }
  }

  async findOne(id: string) {
    try {
      validateUUID(id, 'majorId');
      const found = await this.majorRepository.findOne({
        where: { majorId: id },
      });

      if (!found) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Major not found',
        });
      }

      return {
        EC: 1,
        EM: 'Fetched major successfully',
        ...found,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.log('Error finding major:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while fetching major',
      });
    }
  }

  async update(id: string, updateMajorDto: UpdateMajorDto) {
    try {
      validateUUID(id, 'majorId');

      const found = await this.majorRepository.findOne({
        where: { majorId: id },
      });

      if (!found) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Major not found',
        });
      }

      // Check if major code already exists (for another major)
      if (updateMajorDto.majorName) {
        const existingMajor = await this.majorRepository.findOne({
          where: {
            majorName: updateMajorDto.majorName,
          },
        });

        if (existingMajor && existingMajor.majorId !== id) {
          return {
            EC: 0,
            EM: `Major name ${updateMajorDto.majorName} already exists`,
          };
        }
      }

      // Validate faculty exists if provided
      if (updateMajorDto.falcultyId) {
        const faculty = await this.falcultyRepository.findOne({
          where: { falcultyId: updateMajorDto.falcultyId },
        });

        if (!faculty) {
          return {
            EC: 0,
            EM: 'Faculty not found',
          };
        }
      }

      await this.majorRepository.update({ majorId: id }, { ...updateMajorDto });

      return {
        EC: 1,
        EM: 'Updated major successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.log('Error updating major:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while updating major',
      });
    }
  }

  async remove(id: string) {
    try {
      validateUUID(id, 'majorId');

      const found = await this.majorRepository.findOne({
        where: { majorId: id as any },
      });

      if (!found) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Major not found',
        });
      }

      await this.majorRepository.delete({ majorId: id as any });

      return {
        EC: 1,
        EM: 'Deleted major successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.log('Error removing major:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while deleting major',
      });
    }
  }
}
