import axios from "axios";

let raw = import.meta.env.VITE_BACKEND_API_URL || "https://classroom-hub-jjd4.onrender.com";

// ensure protocol exists (default to http if missing)
if (!/^https?:\/\//i.test(raw)) {
    raw = `http://${raw}`;
}
// remove trailing slashes
const backend = raw.replace(/\/+$/, "");

// If you want to hit backend endpoints like /auth/login (no /api prefix on backend),
// set baseURL to backend. If your backend expects /api prefix, add it here:
const baseURL = backend; // or `${backend}/api` if backend expects /api/

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
