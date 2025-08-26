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
}
export default new ClassroomAnnouncementService();

