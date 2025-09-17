import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from './assignment.entity';
import { AssignmentService } from './assignment.service';
import { AssignmentsController } from './assignments.controller';
import { FileModule } from 'src/fileServices/file.module';
import { UsersModule } from 'src/users/users.module';
import { ClassroomAnnouncement } from 'src/classrooms/entities/classroom-announcement.entity';
import { User } from 'src/users/entities/user.entity';
import { EventsModule } from 'src/event/event.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Assignment, ClassroomAnnouncement, User]),
    FileModule,
    UsersModule,
    EventsModule
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentService],
  exports: [AssignmentService],
})
export class AssignmentModule {}
