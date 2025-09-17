import { UseGuards, Controller } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { EventService } from "./event.service";

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('events')
export class EventsController {
    constructor(private readonly assignmentsService: EventService) { }
}