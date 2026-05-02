import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children, requireAdmin = false }) {
    const { user } = useAuth();

    if (user === null) {
        return (
            <div
                data-testid="auth-loading"
                className="min-h-screen flex items-center justify-center font-mono-ui text-xs uppercase tracking-[0.2em]"
            >
                Loading…
            </div>
        );
    }
    if (user === false) {
        return <Navigate to="/login" replace />;
    }
    if (requireAdmin && user.role !== "admin") {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
}
