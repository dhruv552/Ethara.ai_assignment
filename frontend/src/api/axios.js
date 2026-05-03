import axios from "axios";

const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL ||
    "https://etharaaiassignment-production-1531.up.railway.app";

export const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
    baseURL: API_BASE,
});

// ✅ Attach token properly
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("ttm_token");

    console.log("INTERCEPTOR TOKEN:", token); // debug

    if (token) {
        config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`, // 🔥 IMPORTANT
        };
    }

    return config;
});
export function formatApiErrorDetail(detail) {
    if (!detail) return "Something went wrong";

    if (typeof detail === "string") return detail;

    if (Array.isArray(detail)) {
        return detail.map((e) => e.msg || JSON.stringify(e)).join(" ");
    }

    if (detail.msg) return detail.msg;

    return JSON.stringify(detail);
}

export default api;
export { api };