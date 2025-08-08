import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private chatMessagesRepository: Repository<ChatMessage>,
  ) {}

  async create(createMessageDto: CreateMessageDto): Promise<ChatMessage> {
    const message = this.chatMessagesRepository.create(createMessageDto);
    return this.chatMessagesRepository.save(message);
  }

  async findAllForClassroom(classroomId: string): Promise<ChatMessage[]> {
    return this.chatMessagesRepository.find({
      where: { classroomId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
  }

}
