import { User } from "./user";

export class Classroom {
    id: string;
    name: string;
    description: string;
    joinCode: string;
    teacherId: string;
    teacher: User;
    createdAt: Date;
}

export interface IClassroom {
    id: string;
    name: string;
    description: string;
    joinCode: string;
    teacherId: string;
    teacher: User;
    createdAt: Date;
}