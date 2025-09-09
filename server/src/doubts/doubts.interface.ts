import { IClassroomUser } from "src/classrooms/classrooms.interface";
import { IClassroomFile } from "src/fileServices/file.interface";

export interface IDoubtClearMessages {
    file?: IClassroomFile;
    message: string;
    time: Date;
    sender: IClassroomUser;
}