import { FileEntity } from "src/fileServices/file.entity";
import { User } from "src/users/entities/user.entity";

export type IPartialTeacher = Pick<User, 'id' | 'name'>;

export interface IClassroom {
    id: string;
    name: string;
    description: string;
    joinCode: string;
    teacherId: string;
    teacher: IPartialTeacher;
    studentCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IClassroomAnnouncement {
    id: string;
    name: string;
    description: string;
    teacherId: string;
    teacher: IPartialTeacher;
    fileIds?: [string];
    files: FileEntity[];
    comments: IClassroomComment[];
    isAssignment: boolean;
    dueDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IClassroomComment {
    content: string;
    time: Date;
    sender: User;
    mentionedUser?: User;
}