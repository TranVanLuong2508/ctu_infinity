import { Test, TestingModule } from '@nestjs/testing';
import { FalcultiesService } from './falculties.service';

describe('FalcultiesService', () => {
  let service: FalcultiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FalcultiesService],
    }).compile();

    service = module.get<FalcultiesService>(FalcultiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
