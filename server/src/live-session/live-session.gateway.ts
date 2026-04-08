import {
    WebSocketGateway,
    WebSocketServer,
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    SubscribeMessage,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WEBSOCKET_EVENTS } from 'src/common/websocket-events.enum';
import { LiveSessionMessage } from './entities/live-session-message.entity';

@WebSocketGateway({
    namespace: '/live-session',
    cors: {
        origin: '*',
    },
})
export class LiveSessionGateway implements OnGatewayConnection {
    @WebSocketServer()
    server: Server;

    constructor(private readonly jwtService: JwtService) {}

    async handleConnection(socket: Socket) {
        try {
            const rawToken = socket.handshake.auth?.token as string;
            const token = rawToken?.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;
            if (!token) {
                throw new UnauthorizedException('Missing auth token');
            }

            const user = this.jwtService.verify(token);
            socket.data.user = user;
        } catch {
            socket.disconnect(true);
        }
    }

    @SubscribeMessage(WEBSOCKET_EVENTS.LIVE_SESSION_JOIN)
    joinLiveSession(
        @ConnectedSocket() socket: Socket,
        @MessageBody() payload: { sessionId: string },
    ) {
        if (!payload?.sessionId) return;
        socket.join(payload.sessionId);
    }

    notifyWaitingRoomUpdated(sessionId: string, waitingParticipants: Array<{ userId: string }>) {
        this.server.to(sessionId).emit(WEBSOCKET_EVENTS.WAITING_ROOM_UPDATED, { waitingParticipants });
        this.server.to(sessionId).emit(WEBSOCKET_EVENTS.WAITING_LIST_UPDATED, { waitingParticipants });
    }

    notifyParticipantApproved(sessionId: string, userId: string) {
        const payload = { userId };
        this.server.to(sessionId).emit(WEBSOCKET_EVENTS.PARTICIPANT_APPROVED, payload);
    }

    notifyParticipantRemoved(sessionId: string, userId: string) {
        this.server.to(sessionId).emit(WEBSOCKET_EVENTS.PARTICIPANT_REMOVED, { userId });
    }

    notifyHandRaised(sessionId: string, userId: string) {
        this.server.to(sessionId).emit(WEBSOCKET_EVENTS.HAND_RAISED, { userId });
    }

    notifyModerationCommand(sessionId: string, userId: string, action: string) {
        this.server.to(sessionId).emit(WEBSOCKET_EVENTS.MODERATION_COMMAND, { userId, action });
    }

    notifySessionEnded(sessionId: string) {
        this.server.to(sessionId).emit(WEBSOCKET_EVENTS.SESSION_ENDED, { sessionId });
    }

    notifyLiveChatMessage(sessionId: string, message: LiveSessionMessage) {
        this.server.to(sessionId).emit(WEBSOCKET_EVENTS.LIVE_CHAT_MESSAGE, message);
    }
}
