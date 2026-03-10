import { ParticipantRole, ParticipantStatus } from './live-session.types';

export interface ActiveSessionResponse {
  sessionId: string;
  classroomId: string;
  roomName: string;
  isActive: boolean;
  allowStudentMicrophone: boolean;
  allowStudentCamera: boolean;
  allowStudentScreenShare: boolean;
}

export interface RequestJoinResponse {
  participantId: string;
  status: ParticipantStatus;
  sessionId: string;
  userId: string;
}

export interface TokenResponse {
  sessionId: string;
  roomName: string;
  token: string;
  livekitUrl?: string;
  role: ParticipantRole;
  allowStudentMicrophone: boolean;
  allowStudentCamera: boolean;
  allowStudentScreenShare: boolean;
}

export interface WaitingParticipantDto {
  userId: string;
}

export interface ModerateParticipantDto {
  userId: string;
  action: 'mute' | 'disable-camera' | 'allow-microphone';
}
