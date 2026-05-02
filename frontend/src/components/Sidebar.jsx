import { NavLink, useNavigate } from "react-router-dom";
import {
    SquaresFour,
    FolderSimple,
    SignOut,
    User,
    Sun,
    Moon,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const NAV = [
    {
        to: "/dashboard",
        label: "Dashboard",
        icon: SquaresFour,
        testid: "nav-dashboard",
    },
    {
        to: "/projects",
        label: "Projects",
        icon: FolderSimple,
        testid: "nav-projects",
    },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const { theme, toggle } = useTheme();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    return (
        <>
            {/* Desktop sidebar */}
            <aside
                className="hidden md:flex w-64 flex-col border-r-2 border-[var(--ttm-border-heavy)] bg-[var(--ttm-surface)]"
                data-testid="app-sidebar"
            >
                <div className="px-6 py-7 border-b-2 border-[var(--ttm-border-heavy)]">
                    <div className="font-mono-ui text-[10px] uppercase tracking-[0.25em] text-[var(--ttm-text-muted)]">
                        / TASK MANAGER
                    </div>
                    <div className="font-display font-black text-2xl mt-1 text-[var(--ttm-text)]">
                        ETHARA<span className="text-[var(--ttm-primary)]">.</span>OPS
                    </div>
                </div>

                <nav className="flex-1 py-4">
                    {NAV.map(({ to, label, icon: Icon, testid }) => (
                        <NavLink
                            key={to}
                            to={to}
                            data-testid={testid}
                            className={({ isActive }) =>
                                [
                                    "flex items-center gap-3 px-6 py-3 font-mono-ui text-[12px] uppercase tracking-[0.18em] border-l-4",
                                    isActive
                                        ? "border-[var(--ttm-primary)] bg-[var(--ttm-bg)] text-[var(--ttm-text)]"
                                        : "border-transparent text-[var(--ttm-text-muted)] hover:text-[var(--ttm-text)] hover:bg-[var(--ttm-bg)]",
                                ].join(" ")
                            }
                        >
                            <Icon size={18} weight="regular" />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="border-t-2 border-[var(--ttm-border-heavy)] p-5 space-y-3">
                    <button
                        onClick={toggle}
                        data-testid="theme-toggle"
                        className="w-full flex items-center justify-between px-3 py-2 border border-[var(--ttm-border-heavy)] bg-[var(--ttm-surface)] text-[var(--ttm-text)] font-mono-ui text-[11px] uppercase tracking-[0.2em] brutal-btn"
                    >
                        <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
                        {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                    </button>

                    <div
                        className="flex items-center gap-3"
                        data-testid="sidebar-user"
                    >
                        <div className="w-10 h-10 bg-[var(--ttm-text)] text-[var(--ttm-surface)] flex items-center justify-center">
                            <User size={20} />
                        </div>
                        <div className="min-w-0">
                            <div className="font-display font-bold text-sm truncate text-[var(--ttm-text)]">
                                {user?.name}
                            </div>
                            <div className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-[var(--ttm-text-muted)] flex items-center gap-2">
                                <span
                                    className={[
                                        "px-1.5 py-0.5 border",
                                        user?.role === "admin"
                                            ? "bg-[var(--ttm-primary)] text-white border-[var(--ttm-primary)]"
                                            : "bg-[var(--ttm-surface)] text-[var(--ttm-text)] border-[var(--ttm-border-heavy)]",
                                    ].join(" ")}
                                    data-testid="role-badge"
                                >
                                    {user?.role}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        data-testid="logout-button"
                        className="w-full flex items-center justify-between px-3 py-2 border border-[var(--ttm-border-heavy)] bg-[var(--ttm-surface)] text-[var(--ttm-text)] font-mono-ui text-[11px] uppercase tracking-[0.2em] brutal-btn"
                    >
                        Sign out
                        <SignOut size={14} />
                    </button>
                </div>
            </aside>

            {/* Mobile top bar */}
            <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-[var(--ttm-surface)] border-b-2 border-[var(--ttm-border-heavy)] px-4 py-3 flex items-center justify-between">
                <div className="font-display font-black text-lg text-[var(--ttm-text)]">
                    ETHARA<span className="text-[var(--ttm-primary)]">.</span>OPS
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggle}
                        data-testid="theme-toggle-mobile"
                        className="font-mono-ui text-[10px] uppercase tracking-[0.2em] border border-[var(--ttm-border-heavy)] px-2 py-1 text-[var(--ttm-text)]"
                    >
                        {theme === "dark" ? "Light" : "Dark"}
                    </button>
                    <button
                        onClick={handleLogout}
                        data-testid="logout-button-mobile"
                        className="font-mono-ui text-[10px] uppercase tracking-[0.2em] border border-[var(--ttm-border-heavy)] px-2 py-1 text-[var(--ttm-text)]"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </>
    );
}
