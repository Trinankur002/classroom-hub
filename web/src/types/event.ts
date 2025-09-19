import { IAssignment } from "./assignment";
import { IClassroom } from "./classroom";
import { IClassroomAnnouncement } from "./classroomAnnouncement";
import { IClassroomUser } from "./user";

export interface IEvent {
    id: string;
    type: EventType;
    actorId?: string;
    actor?: IClassroomUser;
    targetUserId?: string;
    targetUser?: IClassroomUser;
    classroomId?: string;
    classroom?: IClassroom;
    assignmentId?: string;
    assignment?: IAssignment;
    announcementId?: string;
    announcement?: IClassroomAnnouncement;
    metadata?: any;
}

export enum EventType {
    CLASSROOM_CREATED = 'CLASSROOM_CREATED',
    STUDENT_JOINED = 'STUDENT_JOINED',
    STUDENT_LEFT = 'STUDENT_LEFT',
    STUDENT_REMOVED = 'STUDENT_REMOVED',
    ASSIGNMENT_CREATED = 'ASSIGNMENT_CREATED',
    ASSIGNMENT_UPDATED = 'ASSIGNMENT_UPDATED',
    ASSIGNMENT_SUBMITTED = 'ASSIGNMENT_SUBMITTED',
    ASSIGNMENT_GRADED = 'ASSIGNMENT_GRADED',
    ANNOUNCEMENT_POSTED = 'ANNOUNCEMENT_POSTED',
    ANNOUNCEMENT_UPDATED = 'ANNOUNCEMENT_UPDATED',
    MENTION = 'MENTION',
    NEW_DOUBT = 'NEW_DOUBT',
    DOUBT_ANSWERED = 'DOUBT_ANSWERED',
    // add more as needed
}