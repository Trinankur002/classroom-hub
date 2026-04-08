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
        const canPublishSources = role === ParticipantRole.TEACHER
            ? [TrackSource.MICROPHONE, TrackSource.CAMERA, TrackSource.SCREEN_SHARE]
            : [
                  ...(options?.allowStudentMicrophone ? [TrackSource.MICROPHONE] : []),
                  ...(options?.allowStudentCamera ? [TrackSource.CAMERA] : []),
                  ...(options?.allowStudentScreenShare ? [TrackSource.SCREEN_SHARE] : []),
              ];
        const canPublish = canPublishSources.length > 0;

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
