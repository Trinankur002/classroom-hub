import { User } from "./user";

export interface IChatFile {
    id: string;
    name: string;
    url: string;
    mimetype: string;
    size: number;
    createdAt: Date | string;
}

export interface IChatRoom {
    id: string;
    type: string;
    name?: string | null;
    classroomId?: string | null;
    createdAt: Date | string;
}

export interface IChatMessage {
    id: string;
    roomId: string;
    senderId: string;
    content: string;
    mentionedUserId?: string | null;
    mentionedUser?: Pick<User, "id" | "name" | "avatarUrl"> | null;
    files?: IChatFile[];
    createdAt: Date | string;
}

export interface IChatMessagePage {
    messages: IChatMessage[];
    hasMore: boolean;
    nextCursor: string | null;
}

export interface IChatParticipant {
    id: string;
    roomId: string;
    userId: string;
    joinedAt: Date | string;
    user?: Pick<User, "id" | "name" | "avatarUrl">;
}
