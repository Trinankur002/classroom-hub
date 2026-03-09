import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {

  constructor(private readonly chatService: ChatService) { }

  @Post('room')
  createRoom(@Body() dto: CreateRoomDto) {
    return this.chatService.createRoom(dto);
  }

  @Get('messages/:roomId')
  getMessages(
    @Request() req: any,
    @Param('roomId') roomId: string,
    @Query('page') page = 1,
  ) {
    return this.chatService.getMessages(roomId, page);
  }

  @Get('messages/:roomId/history')
  getMessageHistory(
    @Request() req: any,
    @Param('roomId') roomId: string,
    @Query('before') before?: string,
    @Query('limit') limit = '30',
  ) {

    const parsedLimit = Number(limit);

    return this.chatService.getChatMessagesPage(roomId, {
      before,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : 30,
    });
  }

  @Get('rooms/:userId')
  getUserRooms(@Param('userId') userId: string) {
    return this.chatService.getUserRooms(userId);
  }

  @Get('classroom/:classroomId')
  async getClassroomChatRooms(@Param('classroomId') classroomId: string, @Request() req: any) {
    await this.chatService.assertUserBelongsToClassroom(req.user.id, classroomId);
    return this.chatService.getClassroomChatRooms(classroomId);
  }

  @Get('participants/:chatRoomId')
  async getChatroomParticipants(@Param('chatRoomId') chatRoomId: string, @Request() req: any,) {
    await this.chatService.assertUserBelongsToChatRoomClassroom(req.user.id, chatRoomId);
    return this.chatService.getChatroomParticipants(chatRoomId);
  }

  @Get('allmessages/:chatRoomId')
  async getChatMessages(@Param('chatRoomId') chatRoomId: string, @Request() req: any,) {
    await this.chatService.assertUserBelongsToChatRoomClassroom(req.user.id, chatRoomId);
    return this.chatService.getChatMessages(chatRoomId);
  }


}
