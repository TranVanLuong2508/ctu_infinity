import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CriteriaFrameService } from './criteria-frame.service';
import { CriteriaFrameController } from './criteria-frame.controller';
import { CriteriaFrame } from './entities/criteria-frame.entity';
import { Criteria } from '../criterias/entities/criteria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CriteriaFrame, Criteria])],
  controllers: [CriteriaFrameController],
  providers: [CriteriaFrameService],
  exports: [CriteriaFrameService],
})
export class CriteriaFrameModule { }
