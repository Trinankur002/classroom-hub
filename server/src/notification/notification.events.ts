import { EventEmitter } from 'events';
import { NotificationEventPayload } from './notification.types';

export const NotificationEvents = {
  ANNOUNCEMENT_CREATED: 'announcement.created',
  ASSIGNMENT_CREATED: 'assignment.created',
  ASSIGNMENT_SUBMITTED: 'assignment.submitted',
  ASSIGNMENT_GRADED: 'assignment.graded',
  LIVECLASS_STARTED: 'liveclass.started',
  DOUBT_REPLIED: 'doubt.replied',
  CLASSROOM_STUDENT_JOINED: 'classroom.student_joined',
  CLASSROOM_STUDENT_REMOVED: 'classroom.student_removed',
} as const;

export type NotificationEventName =
  (typeof NotificationEvents)[keyof typeof NotificationEvents];

export const notificationEventBus = new EventEmitter();
notificationEventBus.setMaxListeners(100);

export function emitNotificationEvent(
  eventName: NotificationEventName,
  payload: NotificationEventPayload,
) {
  notificationEventBus.emit(eventName, payload);
}
