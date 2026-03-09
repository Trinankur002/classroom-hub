import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';

import { ChatRoom } from './entities/chat-room.entity';
import { ChatParticipant } from './entities/chat-participant.entity';
import { Message } from './entities/message.entity';
import { FileModule } from 'src/fileServices/file.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClassroomsModule } from 'src/classrooms/classrooms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatRoom,
      ChatParticipant,
      Message,
    ]),
    forwardRef(() => ClassroomsModule),
    FileModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule { }
