import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailService } from './email.service';
import { EmailQueueService } from './email.queue.service';
import { EmailWorker } from './email.worker';
import { EmailController } from './email.controller';
import { EMAIL_QUEUE_NAME } from './constants/email.constants';
import { createRedisConnection } from 'src/common/redis/redis.connection';

@Module({
  imports: [
    BullModule.registerQueue({
      name: EMAIL_QUEUE_NAME,
      connection: createRedisConnection(),
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailQueueService, EmailWorker],
  exports: [EmailQueueService],
})
export class EmailModule {}
