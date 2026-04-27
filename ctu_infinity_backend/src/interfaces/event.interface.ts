export interface IEvent {
  eventId?: string;
  eventName: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  maxParticipants?: number;
  categoryId?: string;
  organizerId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
