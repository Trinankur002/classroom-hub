import { IChatMessagePage, IChatParticipant, IChatRoom } from "@/types/chat";
import api from "./api";

class ChatService {
    async getClassroomChatroom(classroomId: string): Promise<{ data?: IChatRoom; error?: string; statusCode?: number }> {
        try {
            const response = await api.get(`/chat/classroom/${classroomId}`);
            return { data: response.data as IChatRoom };
        } catch (error: any) {
            console.error("Error fetching classroom chatroom:", error);
            return {
                error: error?.response?.data?.message || error.message || "Something went wrong",
                statusCode: error?.response?.status,
            };
        }
    }

    async getChatMessages(
        chatRoomId: string,
        params?: { before?: string; beforeMessageId?: string; limit?: number }
    ): Promise<{ data?: IChatMessagePage; error?: string; statusCode?: number }> {
        try {
            const queryParams = new URLSearchParams();
            if (params?.before) queryParams.append("before", params.before);
            if (params?.beforeMessageId) queryParams.append("beforeMessageId", params.beforeMessageId);
            if (params?.limit !== undefined) queryParams.append("limit", String(params.limit));
            queryParams.append("_ts", String(Date.now()));

            const query = queryParams.toString();
            const url = `/chat/messages/${chatRoomId}/history${query ? `?${query}` : ""}`;
            const response = await api.get(url);

            return { data: response.data as IChatMessagePage };
        } catch (error: any) {
            console.error("Error fetching chat messages:", error);
            return {
                error: error?.response?.data?.message || error.message || "Something went wrong",
                statusCode: error?.response?.status,
            };
        }
    }

    async getChatParticipants(chatRoomId: string): Promise<{ data: IChatParticipant[]; error?: string; statusCode?: number }> {
        try {
            const response = await api.get(`/chat/participants/${chatRoomId}`);
            return { data: response.data as IChatParticipant[] };
        } catch (error: any) {
            console.error("Error fetching chat participants:", error);
            return {
                data: [],
                error: error?.response?.data?.message || error.message || "Something went wrong",
                statusCode: error?.response?.status,
            };
        }
    }

    async sendMessageWithFiles(
        chatRoomId: string,
        payload: { content?: string; mentionedUserId?: string },
        files: File[]
    ): Promise<{ data?: any; error?: string; statusCode?: number }> {
        try {
            const formData = new FormData();
            if (payload.content !== undefined) formData.append("content", payload.content);
            if (payload.mentionedUserId) formData.append("mentionedUserId", payload.mentionedUserId);
            files.forEach((file) => formData.append("files", file));

            const response = await api.post(`/chat/messages/${chatRoomId}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            return { data: response.data };
        } catch (error: any) {
            console.error("Error sending chat message:", error);
            return {
                error: error?.response?.data?.message || error.message || "Something went wrong",
                statusCode: error?.response?.status,
            };
        }
    }
}

export default new ChatService();
