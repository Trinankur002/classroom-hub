import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Classroom } from 'src/classrooms/entities/classroom.entity';
import { StudentClassroom } from 'src/classrooms/entities/student-classroom.entity';
import { ClassroomAnnouncement } from 'src/classrooms/entities/classroom-announcement.entity';
import { Assignment } from 'src/assignments/assignment.entity';
import { Doubts } from 'src/doubts/doubts.entity';
import { Event } from 'src/event/event.entity';
import { LiveSession } from 'src/live-session/entities/live-session.entity';
import { ParticipantSession } from 'src/live-session/entities/participant-session.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Classroom,
      StudentClassroom,
      ClassroomAnnouncement,
      Assignment,
      Doubts,
      Event,
      LiveSession,
      ParticipantSession,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
