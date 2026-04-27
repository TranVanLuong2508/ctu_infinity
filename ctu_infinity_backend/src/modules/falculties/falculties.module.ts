import { Module } from '@nestjs/common';
import { FalcultiesService } from './falculties.service';
import { FalcultiesController } from './falculties.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Falculty } from './entities/falculty.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Falculty])],
  controllers: [FalcultiesController],
  providers: [FalcultiesService],
  exports: [FalcultiesService],
})
export class FalcultiesModule {}
