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