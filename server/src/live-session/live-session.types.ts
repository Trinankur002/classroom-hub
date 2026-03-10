
export enum ParticipantRole {
    TEACHER = 'teacher',
    STUDENT = 'student',
}

export enum ParticipantStatus {
    WAITING = 'waiting',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

export type ModerationAction = 'mute' | 'disable-camera' | 'allow-microphone';
