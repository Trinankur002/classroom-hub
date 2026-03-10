import { IsOptional, IsUUID } from 'class-validator';

export class ApproveParticipantDto {
    @IsOptional()
    @IsUUID()
    sessionId: string;

    @IsUUID()
    userId: string;
}
