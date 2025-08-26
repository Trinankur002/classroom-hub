import { IClassroomAnnouncement } from "@/types/classroomAnnouncement";
import api from "./api";

class ClassroomAnnouncementService {
    async getAll(classroomId: string): Promise<{ data: IClassroomAnnouncement[]; error?: string }> {
        try {            
            const response = await api.get(`/classrooms/announcements/${classroomId}`);
            return { data: response.data };
        } catch (error) {
            console.error('Error Fetching Announcements:', error);
            return {
                data: [],
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

    async createAnnouncementWithFiles(
        payload: {
            name: string;
            description?: string;
            classroomId: string;
            isAssignment?: boolean;
            dueDate?: string; // or Date, but stringify for form
        },
        files: File[]
    ): Promise<{ data?: IClassroomAnnouncement; error?: string }> {
        try {
            const formData = new FormData();

            // append fields
            formData.append("name", payload.name);
            if (payload.description) formData.append("description", payload.description);
            formData.append("classroomId", payload.classroomId);
            if (payload.isAssignment !== undefined) formData.append("isAssignment", String(payload.isAssignment));
            if (payload.dueDate) formData.append("dueDate", new Date(payload.dueDate).toISOString());

            // append files
            files.forEach((file) => {
                formData.append("files", file);
            });

            const response = await api.post(`/classrooms/announce-files`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            return { data: response.data };
        } catch (error: any) {
            console.error("Error Creating Announcement:", error);
            return {
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }
}
export default new ClassroomAnnouncementService();

