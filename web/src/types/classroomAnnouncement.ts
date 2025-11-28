import { IClassroomFile } from "./fileInterface";
import { User } from "./user";

export interface IClassroomAnnouncement {
    id: string;
    name?: string;
    description?: string;
    classroomId?: string;
    teacherId?: string;
    teacher?: User;
    files?: IClassroomFile[];
    comments?: IClassroomComment[];
    isAssignment?: boolean;
    dueDate?: string | null;
    isNote?: boolean;
    updatedAt?: string,
}

export interface IClassroomComment {
    content: string;
    time: Date;
    sender: User;
    mentionedUser?: User;
}

export interface ICreateComment{
    announcementId: string;
    content: string;
    time: Date
    mentionedUserId ?: string;
}