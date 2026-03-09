import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UploadedFiles,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ChatGateway } from './chat.gateway';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {

  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) { }

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
  async getMessageHistory(
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
    @Param('roomId') roomId: string,
    @Query('before') before?: string,
    @Query('beforeMessageId') beforeMessageId?: string,
    @Query('limit') limit = '30',
  ) {
    await this.chatService.assertUserIsChatParticipant(req.user.id, roomId);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const parsedLimit = Number(limit);

    return this.chatService.getChatMessagesPage(roomId, {
      before,
      beforeMessageId,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : 30,
    });
  }

  @Post('messages/:roomId')
  @UseInterceptors(FilesInterceptor('files', 10, {
    limits: { fileSize: 100 * 1024 * 1024 },
  }))
  async sendMessageWithFiles(
    @Request() req: any,
    @Param('roomId') roomId: string,
    @Body('content') content = '',
    @Body('mentionedUserId') mentionedUserId?: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    await this.chatService.assertUserIsChatParticipant(req.user.id, roomId);

    const savedMessage = await this.chatService.saveMessageWithFiles({
      roomId,
      sender: req.user,
      content,
      mentionedUserId,
      files: files || [],
    });

    if (savedMessage) {
      this.chatGateway.emitMessageToRoom(roomId, savedMessage);
    }

    return savedMessage;
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
