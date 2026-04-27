import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CriteriasService } from './criterias.service';
import { CriteriasController } from './criterias.controller';
import { Criteria } from './entities/criteria.entity';
import { CriteriaFrameModule } from '../criteria-frame/criteria-frame.module';
import { CriteriaFrame } from '../criteria-frame/entities/criteria-frame.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Criteria, CriteriaFrame]),
    CriteriaFrameModule,
  ],
  controllers: [CriteriasController],
  providers: [CriteriasService],
  exports: [CriteriasService],
})
export class CriteriasModule { }
