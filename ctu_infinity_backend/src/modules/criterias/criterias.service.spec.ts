import { Test, TestingModule } from '@nestjs/testing';
import { CriteriasService } from './criterias.service';

describe('CriteriasService', () => {
  let service: CriteriasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CriteriasService],
    }).compile();

    service = module.get<CriteriasService>(CriteriasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
