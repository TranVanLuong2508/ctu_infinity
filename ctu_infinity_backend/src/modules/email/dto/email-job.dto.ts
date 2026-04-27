import { EmailJobType } from '../constants/email.constants';

export interface BaseEmailJobPayload {
  to: string;
  jobType: EmailJobType;
}

/** Payload cho email thông báo sự kiện được duyệt */
export interface EventApprovedEmailPayload extends BaseEmailJobPayload {
  jobType: 'event_approved_notification';
  studentName: string;
  eventName: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string | null;
  eventLocation: string;
  organizerName?: string;
  /**
   * Tên tiêu chí khớp subscription của sinh viên (nếu có).
   * Undefined nếu sinh viên chỉ match qua category.
   */
  criteriaMatch?: string;
  /**
   * Danh sách tên các danh mục khớp subscription (nếu có).
   * Mảng rỗng nếu sinh viên chỉ match qua criteria.
   */
  categoryMatches: string[];
  /** Tên tiêu chí được gán cho sự kiện (để hiển thị thông tin điểm) */
  criteriaName?: string;
  /** Mã tiêu chí được gán cho sự kiện */
  criteriaCode?: string;
  score: number;
  eventUrl: string;
}

/** Payload cho email xác nhận đăng ký */
export interface RegistrationConfirmationEmailPayload extends BaseEmailJobPayload {
  jobType: 'registration_confirmation';
  studentName: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
}

/** Payload cho email generic (text thuần) */
export interface GenericEmailPayload extends BaseEmailJobPayload {
  jobType: 'send_generic';
  subject: string;
  html: string;
}

/** Union type – tất cả loại payload có thể có trong queue */
export type EmailJobPayload =
  | EventApprovedEmailPayload
  | RegistrationConfirmationEmailPayload
  | GenericEmailPayload;
