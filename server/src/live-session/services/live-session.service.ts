import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiveSession } from '../entities/live-session.entity';
import {
    ParticipantSession,
} from '../entities/participant-session.entity';
import { LivekitService } from './livekit.service';
import { ParticipantRole, ParticipantStatus } from '../live-session.types';

@Injectable()
export class LiveSessionService {
    constructor(
        @InjectRepository(LiveSession)
        private liveSessionRepo: Repository<LiveSession>,
        @InjectRepository(ParticipantSession)
        private participantRepo: Repository<ParticipantSession>,
        private livekitService: LivekitService,
    ) { }

    async startSession(classroomId: string, teacherId: string) {
        const roomName = `${classroomId}-${Date.now()}`;

        const session = this.liveSessionRepo.create({
            classroomId,
            teacherId,
            roomName,
            isActive: true,
        });

        const savedSession = await this.liveSessionRepo.save(session);

        await this.participantRepo.save({
            liveSessionId: savedSession.id,
            userId: teacherId,
            role: ParticipantRole.TEACHER,
            status: ParticipantStatus.APPROVED,
            isConnected: false,
        });

        return savedSession;
    }

    async requestJoin(liveSessionId: string, userId: string) {
        const participant = this.participantRepo.create({
            liveSessionId,
            userId,
            role: ParticipantRole.STUDENT,
            status: ParticipantStatus.WAITING,
        });

        return this.participantRepo.save(participant);
    }

    async getTeacherToken(sessionId: string, teacherId: string) {
        const session = await this.liveSessionRepo.findOne({
            where: { id: sessionId },
        });

        if (!session) throw new Error('Session not found');

        const token = await this.livekitService.generateToken(
            teacherId,
            session.roomName,
            ParticipantRole.TEACHER
        );

        return {
            roomName: session.roomName,
            token,
        };
    }
}
