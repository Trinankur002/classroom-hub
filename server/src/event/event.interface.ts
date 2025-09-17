export enum EventType {
    CLASSROOM_CREATED = 'CLASSROOM_CREATED',
    STUDENT_JOINED = 'STUDENT_JOINED',
    STUDENT_LEFT = 'STUDENT_LEFT',
    ASSIGNMENT_CREATED = 'ASSIGNMENT_CREATED',
    ASSIGNMENT_UPDATED = 'ASSIGNMENT_UPDATED',
    ASSIGNMENT_SUBMITTED = 'ASSIGNMENT_SUBMITTED',
    ASSIGNMENT_GRADED = 'ASSIGNMENT_GRADED',
    ANNOUNCEMENT_POSTED = 'ANNOUNCEMENT_POSTED',
    ANNOUNCEMENT_UPDATED = 'ANNOUNCEMENT_UPDATED',
    MENTION = 'MENTION'
    // add more as needed
}

export interface ICreateEventParams {
    type: EventType;
    actorId: string;
    classroomId?: string;
    targetUserId?: string;
    assignmentId?: string;
    announcementId?: string;
    metadata?: any;
}
