import privateAxios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type AttendanceStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type RegistrationStatus =
  | 'REGISTERED'
  | 'ATTENDED'
  | 'CANCELLED'
  | 'ABSENT';

export interface IEvent {
  eventId: string;
  eventName: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  maxParticipants?: number;
  status: EventStatus;
  criteriaId?: string | null;
  score?: number | null;
  requiresApproval: boolean;
  qrCodeToken?: string;
  posterUrl?: string | null;
  organizerId?: string;
  organizer?: { organizerId: string; organizerName?: string };
  createdBy?: string | null;
  creator?: { userId: string; fullName?: string };
  approvedBy?: string | null;
  approver?: { userId: string; fullName?: string };
  approvedAt?: string | null;
  semesterId?: string | null;
  categories?: { categoryId: string; categoryName: string }[];
  createdAt: string;
}

export interface IEventAttendance {
  id: string;
  studentId: string;
  eventId: string;
  checkInTime: string;
  status: AttendanceStatus;
  checkInMethod: 'QR' | 'MANUAL';
  event?: Pick<IEvent, 'eventName' | 'criteriaId' | 'score'>;
}

/**
 * Thông tin sinh viên tham gia sự kiện (từ event_registrations join students + users).
 */
export interface IEventRegistration {
  id: string;
  studentId: string;
  eventId: string;
  status: RegistrationStatus;
  registeredAt: string;
  attendedAt: string | null;
  cancelledAt: string | null;
  /** Mã số sinh viên */
  studentCode: string;
  /** Họ tên đầy đủ */
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface IStudentScore {
  id: string;
  studentId: string;
  eventId: string;
  criteriaId: string;
  scoreValue: number;
  createdAt: string;
  event?: Pick<IEvent, 'eventName'>;
}

export interface IApproveEventPayload {
  criteriaId: string;
  score: number;
}

export interface ICreateEventPayload {
  eventName: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  maxParticipants?: number;
  categoryIds?: string[];
  organizerId?: string;
  posterUrl?: string;
  requiresApproval?: boolean;
  semesterId?: string;
}

export interface IUpdateEventPayload {
  eventName?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  registrationDeadline?: string;
  maxParticipants?: number;
  categoryIds?: string[];
  organizerId?: string;
  posterUrl?: string;
  requiresApproval?: boolean;
  semesterId?: string;
}

// ─── Event Management API ─────────────────────────────────────────────────────

export const eventMgmtApi = {
  /**
   * Lấy danh sách sự kiện.
   * - `status`: lọc theo trạng thái (DRAFT | PENDING | APPROVED | REJECTED)
   * - `createdBy`: lọc theo userId người tạo (dùng cho Organizer chỉ xem sự kiện của mình)
   * - `organizerId`: lọc theo ban tổ chức
   */
  getAll: (params?: {
    status?: EventStatus;
    createdBy?: string;
    organizerId?: string;
  }): Promise<IBackendRes<{ events: IEvent[] }>> =>
    privateAxios.get('/events', {
      params: params
        ? Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined),
          )
        : {},
    }),

  /** Lấy chi tiết một sự kiện theo ID */
  getOne: (eventId: string): Promise<IBackendRes<IEvent>> =>
    privateAxios.get(`/events/${eventId}`),

  /** Tạo sự kiện mới */
  create: (payload: ICreateEventPayload): Promise<IBackendRes<IEvent>> =>
    privateAxios.post('/events', payload),

  /** Cập nhật thông tin sự kiện (chỉ được phép khi còn DRAFT) */
  update: (
    eventId: string,
    payload: IUpdateEventPayload,
  ): Promise<IBackendRes<IEvent>> =>
    privateAxios.patch(`/events/${eventId}`, payload),

  /** Organizer đăng ký duyệt sự kiện: DRAFT → PENDING */
  submitForApproval: (eventId: string): Promise<IBackendRes<any>> =>
    privateAxios.patch(`/events/${eventId}/submit-for-approval`),

  /** Admin duyệt sự kiện: gắn criteriaId và score */
  approve: (
    eventId: string,
    payload: IApproveEventPayload,
  ): Promise<IBackendRes<any>> =>
    privateAxios.patch(`/events/${eventId}/approve`, payload),

  /** Admin từ chối sự kiện */
  reject: (eventId: string): Promise<IBackendRes<any>> =>
    privateAxios.patch(`/events/${eventId}/reject`),

  /** Tạo mã QR token cho sự kiện check-in */
  generateQrToken: (
    eventId: string,
    expiresInMinutes?: number,
  ): Promise<IBackendRes<{ token: string }>> =>
    privateAxios.post(`/events/${eventId}/generate-qr-token`, {
      expiresInMinutes,
    }),
};

// ─── Registration API ─────────────────────────────────────────────────────────

export const registrationApi = {
  /**
   * Lấy danh sách sinh viên tham gia một sự kiện.
   * Có thể lọc theo status: REGISTERED | ATTENDED | CANCELLED | ABSENT
   */
  getByEvent: (
    eventId: string,
    status?: RegistrationStatus,
  ): Promise<
    IBackendRes<{ registrations: IEventRegistration[]; total: number }>
  > =>
    privateAxios.get(`/event-registrations/event/${eventId}`, {
      params: status ? { status } : {},
    }),

  /**
   * Admin đánh dấu vắng mặt (ABSENT) cho sinh viên REGISTERED chưa điểm danh.
   * Gọi sau khi sự kiện kết thúc.
   */
  markAbsent: (eventId: string): Promise<IBackendRes<{ affected: number }>> =>
    privateAxios.patch(`/event-registrations/event/${eventId}/mark-absent`),
};

// ─── Attendance API ───────────────────────────────────────────────────────────

export const attendanceApi = {
  /** Lấy toàn bộ attendance (admin) */
  getAll: (): Promise<IBackendRes<{ attendances: IEventAttendance[] }>> =>
    privateAxios.get('/event-attendances'),

  /** Lấy attendance theo sự kiện */
  getByEvent: (
    eventId: string,
  ): Promise<IBackendRes<{ attendances: IEventAttendance[] }>> =>
    privateAxios.get(`/event-attendances/event/${eventId}`),

  /**
   * Admin điểm danh thủ công cho sinh viên.
   * Dùng khi sinh viên không quét được QR.
   */
  manualCheckIn: (
    studentId: string,
    eventId: string,
  ): Promise<IBackendRes<any>> =>
    privateAxios.post('/event-attendances/manual-check-in', {
      studentId,
      eventId,
    }),

  /** Admin duyệt attendance → cộng điểm */
  approve: (id: string): Promise<IBackendRes<any>> =>
    privateAxios.patch(`/event-attendances/${id}/approve`),

  /** Admin từ chối attendance */
  reject: (id: string): Promise<IBackendRes<any>> =>
    privateAxios.patch(`/event-attendances/${id}/reject`),
};

// ─── Student Score API ────────────────────────────────────────────────────────

export const scoreApi = {
  /** Lấy điểm của một sinh viên theo semesterId */
  getByStudent: (
    studentId: string,
    semesterId?: string,
  ): Promise<
    IBackendRes<{
      scores: IStudentScore[];
      totalsByCriteriaId: Record<string, number>;
    }>
  > => {
    const params = semesterId ? { semesterId } : {};
    return privateAxios.get(`/student-scores/student/${studentId}`, { params });
  },

  /** Lấy toàn bộ điểm (admin) */
  getAll: (): Promise<IBackendRes<{ scores: IStudentScore[] }>> =>
    privateAxios.get('/student-scores'),
};
