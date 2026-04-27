import { Test, TestingModule } from '@nestjs/testing';
import { EventCategoryController } from './event_category.controller';
import { EventCategoryService } from './event_category.service';

describe('EventCategoryController', () => {
  let controller: EventCategoryController;
  let service: EventCategoryService;

  const mockEventCategoryService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventCategoryController],
      providers: [
        {
          provide: EventCategoryService,
          useValue: mockEventCategoryService,
        },
      ],
    }).compile();

    controller = module.get<EventCategoryController>(EventCategoryController);
    service = module.get<EventCategoryService>(EventCategoryService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new event category', async () => {
      const createDto = {
        categoryName: 'Văn hóa',
        description: 'Sự kiện văn hóa',
      };

      const expectedResult = {
        EC: 1,
        EM: 'Create event category successfully',
        data: {
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          categoryName: 'Văn hóa',
          slug: 'van-hoa',
          description: 'Sự kiện văn hóa',
        },
      };

      mockEventCategoryService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of event categories', async () => {
      const expectedResult = {
        EC: 1,
        EM: 'Fetch All Event Category Sucess',
        categories: [
          {
            categoryId: '123e4567-e89b-12d3-a456-426614174000',
            categoryName: 'Văn hóa',
            slug: 'van-hoa',
          },
        ],
      };

      mockEventCategoryService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single event category', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const expectedResult = {
        EC: 1,
        EM: 'Find One Event Category Sucess',
        categoryId: id,
        categoryName: 'Văn hóa',
        slug: 'van-hoa',
      };

      mockEventCategoryService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update an event category', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const updateDto = {
        categoryName: 'Văn hóa Mới',
      };

      const expectedResult = {
        EC: 1,
        EM: 'Update Event Category Success',
        updated: {
          categoryId: id,
          result: { affected: 1 },
        },
      };

      mockEventCategoryService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateDto);

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(id, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete an event category', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const expectedResult = {
        EC: 1,
        EM: 'Delete Event Category Success',
        deletedId: id,
      };

      mockEventCategoryService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(result).toEqual(expectedResult);
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });
});
