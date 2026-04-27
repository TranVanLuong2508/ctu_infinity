import { Test, TestingModule } from '@nestjs/testing';
import { OrganizerService } from './organizer.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Organizer } from './entities/organizer.entity';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { CreateOrganizerDto } from './dto/create-organizer.dto';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';

// Mock the utility functions
jest.mock('src/common/validateUUID', () => ({
  validateUUID: jest.fn((id: string, fieldName: string) => {
    // Simple UUID validation mock
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException({
        EC: 0,
        EM: `${fieldName} must be a valid UUID format`,
      });
    }
  }),
}));

jest.mock('src/common/filerRespone', () => ({
  filterResponse: jest.fn((data: any, fields: string[]) => {
    const result: any = {};
    fields.forEach((field) => {
      if (field in data) {
        result[field] = data[field];
      }
    });
    return result;
  }),
}));

describe('OrganizerService', () => {
  let service: OrganizerService;
  let repository: jest.Mocked<Repository<Organizer>>;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizerService,
        {
          provide: getRepositoryToken(Organizer),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<OrganizerService>(OrganizerService);
    repository = module.get(getRepositoryToken(Organizer));

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createOrganizerDto: CreateOrganizerDto = {
      organizerName: 'Test Organizer',
      description: 'Test Description',
    } as CreateOrganizerDto;

    const mockOrganizer = {
      organizerId: '123e4567-e89b-12d3-a456-426614174000',
      organizerName: 'Test Organizer',
      description: 'Test Description',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a new organizer successfully', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockOrganizer as any);
      repository.save.mockResolvedValue(mockOrganizer as any);

      const result = await service.create(createOrganizerDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { organizerName: createOrganizerDto.organizerName },
      });
      expect(repository.create).toHaveBeenCalledWith(createOrganizerDto);
      expect(repository.save).toHaveBeenCalledWith(mockOrganizer);
      expect(result).toEqual({
        EC: 1,
        EM: 'Created Falculty Sucess',
        organizerId: mockOrganizer.organizerId,
        createdAt: mockOrganizer.createdAt,
      });
    });

    it('should return error when organizer name already exists', async () => {
      repository.findOne.mockResolvedValue(mockOrganizer as any);

      const result = await service.create(createOrganizerDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { organizerName: createOrganizerDto.organizerName },
      });
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
      expect(result).toEqual({
        EC: 0,
        EM: `Falculty "${createOrganizerDto.organizerName}" already exist`,
      });
    });

    it('should handle database errors gracefully', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockOrganizer as any);
      repository.save.mockRejectedValue(new Error('Database error'));

      const result = await service.create(createOrganizerDto);

      expect(result).toEqual({
        EC: 0,
        EM: 'An error occurred while creating organizer',
      });
    });
  });

  describe('findAll', () => {
    const mockOrganizerList = [
      {
        organizerId: '123e4567-e89b-12d3-a456-426614174000',
        organizerName: 'Organizer 1',
        description: 'Description 1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        organizerId: '223e4567-e89b-12d3-a456-426614174001',
        organizerName: 'Organizer 2',
        description: 'Description 2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return all organizers successfully', async () => {
      repository.find.mockResolvedValue(mockOrganizerList as any);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({});
      expect(result).toEqual({
        EC: 1,
        EM: 'Find All organizer success',
        organizers: mockOrganizerList,
      });
    });

    it('should throw NotFoundException when organizer list is not found', async () => {
      repository.find.mockResolvedValue([]);

      await expect(service.findAll()).rejects.toThrow(NotFoundException);
      await expect(service.findAll()).rejects.toThrow(
        expect.objectContaining({
          response: {
            EC: 0,
            EM: 'Organizer list not found',
          },
        }),
      );
    });

    it('should throw InternalServerErrorException on database errors', async () => {
      repository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.findAll()).rejects.toThrow(
        expect.objectContaining({
          response: {
            EC: 0,
            EM: 'An error occurred while Find all organizers',
          },
        }),
      );
    });
  });

  describe('findOne', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';
    const invalidId = 'invalid-uuid';

    const mockOrganizer = {
      organizerId: validId,
      organizerName: 'Test Organizer',
      description: 'Test Description',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should find an organizer by valid ID successfully', async () => {
      repository.findOne.mockResolvedValue(mockOrganizer as any);

      const result = await service.findOne(validId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { organizerId: validId },
      });
      expect(result).toEqual({
        EC: 1,
        EM: 'Find One organizer Sucess',
        ...mockOrganizer,
      });
    });

    it('should throw BadRequestException for invalid UUID format', async () => {
      await expect(service.findOne(invalidId)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.findOne).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when organizer is not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(validId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(validId)).rejects.toThrow(
        expect.objectContaining({
          response: {
            EC: 0,
            EM: 'organizer not found',
          },
        }),
      );
    });

    it('should throw InternalServerErrorException on database errors', async () => {
      repository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.findOne(validId)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.findOne(validId)).rejects.toThrow(
        expect.objectContaining({
          response: {
            EC: 0,
            EM: 'An error occurred while Find One organizer',
          },
        }),
      );
    });
  });

  describe('update', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';
    const invalidId = 'invalid-uuid';

    const updateOrganizerDto: UpdateOrganizerDto = {
      organizerName: 'Updated Organizer',
      description: 'Updated Description',
    } as UpdateOrganizerDto;

    const mockOrganizer = {
      organizerId: validId,
      organizerName: 'Test Organizer',
      description: 'Test Description',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update an organizer successfully', async () => {
      repository.findOne.mockResolvedValue(mockOrganizer as any);
      repository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.update(validId, updateOrganizerDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { organizerId: validId },
      });
      expect(repository.update).toHaveBeenCalledWith(
        { organizerId: validId },
        { ...updateOrganizerDto },
      );
      expect(result).toEqual({
        EC: 1,
        EM: 'Update organizer Success',
        updated: {
          organizerId: validId,
        },
      });
    });

    it('should throw BadRequestException for invalid UUID format', async () => {
      await expect(
        service.update(invalidId, updateOrganizerDto),
      ).rejects.toThrow(BadRequestException);
      expect(repository.findOne).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when organizer is not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(validId, updateOrganizerDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update(validId, updateOrganizerDto),
      ).rejects.toThrow(
        expect.objectContaining({
          response: {
            EC: 0,
            EM: 'Falculty not found',
          },
        }),
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on database errors', async () => {
      repository.findOne.mockResolvedValue(mockOrganizer as any);
      repository.update.mockRejectedValue(new Error('Database error'));

      await expect(
        service.update(validId, updateOrganizerDto),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        service.update(validId, updateOrganizerDto),
      ).rejects.toThrow(
        expect.objectContaining({
          response: {
            EC: 0,
            EM: 'An error occurred while updating one organizer',
          },
        }),
      );
    });
  });

  describe('remove', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';
    const invalidId = 'invalid-uuid';

    const mockOrganizer = {
      organizerId: validId,
      organizerName: 'Test Organizer',
      description: 'Test Description',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should delete an organizer successfully', async () => {
      repository.findOne.mockResolvedValue(mockOrganizer as any);
      repository.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.remove(validId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { organizerId: validId },
      });
      expect(repository.delete).toHaveBeenCalledWith({
        organizerId: validId,
      });
      expect(result).toEqual({
        EC: 1,
        EM: 'Delete organizer Success',
        deleted: {
          organizerId: validId,
        },
      });
    });

    it('should throw BadRequestException for invalid UUID format', async () => {
      await expect(service.remove(invalidId)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.findOne).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when organizer is not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(validId)).rejects.toThrow(NotFoundException);
      await expect(service.remove(validId)).rejects.toThrow(
        expect.objectContaining({
          response: {
            EC: 0,
            EM: 'organizer not found',
          },
        }),
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on database errors', async () => {
      repository.findOne.mockResolvedValue(mockOrganizer as any);
      repository.delete.mockRejectedValue(new Error('Database error'));

      await expect(service.remove(validId)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.remove(validId)).rejects.toThrow(
        expect.objectContaining({
          response: {
            EC: 0,
            EM: 'An error occurred while deleting One organizer',
          },
        }),
      );
    });
  });
});
