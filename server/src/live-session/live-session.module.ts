import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveSession } from './entities/live-session.entity';
import { ParticipantSession } from './entities/participant-session.entity';
import { LiveSessionService } from './services/live-session.service';
import { LivekitService } from './services/livekit.service';
import { LiveSessionController } from './live-session.controller';
import { LiveSessionGateway } from './live-session.gateway';


@Module({
    imports: [TypeOrmModule.forFeature([LiveSession, ParticipantSession])],
    controllers: [LiveSessionController],
    providers: [LiveSessionService, LivekitService, LiveSessionGateway],
})
export class LiveSessionModule { }