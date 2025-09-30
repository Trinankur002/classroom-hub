// src/events/events.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './event.entity';
import { EventService } from './event.service';
import { ClassroomsModule } from 'src/classrooms/classrooms.module';
import { NotificationModule } from 'src/notification/notification.module';
import { EventsController } from './event.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
    forwardRef(() => ClassroomsModule),
    forwardRef(() => NotificationModule), // Apply forwardRef here
  ],
  controllers: [EventsController],
  providers: [EventService],
  exports: [EventService],
})
export class EventsModule { }
