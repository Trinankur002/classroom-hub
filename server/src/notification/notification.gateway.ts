import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: true, credentials: true },
})
@Injectable()
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authToken = client.handshake.auth?.token as string | undefined;
      const token = authToken?.startsWith('Bearer ')
        ? authToken.slice(7)
        : authToken;

      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const userId = payload?.sub ?? payload?.userId ?? payload?.id;
      if (!userId) {
        client.disconnect(true);
        return;
      }

      client.join(userId);
      client.data.userId = userId;
    } catch (error) {
      this.logger.warn(`Notification socket auth failed: ${String(error)}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: Socket) {}

  emitToUser(userId: string, payload: any) {
    this.server.to(userId).emit('notification:new', payload);
  }
}
