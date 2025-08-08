import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':classroomId/messages')
  findAll(@Param('classroomId') classroomId: string) {
    return this.chatService.findAllForClassroom(classroomId);
  }
}
