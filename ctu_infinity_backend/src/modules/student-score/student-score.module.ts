import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentScoreService } from './student-score.service';
import { StudentScoreController } from './student-score.controller';
import { StudentScore } from './entities/student-score.entity';
import { Semester } from '../semesters/entities/semester.entity';
import { CriteriasModule } from '../criterias/criterias.module';
import { Student } from '../students/entities/student.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentScore, Semester, Student]),
    CriteriasModule, // Cần CriteriasService để lấy maxScore khi addScore
  ],
  controllers: [StudentScoreController],
  providers: [StudentScoreService],
  exports: [StudentScoreService], // Export để EventAttendanceService sử dụng
})
export class StudentScoreModule {}
