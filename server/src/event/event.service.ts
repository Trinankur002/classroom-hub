import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventType, ICreateEventParams } from "./event.interface";
import { Event } from "./event.entity";

@Injectable()
export class EventService {
    constructor(
        @InjectRepository(Event)
        private readonly eventRepo: Repository<Event>,
    ) { }

    async createEvent(params: ICreateEventParams): Promise<Event> {
        const event = this.eventRepo.create(params);
        return this.eventRepo.save(event);
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
}
