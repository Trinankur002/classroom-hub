export enum Role {
    SystemUser = 'SystemUser',
    Teacher = 'Teacher',
    Student = 'Student',
}

export class User {
    id: string;
    name: string;
    email: string;
    password: string;
    role: Role;
    avatarUrl: string;
    createdAt: Date;
}