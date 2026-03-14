import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiveSession } from '../entities/live-session.entity';
import { ParticipantSession } from '../entities/participant-session.entity';
import { LivekitService } from './livekit.service';
import {
  ModerationAction,
  ParticipantRole,
  ParticipantStatus,
} from '../live-session.types';
import { Classroom } from 'src/classrooms/entities/classroom.entity';
import { Role } from 'src/users/entities/role.enum';
import { LiveSessionGateway } from '../live-session.gateway';

@Injectable()
export class LiveSessionService {
  constructor(
    @InjectRepository(LiveSession)
    private liveSessionRepo: Repository<LiveSession>,
    @InjectRepository(ParticipantSession)
    private participantRepo: Repository<ParticipantSession>,
    @InjectRepository(Classroom)
    private classroomRepo: Repository<Classroom>,
    private livekitService: LivekitService,
    private liveSessionGateway: LiveSessionGateway,
  ) {}

  private ensureTeacherRole(role?: Role) {
    if (role !== Role.Teacher) {
      throw new ForbiddenException('Only teacher can perform this action');
    }
  }

  private async getSessionById(sessionId: string) {
    const session = await this.liveSessionRepo.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException('Live session not found');
    }
    return session;
  }

  private async getParticipant(sessionId: string, userId: string) {
    return this.participantRepo.findOne({
      where: {
        liveSessionId: sessionId,
        userId,
      },
    });
  }

  private async assertTeacherOwnsClassroom(classroomId: string, teacherId: string) {
    const classroom = await this.classroomRepo.findOne({
      where: { id: classroomId },
    });

    if (!classroom) {
      throw new NotFoundException('Classroom not found');
    }

    if (classroom.teacherId !== teacherId) {
      throw new ForbiddenException('Only classroom teacher can start live class');
    }
  }

  private async assertTeacherOwnsSession(sessionId: string, teacherId: string) {
    const session = await this.getSessionById(sessionId);

    if (session.teacherId !== teacherId) {
      throw new ForbiddenException('Only session teacher can perform this action');
    }

    return session;
  }

  async getActiveSession(classroomId: string) {
    return this.liveSessionRepo.findOne({
      where: {
        classroomId,
        isActive: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getTeacherActiveSession(teacherId: string) {
    return this.liveSessionRepo.findOne({
      where: {
        teacherId,
        isActive: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async startSession(
    classroomId: string,
    teacherId: string,
    userRole: Role,
    options?: {
      allowStudentMicrophone?: boolean;
      allowStudentCamera?: boolean;
      allowStudentScreenShare?: boolean;
    },
  ) {
    this.ensureTeacherRole(userRole);
    const teacherActiveSession = await this.getTeacherActiveSession(teacherId);
    if (teacherActiveSession) {
      return teacherActiveSession;
    }

    await this.assertTeacherOwnsClassroom(classroomId, teacherId);

    const roomName = `${classroomId}-${Date.now()}`;
    const session = this.liveSessionRepo.create({
      classroomId,
      teacherId,
      roomName,
      isActive: true,
      allowStudentMicrophone: options?.allowStudentMicrophone ?? false,
      allowStudentCamera: options?.allowStudentCamera ?? false,
      allowStudentScreenShare: options?.allowStudentScreenShare ?? false,
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
    const session = await this.getSessionById(liveSessionId);
    if (!session.isActive) {
      throw new ForbiddenException('Session is not active');
    }

    const existing = await this.getParticipant(liveSessionId, userId);
    if (existing) {
      if (existing.status !== ParticipantStatus.APPROVED) {
        existing.status = ParticipantStatus.WAITING;
      }
      existing.leftAt = null;
      const saved = await this.participantRepo.save(existing);
      await this.emitWaitingList(liveSessionId);
      return saved;
    }

    const participant = this.participantRepo.create({
      liveSessionId,
      userId,
      role: ParticipantRole.STUDENT,
      status: ParticipantStatus.WAITING,
    });
    const savedParticipant = await this.participantRepo.save(participant);
    await this.emitWaitingList(liveSessionId);

    return savedParticipant;
  }

  async approveParticipant(sessionId: string, teacherId: string, userId: string) {
    await this.assertTeacherOwnsSession(sessionId, teacherId);
    const participant = await this.getParticipant(sessionId, userId);
    if (!participant) {
      throw new NotFoundException('Participant request not found');
    }

    participant.status = ParticipantStatus.APPROVED;
    participant.isConnected = false;
    participant.leftAt = null;
    const saved = await this.participantRepo.save(participant);

    this.liveSessionGateway.notifyParticipantApproved(sessionId, userId);
    await this.emitWaitingList(sessionId);
    return saved;
  }

  async getSessionToken(sessionId: string, userId: string, userRole: Role, userName?: string) {
    const session = await this.getSessionById(sessionId);
    if (!session.isActive) {
      throw new ForbiddenException('Session has ended');
    }

    let participant = await this.getParticipant(sessionId, userId);

    if (session.teacherId === userId && userRole === Role.Teacher) {
      if (!participant) {
        participant = await this.participantRepo.save({
          liveSessionId: sessionId,
          userId,
          role: ParticipantRole.TEACHER,
          status: ParticipantStatus.APPROVED,
        });
      } else {
        participant.role = ParticipantRole.TEACHER;
        participant.status = ParticipantStatus.APPROVED;
      }
    }

    if (!participant || participant.status !== ParticipantStatus.APPROVED) {
      throw new ForbiddenException('You are not approved to join this live class');
    }

    participant.isConnected = true;
    participant.leftAt = null;
    await this.participantRepo.save(participant);

    const token = await this.livekitService.generateToken(
      userId,
      userName,
      session.roomName,
      participant.role,
      {
        allowStudentMicrophone: session.allowStudentMicrophone,
        allowStudentCamera: session.allowStudentCamera,
        allowStudentScreenShare: session.allowStudentScreenShare,
      },
    );
    const studentControlsEnabled = participant.role === ParticipantRole.STUDENT;

    return {
      sessionId,
      roomName: session.roomName,
      token,
      livekitUrl: process.env.LIVEKIT_URL,
      role: participant.role,
      allowStudentMicrophone: studentControlsEnabled || session.allowStudentMicrophone,
      allowStudentCamera: studentControlsEnabled || session.allowStudentCamera,
      allowStudentScreenShare: studentControlsEnabled || session.allowStudentScreenShare,
    };
  }

  async raiseHand(sessionId: string, userId: string) {
    const participant = await this.getParticipant(sessionId, userId);
    if (!participant || participant.status !== ParticipantStatus.APPROVED) {
      throw new ForbiddenException('Participant is not approved');
    }

    participant.handRaised = true;
    const saved = await this.participantRepo.save(participant);
    this.liveSessionGateway.notifyHandRaised(sessionId, userId);
    return saved;
  }

  async lowerHand(
    sessionId: string,
    actorId: string,
    targetUserId: string,
    actorRole: Role,
  ) {
    if (actorId !== targetUserId) {
      this.ensureTeacherRole(actorRole);
      await this.assertTeacherOwnsSession(sessionId, actorId);
    }

    const participant = await this.getParticipant(sessionId, targetUserId);
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    participant.handRaised = false;
    return this.participantRepo.save(participant);
  }

  async endSession(sessionId: string, teacherId: string, userRole: Role) {
    this.ensureTeacherRole(userRole);
    const session = await this.assertTeacherOwnsSession(sessionId, teacherId);
    session.isActive = false;
    session.endedAt = new Date();
    const saved = await this.liveSessionRepo.save(session);
    this.liveSessionGateway.notifySessionEnded(sessionId);
    return saved;
  }

  async removeParticipant(sessionId: string, teacherId: string, userId: string) {
    await this.assertTeacherOwnsSession(sessionId, teacherId);
    const participant = await this.getParticipant(sessionId, userId);
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    participant.status = ParticipantStatus.REJECTED;
    participant.isConnected = false;
    participant.leftAt = new Date();
    const saved = await this.participantRepo.save(participant);
    this.liveSessionGateway.notifyParticipantRemoved(sessionId, userId);
    await this.emitWaitingList(sessionId);
    return saved;
  }

  async moderateParticipant(
    sessionId: string,
    teacherId: string,
    userId: string,
    action: ModerationAction,
  ) {
    await this.assertTeacherOwnsSession(sessionId, teacherId);

    const participant = await this.getParticipant(sessionId, userId);
    if (!participant || participant.status !== ParticipantStatus.APPROVED) {
      throw new NotFoundException('Participant not found in approved list');
    }

    this.liveSessionGateway.notifyModerationCommand(sessionId, userId, action);
    return { success: true };
  }

  async getWaitingParticipants(sessionId: string, teacherId: string, userRole: Role) {
    this.ensureTeacherRole(userRole);
    await this.assertTeacherOwnsSession(sessionId, teacherId);

    return this.participantRepo.find({
      where: {
        liveSessionId: sessionId,
        status: ParticipantStatus.WAITING,
      },
      order: { joinedAt: 'ASC' },
    });
  }

  async getRaisedHands(sessionId: string, teacherId: string, userRole: Role) {
    this.ensureTeacherRole(userRole);
    await this.assertTeacherOwnsSession(sessionId, teacherId);

    return this.participantRepo.find({
      where: {
        liveSessionId: sessionId,
        status: ParticipantStatus.APPROVED,
        handRaised: true,
      },
      order: { joinedAt: 'ASC' },
    });
  }

  private async emitWaitingList(sessionId: string) {
    const waiting = await this.participantRepo.find({
      where: {
        liveSessionId: sessionId,
        status: ParticipantStatus.WAITING,
      },
      order: { joinedAt: 'ASC' },
    });
    this.liveSessionGateway.notifyWaitingRoomUpdated(
      sessionId,
      waiting.map((participant) => ({ userId: participant.userId })),
    );
  }
}
