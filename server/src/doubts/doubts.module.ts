import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClassroomsModule } from "src/classrooms/classrooms.module";
import { FileModule } from "src/fileServices/file.module";
import { UsersModule } from "src/users/users.module";
import { DoubtsController } from "./doubts.controller";
import { Doubts } from "./doubts.entity";
import { DoubtsService } from "./doubts.service";
import { EventsModule } from "src/event/event.module";


@Module({
    imports: [
        TypeOrmModule.forFeature([Doubts]),
        ClassroomsModule,
        UsersModule,
        FileModule,
        EventsModule
    ],
    controllers: [DoubtsController],
    providers: [DoubtsService],
    exports: [DoubtsService],
})

export class DoubtsModule {}
