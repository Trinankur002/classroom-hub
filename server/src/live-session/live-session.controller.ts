import {
  Body,
  Controller,
  Get,
  ParseUUIDPipe,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { LiveSessionService } from './services/live-session.service';
import { ApproveParticipantDto } from './dto/approve-participant.dto';
import { ModerateParticipantDto } from './dto/moderate-participant.dto';
import { StartLiveSessionDto } from './dto/start-live-session.dto';
import { CreateLiveSessionMessageDto } from './dto/create-live-session-message.dto';

@Controller('live-sessions')
@UseGuards(JwtAuthGuard)
export class LiveSessionController {
  constructor(private readonly liveService: LiveSessionService) {}

  @Get('teacher/active')
  async getTeacherActiveSession(@Request() req) {
    const session = await this.liveService.getTeacherActiveSession(req.user.id);
    if (!session) {
      return null;
    }

    return {
      sessionId: session.id,
      classroomId: session.classroomId,
      roomName: session.roomName,
      isActive: session.isActive,
      allowStudentMicrophone: session.allowStudentMicrophone,
      allowStudentCamera: session.allowStudentCamera,
      allowStudentScreenShare: session.allowStudentScreenShare,
    };
  }

  @Get('active')
  async getActiveSessionsForUser(@Request() req) {
    return this.liveService.getActiveSessionsForUser(req.user.id, req.user.role);
  }

  @Post(':classroomId/start')
  async startSession(
    @Request() req,
    @Param('classroomId', new ParseUUIDPipe()) classroomId: string,
    @Body() body: StartLiveSessionDto,
  ) {
    const teacherId = req.user.id;
    const session = await this.liveService.startSession(
      classroomId,
      teacherId,
      req.user.role,
      body,
    );
    const tokenData = await this.liveService.getSessionToken(
      session.id,
      teacherId,
      req.user.role,
      req.user.name,
    );

    return {
      ...tokenData,
      classroomId: session.classroomId,
      isActive: session.isActive,
      allowStudentMicrophone: session.allowStudentMicrophone,
      allowStudentCamera: session.allowStudentCamera,
      allowStudentScreenShare: session.allowStudentScreenShare,
    };
  }

  @Get(':classroomId/active')
  async getActiveSession(@Param('classroomId', new ParseUUIDPipe()) classroomId: string) {
    const session = await this.liveService.getActiveSession(classroomId);
    if (!session) {
      return null;
    }

    return {
      sessionId: session.id,
      classroomId: session.classroomId,
      roomName: session.roomName,
      isActive: session.isActive,
      allowStudentMicrophone: session.allowStudentMicrophone,
      allowStudentCamera: session.allowStudentCamera,
      allowStudentScreenShare: session.allowStudentScreenShare,
    };
  }

  @Post(':sessionId/request-join')
  async requestJoin(@Request() req, @Param('sessionId', new ParseUUIDPipe()) sessionId: string) {
    const participant = await this.liveService.requestJoin(sessionId, req.user.id);
    return {
      participantId: participant.id,
      status: participant.status,
      sessionId,
      userId: participant.userId,
    };
  }

  @Post(':sessionId/approve-participant')
  async approveParticipant(
    @Request() req,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Body() body: ApproveParticipantDto,
  ) {
    const participant = await this.liveService.approveParticipant(
      sessionId,
      req.user.id,
      body.userId,
    );
    return {
      participantId: participant.id,
      status: participant.status,
      userId: participant.userId,
    };
  }

  @Get(':sessionId/token')
  getSessionToken(@Request() req, @Param('sessionId', new ParseUUIDPipe()) sessionId: string) {
    return this.liveService.getSessionToken(sessionId, req.user.id, req.user.role, req.user.name);
  }

  @Post(':sessionId/raise-hand')
  raiseHand(@Request() req, @Param('sessionId', new ParseUUIDPipe()) sessionId: string) {
    return this.liveService.raiseHand(sessionId, req.user.id);
  }

  @Post(':sessionId/lower-hand')
  lowerHand(
    @Request() req,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Body() body: { userId?: string },
  ) {
    const targetUserId = body?.userId || req.user.id;
    return this.liveService.lowerHand(sessionId, req.user.id, targetUserId, req.user.role);
  }

  @Post(':sessionId/end')
  endSession(@Request() req, @Param('sessionId', new ParseUUIDPipe()) sessionId: string) {
    return this.liveService.endSession(sessionId, req.user.id, req.user.role);
  }

  @Post(':sessionId/remove-participant')
  removeParticipant(
    @Request() req,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Body() body: ApproveParticipantDto,
  ) {
    return this.liveService.removeParticipant(sessionId, req.user.id, body.userId);
  }

  @Post(':sessionId/moderate')
  moderateParticipant(
    @Request() req,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Body() body: ModerateParticipantDto,
  ) {
    return this.liveService.moderateParticipant(
      sessionId,
      req.user.id,
      body.userId,
      body.action,
    );
  }

  @Get(':sessionId/waiting-room')
  getWaitingRoom(@Request() req, @Param('sessionId', new ParseUUIDPipe()) sessionId: string) {
    return this.liveService.getWaitingParticipants(sessionId, req.user.id, req.user.role);
  }

  @Get(':sessionId/raised-hands')
  getRaisedHands(@Request() req, @Param('sessionId', new ParseUUIDPipe()) sessionId: string) {
    return this.liveService.getRaisedHands(sessionId, req.user.id, req.user.role);
  }

  @Get(':sessionId/messages')
  getRecentMessages(@Request() req, @Param('sessionId', new ParseUUIDPipe()) sessionId: string) {
    return this.liveService.getRecentMessages(sessionId, req.user.id);
  }

  @Post(':sessionId/messages')
  createMessage(
    @Request() req,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Body() body: CreateLiveSessionMessageDto,
  ) {
    return this.liveService.createMessage(sessionId, req.user.id, req.user.name, body.message);
  }
}
