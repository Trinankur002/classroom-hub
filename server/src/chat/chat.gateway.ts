import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

interface JwtPayload {
  sub: string;
  email: string;
}

interface SendMessagePayload {
  roomId: string;
  content: string;
}

@WebSocketGateway({
  cors: true,
})
export class ChatGateway implements OnGatewayConnection {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) { }

  async handleConnection(socket: Socket) {
    try {

      const token = socket.handshake.auth?.token;
      this.logger.log("TOKEN RECEIVED:");
      this.logger.log(token);
      const user = this.jwtService.verify<JwtPayload>(token);
      this.logger.log("JWT PAYLOAD:");
      this.logger.log(user);
      socket.data.user = user;
      this.logger.log(`User connected: ${user.sub}`);
    } catch (error) {

      this.logger.error(error);
      this.logger.warn(`Unauthorized socket connection`);
      socket.disconnect();
    }
  }

  private getRoomName(roomId: string): string {
    return `room_${roomId}`;
  }

  @SubscribeMessage('join_room')
  async joinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() roomId: string,
  ) {

    const room = this.getRoomName(roomId);
    socket.join(room);
    this.logger.log(`User ${socket.data.user?.sub} joined ${room}`);
  }

  @SubscribeMessage('send_message')
  async sendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: SendMessagePayload,
  ) {

    const user = socket.data.user;

    if (!user) {
      socket.disconnect();
      return;
    }

    const savedMessage = await this.chatService.saveMessage({
      roomId: payload.roomId,
      senderId: user.sub ,
      content: payload.content,
    });

    this.server
      .to(this.getRoomName(payload.roomId))
      .emit('receive_message', savedMessage);
  }
}