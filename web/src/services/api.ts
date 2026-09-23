import axios from "axios";

let raw = import.meta.env.VITE_BACKEND_API_URL;

let baseURL = "/api";
if (raw) {
    if (!/^https?:\/\//i.test(raw)) {
        raw = `http://${raw}`;
    }
    const backend = raw.replace(/\/+$/, "");
    baseURL = backend.endsWith("/api") ? backend : `${backend}/api`;
}

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
