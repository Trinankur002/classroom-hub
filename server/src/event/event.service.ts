// event.service.ts
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { EventType, ICreateEventParams } from "./event.interface";
import { Event } from "./event.entity";
import { ClassroomsService } from "src/classrooms/classrooms.service";
import { User } from "src/users/entities/user.entity";
// import { NotificationQueueService } from "src/notification/notification-queue.service";

@Injectable()
export class EventService {
    constructor(
        @InjectRepository(Event)
        private readonly eventRepo: Repository<Event>,
        @Inject(forwardRef(() => ClassroomsService))
        private readonly classroomService: ClassroomsService,
        // Add the NotificationQueueService here
        // private readonly notificationQueueService: NotificationQueueService,
    ) { }

    async createEvent(params: ICreateEventParams): Promise<Event> {
        const event = this.eventRepo.create(params);
        const savedEvent = await this.eventRepo.save(event);

        if (params.type === EventType.ASSIGNMENT_CREATED) {
            // Check if classroomId and assignmentId exist
            if (params.classroomId && params.assignmentId) {
                const studentIds: string[] = await this.classroomService.getStudentIds(
                    params.classroomId,
                );

                // Add a job to the notification queue
                // await this.notificationQueueService.addDeliverJob({
                //     userIds: studentIds,
                //     type: params.type,
                //     payload: {
                //         assignmentId: params.assignmentId,
                //         classroomId: params.classroomId,
                //         // You can add more data to the payload as needed
                //     },
                // });
            }
        }
        return savedEvent;
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
}