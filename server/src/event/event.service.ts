// event.service.ts
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { EventType, ICreateEventParams } from "./event.interface";
import { Event } from "./event.entity";
import { ClassroomsService } from "src/classrooms/classrooms.service";
import { User } from "src/users/entities/user.entity";
import { emitNotificationEvent, NotificationEvents } from "src/notification/notification.events";

@Injectable()
export class EventService {
    constructor(
        @InjectRepository(Event)
        private readonly eventRepo: Repository<Event>,
        @Inject(forwardRef(() => ClassroomsService))
        private readonly classroomService: ClassroomsService,
    ) { }

    async createEvent(params: ICreateEventParams): Promise<Event> {
        const event = this.eventRepo.create(params);
        const savedEvent = await this.eventRepo.save(event);

        this.emitNotificationEvent(params);
        return savedEvent;
    }

    private emitNotificationEvent(params: ICreateEventParams) {
        switch (params.type) {
            case EventType.ANNOUNCEMENT_POSTED:
                if (params.classroomId && params.announcementId) {
                    emitNotificationEvent(NotificationEvents.ANNOUNCEMENT_CREATED, {
                        actorId: params.actorId,
                        classroomId: params.classroomId,
                        announcementId: params.announcementId,
                    });
                }
                return;
            case EventType.ASSIGNMENT_CREATED:
                if (params.classroomId && params.announcementId) {
                    emitNotificationEvent(NotificationEvents.ASSIGNMENT_CREATED, {
                        actorId: params.actorId,
                        classroomId: params.classroomId,
                        announcementId: params.announcementId,
                    });
                }
                return;
            case EventType.ASSIGNMENT_SUBMITTED:
                if (params.classroomId && params.announcementId) {
                    emitNotificationEvent(NotificationEvents.ASSIGNMENT_SUBMITTED, {
                        actorId: params.actorId,
                        classroomId: params.classroomId,
                        announcementId: params.announcementId,
                    });
                }
                return;
            case EventType.ASSIGNMENT_GRADED:
                if (params.assignmentId) {
                    emitNotificationEvent(NotificationEvents.ASSIGNMENT_GRADED, {
                        actorId: params.actorId,
                        assignmentSubmissionId: params.assignmentId,
                        classroomId: params.classroomId,
                        targetUserId: params.targetUserId,
                    });
                }
                return;
            case EventType.DOUBT_ANSWERED:
                if (params.metadata?.doubtId) {
                    emitNotificationEvent(NotificationEvents.DOUBT_REPLIED, {
                        actorId: params.actorId,
                        classroomId: params.classroomId,
                        doubtId: params.metadata.doubtId,
                        targetUserId: params.targetUserId,
                    });
                }
                return;
            case EventType.STUDENT_JOINED:
                if (params.classroomId) {
                    emitNotificationEvent(NotificationEvents.CLASSROOM_STUDENT_JOINED, {
                        actorId: params.actorId,
                        classroomId: params.classroomId,
                        studentId: params.targetUserId,
                    });
                }
                return;
            case EventType.STUDENT_REMOVED:
                if (params.classroomId && params.targetUserId) {
                    emitNotificationEvent(NotificationEvents.CLASSROOM_STUDENT_REMOVED, {
                        actorId: params.actorId,
                        classroomId: params.classroomId,
                        targetUserId: params.targetUserId,
                    });
                }
                return;
            default:
                return;
        }
    }

    async getClassroomEvents(classroomId: string, limit = 10, offset = 0) {
        return this.eventRepo.find({
            where: { classroomId },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
    }

    async getUserEvents(userId: string, limit = 10, offset = 0) {
        return this.eventRepo.find({
            where: [{ actorId: userId }, { targetUserId: userId }],
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
    }

    async getEventsByType(type: EventType, classroomId?: string) {
        return this.eventRepo.find({
            where: { type, ...(classroomId ? { classroomId } : {}) },
            order: { createdAt: 'DESC' },
        });
    }

    async getEventsCustomize(params: Partial<ICreateEventParams>, limit: number = 10): Promise<Event[]> {
        return this.eventRepo.find({
            where: params,
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    async getNewAssignmentEvents(user: User, limit: number = 10): Promise<Event[]> {
        const classes = await this.classroomService.findAllForUser(user)

        let classIds = classes.map(c => c.id)
        return await this.eventRepo.find({
            where: { classroomId: In(classIds), type: EventType.ASSIGNMENT_CREATED },
            order: { createdAt: 'DESC' },
            take: limit,
        })
    }

    async getNewDoubtsEventsForTeacher(user: User, limit: number = 5): Promise<Event[]> {
        const classes = await this.classroomService.findAllForUser(user)
        let classIds = classes.map(c => c.id)

        return await this.eventRepo.find({
            where: { classroomId: In(classIds), type: EventType.NEW_DOUBT },
            order: { createdAt: 'DESC' },
            take: limit,
        })
    }

    async deleteEventsForAnnouncement(announcementId: string): Promise<void> {
        await this.eventRepo.delete({ announcementId });
    }

    async deleteEventsForClassroom(classroomId: string): Promise<void> {
        await this.eventRepo.delete({ classroomId });
    }
}
