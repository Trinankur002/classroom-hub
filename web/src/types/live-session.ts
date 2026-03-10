import { ConnectionState, LocalParticipant, Participant, Room, Track } from "livekit-client";

export type ParticipantRole = "teacher" | "student";
export type JoinRequestStatus = "waiting" | "approved" | "rejected";
export type ModerationAction = "mute" | "disable-camera" | "allow-microphone";

export interface LiveSession {
  sessionId: string;
  classroomId: string;
  roomName: string;
  isActive: boolean;
  allowStudentMicrophone?: boolean;
  allowStudentCamera?: boolean;
  allowStudentScreenShare?: boolean;
}

export interface TokenResponse {
  sessionId: string;
  roomName: string;
  token: string;
  livekitUrl: string;
  role: ParticipantRole;
  allowStudentMicrophone?: boolean;
  allowStudentCamera?: boolean;
  allowStudentScreenShare?: boolean;
}

export interface LiveClassPermissions {
  allowStudentMicrophone: boolean;
  allowStudentCamera: boolean;
  allowStudentScreenShare: boolean;
}

export interface LiveParticipant {
  id: string;
  userId: string;
  status: JoinRequestStatus;
  role: ParticipantRole;
  handRaised: boolean;
  isConnected: boolean;
  joinedAt: string;
}

export type LiveConnectionState = ConnectionState | "idle";

export interface LiveRoomContextValue {
  room: Room | null;
  participants: Participant[];
  localParticipant: LocalParticipant | null;
  activeSpeaker: Participant | null;
  screenShareTrack: Track | null;
  connectionState: LiveConnectionState;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}
