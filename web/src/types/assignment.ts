import { IClassroomFile } from "./fileInterface";
import { User } from "./user";

export interface IAssignment {
    id: string;
    announcementId: string;
    studentId: string;
    student?: User;
    files?: IClassroomFile[];
    createdAt: Date;
    updatedAt: Date;
}