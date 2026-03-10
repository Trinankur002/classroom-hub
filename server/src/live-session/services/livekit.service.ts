import { Injectable } from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';
import { ParticipantRole } from '../live-session.types';

@Injectable()
export class LivekitService {

    async generateToken(
        userId: string,
        roomName: string,
        role: ParticipantRole,
    ): Promise<string> {

        const token = new AccessToken(
            process.env.LIVEKIT_API_KEY,
            process.env.LIVEKIT_SECRET,
            {
                identity: userId,
                name: userId,
            },
        );

        token.addGrant({
            room: roomName,
            roomJoin: true,
            canPublish: role === ParticipantRole.TEACHER,
            canSubscribe: true,
        });

        return await token.toJwt();
    }
}