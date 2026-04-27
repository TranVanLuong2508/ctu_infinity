import { Module } from '@nestjs/common';
import { MajorService } from './major.service';
import { MajorController } from './major.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Major } from './entities/major.entity';
import { Falculty } from '../falculties/entities/falculty.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Major, Falculty])],
  controllers: [MajorController],
  providers: [MajorService],
  exports: [MajorService],
})
export class MajorModule {}
