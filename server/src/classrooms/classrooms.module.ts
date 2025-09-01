import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Classroom } from './entities/classroom.entity';
import { StudentClassroom } from './entities/student-classroom.entity';
import { ClassroomsService } from './classrooms.service';
import { ClassroomsController } from './classrooms.controller'; // Import ClassroomAnnouncement
import { ClassroomAnnouncement } from './entities/classroom-announcement.entity';
import { FileModule } from '../fileServices/file.module'; // Import FileModule
import { UsersModule } from 'src/users/users.module';
import { AssignmentModule } from 'src/assignments/assignment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Classroom, StudentClassroom, ClassroomAnnouncement]), // Add ClassroomAnnouncement
    FileModule, // Import FileModule to make FileService available
    UsersModule,
    AssignmentModule,
  ],
  providers: [ClassroomsService],
  controllers: [ClassroomsController],
})
export class ClassroomsModule {}
