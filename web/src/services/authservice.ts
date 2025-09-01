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
}

export default new AuthService();