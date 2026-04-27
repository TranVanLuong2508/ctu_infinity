import { Module } from '@nestjs/common';
import { AcademicYearService } from './academic_year.service';
import { AcademicYearController } from './academic_year.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicYear } from './entities/academic_year.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicYear])],
  controllers: [AcademicYearController],
  providers: [AcademicYearService],
  exports: [AcademicYearService],
})
export class AcademicYearModule {}
