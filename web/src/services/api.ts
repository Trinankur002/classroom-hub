// src/services/api.ts
import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_HOSTED_BACKEND_URL || "http://localhost:3000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to attach token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;