import { ModerationAction } from '../live-session.types';
import { IsIn, IsUUID } from 'class-validator';

export class ModerateParticipantDto {
  @IsUUID()
  userId: string;

  @IsIn(['mute', 'disable-camera', 'allow-microphone'])
  action: ModerationAction;
}
