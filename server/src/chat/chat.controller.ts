import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
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
    @Param('roomId') roomId: string,
    @Query('page') page = 1,
  ) {
    return this.chatService.getMessages(roomId, page);
  }

  @Get('rooms/:userId')
  getUserRooms(@Param('userId') userId: string) {
    return this.chatService.getUserRooms(userId);
  }
}