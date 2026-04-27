import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from './email.service';
import { EmailJobPayload } from './dto/email-job.dto';
import { EMAIL_QUEUE_NAME } from './constants/email.constants';

@Processor(EMAIL_QUEUE_NAME, {
  concurrency: parseInt(process.env.EMAIL_QUEUE_CONCURRENCY ?? '5', 10),
})
export class EmailWorker extends WorkerHost {
  private readonly logger = new Logger(EmailWorker.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<EmailJobPayload>): Promise<void> {
    this.logger.log(
      `[Worker] Processing | jobId: ${job.id} | type: ${job.name} | attempt: ${job.attemptsMade + 1}`,
    );

    await this.emailService.dispatch(job.data);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<EmailJobPayload>): void {
    this.logger.log(
      `[Worker] ✅ Completed | jobId: ${job.id} | type: ${job.name} | to: ${job.data.to}`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<EmailJobPayload> | undefined, error: Error): void {
    this.logger.error(
      `[Worker] ❌ Failed | jobId: ${job?.id} | type: ${job?.name} | to: ${job?.data?.to} | attempts: ${job?.attemptsMade}`,
      error.stack,
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error): void {
    this.logger.error('[Worker] Worker error:', error.message);
  }
}
