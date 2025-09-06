export enum Role {
    SystemUser = 'SystemUser',
    Teacher = 'Teacher',
    Student = 'Student',
}

export class User {
    id: string;
    name: string;
    email: string;
    password?: string;
    role: Role;
    avatarUrl: string;
    createdAt: Date;
}

export interface IClassroomUser {
    id: string;
    name: string;
    email: string;
    role: 'Teacher' | 'Student';
    avatarUrl?: string | null;
    createdAt: Date;
}