import { Module } from '@nestjs/common';
import { SemestersService } from './semesters.service';
import { SemestersController } from './semesters.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Semester } from './entities/semester.entity';
import { AcademicYear } from '../academic_year/entities/academic_year.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Semester, AcademicYear])],
  controllers: [SemestersController],
  providers: [SemestersService],
  exports: [SemestersService],
})
export class SemestersModule {}
