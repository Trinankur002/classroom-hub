import { IAssignment } from "@/types/assignment";
import api from "./api";
import { IClassroomAnnouncement } from "@/types/classroomAnnouncement";
import { User } from "@/types/user";

class AssignmentService {
    async submitAssignment(assignmentId: string, files: File[]): Promise<any> {
        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append("files", file);
            });

            const response = await api.post(`/assignments/${assignmentId}/submit`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return { data: response.data };
        } catch (error) {
            console.error("Error submitting assignment:", error);
            return {
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

    async getAssignmentsForAnnouncement(announcementId: string): Promise<{ data: IAssignment[], error?: string }>{
        try {
            const response = await api.get(`/assignments/allsubmited/${announcementId}`);
            return { data: response.data };
        } catch (error: any) {
            console.error("Error fetching assigments:", error?.response?.data || error.message);
            return {
                data: [],
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

    async getPendingForClassroomForStudent(classroomid: string): Promise<{ data?: IClassroomAnnouncement[], error?: string }>{
        try {
            const response = await api.get(`/assignments/pending/student/${classroomid}`);
            return { data: response.data };
        } catch (error: any) {
            console.error("Error fetching assigments:", error?.response?.data || error.message);
            return {
                data: [],
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

    async getSubmittedForClassroomForStudent(classroomid: string): Promise<{ data: IAssignment[], error?: string }> {
        try {
            const response = await api.get(`/assignments/submitted/student/${classroomid}`);
            return { data: response.data };
        } catch (error: any) {
            console.error("Error fetching assigments:", error?.response?.data || error.message);
            return {
                data: [],
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

    async getAllPendingAssignmentsForStudent(): Promise<{ data?: IClassroomAnnouncement[], error?: string }> {
        try {
            const response = await api.get(`/assignments/all/pending/student`);
            return { data: response.data };
        } catch (error: any) {
            console.error("Error fetching assigments:", error?.response?.data || error.message);
            return {
                data: [],
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

    async getMissedForClassroomForStudent(classroomid: string): Promise<{ data?: IClassroomAnnouncement[], error?: string }>  {
        try {
            const response = await api.get(`/assignments/missed/student/${classroomid}`);
            return { data: response.data };
        } catch (error: any) {
            console.error("Error fetching assigments:", error?.response?.data || error.message);
            return {
                data: [],
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

    async getAllMissedForStudent(): Promise<{ data?: IClassroomAnnouncement[], error?: string }> {
        try {
            const response = await api.get(`/assignments/all/missed/student`);
            return { data: response.data };
        } catch (error: any) {
            console.error("Error fetching assigments:", error?.response?.data || error.message);
            return {
                data: [],
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

    async getPendingStudentsForAnnouncement(announcementId: string): Promise<{ data?: User[], error?: string }>  {
        try {
            const response = await api.get(`/assignments/all/studentlist/pending/${announcementId}`);
            return { data: response.data };
        } catch (error: any) {
            console.error("Error fetching assigments:", error?.response?.data || error.message);
            return {
                data: [],
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }
}

export default new AssignmentService();
