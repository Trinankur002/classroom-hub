export interface IClassroomUser {
    id: string;
    name: string;
    email: string;
    role: 'Teacher' | 'Student';
    avatarUrl?: string | null;
    createdAt: Date;
}