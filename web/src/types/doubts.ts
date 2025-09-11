import { Classroom } from "./classroom";
import { IClassroomFile } from "./fileInterface";
import { IClassroomUser, User } from "./user";

export interface IDoubt {
    id: string;
    doubtDescribtion?: string;
    classroomId?: string;
    classroom?: Classroom;
    studentId?: string;
    student?: IClassroomUser;
    files?: IClassroomFile[];
    messages?: IDoubtClearMessages[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IDoubtClearMessages {
    file?: IClassroomFile;
    message: string;
    time: Date;
    sender: IClassroomUser;
}