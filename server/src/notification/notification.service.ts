// src/notification/notification.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { ClassroomsService } from 'src/classrooms/classrooms.service';

@Injectable()
export class NotificationService {
    constructor(
        @InjectRepository(Notification)
        private readonly notifRepo: Repository<Notification>,
        private readonly classroomService: ClassroomsService, // used for classroom->studentIds
    ) { }

    async createForUsers(type: string, payload: any, userIds: string[]) {
        if (!Array.isArray(userIds) || userIds.length === 0) return [];

        const rows = userIds.map((id) =>
            this.notifRepo.create({
                recipientId: id,
                type,
                payload,
            }),
        );

        // Bulk save
        const saved = await this.notifRepo.save(rows);
        return saved;
    }

    async createForClassroom(type: string, payload: any, classroomId: string) {
        const studentIds: string[] = await this.classroomService.getStudentIds(classroomId);
        return this.createForUsers(type, payload, studentIds);
    }

    async listForUser(userId: string, limit = 20, offset = 0) {
        return this.notifRepo.find({
            where: { recipientId: userId },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
    }

    async markAsRead(notificationId: string, userId: string) {
        await this.notifRepo.update({ id: notificationId, recipientId: userId }, { isRead: true });
    }

    async markAllRead(userId: string) {
        await this.notifRepo.update({ recipientId: userId, isRead: false }, { isRead: true });
    }
}
