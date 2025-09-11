import { IDoubt, IDoubtClearMessages } from "@/types/doubts";
import api from "./api";

class DoubtService {
    async getDoubts(
        classroomId: string,
        page?: number,
        limit?: number
    ): Promise<{ data: IDoubt[], error?: string }> {
        try {
            let url = `/doubts/classroom/${classroomId}`;

            // Construct the query string with optional parameters
            const queryParams = [];
            if (page !== undefined) {
                queryParams.push(`page=${page}`);
            }
            if (limit !== undefined) {
                queryParams.push(`limit=${limit}`);
            }

            if (queryParams.length > 0) {
                url += `?${queryParams.join('&')}`;
            }

            const response = await api.get(url);
            return { data: response.data };
        } catch (error) {
            console.error('Error Fetching Doubts:', error);
            return {
                data: [],
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

    async getDoubtMessages(doubtId: string): Promise<{ data: IDoubtClearMessages[], error?: string }> {
        try {
            const response = await api.get(`/doubts/messages/${doubtId}`);
            return response.data;
        } catch (error) {
            console.error('Error Fetching Messages for Doubt:', error);
            return {
                data: [],
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

    async createDoubtWithFiles(
        payload: {
            classroomId: string;
            doubtDescribtion?: string;
        },
        files?: File[]
    ): Promise<{ data?: IDoubt; error?: string }> {
        try {
            const formData = new FormData();

            // append fields
            if (payload.doubtDescribtion) formData.append("doubtDescribtion", payload.doubtDescribtion);
            formData.append("classroomId", payload.classroomId);

            // append files
            if (files) {
                files.forEach((file) => {
                    formData.append("files", file);
                });

            }

            const response = await api.post(`/doubts`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            return { data: response.data };
        } catch (error: any) {
            console.error("Error Creating Doubt:", error);
            return {
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

    async createDoubtMessage(
        payload: {
            doubtId: string;
            message?: string;
        },
        file?: File
    ): Promise<{ data?: IDoubt; error?: string }> {
        try {
            const formData = new FormData();

            // append fields
            if (payload.message) formData.append("message", payload.message);
            formData.append("doubtId", payload.doubtId);

            // append file
            if (file) {
                formData.append("file", file);
            }

            const response = await api.post(`/doubts/message`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            return { data: response.data };
        } catch (error: any) {
            console.error("Error Creating Message for Doubt:", error);
            return {
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }

}

export default new DoubtService();