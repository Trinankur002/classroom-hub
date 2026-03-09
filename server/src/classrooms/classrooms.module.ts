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

@Module({
  imports: [
    TypeOrmModule.forFeature([Classroom, StudentClassroom, ClassroomAnnouncement]),
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
