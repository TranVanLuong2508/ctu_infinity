import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmailJobPayload } from './dto/email-job.dto';
import { EMAIL_QUEUE_NAME } from './constants/email.constants';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    @InjectQueue(EMAIL_QUEUE_NAME)
    private readonly emailQueue: Queue,
  ) {}

  async addEmailJob(
    payload: EmailJobPayload,
    options?: {
      delay?: number;
      priority?: number;
    },
  ): Promise<void> {
    try {
      const job = await this.emailQueue.add(payload.jobType, payload, {
        attempts: parseInt(process.env.EMAIL_QUEUE_ATTEMPTS ?? '3', 10),
        backoff: {
          type: 'exponential',
          delay: parseInt(process.env.EMAIL_QUEUE_BACKOFF_DELAY ?? '5000', 10),
        },
        removeOnComplete: {
          age: 7 * 24 * 3600,
          count: 1000,
        },
        removeOnFail: {
          age: 30 * 24 * 3600,
        },
        delay: options?.delay,
        priority: options?.priority,
      });

      this.logger.log(
        `[Queue] Job added | type: ${payload.jobType} | to: ${payload.to} | jobId: ${job.id}`,
      );
    } catch (error: any) {
      this.logger.error(
        `[Queue] Failed to add job | type: ${payload.jobType} | to: ${payload.to}`,
        error?.message,
      );
    }
  }

  async addEventApprovedNotificationJob(params: {
    to: string;
    studentName: string;
    eventName: string;
    startDate: string;
    endDate: string;
    registrationDeadline: string | null;
    eventLocation: string;
    organizerName?: string;
    criteriaMatch?: string;
    categoryMatches: string[];
    criteriaName?: string;
    criteriaCode?: string;
    score: number;
    eventUrl: string;
  }): Promise<void> {
    return this.addEmailJob({
      jobType: 'event_approved_notification',
      ...params,
    });
  }

  async addRegistrationConfirmationJob(params: {
    to: string;
    studentName: string;
    eventName: string;
    eventDate: string;
    eventLocation: string;
  }): Promise<void> {
    return this.addEmailJob({
      jobType: 'registration_confirmation',
      ...params,
    });
  }
}
