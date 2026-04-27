import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFalcultyDto } from './dto/create-falculty.dto';
import { UpdateFalcultyDto } from './dto/update-falculty.dto';
import { Falculty } from './entities/falculty.entity';
import { filterResponse } from 'src/common/filerRespone';
import { validateUUID } from 'src/common/validateUUID';

@Injectable()
export class FalcultiesService {
  constructor(
    @InjectRepository(Falculty)
    private falcultyRepository: Repository<Falculty>,
  ) {}

  async create(createFalcultyDto: CreateFalcultyDto) {
    try {
      const existingFalculty = await this.falcultyRepository.findOne({
        where: {
          falcultyName: createFalcultyDto.falcultyName as any,
        },
      });

      if (existingFalculty) {
        return {
          EC: 0,
          EM: `Falculty "${createFalcultyDto.falcultyName}" already exist`,
        };
      }

      // Create new faculty
      const newFalculty = this.falcultyRepository.create(createFalcultyDto);
      const savedFalculty = await this.falcultyRepository.save(newFalculty);

      const dataReturn = filterResponse(savedFalculty, ['falcultyId', 'createdAt']);

      return {
        EC: 1,
        EM: 'Created Falculty Sucess',
        ...dataReturn,
      };
    } catch (error) {
      console.log('Error creating faculty:', error.message);
      return {
        EC: 0,
        EM: 'An error occurred while creating faculty',
      };
    }
  }

  async findAll() {
    try {
      const listFalculties = await this.falcultyRepository.find({});
      if (!listFalculties) {
        return {
          EC: 0,
          EM: 'Fetch List falculties failed',
        };
      } else {
        return {
          EC: 1,
          EM: 'Fetch List falculties sucess',
          falculties: listFalculties,
        };
      }
    } catch (error) {
      console.log('Error fetch all faculty:', error.message);
      return {
        EC: 0,
        EM: 'An error occurred while fetching all faculty',
      };
    }
  }

  async findOne(id: string) {
    try {
      validateUUID(id, 'inputId');
      const found = await this.falcultyRepository.findOne({
        where: { falcultyId: id },
      });
      if (!found) {
        throw new NotFoundException({
          EC: 0,
          EM: 'falculty not found',
        });
      }

      return {
        EC: 1,
        EM: 'Find One falculty Sucess',
        ...found,
      };
    } catch (error) {
      console.log('Error Find One falculty:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while Find One falculty',
      });
    }
  }

  async update(id: string, updateFalcultyDto: UpdateFalcultyDto) {
    try {
      validateUUID(id, 'falculty ID');
      const found = await this.falcultyRepository.findOne({
        where: { falcultyId: id },
      });
      if (!found) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Falculty not found',
        });
      }

      await this.falcultyRepository.update(
        {
          falcultyId: id,
        },
        {
          ...updateFalcultyDto,
        },
      );

      return {
        EC: 1,
        EM: 'Update falculty Success',
        updated: {
          falcultyId: id,
        },
      };
    } catch (error) {
      console.log('Error update One Falculty:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while updating One Falculty',
      });
    }
  }

  async remove(id: string) {
    try {
      validateUUID(id, 'falculty ID');
      const found = await this.falcultyRepository.findOne({
        where: { falcultyId: id },
      });
      if (!found) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Falculty not found',
        });
      }

      await this.falcultyRepository.delete({ falcultyId: id });

      return {
        EC: 1,
        EM: 'Delete Falculty Success',
        deleted: {
          falcultyId: id,
        },
      };
    } catch (error) {
      console.log('Error update One Falculty:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while deleting One Falculty',
      });
    }
  }
}
