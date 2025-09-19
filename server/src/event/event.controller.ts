import { UseGuards, Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { EventService } from "./event.service";
import { Request} from '@nestjs/common';
import { EventType } from "./event.interface";

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('events')
export class EventsController {
    constructor(private readonly eventService: EventService) { }

    @Get('new-mention')
    @ApiQuery({name: 'limit', required: false, type: Number})
    async getNewMentionEvents(@Request() req: any, @Query('limit') limit: number = 5) {
        return await this.eventService.getEventsCustomize({
            actorId: req.user.id, 
            type: EventType.MENTION
        }, limit);
    }

    @Get('new-assignment')
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getNewAssignmentEvents(@Request() req: any, @Query('limit') limit: number = 5) { 
        return await this.eventService.getNewAssignmentEvents(req.user, limit)
    }

    @Get('new-doubts')
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getNewDoubtsEventsForTeacher(@Request() req: any, @Query('limit') limit: number = 5) {
        return await this.eventService.getNewDoubtsEventsForTeacher(req.user, limit)
    }
}