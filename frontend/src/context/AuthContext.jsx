import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { api, formatApiErrorDetail } from "@/api/axios";

console.log("LOGIN RESPONSE:", data);

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // null = loading, false = not logged in, object = user
    const [user, setUser] = useState(null);

    // ✅ Refresh user (safe version)
    const refresh = useCallback(async () => {
        const token = localStorage.getItem("ttm_token");

        if (!token) {
            setUser(false);
            return;
        }

        try {
            const { data } = await api.get("/auth/me");
            setUser(data);
        } catch (error) {
            console.error(
                "[AuthContext] Failed to refresh user:",
                error?.response?.data?.detail || error.message
            );

            // 🔥 only remove token if invalid
            if (error.response?.status === 401) {
                localStorage.removeItem("ttm_token");
                setUser(false);
            }
        }
    }, []);

    // ✅ Run on app load
    useEffect(() => {
        refresh();
    }, [refresh]);

    // ✅ LOGIN (fixed)
    const login = useCallback(async (email, password) => {
        try {
            const { data } = await api.post("/auth/login", { email, password });

            // 🔥 Save token FIRST
            localStorage.setItem("ttm_token", data.token);

            // 🔥 Then fetch user using token
            await refresh();

            return { ok: true };
        } catch (e) {
            return {
                ok: false,
                error:
                    formatApiErrorDetail(e.response?.data?.detail) ||
                    e.message,
            };
        }
    }, [refresh]);

    // ✅ SIGNUP (fixed)
    const signup = useCallback(async (payload) => {
        try {
            const { data } = await api.post("/auth/signup", payload);

            localStorage.setItem("ttm_token", data.token);

            await refresh();

            return { ok: true };
        } catch (e) {
            return {
                ok: false,
                error:
                    formatApiErrorDetail(e.response?.data?.detail) ||
                    e.message,
            };
        }
    }, [refresh]);

    // ✅ LOGOUT
    const logout = useCallback(async () => {
        try {
            await api.post("/auth/logout");
        } catch {
            // ignore errors
        }

        localStorage.removeItem("ttm_token");
        setUser(false);
    }, []);

    const value = useMemo(
        () => ({
            user,
            login,
            signup,
            logout,
            refresh,
        }),
        [user, login, signup, logout, refresh]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// ✅ Hook
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return ctx;
}