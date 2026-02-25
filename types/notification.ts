export type NotificationType =
  | 'budget_alert'
  | 'bill_reminder'
  | 'daily_reminder'
  | 'summary'
  | 'system'
  | 'goal_achieved';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: Date | string;
  isRead: boolean;
  relatedId?: string;
  eventKey?: string;
  route?: string;
}
