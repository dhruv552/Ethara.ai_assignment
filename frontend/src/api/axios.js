import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true
});

// ✅ export BOTH ways
export { api };

export default api;

// ✅ add this back (required by your code)
export function formatApiErrorDetail(detail) {
    if (!detail) return "Something went wrong";

    if (typeof detail === "string") return detail;

    if (Array.isArray(detail)) {
        return detail.map(e => e.msg || JSON.stringify(e)).join(" ");
    }

    if (detail.msg) return detail.msg;

    return JSON.stringify(detail);
}

console.log("ENV BACKEND:", import.meta.env.VITE_BACKEND_URL);