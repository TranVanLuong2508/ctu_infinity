import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { CreateCriteriaFrameDto } from './dto/create-criteria-frame.dto';
import { UpdateCriteriaFrameDto } from './dto/update-criteria-frame.dto';
import { CloneCriteriaFrameworkDto } from './dto/clone-criteria-framework.dto';
import { CriteriaFrame } from './entities/criteria-frame.entity';
import { Criteria } from '../criterias/entities/criteria.entity';
import { FrameworkStatus } from 'src/common/enums/framework-status.enum';
import { validateUUID } from 'src/common/validateUUID';

@Injectable()
export class CriteriaFrameService {
  constructor(
    @InjectRepository(CriteriaFrame)
    private criteriaFrameRepository: Repository<CriteriaFrame>,
    @InjectRepository(Criteria)
    private criteriaRepository: Repository<Criteria>,
    private dataSource: DataSource,
  ) {}

  async create(createCriteriaFrameDto: CreateCriteriaFrameDto) {
    try {
      const newFramework = this.criteriaFrameRepository.create({
        ...createCriteriaFrameDto,
        status: FrameworkStatus.DRAFT,
        isActive: false,
      });

      const savedCriteriaFrame = await this.criteriaFrameRepository.save(newFramework);

      return {
        EC: 1,
        EM: 'Create criteria frame successfully',
        ...savedCriteriaFrame,
      };
    } catch (error) {
      console.error('Error creating criteria criteria frame:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while creating criteria frame',
      });
    }
  }

  async findAll() {
    try {
      const frameworks = await this.criteriaFrameRepository.find({
        order: { createdAt: 'DESC' },
      });

      // Get criteria count for each frame
      const framesWithCount = await Promise.all(
        frameworks.map(async (frame) => {
          const criteriaCount = await this.criteriaRepository.count({
            where: { frameworkId: frame.frameworkId },
          });

          return {
            ...frame,
            criteriaCount,
          };
        }),
      );

      return {
        EC: 1,
        EM: 'Fetch all criteria frames successfully',
        frameworks: framesWithCount,
      };
    } catch (error) {
      console.error('Error fetching all frameworks:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while fetching frameworks',
      });
    }
  }

  async findOne(id: string) {
    try {
      validateUUID(id, 'frameworkId');

      const framework = await this.criteriaFrameRepository.findOne({
        where: { frameworkId: id },
      });

      if (!framework) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Criteria frame not found',
        });
      }

      const criteriaCount = await this.criteriaRepository.count({
        where: { frameworkId: id },
      });

      return {
        EC: 1,
        EM: 'Find criteria frame successfully',
        ...framework,
        criteriaCount,
      };
    } catch (error) {
      console.error('Error finding frame:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while finding frame',
      });
    }
  }

  async findActiveFrame() {
    try {
      const activeFrame = await this.criteriaFrameRepository.findOne({
        where: { isActive: true, status: FrameworkStatus.ACTIVE },
      });

      if (!activeFrame) {
        throw new NotFoundException({
          EC: 0,
          EM: 'No active frame found',
        });
      }

      const criteriaCount = await this.criteriaRepository.count({
        where: { frameworkId: activeFrame.frameworkId },
      });

      return {
        EC: 1,
        EM: 'Find active frame successfully',
        ...activeFrame,
        criteriaCount,
      };
    } catch (error) {
      console.error('Error finding active frame:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while finding active frame',
      });
    }
  }

  /**
   * Update framework - only allowed if status is DRAFT
   */
  async update(id: string, updateCriteriaFrameDto: UpdateCriteriaFrameDto) {
    try {
      validateUUID(id, 'frameworkId');

      const framework = await this.criteriaFrameRepository.findOne({
        where: { frameworkId: id },
      });

      if (!framework) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Criteria frame not found',
        });
      }

      if (framework.status !== FrameworkStatus.DRAFT) {
        throw new BadRequestException({
          EC: 0,
          EM: 'Cannot update an ACTIVE or ARCHIVED frame. Only DRAFT frames can be modified.',
        });
      }

      await this.criteriaFrameRepository.update({ frameworkId: id }, updateCriteriaFrameDto);

      return {
        EC: 1,
        EM: 'Update criteria framework successfully',
        data: { frameworkId: id },
      };
    } catch (error) {
      console.error('Error updating framework:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while updating framework',
      });
    }
  }

  /**
   * Delete framework - only allowed if status is DRAFT
   * Cascades delete to all associated criteria
   */
  async remove(id: string) {
    try {
      validateUUID(id, 'frameworkId');

      const framework = await this.criteriaFrameRepository.findOne({
        where: { frameworkId: id },
      });

      if (!framework) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Criteria frame not found',
        });
      }

      if (framework.status !== FrameworkStatus.DRAFT) {
        throw new BadRequestException({
          EC: 0,
          EM: 'Cannot delete an ACTIVE or ARCHIVED framework. Only DRAFT frame can be deleted.',
        });
      }

      const criteriaCount = await this.criteriaRepository.count({
        where: { frameworkId: id },
      });

      await this.criteriaFrameRepository.delete({ frameworkId: id });

      return {
        EC: 1,
        EM: 'Delete criteria frame successfully',
        data: {
          frameworkId: id,
          deletedCriteriaCount: criteriaCount,
        },
      };
    } catch (error) {
      console.error('Error deleting framework:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while deleting framework',
      });
    }
  }

  /**
   * Approve framework: DRAFT → ACTIVE
   * Archives the previous active framework
   * Validates framework has at least one root criteria
   */
  async approve(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      validateUUID(id, 'frameworkId');

      const frame = await queryRunner.manager.findOne(CriteriaFrame, {
        where: { frameworkId: id },
      });

      if (!frame) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Criteria frame not found',
        });
      }

      if (frame.status !== FrameworkStatus.DRAFT) {
        throw new BadRequestException({
          EC: 0,
          EM: 'Only DRAFT frames can be approved',
        });
      }

      // Validate framework has at least one root criteria
      const rootCriteriaCount = await queryRunner.manager.count(Criteria, {
        where: { frameworkId: id, parentId: IsNull() },
      });

      if (rootCriteriaCount === 0) {
        throw new BadRequestException({
          EC: 0,
          EM: 'Framework must have at least one root criteria before approval',
        });
      }

      // Archive previous active framework
      const previousActive = await queryRunner.manager.findOne(CriteriaFrame, {
        where: { isActive: true, status: FrameworkStatus.ACTIVE },
      });

      if (previousActive) {
        await queryRunner.manager.update(
          CriteriaFrame,
          { frameworkId: previousActive.frameworkId },
          {
            status: FrameworkStatus.ARCHIVED,
            isActive: false,
            endDate: new Date(),
          },
        );
      }

      // Activate new framework
      const now = new Date();
      await queryRunner.manager.update(
        CriteriaFrame,
        { frameworkId: id },
        {
          status: FrameworkStatus.ACTIVE,
          isActive: true,
          approvedAt: now,
        },
      );

      await queryRunner.commitTransaction();

      return {
        EC: 1,
        EM: 'Approve criteria frame successfully',
        data: {
          frameworkId: id,
          previousActiveId: previousActive?.frameworkId || null,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error approving frame:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while approving frame',
      });
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Archive framework: ACTIVE → ARCHIVED
   */
  async archive(id: string) {
    try {
      validateUUID(id, 'frameworkId');

      const framework = await this.criteriaFrameRepository.findOne({
        where: { frameworkId: id },
      });

      if (!framework) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Criteria frame not found',
        });
      }

      if (framework.status !== FrameworkStatus.ACTIVE) {
        throw new BadRequestException({
          EC: 0,
          EM: 'Only ACTIVE frame can be archived',
        });
      }

      // TODO: Add validation to check if any active semesters are using this frame
      // This would require access to the Semester entity

      await this.criteriaFrameRepository.update(
        { frameworkId: id },
        {
          status: FrameworkStatus.ARCHIVED,
          isActive: false,
          endDate: new Date(),
        },
      );

      return {
        EC: 1,
        EM: 'Archive criteria frame successfully',
        data: { frameworkId: id },
      };
    } catch (error) {
      console.error('Error archiving frame:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while archiving framework',
      });
    }
  }

  /**
   * Clone entire criteria tree from source frame to new frame
   * Creates a new frame in DRAFT status with all criteria copied
   */
  async cloneFrame(sourceId: string, cloneDto: CloneCriteriaFrameworkDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      validateUUID(sourceId, 'sourceFrameworkId');

      const sourceFramework = await queryRunner.manager.findOne(CriteriaFrame, {
        where: { frameworkId: sourceId },
      });

      if (!sourceFramework) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Source frame not found',
        });
      }

      // Create new framework
      const newFramework = queryRunner.manager.create(CriteriaFrame, {
        frameworkName: cloneDto.frameworkName,
        version: cloneDto.version,
        startDate: cloneDto.startDate,
        status: FrameworkStatus.DRAFT,
        isActive: false,
        description: `Cloned from ${sourceFramework.frameworkName} (${sourceFramework.version})`,
      });

      const savedFrame = await queryRunner.manager.save(newFramework);

      // Get all criteria from source framework
      const sourceCriteria = await queryRunner.manager.find(Criteria, {
        where: { frameworkId: sourceId },
        order: { displayOrder: 'ASC' },
      });

      if (sourceCriteria.length === 0) {
        throw new BadRequestException({
          EC: 0,
          EM: 'Source framework has no criteria to clone',
        });
      }

      // Map old criteriaId to new criteriaId
      const idMap = new Map<string, string>();

      // Clone all criteria (maintain hierarchy)
      for (const criteria of sourceCriteria) {
        const newCriteria = queryRunner.manager.create(Criteria, {
          criteriaCode: criteria.criteriaCode,
          criteriaName: criteria.criteriaName,
          description: criteria.description,
          maxScore: criteria.maxScore,
          displayOrder: criteria.displayOrder,
          frameworkId: savedFrame.frameworkId,
          parentId: null, // Will be set in second pass
        });

        const savedCriteria = await queryRunner.manager.save(newCriteria);
        idMap.set(criteria.criteriaId, savedCriteria.criteriaId);
      }

      // Second pass: update parent relationships
      for (const criteria of sourceCriteria) {
        if (criteria.parentId) {
          const newCriteriaId = idMap.get(criteria.criteriaId);
          const newParentId = idMap.get(criteria.parentId);

          if (newCriteriaId && newParentId) {
            await queryRunner.manager.update(
              Criteria,
              { criteriaId: newCriteriaId },
              { parentId: newParentId },
            );
          }
        }
      }

      await queryRunner.commitTransaction();

      return {
        EC: 1,
        EM: 'Clone criteria frame successfully',
        data: {
          newFrameworkId: savedFrame.frameworkId,
          sourceFrameworkId: sourceId,
          clonedCriteriaCount: sourceCriteria.length,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error cloning framework:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        EC: 0,
        EM: 'An error occurred while cloning framework',
      });
    } finally {
      await queryRunner.release();
    }
  }
}
