// src/notification/notifications.gateway.ts
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import * as cookie from 'cookie';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({ namespace: '/notifications', cors: { origin: true, credentials: true } })
@Injectable()
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private readonly logger = new Logger(NotificationsGateway.name);

    constructor(private readonly jwtService: JwtService) { }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth?.token ?? extractTokenFromCookie(client.handshake.headers.cookie);
            if (!token) {
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token);
            const userId = payload?.sub ?? payload?.userId ?? payload?.id;
            if (!userId) {
                client.disconnect();
                return;
            }

            client.data.userId = userId;
            client.join(this.userRoom(userId));
            this.logger.log(`Socket connected for user ${userId}`);
        } catch (err) {
            this.logger.warn('Socket auth failed', err);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        // optional: cleanup
    }

    userRoom(userId: string) {
        return `user:${userId}`;
    }

    emitToUser(userId: string, payload: any) {
        try {
            this.server.to(this.userRoom(userId)).emit('notification', payload);
        } catch (err) {
            this.logger.warn(`emitToUser failed for ${userId}`, err);
        }
    }
}

function extractTokenFromCookie(cookieHeader?: string): string | null {
    if (!cookieHeader) return null;
    const parsed = cookie.parse(cookieHeader);
    return parsed['jwt'] || parsed['token'] || null;
}
