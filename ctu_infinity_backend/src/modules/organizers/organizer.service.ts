import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrganizerDto } from './dto/create-organizer.dto';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Organizer } from './entities/organizer.entity';
import { Repository } from 'typeorm';
import { filterResponse } from 'src/common/filerRespone';
import { validateUUID } from 'src/common/validateUUID';

@Injectable()
export class OrganizerService {
  constructor(
    @InjectRepository(Organizer)
    private organizerRepository: Repository<Organizer>,
  ) { }

  async create(createOrganizerDto: CreateOrganizerDto) {
    try {
      // Check if organizer name already exists
      const existingOrganizer = await this.organizerRepository.findOne({
        where: {
          organizerName: createOrganizerDto.organizerName,
        },
      });

      if (existingOrganizer) {
        return {
          EC: 0,
          EM: `Organizer "${createOrganizerDto.organizerName}" already exists`,
        };
      }

      // Check if userId already has an organizer record
      const existingUserOrganizer = await this.organizerRepository.findOne({
        where: { userId: createOrganizerDto.userId },
      });

      if (existingUserOrganizer) {
        return {
          EC: 0,
          EM: 'This user already has an organizer record',
        };
      }

      // Create new organizer
      const newOrganizer = this.organizerRepository.create(createOrganizerDto);
      const savedOrganizer = await this.organizerRepository.save(newOrganizer);

      const dataReturn = filterResponse(savedOrganizer, ['organizerId']);

      return {
        EC: 1,
        EM: 'Created Organizer Successfully',
        ...dataReturn,
      };
    } catch (error) {
      console.log('Error creating organizer:', error.message);
      return {
        EC: 0,
        EM: 'An error occurred while creating organizer',
      };
    }
  }

  async findAll(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const queryBuilder = this.organizerRepository
        .createQueryBuilder('organizer')
        .leftJoinAndSelect('organizer.user', 'user')
        .where('user.isDeleted = :isDeleted', { isDeleted: false })
        .skip(skip)
        .take(limit)
        .orderBy('user.createdAt', 'DESC');

      const [organizers, total] = await queryBuilder.getManyAndCount();

      return {
        EC: 1,
        EM: 'Fetch All Organizers Successfully',
        organizers,
        pagination: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.log('Error fetching all organizers:', error.message);
      return {
        EC: 0,
        EM: 'An error occurred while fetching all organizers',
      };
    }
  }

  async findOne(id: string) {
    try {
      validateUUID(id, 'Organizer ID');

      const organizer = await this.organizerRepository
        .createQueryBuilder('organizer')
        .leftJoinAndSelect('organizer.user', 'user')
        .where('organizer.organizerId = :id', { id })
        .andWhere('user.isDeleted = :isDeleted', { isDeleted: false })
        .getOne();

      if (!organizer) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Organizer not found',
        });
      }

      return {
        EC: 1,
        EM: 'Find One Organizer Successfully',
        ...organizer,
      };
    } catch (error) {
      console.log('Error finding one organizer:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while finding one organizer',
      });
    }
  }

  async findByOrganizerName(organizerName: string) {
    try {
      const organizer = await this.organizerRepository
        .createQueryBuilder('organizer')
        .leftJoinAndSelect('organizer.user', 'user')
        .where('organizer.organizerName = :organizerName', { organizerName })
        .andWhere('user.isDeleted = :isDeleted', { isDeleted: false })
        .getOne();

      if (!organizer) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Organizer not found',
        });
      }

      return {
        EC: 1,
        EM: 'Find Organizer by Name Successfully',
        ...organizer,
      };
    } catch (error) {
      console.log('Error finding organizer by name:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while finding organizer by name',
      });
    }
  }

  async update(id: string, updateOrganizerDto: UpdateOrganizerDto) {
    try {
      validateUUID(id, 'Organizer ID');

      const found = await this.organizerRepository
        .createQueryBuilder('organizer')
        .leftJoinAndSelect('organizer.user', 'user')
        .where('organizer.organizerId = :id', { id })
        .andWhere('user.isDeleted = :isDeleted', { isDeleted: false })
        .getOne();

      if (!found) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Organizer not found',
        });
      }

      // Check if updating organizerName and if it conflicts
      if (updateOrganizerDto.organizerName && updateOrganizerDto.organizerName !== found.organizerName) {
        const existingOrganizer = await this.organizerRepository.findOne({
          where: { organizerName: updateOrganizerDto.organizerName },
        });

        if (existingOrganizer) {
          return {
            EC: 0,
            EM: `Organizer name "${updateOrganizerDto.organizerName}" already exists`,
          };
        }
      }

      await this.organizerRepository.update(
        { organizerId: id },
        { ...updateOrganizerDto },
      );

      return {
        EC: 1,
        EM: 'Update Organizer Successfully',
        updated: {
          organizerId: id,
        },
      };
    } catch (error) {
      console.log('Error updating organizer:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while updating organizer',
      });
    }
  }

  async remove(id: string) {
    try {
      validateUUID(id, 'Organizer ID');

      const organizer = await this.organizerRepository
        .createQueryBuilder('organizer')
        .leftJoinAndSelect('organizer.user', 'user')
        .where('organizer.organizerId = :id', { id })
        .andWhere('user.isDeleted = :isDeleted', { isDeleted: false })
        .getOne();

      if (!organizer) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Organizer not found',
        });
      }

      // Soft delete by updating the user
      await this.organizerRepository.manager.update(
        'users',
        { userId: organizer.userId },
        {
          isDeleted: true,
          deletedAt: new Date(),
        },
      );

      return {
        EC: 1,
        EM: 'Delete Organizer Successfully',
        deleted: {
          organizerId: id,
        },
      };
    } catch (error) {
      console.log('Error deleting organizer:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while deleting organizer',
      });
    }
  }

  async restore(id: string) {
    try {
      validateUUID(id, 'Organizer ID');

      const organizer = await this.organizerRepository
        .createQueryBuilder('organizer')
        .leftJoinAndSelect('organizer.user', 'user')
        .where('organizer.organizerId = :id', { id })
        .andWhere('user.isDeleted = :isDeleted', { isDeleted: true })
        .getOne();

      if (!organizer) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Deleted organizer not found',
        });
      }

      // Restore by updating the user
      await this.organizerRepository.manager.update(
        'users',
        { userId: organizer.userId },
        {
          isDeleted: false,
          deletedAt: null,
        },
      );

      return {
        EC: 1,
        EM: 'Restore Organizer Successfully',
        restored: {
          organizerId: id,
        },
      };
    } catch (error) {
      console.log('Error restoring organizer:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while restoring organizer',
      });
    }
  }
}
