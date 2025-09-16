import api from "./api";

class AuthService {
    async login(email: string, password: string): Promise<any> {
        try {
            const res = await api.post(`/auth/login`, { email, password });
            return res.data;
        } catch (error) {
            console.error('Error logging in', error);
            throw error;
        }
    }

    async signup(data: any): Promise<any> {
        try {
            const res = await api.post(`/auth/signup`, data);
            return res.data;
        } catch (error) {
            console.error('Error signing up', error);
            throw error;
        }
    }

    async me(): Promise<any> {
        try {
            const res = await api.get(`/auth/me`);
            return res.data;
        } catch (error) {
            console.error('Error fetching user data', error);
            throw error;
        }
    }

    async changeAvater(file: File): Promise<any> {
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await api.post(`/auth/me/avatar`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return { data: response.data };
        } catch (error) {
            console.error("Error updating avater:", error);
            return {
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }
}

export default new AuthService();