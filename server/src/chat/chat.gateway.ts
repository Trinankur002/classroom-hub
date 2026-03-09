import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
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
  mentionedUserId?: string;
}

@WebSocketGateway({
  cors: true,
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) { }

  async handleConnection(socket: Socket) {
    try {
      this.logger.log('Handle connection called');
      const rawToken = socket.handshake.auth?.token;
      const token = typeof rawToken === 'string' && rawToken.startsWith('Bearer ')
        ? rawToken.slice(7)
        : rawToken;
      this.logger.log("TOKEN RECEIVED:");
      this.logger.log(token);
      const user = this.jwtService.verify<JwtPayload>(token);

      this.logger.log("JWT PAYLOAD:");
      console.log('User', user);
      this.logger.log(user);
      socket.data.user = user;
      this.logger.log(`User connected: ${user.sub}`);
    } catch (error) {

      this.logger.error(error);
      this.logger.warn(`Unauthorized socket connection`);
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(`Socket disconnected: ${socket.id}`);
  }

  private getRoomName(roomId: string): string {
    return `room_${roomId}`;
  }

  emitMessageToRoom(roomId: string, message: any) {
    this.server
      .to(this.getRoomName(roomId))
      .emit('receive_message', message);
    this.server
      .to(this.getRoomName(roomId))
      .emit('new_message', message);
  }

  async notifyStudentRemovedFromClassroom(classroomId: string, studentId: string): Promise<void> {
    const room = await this.chatService.getClassroomChatRooms(classroomId);
    if (!room) return;

    const roomName = this.getRoomName(room.id);
    const sockets = await this.server.in(roomName).fetchSockets();

    for (const socket of sockets) {
      if (socket.data.user?.sub === studentId) {
        socket.emit('removed_from_classroom', {
          classroomId,
          roomId: room.id,
        });
        socket.leave(roomName);
        socket.disconnect(true);
      }
    }
  }

  @SubscribeMessage('join_room')
  async joinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() roomId: string,
  ) {
    this.logger.log(`joinRoom event received: ${roomId}`);
    const user = socket.data.user;

    if (!user) {
      socket.disconnect();
      return;
    }

    try {
      await this.chatService.assertUserIsChatParticipant(user.sub, roomId);
    } catch (error) {
      socket.emit('removed_from_classroom', { roomId });
      return;
    }

    const room = this.getRoomName(roomId);
    socket.join(room);
    this.logger.log(`User ${user.sub} joined ${room}`);
    socket.emit('room_joined', { roomId });
  }

  @SubscribeMessage('get_messages')
  async getMessages(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { roomId: string; before?: string; limit?: number },
  ) {
    const user = socket.data.user;
    if (!user) {
      socket.disconnect();
      return;
    }

    await this.chatService.assertUserIsChatParticipant(user.sub, payload.roomId);
    return this.chatService.getChatMessagesPage(payload.roomId, {
      before: payload.before,
      limit: payload.limit,
    });
  }

  @SubscribeMessage('send_message')
  async sendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    this.logger.log(`sendMessage event received: ${JSON.stringify(payload)}`);

    const user = socket.data.user;

    if (!user) {
      socket.disconnect();
      return;
    }

    try {
      await this.chatService.assertUserIsChatParticipant(user.sub, payload.roomId);
    } catch (error) {
      socket.emit('removed_from_classroom', { roomId: payload.roomId });
      return;
    }

    try {
      await this.chatService.assertMentionedUserIsParticipant(payload.roomId, payload.mentionedUserId);
    } catch (error) {
      socket.emit('chat_error', { message: 'Mentioned user is not in this room.' });
      return;
    }

    const savedMessage = await this.chatService.saveMessage({
      roomId: payload.roomId,
      senderId: user.sub,
      content: payload.content,
      mentionedUserId: payload.mentionedUserId,
    });

    this.emitMessageToRoom(payload.roomId, savedMessage);
    this.logger.log(`Emitted receive_message to room ${payload.roomId}: ${JSON.stringify(savedMessage)}`);
  }
}
