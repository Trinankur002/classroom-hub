export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
}

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: string;
  category?: NotificationPreferenceKey;
  entityId?: string | null;
  entityType?: string | null;
  data?: NotificationData | null;
  priority?: NotificationPriority;
}

export interface NotificationListQuery {
  page?: number;
  limit?: number;
}

export interface NotificationEventPayload {
  actorId?: string;
  classroomId?: string;
  announcementId?: string;
  assignmentSubmissionId?: string;
  doubtId?: string;
  studentId?: string;
  liveSessionId?: string;
  targetUserId?: string;
}

export type NotificationPreferenceKey =
  | 'messages'
  | 'assignments'
  | 'grades';

export interface NotificationPreferencesPayload {
  email: boolean;
  push: boolean;
  messages: boolean;
  assignments: boolean;
  grades: boolean;
}

export interface NotificationData {
  route?: string;
  classroomId?: string;
  classroomName?: string;
  actorId?: string;
  actorName?: string;
  entityId?: string;
  entityType?: string;
  entityTitle?: string;
  context?: Record<string, any>;
}

export interface PushSubscriptionDto {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
}
