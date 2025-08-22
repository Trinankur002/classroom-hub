import { IClassroom } from "@/types/classroom";
import api from "./api";

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

    async getAllClassrooms(): Promise<IClassroom[]> {
        try {
            // http://localhost:3000/api/classrooms

            const response = await api.get('/classrooms');
            return response.data;
        } catch (error) {
            console.error('Error fetching classrooms:', error);
            throw error;
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