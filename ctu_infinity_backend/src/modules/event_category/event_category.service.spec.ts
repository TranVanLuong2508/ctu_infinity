import { Test, TestingModule } from '@nestjs/testing';
import { EventCategoryService } from './event_category.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventCategory } from './entities/event_category.entity';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock functions
jest.mock('src/common/generateSlug', () => ({
  generateUniqueSlug: jest.fn((name: string) => name.toLowerCase().replace(/\s+/g, '-')),
}));

jest.mock('src/common/filerRespone', () => ({
  filterResponse: jest.fn((data, fields) => {
    const filtered = { ...data };
    fields.forEach((field: string) => {
      if (field in filtered) filtered[field] = filtered[field];
    });
    return filtered;
  }),
}));

describe('EventCategoryService', () => {
  let service: EventCategoryService;
  let repository: Repository<EventCategory>;

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
        EventCategoryService,
        {
          provide: getRepositoryToken(EventCategory),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EventCategoryService>(EventCategoryService);
    repository = module.get<Repository<EventCategory>>(getRepositoryToken(EventCategory));

    // Clear all mocks trước mỗi test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      categoryName: 'Văn hóa Nghệ thuật',
      description: 'Các sự kiện văn hóa',
    };

    it('should create a new event category successfully', async () => {
      const expectedSlug = 'van-hoa-nghe-thuat';
      const savedCategory = {
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        categoryName: createDto.categoryName,
        slug: expectedSlug,
        description: createDto.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(null); // Slug chưa tồn tại
      mockRepository.create.mockReturnValue(savedCategory);
      mockRepository.save.mockResolvedValue(savedCategory);

      const result = await service.create(createDto);

      expect(result).toEqual({
        EC: 1,
        EM: 'Create event category successfully',
        data: expect.objectContaining({
          categoryId: savedCategory.categoryId,
          createdAt: savedCategory.createdAt,
        }),
      });
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { slug: expectedSlug },
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should return error when category name already exists', async () => {
      const existingCategory = {
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        categoryName: createDto.categoryName,
        slug: 'van-hoa-nghe-thuat',
      };

      mockRepository.findOne.mockResolvedValue(existingCategory);

      const result = await service.create(createDto);

      expect(result).toEqual({
        EC: 0,
        EM: `Category with name "${createDto.categoryName}" already exists`,
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('Database error'));

      const result = await service.create(createDto);

      expect(result).toEqual({
        EC: 0,
        EM: 'An error occurred while creating event category',
      });
    });
  });

  describe('findAll', () => {
    it('should return all event categories', async () => {
      const categories = [
        {
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          categoryName: 'Văn hóa',
          slug: 'van-hoa',
          description: 'Test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          categoryId: '123e4567-e89b-12d3-a456-426614174001',
          categoryName: 'Thể thao',
          slug: 'the-thao',
          description: 'Test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(categories);

      const result = await service.findAll();

      expect(result).toEqual({
        EC: 1,
        EM: 'Fetch All Event Category Sucess',
        categories: categories,
      });
      expect(mockRepository.find).toHaveBeenCalledWith({});
    });

    it('should handle errors when fetching categories', async () => {
      mockRepository.find.mockRejectedValue(new Error('Database error'));

      const result = await service.findAll();

      expect(result).toEqual({
        EC: 0,
        EM: 'An error occurred while getting all event category',
      });
    });
  });

  describe('findOne', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return a category when found', async () => {
      const category = {
        categoryId: validId,
        categoryName: 'Văn hóa',
        slug: 'van-hoa',
        description: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(category);

      const result = await service.findOne(validId);

      expect(result).toEqual({
        EC: 1,
        EM: 'Find One Event Category Sucess',
        ...category,
      });
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { categoryId: validId },
      });
    });

    it('should return error when category not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(validId);

      expect(result).toEqual({
        EC: 0,
        EM: 'Event category not found',
      });
    });
  });

  describe('update', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';
    const updateDto = {
      categoryName: 'Văn hóa Mới',
      description: 'Updated description',
    };

    it('should update category successfully', async () => {
      const existingCategory = {
        categoryId: validId,
        categoryName: 'Văn hóa',
        slug: 'van-hoa',
        description: 'Old description',
      };

      mockRepository.findOne.mockResolvedValue(existingCategory);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update(validId, updateDto);

      expect(result).toEqual({
        EC: 1,
        EM: 'Update Event Category Success',
        updated: {
          categoryId: validId,
          result: { affected: 1 },
        },
      });
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when category not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(validId, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';

    it('should delete category successfully', async () => {
      const existingCategory = {
        categoryId: validId,
        categoryName: 'Văn hóa',
        slug: 'van-hoa',
      };

      mockRepository.findOne.mockResolvedValue(existingCategory);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(validId);

      expect(result).toEqual({
        EC: 1,
        EM: 'Delete Event Category Success',
        deletedId: validId,
      });
      expect(mockRepository.delete).toHaveBeenCalledWith({ categoryId: validId });
    });

    it('should throw NotFoundException when category not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(validId)).rejects.toThrow(NotFoundException);
    });
  });
});
