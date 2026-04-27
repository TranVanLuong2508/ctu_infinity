import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { EventAttendanceService } from './event-attendance.service';
import { EventAttendanceController } from './event-attendance.controller';
import { EventAttendance } from './entities/event-attendance.entity';
import { EventRegistration } from '../event-registration/entities/event-registration.entity';
import { Student } from '../students/entities/student.entity';
import { EventModule } from '../events/event.module';
import { StudentScoreModule } from '../student-score/student-score.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventAttendance,
      EventRegistration, // Cần để cập nhật trạng thái đăng ký khi check-in
      Student, // Cần để resolve userId → studentId
    ]),
    EventModule, // Cần EventService.findEventEntity
    StudentScoreModule, // Cần StudentScoreService.addScoreForEvent
    JwtModule.register({}),
  ],
  controllers: [EventAttendanceController],
  providers: [EventAttendanceService],
  exports: [EventAttendanceService],
})
export class EventAttendanceModule {}
