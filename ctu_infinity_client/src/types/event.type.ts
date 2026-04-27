export type EventStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IEvent {
  eventId: string;
  eventName: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  status: EventStatus;
  userRegistrationStatus?: string; // e.g. 'REGISTERED', 'ATTENDED', 'ABSENT', 'CANCELLED'
  criteriaId?: string | null;
  score?: number | null;
  requiresApproval: boolean;
  qrCodeToken?: string;
  posterUrl?: string | null;
  organizerId?: string;
  organizer?: {
    organizerId: string;
    organizerName?: string;
  };
  categories?: { categoryId: string; categoryName: string }[];
  createdBy?: string | null;
  creator?: {
    userId: string;
    fullName?: string;
  };
  approvedBy?: string | null;
  approver?: {
    userId: string;
    fullName?: string;
  };
  approvedAt?: string | null;
  createdAt: string;
  maxParticipants?: number;
  currentParticipants?: number;
  /** Giải thích lý do gợi ý từ recommendation system */
  explanation?: {
    reasonType: 'DEFICIT' | 'SUBSCRIPTION' | 'HISTORY' | 'COMMUNITY';
    message: string;
  } | null;
}

export interface IEventListResponse {
  events: IEvent[];
}
