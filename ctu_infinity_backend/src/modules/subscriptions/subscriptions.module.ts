import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { Subscription } from './entities/subscription.entity';
import { Student } from '../students/entities/student.entity';
import { EventCategory } from '../event_category/entities/event_category.entity';
import { Criteria } from '../criterias/entities/criteria.entity';
import { CriteriaFrame } from '../criteria-frame/entities/criteria-frame.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Student, EventCategory, Criteria, CriteriaFrame]),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
