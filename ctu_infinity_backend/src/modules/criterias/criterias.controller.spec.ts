import { Test, TestingModule } from '@nestjs/testing';
import { CriteriasController } from './criterias.controller';
import { CriteriasService } from './criterias.service';

describe('CriteriasController', () => {
  let controller: CriteriasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CriteriasController],
      providers: [CriteriasService],
    }).compile();

    controller = module.get<CriteriasController>(CriteriasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
