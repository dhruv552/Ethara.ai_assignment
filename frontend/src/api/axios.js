import axios from "axios";

// ❗ NO fallback (force correct env usage)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Debug log (remove later)
console.log("BACKEND URL:", BACKEND_URL);

// ✅ API base
export const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true
});

// ✅ Attach token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("ttm_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ✅ Handle 401
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

export default api;