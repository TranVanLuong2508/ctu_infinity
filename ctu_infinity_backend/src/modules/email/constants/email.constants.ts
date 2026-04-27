export const EMAIL_QUEUE_NAME = 'email';

export const EMAIL_JOB = {
  SEND_GENERIC: 'send_generic',
  EVENT_APPROVED_NOTIFICATION: 'event_approved_notification',
  REGISTRATION_CONFIRMATION: 'registration_confirmation',
} as const;

export type EmailJobType = (typeof EMAIL_JOB)[keyof typeof EMAIL_JOB];
