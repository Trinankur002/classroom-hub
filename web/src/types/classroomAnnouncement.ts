import { IClassroomFile } from "./fileInterface";
import { User } from "./user";

export interface IClassroomAnnouncement {
    id: string;
    name: string;
    description: string;
    classroomId: string;
    teacherId: string;
    teacher: User;
    files: IClassroomFile[];
    isAssignment: boolean;
    dueDate: string | null;
    updatedAt: string,
}