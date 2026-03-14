import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Classroom } from './entities/classroom.entity';
import { StudentClassroom } from './entities/student-classroom.entity';
import { ClassroomsService } from './classrooms.service';
import { ClassroomsController } from './classrooms.controller';
import { ClassroomAnnouncement } from './entities/classroom-announcement.entity';
import { FileModule } from '../fileServices/file.module';
import { UsersModule } from 'src/users/users.module';
import { AssignmentModule } from 'src/assignments/assignment.module';
import { EventsModule } from 'src/event/event.module';
import { ChatModule } from 'src/chat/chat.module';
import { Assignment } from 'src/assignments/assignment.entity';
import { Doubts } from 'src/doubts/doubts.entity';
import { LiveSession } from 'src/live-session/entities/live-session.entity';
import { ChatRoom } from 'src/chat/entities/chat-room.entity';
import { ChatParticipant } from 'src/chat/entities/chat-participant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Classroom,
      StudentClassroom,
      ClassroomAnnouncement,
      Assignment,
      Doubts,
      LiveSession,
      ChatRoom,
      ChatParticipant,
    ]),
    FileModule,
    UsersModule,
    AssignmentModule,
    forwardRef(() => ChatModule),
    forwardRef(() => EventsModule), // OK
  ],
  providers: [ClassroomsService],
  controllers: [ClassroomsController],
  exports: [ClassroomsService],
})
export class ClassroomsModule { }
