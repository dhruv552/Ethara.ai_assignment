import axios from "axios";

// ✅ Backend URL (ENV first, fallback to Railway URL)
const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL ||
    "https://etharaaiassignment-production-d95d.up.railway.app";

// ✅ API base
export const API_BASE = `${BACKEND_URL}/api`;

// ✅ Axios instance
const api = axios.create({
    baseURL: API_BASE,
});

// ✅ Attach token automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("ttm_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// ✅ Handle unauthorized errors
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err?.response?.status === 401) {
            const path = window.location.pathname;

            if (path !== "/login" && path !== "/signup") {
                localStorage.removeItem("ttm_token");
            }
        }

        return Promise.reject(err);
    }
);

// ✅ Format error nicely
export function formatApiErrorDetail(detail) {
    if (detail == null) return "Something went wrong. Please try again.";

    if (typeof detail === "string") return detail;

    if (Array.isArray(detail)) {
        return detail
            .map((e) =>
                e && typeof e.msg === "string"
                    ? e.msg
                    : JSON.stringify(e)
            )
            .filter(Boolean)
            .join(" ");
    }

    if (detail && typeof detail.msg === "string") return detail.msg;

    return String(detail);
}

// ✅ Export
export default api;
export { api };