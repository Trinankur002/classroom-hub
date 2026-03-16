import { forwardRef, Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Assignment } from 'src/assignments/assignment.entity';
import { ClassroomAnnouncement } from 'src/classrooms/entities/classroom-announcement.entity';
import { Classroom } from 'src/classrooms/entities/classroom.entity';
import { ClassroomsService } from 'src/classrooms/classrooms.service';
import { Doubts } from 'src/doubts/doubts.entity';
import { In, Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { NotificationPreference } from './notification-preference.entity';
import { NotificationRepository } from './notification.repository';
import {
  CreateNotificationInput,
  NotificationEventPayload,
  NotificationListQuery,
  NotificationPreferenceKey,
  NotificationPreferencesPayload,
  PushSubscriptionDto,
} from './notification.types';
import { NotificationGateway } from './notification.gateway';
import { NotificationEvents, notificationEventBus } from './notification.events';
import { PushSubscriptionEntity } from './push-subscription.entity';
import { NotificationPushService } from './notification-push.service';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class NotificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationService.name);
  private readonly handlers: Array<{
    event: string;
    listener: (payload: NotificationEventPayload) => Promise<void>;
  }> = [];

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationGateway: NotificationGateway,
    private readonly notificationPushService: NotificationPushService,
    @Inject(forwardRef(() => ClassroomsService))
    private readonly classroomService: ClassroomsService,
    @InjectRepository(Classroom)
    private readonly classroomRepo: Repository<Classroom>,
    @InjectRepository(ClassroomAnnouncement)
    private readonly announcementRepo: Repository<ClassroomAnnouncement>,
    @InjectRepository(Assignment)
    private readonly assignmentRepo: Repository<Assignment>,
    @InjectRepository(Doubts)
    private readonly doubtsRepo: Repository<Doubts>,
    @InjectRepository(NotificationPreference)
    private readonly notificationPreferenceRepo: Repository<NotificationPreference>,
    @InjectRepository(PushSubscriptionEntity)
    private readonly pushSubscriptionRepo: Repository<PushSubscriptionEntity>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  onModuleInit() {
    this.register(NotificationEvents.ANNOUNCEMENT_CREATED, this.handleAnnouncementCreated);
    this.register(NotificationEvents.ASSIGNMENT_CREATED, this.handleAssignmentCreated);
    this.register(NotificationEvents.ASSIGNMENT_SUBMITTED, this.handleAssignmentSubmitted);
    this.register(NotificationEvents.ASSIGNMENT_GRADED, this.handleAssignmentGraded);
    this.register(NotificationEvents.LIVECLASS_STARTED, this.handleLiveClassStarted);
    this.register(NotificationEvents.DOUBT_REPLIED, this.handleDoubtReplied);
    this.register(NotificationEvents.CLASSROOM_STUDENT_JOINED, this.handleStudentJoinedClassroom);
    this.register(NotificationEvents.CLASSROOM_STUDENT_REMOVED, this.handleStudentRemovedClassroom);
  }

  onModuleDestroy() {
    for (const handler of this.handlers) {
      notificationEventBus.off(handler.event, handler.listener);
    }
    this.handlers.length = 0;
  }

  async createNotification(input: CreateNotificationInput): Promise<Notification | null> {
    const category = input.category ?? 'messages';
    const preferences = await this.getOrCreatePreferences(input.userId);
    if (!this.isCategoryEnabled(preferences, category)) {
      return null;
    }

    const created = await this.notificationRepository.createOne(input);
    this.notificationGateway.emitToUser(created.userId, created);
    await this.sendWebPushIfEnabled(created, preferences);
    return created;
  }

  async createNotificationsForUsers(
    userIds: string[],
    payload: Omit<CreateNotificationInput, 'userId'>,
  ): Promise<Notification[]> {
    const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
    if (!uniqueUserIds.length) {
      return [];
    }

    const category = payload.category ?? 'messages';
    const filteredUserIds = await this.filterRecipientsByCategory(uniqueUserIds, category);
    if (!filteredUserIds.length) {
      return [];
    }

    const created = await this.notificationRepository.createMany(filteredUserIds, payload);
    created.forEach((notification) => {
      this.notificationGateway.emitToUser(notification.userId, notification);
    });

    const preferencesByUser = await this.getPreferencesMap(filteredUserIds);
    for (const notification of created) {
      const pref = preferencesByUser.get(notification.userId);
      await this.sendWebPushIfEnabled(notification, pref);
    }

    return created;
  }

  getNotificationsForUser(userId: string, query?: NotificationListQuery) {
    return this.notificationRepository.listByUser(userId, query?.page ?? 1, query?.limit ?? 20);
  }

  getUnreadCount(userId: string) {
    return this.notificationRepository.countUnread(userId);
  }

  markAsRead(notificationId: string, userId: string) {
    return this.notificationRepository.markAsRead(notificationId, userId);
  }

  markAllAsRead(userId: string) {
    return this.notificationRepository.markAllAsRead(userId);
  }

  deleteNotification(notificationId: string, userId: string) {
    return this.notificationRepository.deleteByIdAndUser(notificationId, userId);
  }

  async getPreferences(userId: string) {
    return this.getOrCreatePreferences(userId);
  }

  async updatePreferences(
    userId: string,
    payload: Partial<NotificationPreferencesPayload>,
  ) {
    const current = await this.getOrCreatePreferences(userId);
    Object.assign(current, payload);
    return this.notificationPreferenceRepo.save(current);
  }

  getPushPublicKey() {
    return this.notificationPushService.getPublicKey();
  }

  async getPushStatus(userId: string) {
    const pref = await this.getOrCreatePreferences(userId);
    const activeSubscriptionCount = await this.pushSubscriptionRepo.count({
      where: {
        userId,
        isActive: true,
      },
    });

    return {
      pushEnabled: pref.push,
      hasSubscription: activeSubscriptionCount > 0,
      vapidPublicKey: this.getPushPublicKey(),
    };
  }

  async subscribePush(userId: string, payload: PushSubscriptionDto) {
    const existing = await this.pushSubscriptionRepo.findOne({
      where: {
        userId,
        endpoint: payload.endpoint,
      },
    });

    if (existing) {
      existing.p256dh = payload.keys.p256dh;
      existing.authKey = payload.keys.auth;
      existing.userAgent = payload.userAgent ?? null;
      existing.isActive = true;
      await this.pushSubscriptionRepo.save(existing);
      return { success: true };
    }

    const entity = this.pushSubscriptionRepo.create({
      userId,
      endpoint: payload.endpoint,
      p256dh: payload.keys.p256dh,
      authKey: payload.keys.auth,
      userAgent: payload.userAgent ?? null,
      isActive: true,
    });
    await this.pushSubscriptionRepo.save(entity);
    return { success: true };
  }

  async unsubscribePush(userId: string, endpoint?: string) {
    if (endpoint) {
      await this.pushSubscriptionRepo.update(
        { userId, endpoint },
        { isActive: false },
      );
      return { success: true };
    }

    await this.pushSubscriptionRepo.update(
      { userId },
      { isActive: false },
    );
    return { success: true };
  }

  private register(
    event: string,
    handler: (payload: NotificationEventPayload) => Promise<void>,
  ) {
    const listener = async (payload: NotificationEventPayload) => {
      try {
        await handler.call(this, payload);
      } catch (error) {
        this.logger.error(
          `Failed handling notification event "${event}": ${String(error)}`,
        );
      }
    };

    notificationEventBus.on(event, listener);
    this.handlers.push({ event, listener });
  }

  private async handleAnnouncementCreated(payload: NotificationEventPayload) {
    if (!payload.classroomId || !payload.announcementId) return;
    const [studentIds, announcement, classroom, actor] = await Promise.all([
      this.classroomService.getStudentIds(payload.classroomId),
      this.announcementRepo.findOne({
        where: { id: payload.announcementId },
        select: ['id', 'name', 'classroomId'],
      }),
      this.classroomRepo.findOne({
        where: { id: payload.classroomId },
        select: ['id', 'name'],
      }),
      payload.actorId
        ? this.userRepo.findOne({
            where: { id: payload.actorId },
            select: ['id', 'name'],
          })
        : null,
    ]);
    await this.createNotificationsForUsers(studentIds, {
      title: 'New announcement posted',
      message: `${actor?.name || 'Teacher'} posted "${announcement?.name || 'an announcement'}" in ${classroom?.name || 'your classroom'}.`,
      type: NotificationEvents.ANNOUNCEMENT_CREATED,
      category: 'messages',
      entityType: 'announcement',
      entityId: payload.classroomId,
      data: {
        route: `/classrooms/${payload.classroomId}`,
        classroomId: payload.classroomId,
        classroomName: classroom?.name,
        actorId: actor?.id,
        actorName: actor?.name,
        entityId: announcement?.id,
        entityType: 'announcement',
        entityTitle: announcement?.name,
      },
    });
  }

  private async handleAssignmentCreated(payload: NotificationEventPayload) {
    if (!payload.classroomId || !payload.announcementId) return;
    const [studentIds, announcement, classroom, actor] = await Promise.all([
      this.classroomService.getStudentIds(payload.classroomId),
      this.announcementRepo.findOne({
        where: { id: payload.announcementId },
        select: ['id', 'name', 'dueDate'],
      }),
      this.classroomRepo.findOne({
        where: { id: payload.classroomId },
        select: ['id', 'name'],
      }),
      payload.actorId
        ? this.userRepo.findOne({
            where: { id: payload.actorId },
            select: ['id', 'name'],
          })
        : null,
    ]);
    await this.createNotificationsForUsers(studentIds, {
      title: 'New assignment created',
      message: `${actor?.name || 'Teacher'} assigned "${announcement?.name || 'a new assignment'}" in ${classroom?.name || 'your classroom'}.`,
      type: NotificationEvents.ASSIGNMENT_CREATED,
      category: 'assignments',
      entityType: 'assignment',
      entityId: payload.classroomId,
      data: {
        route: `/classrooms/${payload.classroomId}`,
        classroomId: payload.classroomId,
        classroomName: classroom?.name,
        actorId: actor?.id,
        actorName: actor?.name,
        entityId: announcement?.id,
        entityType: 'assignment',
        entityTitle: announcement?.name,
        context: {
          dueDate: announcement?.dueDate ?? null,
        },
      },
    });
  }

  private async handleAssignmentSubmitted(payload: NotificationEventPayload) {
    if (!payload.announcementId) return;
    const announcement = await this.announcementRepo.findOne({
      where: { id: payload.announcementId },
      select: ['id', 'teacherId', 'classroomId', 'name'],
    });
    if (!announcement) return;

    const [classroom, actor] = await Promise.all([
      this.classroomRepo.findOne({
        where: { id: announcement.classroomId },
        select: ['id', 'name'],
      }),
      payload.actorId
        ? this.userRepo.findOne({
            where: { id: payload.actorId },
            select: ['id', 'name'],
          })
        : null,
    ]);

    await this.createNotification({
      userId: announcement.teacherId,
      title: 'Assignment submitted',
      message: `${actor?.name || 'A student'} submitted "${announcement.name}" in ${classroom?.name || 'your classroom'}.`,
      type: NotificationEvents.ASSIGNMENT_SUBMITTED,
      category: 'assignments',
      entityType: 'assignment_submission',
      entityId: announcement.classroomId,
      data: {
        route: `/classrooms/${announcement.classroomId}`,
        classroomId: announcement.classroomId,
        classroomName: classroom?.name,
        actorId: actor?.id,
        actorName: actor?.name,
        entityId: announcement.id,
        entityType: 'assignment_submission',
        entityTitle: announcement.name,
      },
    });
  }

  private async handleAssignmentGraded(payload: NotificationEventPayload) {
    if (!payload.assignmentSubmissionId) return;
    const submission = await this.assignmentRepo.findOne({
      where: { id: payload.assignmentSubmissionId },
      select: ['id', 'studentId', 'announcementId', 'grade', 'feedback'],
    });
    if (!submission) return;

    const [announcement, actor] = await Promise.all([
      this.announcementRepo.findOne({
      where: { id: submission.announcementId },
      select: ['id', 'classroomId', 'name'],
    }),
      payload.actorId
        ? this.userRepo.findOne({
            where: { id: payload.actorId },
            select: ['id', 'name'],
          })
        : null,
    ]);

    await this.createNotification({
      userId: submission.studentId,
      title: 'Assignment graded',
      message: `Your assignment "${announcement?.name || ''}" was graded${submission.grade !== null && submission.grade !== undefined ? `: ${submission.grade}` : ''}.`,
      type: NotificationEvents.ASSIGNMENT_GRADED,
      category: 'grades',
      entityType: 'assignment_graded',
      entityId: announcement?.classroomId ?? null,
      data: {
        route: announcement?.classroomId ? `/classrooms/${announcement.classroomId}` : '/dashboard',
        classroomId: announcement?.classroomId,
        actorId: actor?.id,
        actorName: actor?.name,
        entityId: submission.id,
        entityType: 'assignment_graded',
        entityTitle: announcement?.name,
        context: {
          grade: submission.grade ?? null,
          feedback: submission.feedback ?? null,
        },
      },
    });
  }

  private async handleLiveClassStarted(payload: NotificationEventPayload) {
    if (!payload.classroomId || !payload.liveSessionId) return;
    const [studentIds, classroom, actor] = await Promise.all([
      this.classroomService.getStudentIds(payload.classroomId),
      this.classroomRepo.findOne({
        where: { id: payload.classroomId },
        select: ['id', 'name'],
      }),
      payload.actorId
        ? this.userRepo.findOne({
            where: { id: payload.actorId },
            select: ['id', 'name'],
          })
        : null,
    ]);
    await this.createNotificationsForUsers(studentIds, {
      title: 'Live class started',
      message: `${actor?.name || 'Your teacher'} started a live class in ${classroom?.name || 'your classroom'}.`,
      type: NotificationEvents.LIVECLASS_STARTED,
      category: 'messages',
      entityType: 'live_class',
      entityId: payload.classroomId,
      data: {
        route: `/classrooms/${payload.classroomId}/live`,
        classroomId: payload.classroomId,
        classroomName: classroom?.name,
        actorId: actor?.id,
        actorName: actor?.name,
        entityId: payload.liveSessionId,
        entityType: 'live_class',
      },
    });
  }

  private async handleDoubtReplied(payload: NotificationEventPayload) {
    if (!payload.doubtId) return;
    const doubt = await this.doubtsRepo.findOne({
      where: { id: payload.doubtId },
      select: ['id', 'studentId', 'classroomId', 'doubtDescribtion'],
    });
    if (!doubt) return;

    const [classroom, actor] = await Promise.all([
      doubt.classroomId
        ? this.classroomRepo.findOne({
            where: { id: doubt.classroomId },
            select: ['id', 'name'],
          })
        : null,
      payload.actorId
        ? this.userRepo.findOne({
            where: { id: payload.actorId },
            select: ['id', 'name'],
          })
        : null,
    ]);

    await this.createNotification({
      userId: doubt.studentId,
      title: 'Doubt replied',
      message: `${actor?.name || 'Teacher'} replied to your doubt in ${classroom?.name || 'classroom'}.`,
      type: NotificationEvents.DOUBT_REPLIED,
      category: 'messages',
      entityType: 'doubt',
      entityId: doubt.classroomId ?? null,
      data: {
        route: doubt.classroomId ? `/classrooms/${doubt.classroomId}` : '/dashboard',
        classroomId: doubt.classroomId,
        classroomName: classroom?.name,
        actorId: actor?.id,
        actorName: actor?.name,
        entityId: doubt.id,
        entityType: 'doubt',
        entityTitle: doubt.doubtDescribtion?.slice(0, 50),
      },
    });
  }

  private async handleStudentJoinedClassroom(payload: NotificationEventPayload) {
    if (!payload.classroomId) return;
    const classroom = await this.classroomRepo.findOne({
      where: { id: payload.classroomId },
      select: ['id', 'teacherId', 'name'],
    });
    if (!classroom) return;

    const actor = payload.actorId
      ? await this.userRepo.findOne({
          where: { id: payload.actorId },
          select: ['id', 'name'],
        })
      : null;

    await this.createNotification({
      userId: classroom.teacherId,
      title: 'Student joined classroom',
      message: `${actor?.name || 'A student'} joined ${classroom.name}.`,
      type: NotificationEvents.CLASSROOM_STUDENT_JOINED,
      category: 'messages',
      entityType: 'classroom',
      entityId: classroom.id,
      data: {
        route: `/classrooms/${classroom.id}`,
        classroomId: classroom.id,
        classroomName: classroom.name,
        actorId: actor?.id,
        actorName: actor?.name,
        entityId: classroom.id,
        entityType: 'classroom',
      },
    });
  }

  private async handleStudentRemovedClassroom(payload: NotificationEventPayload) {
    if (!payload.targetUserId || !payload.classroomId) return;

    const classroom = await this.classroomRepo.findOne({
      where: { id: payload.classroomId },
      select: ['id', 'name'],
    });
    await this.createNotification({
      userId: payload.targetUserId,
      title: 'Removed from classroom',
      message: `You were removed from ${classroom?.name || 'a classroom'}.`,
      type: NotificationEvents.CLASSROOM_STUDENT_REMOVED,
      category: 'messages',
      entityType: 'classroom',
      entityId: payload.classroomId,
      data: {
        route: '/classrooms',
        classroomId: payload.classroomId,
        classroomName: classroom?.name,
        actorId: payload.actorId,
        entityId: payload.classroomId,
        entityType: 'classroom',
      },
    });
  }

  private async getOrCreatePreferences(userId: string) {
    let preferences = await this.notificationPreferenceRepo.findOne({
      where: { userId },
    });
    if (!preferences) {
      const user = await this.userRepo.findOne({
        where: { id: userId },
        select: ['id', 'role'],
      });
      const isTeacher = user?.role?.toString().toLowerCase() === 'teacher';

      preferences = this.notificationPreferenceRepo.create({
        userId,
        email: true,
        push: true,
        messages: true,
        assignments: true,
        grades: !isTeacher,
      });
      preferences = await this.notificationPreferenceRepo.save(preferences);
    }
    return preferences;
  }

  private isCategoryEnabled(
    preferences: NotificationPreference,
    category: NotificationPreferenceKey,
  ) {
    return Boolean(preferences[category]);
  }

  private async filterRecipientsByCategory(
    userIds: string[],
    category: NotificationPreferenceKey,
  ) {
    const prefs = await this.notificationPreferenceRepo.find({
      where: { userId: In(userIds) },
    });
    const map = new Map(prefs.map((pref) => [pref.userId, pref]));
    return userIds.filter((userId) => {
      const pref = map.get(userId);
      if (!pref) {
        return true;
      }
      return this.isCategoryEnabled(pref, category);
    });
  }

  private async getPreferencesMap(userIds: string[]) {
    const prefs = await this.notificationPreferenceRepo.find({
      where: { userId: In(userIds) },
    });
    return new Map(prefs.map((pref) => [pref.userId, pref]));
  }

  private async sendWebPushIfEnabled(
    notification: Notification,
    preferences?: NotificationPreference,
  ) {
    const pref = preferences || (await this.getOrCreatePreferences(notification.userId));
    if (!pref.push) {
      return;
    }

    const subscriptions = await this.pushSubscriptionRepo.find({
      where: {
        userId: notification.userId,
        isActive: true,
      },
    });
    if (!subscriptions.length) {
      return;
    }
    await this.notificationPushService.sendToSubscriptions(subscriptions, notification);
  }
}
