import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import { StatusPill } from "@/components/TaskCard";
import {
    ListChecks,
    CheckCircle,
    WarningCircle,
    Spinner,
    ArrowUpRight,
} from "@phosphor-icons/react";

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [projects, setProjects] = useState([]);
    const [myTasks, setMyTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const [s, p, m] = await Promise.all([
                    api.get("/dashboard/stats"),
                    api.get("/projects"),
                    api.get("/tasks/mine"),
                ]);
                if (!mounted) return;
                setStats(s.data);
                setProjects(p.data);
                setMyTasks(m.data);
            } catch (error) {
                console.error("[Dashboard] Failed to load data:", error?.response?.data?.detail || error.message);
                // Still set loading to false so UI doesn't hang
                if (mounted) setStats({ total_tasks: 0, completed_tasks: 0, in_progress_tasks: 0, overdue_tasks: 0, my_open_tasks: 0 });
                if (mounted) setProjects([]);
                if (mounted) setMyTasks([]);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const cards = [
        {
            label: "Total Tasks",
            value: stats?.total_tasks ?? 0,
            icon: ListChecks,
            tone: "default",
        },
        {
            label: "In Progress",
            value: stats?.in_progress_tasks ?? 0,
            icon: Spinner,
            tone: "primary",
        },
        {
            label: "Completed",
            value: stats?.completed_tasks ?? 0,
            icon: CheckCircle,
            tone: "dark",
        },
        {
            label: "Overdue",
            value: stats?.overdue_tasks ?? 0,
            icon: WarningCircle,
            tone: "danger",
        },
    ];

    return (
        <div className="px-6 sm:px-10 py-10 max-w-7xl">
            <Header
                eyebrow={`/// ${user?.role?.toUpperCase()} VIEW`}
                title={`Hi, ${user?.name?.split(" ")[0] || "there"}.`}
                subtitle="Here's the team's pulse for today."
            />

            {/* Stat grid (cardless) */}
            <section
                data-testid="stats-grid"
                className="mt-8 grid grid-cols-2 lg:grid-cols-4 border-2 border-[#09090b] bg-white grid-skeleton"
            >
                {cards.map((c) => (
                    <StatCell key={c.label} {...c} loading={loading} />
                ))}
            </section>

            {/* Two columns */}
            <section className="mt-10 grid lg:grid-cols-3 gap-px bg-[#09090b] border-2 border-[#09090b]">
                <div className="lg:col-span-2 bg-white p-6">
                    <SectionHeader
                        label="My Tasks"
                        action={
                            <Link
                                to="/projects"
                                data-testid="cta-view-projects"
                                className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-[#0033cc]"
                            >
                                View projects →
                            </Link>
                        }
                    />
                    {loading ? (
                        <SkeletonList />
                    ) : myTasks.length === 0 ? (
                        <Empty message="No tasks assigned to you yet." />
                    ) : (
                        <ul
                            data-testid="my-tasks-list"
                            className="mt-4 divide-y divide-[#d4d4d8] border-t border-[#d4d4d8]"
                        >
                            {myTasks.slice(0, 6).map((t) => (
                                <TaskRow key={t.id} task={t} />
                            ))}
                        </ul>
                    )}
                </div>

                <div className="bg-white p-6">
                    <SectionHeader
                        label="Active Projects"
                        action={
                            <span
                                data-testid="active-project-count"
                                className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-[#52525b]"
                            >
                                {projects.length} TOTAL
                            </span>
                        }
                    />
                    {loading ? (
                        <SkeletonList />
                    ) : projects.length === 0 ? (
                        <Empty message="No projects yet." />
                    ) : (
                        <ul
                            data-testid="projects-quick-list"
                            className="mt-4 space-y-px bg-[#d4d4d8] border border-[#d4d4d8]"
                        >
                            {projects.slice(0, 6).map((p) => (
                                <li key={p.id} className="bg-white">
                                    <Link
                                        to={`/projects/${p.id}`}
                                        className="flex items-center justify-between gap-3 p-3 hover:bg-[#f4f4f5]"
                                    >
                                        <div className="min-w-0">
                                            <div className="font-display font-bold truncate">
                                                {p.name}
                                            </div>
                                            <div className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-[#52525b]">
                                                {p.members.length} MEMBERS
                                            </div>
                                        </div>
                                        <ArrowUpRight size={16} />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </div>
    );
}

function Header({ eyebrow, title, subtitle }) {
    return (
        <div>
            <div className="font-mono-ui text-[10px] uppercase tracking-[0.25em] text-[#52525b]">
                {eyebrow}
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tighter mt-2">
                {title}
            </h1>
            <p className="text-[#52525b] mt-2 max-w-xl">{subtitle}</p>
        </div>
    );
}

function StatCell({ label, value, icon: Icon, tone, loading }) {
    const palette = {
        default: "bg-white text-[#09090b]",
        primary: "bg-[#0033cc] text-white",
        dark: "bg-[#09090b] text-white",
        danger: "bg-[#ff2a2a] text-white",
    }[tone];
    return (
        <div
            data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}
            className={`p-6 ${palette}`}
        >
            <div className="flex items-start justify-between">
                <div className="font-mono-ui text-[10px] uppercase tracking-[0.25em] opacity-80">
                    {label}
                </div>
                <Icon size={18} />
            </div>
            <div className="font-display font-black text-5xl mt-4">
                {loading ? "—" : value}
            </div>
        </div>
    );
}

function SectionHeader({ label, action }) {
    return (
        <div className="flex items-end justify-between">
            <h2 className="font-display font-bold text-xl">{label}</h2>
            {action}
        </div>
    );
}

function TaskRow({ task }) {
    return (
        <li className="py-3 flex items-center gap-3">
            <StatusPill status={task.status} />
            <div className="min-w-0 flex-1">
                <div className="font-display font-semibold truncate">
                    {task.title}
                </div>
                <div className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-[#52525b]">
                    DUE {task.due_date || "—"}
                </div>
            </div>
            <Link
                to={`/projects/${task.project_id}`}
                className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-[#0033cc]"
            >
                Open →
            </Link>
        </li>
    );
}

function SkeletonList() {
    return (
        <ul className="mt-4 space-y-2">
            {[0, 1, 2].map((i) => (
                <li
                    key={i}
                    className="h-12 bg-[#f4f4f5] border border-[#d4d4d8] animate-pulse"
                />
            ))}
        </ul>
    );
}

function Empty({ message }) {
    return (
        <div className="mt-6 border border-dashed border-[#d4d4d8] p-6 text-center font-mono-ui text-[11px] uppercase tracking-[0.2em] text-[#52525b]">
            {message}
        </div>
    );
}
