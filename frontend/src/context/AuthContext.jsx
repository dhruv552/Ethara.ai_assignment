import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { api, formatApiErrorDetail } from "@/api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // null = checking, false = unauthenticated, object = user
    const [user, setUser] = useState(null);

    const refresh = useCallback(async () => {
        const token = localStorage.getItem("ttm_token");
        if (!token) {
            setUser(false);
            return;
        }
        try {
            const { data } = await api.get("/auth/me");
            setUser(data);
        } catch {
            localStorage.removeItem("ttm_token");
            setUser(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const login = useCallback(async (email, password) => {
        try {
            const { data } = await api.post("/auth/login", { email, password });
            localStorage.setItem("ttm_token", data.token);
            setUser(data.user);
            return { ok: true };
        } catch (e) {
            return {
                ok: false,
                error: formatApiErrorDetail(e.response?.data?.detail) || e.message,
            };
        }
    }, []);

    const signup = useCallback(async (payload) => {
        try {
            const { data } = await api.post("/auth/signup", payload);
            localStorage.setItem("ttm_token", data.token);
            setUser(data.user);
            return { ok: true };
        } catch (e) {
            return {
                ok: false,
                error: formatApiErrorDetail(e.response?.data?.detail) || e.message,
            };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post("/auth/logout");
        } catch {
            /* ignore */
        }
        localStorage.removeItem("ttm_token");
        setUser(false);
    }, []);

    const value = useMemo(
        () => ({ user, login, signup, logout, refresh }),
        [user, login, signup, logout, refresh],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
