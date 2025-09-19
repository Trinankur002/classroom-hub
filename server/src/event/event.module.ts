import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventsController } from "./event.controller";
import { Event } from "./event.entity";
import { EventService } from "./event.service";
import { ClassroomsModule } from "src/classrooms/classrooms.module"; // OK if path is valid

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
    forwardRef(() => ClassroomsModule), // <- make this forwardRef
  ],
  controllers: [EventsController],
  providers: [EventService],
  exports: [EventService], // export if Classroom module needs EventService
})
export class EventsModule { }
