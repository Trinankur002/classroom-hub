import axios from "axios";
import { resolveBackendBaseUrl } from "@/lib/backend-url";

const api = axios.create({
    baseURL: resolveBackendBaseUrl(),
    headers: { "Content-Type": "application/json" },
    withCredentials: true, // optional
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default api;
