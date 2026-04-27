import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { Event } from './entities/event.entity';
import { EventCategory } from '../event_category/entities/event_category.entity';
import { Semester } from '../semesters/entities/semester.entity';
import { CriteriasModule } from '../criterias/criterias.module';
import { EventRegistration } from '../event-registration/entities/event-registration.entity';
import { Student } from '../students/entities/student.entity';
import { EmailModule } from '../email/email.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, EventCategory, Semester, EventRegistration, Student]),
    CriteriasModule,
    JwtModule.register({}),
    EmailModule,
    SubscriptionsModule,
  ],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
