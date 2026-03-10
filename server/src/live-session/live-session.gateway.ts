import {
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';

import { Server } from 'socket.io';
import { WEBSOCKET_EVENTS } from 'src/common/websocket-events.enum';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class LiveSessionGateway {
    @WebSocketServer()
    server: Server;

    notifyWaitingList(sessionId: string) {
        this.server.to(sessionId).emit(WEBSOCKET_EVENTS.WAITING_LIST_UPDATED);
    }

    notifyParticipantApproved(sessionId: string, userId: string) {
        this.server.to(sessionId).emit(WEBSOCKET_EVENTS.PERTICIPENT_APPROVED, { userId });
    }
}