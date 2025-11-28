import { IClassroomAnnouncement, ICreateComment } from "@/types/classroomAnnouncement";
import api from "./api";
import { IClassroomUser } from "@/types/user";
import { IAssignment } from "@/types/assignment";

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
            isNote?: boolean;
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
            if (payload.isNote !== undefined) formData.append("isNote", String(payload.isNote));

            // append files
            files.forEach((file) => {
                formData.append("files", file);
            });

            console.log("--- FormData Contents ---");
            for (const pair of formData.entries()) {
                console.log(`${pair[0]}:`, pair[1]);
            }
            console.log("-------------------------");
            

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

    async getOneAnnouncement(announcementId: string): Promise<{ data: IClassroomAnnouncement; error?: string }>{
        try {
            const response = await api.get(`/classrooms/announcement/one/${announcementId}`)
            return {data: response.data};
        } catch (error) {
            console.error('Error Fetching Announcements:', error);
            return {
                data: {} as IClassroomAnnouncement,
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

    async addCommentToAnnouncement(data: ICreateComment): Promise<{ data?: IClassroomAnnouncement; error?: string }> { 
        try {
            // By default, axios will send the data as 'application/json', which is what the backend expects.
            const response = await api.post(`/classrooms/announcements/comment`, data);
            return { data: response.data };
        } catch (error: any) {
            console.error('Error adding comment:', error);
            return {
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

    async getAllClassroomUsers(classroomId: string): Promise<{ data: IClassroomUser[]; error?: string }> {
        try {
            const response = await api.get(`/classrooms/${classroomId}/users`);
            return { data: response.data };
        } catch (error: any) {
            console.error('Error Fetching Announcements:', error);
            return {
                data: [],
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

    async deleteAnnouncement(announcementId: string) : Promise<{ data?: string ; error?: string }>{
        try {
            const response = await api.delete(`classrooms/anouncement/${announcementId}`);
            return { data: response.data.message };
        } catch (error) {
            console.error('Error Deleting Announcements:', error);
            return {
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

    /**
   * Gets all submitted assignments for a specific announcement. The result varies based on the user's role.
   * @param announcementid The ID of the announcement.
   */
    async getAllSubmitedAssignments(announcementid: string): Promise<{ data?: IAssignment[]; error?: string }> {
        try {
            const response = await api.get(`/assignments/allsubmited/${announcementid}`);
            return { data: response.data };
        } catch (error: any) {
            console.error("Error fetching submitted assignments:", error);
            return { error: error?.response?.data?.message || error.message || "Something went wrong" };
        }
    }

    /**
     * Gets pending assignments for a student in a specific classroom.
     * @param classroomid The ID of the classroom.
     */
    async getPendingForClassroomForStudent(classroomid: string): Promise<{ data?: IClassroomAnnouncement[]; error?: string }> {
        try {
            const response = await api.get(`/assignments/pending/student/${classroomid}`);
            return { data: response.data };
        } catch (error: any) {
            console.error("Error fetching pending assignments:", error);
            return { error: error?.response?.data?.message || error.message || "Something went wrong" };
        }
    }

    /**
     * Gets submitted assignments for a student in a specific classroom.
     * @param classroomid The ID of the classroom.
     */
    async getSubmittedForClassroomForStudent(classroomid: string): Promise<{ data?: IAssignment[]; error?: string }> {
        try {
            const response = await api.get(`/assignments/submitted/student/${classroomid}`);
            return { data: response.data };
        } catch (error: any) {
            console.error("Error fetching submitted assignments:", error);
            return { error: error?.response?.data?.message || error.message || "Something went wrong" };
        }
    }

    /**
     * Gets all pending assignments for a student.
     */
    async getAllPendingAssignmentsForStudent(): Promise<{ data?: IClassroomAnnouncement[]; error?: string }> {
        try {
            const response = await api.get(`/assignments/all/pending/student`);
            console.log("response.data:", response.data);
            
            return { data: response.data };
        } catch (error: any) {
            console.error("Error fetching all pending assignments:", error);
            return { error: error?.response?.data?.message || error.message || "Something went wrong" };
        }
    }

    /**
     * Gets missed assignments for a student in a specific classroom.
     * @param classroomid The ID of the classroom.
     */
    async getMissedForClassroomForStudent(classroomid: string): Promise<{ data?: IClassroomAnnouncement[]; error?: string }> {
        try {
            const response = await api.get(`/assignments/missed/student/${classroomid}`);
            return { data: response.data };
        } catch (error: any) {
            console.error("Error fetching missed assignments:", error);
            return { error: error?.response?.data?.message || error.message || "Something went wrong" };
        }
    }

    /**
     * Gets all missed assignments for a student.
     */
    async getAllMissedForStudent(): Promise<{ data?: IClassroomAnnouncement[]; error?: string }> {
        try {
            const response = await api.get(`/assignments/all/missed/student`);
            if (response.data && response.data.length > 0) {
                console.log("response.data:", response.data);
            } else {
                console.log("No missed assignments found. The API returned an empty array.");
            }
            return { data: response.data };
        } catch (error: any) {
            console.error("Error fetching all missed assignments:", error);
            return { error: error?.response?.data?.message || error.message || "Something went wrong" };
        }
    }

    /**
     * Gets a list of pending students for a specific announcement.
     * @param announcementid The ID of the announcement.
     */
    async getPendingStudentsForAnnouncement(announcementid: string): Promise<{ data?: IClassroomUser[]; error?: string }> {
        try {
            const response = await api.get(`/assignments/all/studentlist/pending/${announcementid}`);
            return { data: response.data };
        } catch (error: any) {
            console.error("Error fetching pending students:", error);
            return { error: error?.response?.data?.message || error.message || "Something went wrong" };
        }
    }
}
export default new ClassroomAnnouncementService();
