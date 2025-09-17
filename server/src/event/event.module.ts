import { TypeOrmModule } from "@nestjs/typeorm";
import { EventsController } from "./event.controller";
import { Event } from "./event.entity";
import { EventService } from "./event.service";
import { Module } from "@nestjs/common";

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
  ],
  controllers: [EventsController],
  providers: [EventService],
    exports: [EventService],
})
export class EventsModule {}