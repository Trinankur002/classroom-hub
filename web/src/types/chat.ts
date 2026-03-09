import { User } from "./user";

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
