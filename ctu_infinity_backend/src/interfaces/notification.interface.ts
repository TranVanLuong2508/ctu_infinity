export interface INotification {
  notificationId?: string;
  title: string;
  content: string;
  isRead?: boolean;
  userId?: string;
  eventId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
