import {
    Controller,
    Post,
    Param,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';

import { LiveSessionService } from './services/live-session.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('live-sessions')
@UseGuards(JwtAuthGuard)
export class LiveSessionController {
    constructor(private readonly liveService: LiveSessionService) { }

    @Post(':classroomId/start')
    async startSession(
        @Request() req,
        @Param('classroomId') classroomId: string,
    ) {
        const teacherId = req.user.id ;

        const session = await this.liveService.startSession(
            classroomId,
            teacherId,
        );

        const tokenData = await this.liveService.getTeacherToken(
            session.id,
            teacherId,
        );

        return {
            sessionId: session.id,
            ...tokenData,
        };
    }

    @Post(':sessionId/request-join')
    requestJoin(@Param('sessionId') sessionId: string) {
        return this.liveService.requestJoin(sessionId, 'student-id');
    }
}