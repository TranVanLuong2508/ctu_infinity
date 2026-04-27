import { Test, TestingModule } from '@nestjs/testing';
import { OrganizerController } from './organizer.controller';
import { OrganizerService } from './organizer.service';
import { CreateOrganizerDto } from './dto/create-organizer.dto';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';

describe('OrganizerController', () => {
  let controller: OrganizerController;
  let service: OrganizerService;

  const mockOrganizerService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizerController],
      providers: [
        {
          provide: OrganizerService,
          useValue: mockOrganizerService,
        },
      ],
    }).compile();

    controller = module.get<OrganizerController>(OrganizerController);
    service = module.get<OrganizerService>(OrganizerService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createOrganizerDto: CreateOrganizerDto = {
      organizerName: 'Test Organizer',
      description: 'Test Description',
    } as CreateOrganizerDto;

    const mockResponse = {
      EC: 1,
      EM: 'Created Falculty Sucess',
      organizerId: '123e4567-e89b-12d3-a456-426614174000',
      createdAt: new Date(),
    };

    it('should call service.create with correct parameters', async () => {
      mockOrganizerService.create.mockResolvedValue(mockResponse);

      const result = await controller.create(createOrganizerDto);

      expect(service.create).toHaveBeenCalledWith(createOrganizerDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should return the result from service.create', async () => {
      mockOrganizerService.create.mockResolvedValue(mockResponse);

      const result = await controller.create(createOrganizerDto);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('findAll', () => {
    const mockResponse = {
      EC: 1,
      EM: 'Find All organizer success',
      organizers: [
        {
          organizerId: '123e4567-e89b-12d3-a456-426614174000',
          organizerName: 'Organizer 1',
          description: 'Description 1',
        },
        {
          organizerId: '223e4567-e89b-12d3-a456-426614174001',
          organizerName: 'Organizer 2',
          description: 'Description 2',
        },
      ],
    };

    it('should call service.findAll', async () => {
      mockOrganizerService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return the result from service.findAll', async () => {
      mockOrganizerService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('findOne', () => {
    const organizerId = '123e4567-e89b-12d3-a456-426614174000';
    const mockResponse = {
      EC: 1,
      EM: 'Find One organizer Sucess',
      organizerId: organizerId,
      organizerName: 'Test Organizer',
      description: 'Test Description',
    };

    it('should call service.findOne with correct ID', async () => {
      mockOrganizerService.findOne.mockResolvedValue(mockResponse);

      const result = await controller.findOne(organizerId);

      expect(service.findOne).toHaveBeenCalledWith(organizerId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return the result from service.findOne', async () => {
      mockOrganizerService.findOne.mockResolvedValue(mockResponse);

      const result = await controller.findOne(organizerId);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('update', () => {
    const organizerId = '123e4567-e89b-12d3-a456-426614174000';
    const updateOrganizerDto: UpdateOrganizerDto = {
      organizerName: 'Updated Organizer',
      description: 'Updated Description',
    } as UpdateOrganizerDto;

    const mockResponse = {
      EC: 1,
      EM: 'Update organizer Success',
      updated: {
        organizerId: organizerId,
      },
    };

    it('should call service.update with correct parameters', async () => {
      mockOrganizerService.update.mockResolvedValue(mockResponse);

      const result = await controller.update(organizerId, updateOrganizerDto);

      expect(service.update).toHaveBeenCalledWith(
        organizerId,
        updateOrganizerDto,
      );
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('should return the result from service.update', async () => {
      mockOrganizerService.update.mockResolvedValue(mockResponse);

      const result = await controller.update(organizerId, updateOrganizerDto);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('remove', () => {
    const organizerId = '123e4567-e89b-12d3-a456-426614174000';
    const mockResponse = {
      EC: 1,
      EM: 'Delete organizer Success',
      deleted: {
        organizerId: organizerId,
      },
    };

    it('should call service.remove with correct ID', async () => {
      mockOrganizerService.remove.mockResolvedValue(mockResponse);

      const result = await controller.remove(organizerId);

      expect(service.remove).toHaveBeenCalledWith(organizerId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

    it('should return the result from service.remove', async () => {
      mockOrganizerService.remove.mockResolvedValue(mockResponse);

      const result = await controller.remove(organizerId);

      expect(result).toEqual(mockResponse);
    });
  });
});
