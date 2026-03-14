import { Injectable } from '@nestjs/common';
import { AccessToken, TrackSource } from 'livekit-server-sdk';
import { ParticipantRole } from '../live-session.types';

@Injectable()
export class LivekitService {
    async generateToken(
        userId: string,
        userName: string | undefined,
        roomName: string,
        role: ParticipantRole,
        options?: {
            allowStudentMicrophone?: boolean;
            allowStudentCamera?: boolean;
            allowStudentScreenShare?: boolean;
        },
    ): Promise<string> {
        const canPublishSources = [TrackSource.MICROPHONE, TrackSource.CAMERA, TrackSource.SCREEN_SHARE];
        const canPublish = role === ParticipantRole.TEACHER || role === ParticipantRole.STUDENT;

        const token = new AccessToken(
            process.env.LIVEKIT_API_KEY,
            process.env.LIVEKIT_SECRET,
            {
                identity: userId,
                name: userName || userId,
            },
        );

        token.addGrant({
            room: roomName,
            roomJoin: true,
            canPublish,
            canPublishData: canPublish,
            canPublishSources,
            canSubscribe: true,
        });

        return await token.toJwt();
    }
}
