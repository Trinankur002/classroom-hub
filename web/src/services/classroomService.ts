import { IClassroom } from "@/types/classroom";
import api from "./api";
import { AxiosResponse } from "axios";

class ClassroomService {

    async createClassroom(name: string, description: string): Promise<any> {
        try {
            const response = await api.post('/classrooms', { name, description });
            return response.data;
        } catch (error) {
            console.error('Error creating classroom:', error);
            throw error;
        }
    }

    async getAllClassrooms(): Promise<{ data: IClassroom[]; error?: string }> {
        try {
            const response: AxiosResponse<any, any> = await api.get('/classrooms');
            return { data: response.data };
        } catch (error: any) {
            console.error("Error fetching classrooms:", error?.response?.data || error.message);
            return {
                data: [],
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

    async getClassroomById(id: string): Promise<{ data: IClassroom; error?: string }> {
        try {
            const response = await api.get(`/classrooms/class/${id}`);
            return { data: response.data };
        } catch (error) {
            console.error(`Error fetching classroom with ID ${id}:`, error);
            return {
                data: {} as IClassroom,
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

    async joinClassroom(code: string): Promise<any> {
        try {
            const response = await api.post(`/classrooms/join/${code}`);
            return response.data;
        } catch (error) {
            console.error('Error joining classroom:', error);
            throw error;
        }
    }

    async removeStudentFromClassroom(studentId: string, classroomId: string): Promise<{ data?: string; error?: string }> {
        try {
            let url = `classrooms/student/${studentId}`;

            const queryParams = [];
            queryParams.push(`classroomId=${classroomId}`);
            url += `?${queryParams.join('&')}`;

            const response = await api.delete(url);
            return { data: response.data.message };
        } catch (error) {
            console.error('Error removing student from classroom:', error);
            return {
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

    async leaveClassroom(classroomId: string): Promise<{ data?: string; error?: string }> {
        try {
            const url = `classrooms/student/leave/${classroomId}`;
            const response = await api.delete(url);
            return { data: response.data.message };
        } catch (error) {
            console.error('Error leaving classroom:', error);
            return {
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

    async deleteClassroom(classroomId: string): Promise<{ data?: string; error?: string }> {
        try {
            const url = `classrooms/delete/${classroomId}`;
            const response = await api.delete(url);
            return { data: response.data.message };
        } catch (error) {
            console.error('Error deleting classroom:', error);
            return {
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

}

export default new ClassroomService()