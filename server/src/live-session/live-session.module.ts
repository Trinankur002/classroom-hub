import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveSession } from './entities/live-session.entity';
import { ParticipantSession } from './entities/participant-session.entity';
import { LiveSessionMessage } from './entities/live-session-message.entity';
import { LiveSessionService } from './services/live-session.service';
import { LivekitService } from './services/livekit.service';
import { LiveSessionController } from './live-session.controller';
import { LiveSessionGateway } from './live-session.gateway';
import { Classroom } from 'src/classrooms/entities/classroom.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';


@Module({
    imports: [
        TypeOrmModule.forFeature([LiveSession, ParticipantSession, LiveSessionMessage, Classroom]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
            }),
        }),
    ],
    controllers: [LiveSessionController],
    providers: [LiveSessionService, LivekitService, LiveSessionGateway],
})
export class LiveSessionModule { }
