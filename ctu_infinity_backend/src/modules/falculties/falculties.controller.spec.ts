import { Test, TestingModule } from '@nestjs/testing';
import { FalcultiesController } from './falculties.controller';
import { FalcultiesService } from './falculties.service';

describe('FalcultiesController', () => {
  let controller: FalcultiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FalcultiesController],
      providers: [FalcultiesService],
    }).compile();

    controller = module.get<FalcultiesController>(FalcultiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
