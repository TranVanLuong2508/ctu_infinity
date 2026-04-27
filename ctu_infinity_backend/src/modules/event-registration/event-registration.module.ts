import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventRegistrationService } from './event-registration.service';
import { EventRegistrationController } from './event-registration.controller';
import { EventRegistration } from './entities/event-registration.entity';
import { Event } from '../events/entities/event.entity';
import { Student } from '../students/entities/student.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventRegistration, Event, Student]),
    EmailModule,
  ],
  controllers: [EventRegistrationController],
  providers: [EventRegistrationService],
  exports: [EventRegistrationService],
})
export class EventRegistrationModule {}
