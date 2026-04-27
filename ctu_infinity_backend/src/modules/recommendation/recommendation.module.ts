import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { Event } from '../events/entities/event.entity';
import { EventRegistration } from '../event-registration/entities/event-registration.entity';
import { StudentScore } from '../student-score/entities/student-score.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Student } from '../students/entities/student.entity';
import { Criteria } from '../criterias/entities/criteria.entity';
import { Semester } from '../semesters/entities/semester.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      EventRegistration,
      StudentScore,
      Subscription,
      Student,
      Criteria,
      Semester,
    ]),
  ],
  controllers: [RecommendationController],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
