import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { Repository } from 'typeorm';
import { CreateNotificationInput, NotificationPriority } from './notification.types';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  async createOne(input: CreateNotificationInput): Promise<Notification> {
    const entity = this.repo.create({
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      entityId: input.entityId ?? null,
      entityType: input.entityType ?? null,
      data: input.data ?? null,
      priority: input.priority ?? NotificationPriority.NORMAL,
    });

    return this.repo.save(entity);
  }

  async createMany(
    userIds: string[],
    payload: Omit<CreateNotificationInput, 'userId'>,
  ): Promise<Notification[]> {
    if (!userIds.length) {
      return [];
    }

    const values = userIds.map((userId) =>
      this.repo.create({
      userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      entityId: payload.entityId ?? null,
      entityType: payload.entityType ?? null,
      data: payload.data ?? null,
      priority: payload.priority ?? NotificationPriority.NORMAL,
      }),
    );

    return this.repo.save(values);
  }

  async listByUser(userId: string, page = 1, limit = 20) {
    const take = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * take;

    const [items, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return {
      items,
      total,
      page: safePage,
      limit: take,
    };
  }

  countUnread(userId: string) {
    return this.repo.count({
      where: { userId, isRead: false },
    });
  }

  markAsRead(notificationId: string, userId: string) {
    return this.repo.update({ id: notificationId, userId }, { isRead: true });
  }

  markAllAsRead(userId: string) {
    return this.repo.update({ userId, isRead: false }, { isRead: true });
  }

  deleteByIdAndUser(notificationId: string, userId: string) {
    return this.repo.delete({ id: notificationId, userId });
  }
}
