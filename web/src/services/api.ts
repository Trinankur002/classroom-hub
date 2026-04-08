import axios from "axios";
import { resolveBackendBaseUrl } from "@/lib/backend-url";

const baseURL = resolveBackendBaseUrl();

const api = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
    withCredentials: true, // optional
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default api;
