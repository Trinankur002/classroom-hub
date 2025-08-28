// src/services/api.ts
import axios from "axios";

const api = axios.create({
    // Change the baseURL to a relative path
    baseURL: "/api",
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