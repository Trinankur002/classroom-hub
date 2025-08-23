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

}

export default new ClassroomService()

// async getAllClassrooms(): Promise<any[]> {
//     try {
//         const response = await api.get('/classroom');
//         return response.data;
//     } catch (error) {
//         console.error('Error fetching classrooms:', error);
//         throw error;
//     }
// }

// async getMyClassrooms(): Promise<any[]> {
//     try {
//         const response = await api.get('/classroom/my-classrooms');
//         return response.data;
//     } catch (error) {
//         console.error('Error fetching my classrooms:', error);
//         throw error;
//     }
// }

// async getClassroomById(id: string): Promise<any> {
//     try {
//         const response = await api.get(`/classroom/${id}`);
//         return response.data;
//     } catch (error) {
//         console.error(`Error fetching classroom with ID ${id}:`, error);
//         throw error;
//     }
// }

// async updateClassroom(id: string, name: string, description: string): Promise<any> {
//     try {
//         const response = await api.put(`/classroom/${id}`, { name, description });
//         return response.data;
//     } catch (error) {
//         console.error(`Error updating classroom with ID ${id}:`, error);
//         throw error;
//     }
// }

// async deleteClassroom(id: string): Promise<void> {
//     try {
//         await api.delete(`/classroom/${id}`);
//     } catch (error) {
//         console.error(`Error deleting classroom with ID ${id}:`, error);
//         throw error;
//     }
// }

// async joinClassroom(code: string): Promise<any> {
//     try {
//         const response = await api.post('/classroom/join', { code });
//         return response.data;
//     } catch (error) {
//         console.error('Error joining classroom:', error);
//         throw error;
//     }
// }