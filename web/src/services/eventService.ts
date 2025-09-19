import { IEvent } from "@/types/event";
import api from "./api";

class EventService{
    async getNewMentionEvents(): Promise<{ data: IEvent[]; error?: string }> {
        try {
            const response = await api.get('/events/new-mention');
            return { data: response.data };
        } catch (error: any) {
            console.error("Error fetching event:", error?.response?.data || error.message);
            return {
                data: [],
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

    async getNewAssignmentEvents(): Promise<{ data: IEvent[]; error?: string }> {
        try {
            const response = await api.get('/events/new-assignment');
            return { data: response.data };
        } catch (error: any) {
            console.error("Error fetching event:", error?.response?.data || error.message);
            return {
                data: [],
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

    async getNewDoubtsEventsForTeacher(): Promise<{ data: IEvent[]; error?: string }> {
        try {
            const response = await api.get('/events/new-doubts');
            return { data: response.data };
        } catch (error: any) {
            console.error("Error fetching event:", error?.response?.data || error.message);
            return {
                data: [],
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }
}

export default new EventService();