import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, formatApiErrorDetail } from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import TaskCard, { STATUS_COLUMNS } from "@/components/TaskCard";
import { ArrowLeft, Plus, UserPlus, X } from "@phosphor-icons/react";

export default function Tasks() {
    const { id } = useParams();
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";

    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreateTask, setShowCreateTask] = useState(false);

    const userMap = useMemo(() => {
        const m = {};
        users.forEach((u) => (m[u.id] = u));
        return m;
    }, [users]);

    const load = async () => {
        try {
            const [p, t, u] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get(`/tasks/project/${id}`),
                api.get("/users"),
            ]);
            setProject(p.data);
            setTasks(t.data);
            setUsers(u.data);
        } catch (e) {
            setError(formatApiErrorDetail(e.response?.data?.detail) || e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const updateTask = async (taskId, patch) => {
        try {
            const { data } = await api.put(`/tasks/${taskId}`, patch);
            setTasks((prev) => prev.map((t) => (t.id === taskId ? data : t)));
        } catch (e) {
            alert(formatApiErrorDetail(e.response?.data?.detail) || e.message);
        }
    };

    const deleteTask = async (taskId) => {
        if (!confirm("Delete this task?")) return;
        await api.delete(`/tasks/${taskId}`);
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
    };

    const addMember = async (userId) => {
        const { data } = await api.post(`/projects/${id}/members`, {
            user_id: userId,
        });
        setProject(data);
    };

    const removeMember = async (userId) => {
        const { data } = await api.delete(`/projects/${id}/members/${userId}`);
        setProject(data);
    };

    if (loading) {
        return (
            <div className="px-6 sm:px-10 py-10 font-mono-ui text-xs uppercase tracking-[0.2em] text-[var(--ttm-text)]">
                Loading project…
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="px-6 sm:px-10 py-10">
                <Link
                    to="/projects"
                    className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-[var(--ttm-primary)]"
                >
                    ← Back to projects
                </Link>
                <div className="mt-4 border border-[var(--ttm-accent)] bg-[var(--ttm-accent)]/5 p-4 text-[var(--ttm-accent)] font-mono-ui text-xs uppercase tracking-[0.2em]">
                    {error || "Project not found"}
                </div>
            </div>
        );
    }

    const tasksByStatus = STATUS_COLUMNS.map((c) => ({
        ...c,
        tasks: tasks.filter((t) => t.status === c.key),
    }));

    const memberUsers = (project.members || [])
        .map((mid) => userMap[mid])
        .filter(Boolean);

    return (
        <div className="px-6 sm:px-10 py-10 max-w-7xl">
            <Link
                to="/projects"
                data-testid="back-to-projects"
                className="inline-flex items-center gap-1 font-mono-ui text-[10px] uppercase tracking-[0.25em] text-[var(--ttm-text-muted)] hover:text-[var(--ttm-text)]"
            >
                <ArrowLeft size={12} /> Back to projects
            </Link>

            <div className="mt-3 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div className="min-w-0">
                    <div className="font-mono-ui text-[10px] uppercase tracking-[0.25em] text-[var(--ttm-text-muted)]">
                        /// PROJECT · {String(project.id).slice(0, 8)}
                    </div>
                    <h1
                        data-testid="project-title"
                        className="font-display font-black text-4xl sm:text-5xl tracking-tighter mt-2 break-words text-[var(--ttm-text)]"
                    >
                        {project.name}
                    </h1>
                    <p className="text-[var(--ttm-text-muted)] mt-2 max-w-2xl">
                        {project.description || "No description."}
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowCreateTask(true)}
                        data-testid="open-create-task"
                        className="self-start lg:self-auto bg-[var(--ttm-primary)] text-white border border-[var(--ttm-primary)] px-5 py-3 font-mono-ui text-[11px] uppercase tracking-[0.2em] flex items-center gap-2 brutal-btn"
                    >
                        <Plus size={14} weight="bold" />
                        New task
                    </button>
                )}
            </div>

            {/* Members */}
            <section className="mt-8 border-2 border-[var(--ttm-border-heavy)] bg-[var(--ttm-surface)]">
                <div className="px-5 py-3 border-b border-[var(--ttm-border-heavy)] flex items-center justify-between">
                    <h2 className="font-display font-bold text-base text-[var(--ttm-text)]">
                        Members
                    </h2>
                    <span
                        data-testid="member-count"
                        className="font-mono-ui text-[10px] uppercase tracking-[0.25em] text-[var(--ttm-text-muted)]"
                    >
                        {memberUsers.length} TOTAL
                    </span>
                </div>
                <div
                    data-testid="members-list"
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 grid-skeleton"
                >
                    {memberUsers.map((m) => (
                        <div
                            key={m.id}
                            className="p-4 flex items-center justify-between gap-2"
                            data-testid={`member-${m.id}`}
                        >
                            <div className="min-w-0">
                                <div className="font-display font-semibold truncate text-sm text-[var(--ttm-text)]">
                                    {m.name}
                                </div>
                                <div className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-[var(--ttm-text-muted)] truncate">
                                    {m.role}
                                </div>
                            </div>
                            {isAdmin && m.id !== project.created_by && (
                                <button
                                    onClick={() => removeMember(m.id)}
                                    data-testid={`remove-member-${m.id}`}
                                    className="p-1.5 border border-[var(--ttm-border-heavy)] text-[var(--ttm-text)] hover:bg-[var(--ttm-accent)] hover:text-white"
                                >
                                    <X size={12} weight="bold" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                {isAdmin && (
                    <AddMemberRow
                        users={users}
                        memberIds={(project.members || []).map(String)}
                        onAdd={addMember}
                    />
                )}
            </section>

            {/* Task board */}
            <section className="mt-8">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display font-bold text-xl text-[var(--ttm-text)]">
                        Task board
                    </h2>
                    <span className="font-mono-ui text-[10px] uppercase tracking-[0.25em] text-[var(--ttm-text-muted)]">
                        {tasks.length} TASKS
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--ttm-border-heavy)] border-2 border-[var(--ttm-border-heavy)]">
                    {tasksByStatus.map((col) => (
                        <div
                            key={col.key}
                            className="bg-[var(--ttm-surface)] min-h-[16rem]"
                        >
                            <div className="px-4 py-3 border-b border-[var(--ttm-border-heavy)] flex items-center justify-between">
                                <span className="font-mono-ui text-[10px] uppercase tracking-[0.25em] text-[var(--ttm-text)]">
                                    {col.label}
                                </span>
                                <span className="font-mono-ui text-[10px] text-[var(--ttm-text-muted)]">
                                    {col.tasks.length}
                                </span>
                            </div>
                            <div
                                data-testid={`column-${col.key}`}
                                className="p-3 space-y-3"
                            >
                                {col.tasks.length === 0 && (
                                    <div className="text-center font-mono-ui text-[10px] uppercase tracking-[0.2em] text-[var(--ttm-text-muted)] py-6 border border-dashed border-[var(--ttm-border)]">
                                        No tasks
                                    </div>
                                )}
                                {col.tasks.map((t) => (
                                    <TaskCard
                                        key={t.id}
                                        task={t}
                                        userMap={userMap}
                                        canEdit={
                                            isAdmin || t.assigned_to === user.id
                                        }
                                        canDelete={isAdmin}
                                        onChangeStatus={(s) =>
                                            updateTask(t.id, { status: s })
                                        }
                                        onDelete={() => deleteTask(t.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {showCreateTask && (
                <CreateTaskModal
                    projectId={id}
                    allUsers={users}
                    onClose={() => setShowCreateTask(false)}
                    onCreated={() => {
                        setShowCreateTask(false);
                        load();
                    }}
                />
            )}
        </div>
    );
}

function AddMemberRow({ users, memberIds, onAdd }) {
    const candidates = users.filter((u) => !memberIds.includes(u.id));
    const [selected, setSelected] = useState("");

    const submit = async () => {
        if (!selected) return;
        await onAdd(selected);
        setSelected("");
    };

    return (
        <div className="border-t border-[var(--ttm-border-heavy)] p-4 flex flex-col sm:flex-row gap-3">
            <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                data-testid="add-member-select"
                className="flex-1 px-3 py-2.5 border border-[var(--ttm-border-heavy)] bg-[var(--ttm-surface)] text-[var(--ttm-text)] font-mono-ui text-xs"
            >
                <option value="">— Select a user to add —</option>
                {candidates.map((u) => (
                    <option key={u.id} value={u.id}>
                        {u.name} · {u.email}
                    </option>
                ))}
            </select>
            <button
                onClick={submit}
                disabled={!selected}
                data-testid="add-member-button"
                className="bg-[var(--ttm-text)] text-[var(--ttm-surface)] px-5 py-2.5 font-mono-ui text-[11px] uppercase tracking-[0.2em] flex items-center gap-2 brutal-btn disabled:opacity-50"
            >
                <UserPlus size={14} />
                Add member
            </button>
        </div>
    );
}

function CreateTaskModal({ projectId, allUsers, onClose, onCreated }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [status, setStatus] = useState("todo");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await api.post("/tasks", {
                title,
                description,
                project_id: projectId,
                assigned_to: assignedTo || null,
                due_date: dueDate || null,
                status,
            });
            onCreated();
        } catch (err) {
            setError(
                formatApiErrorDetail(err.response?.data?.detail) || err.message,
            );
            setLoading(false);
        }
    };

    return (
        <div
            data-testid="create-task-modal"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <form
                onSubmit={submit}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl bg-[var(--ttm-surface)] border-2 border-[var(--ttm-border-heavy)] p-8 brutal-shadow-lg"
            >
                <div className="font-mono-ui text-[10px] uppercase tracking-[0.25em] text-[var(--ttm-text-muted)]">
                    /// NEW TASK
                </div>
                <h3 className="font-display font-black text-3xl mt-2 text-[var(--ttm-text)]">
                    Create task
                </h3>

                <div className="mt-6 space-y-4">
                    <Field label="Title" required>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            data-testid="task-title"
                            required
                            className="ttm-input"
                        />
                    </Field>
                    <Field label="Description">
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            data-testid="task-description"
                            rows={3}
                            className="ttm-input"
                        />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Assignee">
                            <select
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                                data-testid="task-assignee"
                                className="ttm-input"
                            >
                                <option value="">Unassigned</option>
                                {allUsers.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Due date">
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                data-testid="task-due-date"
                                className="ttm-input"
                            />
                        </Field>
                    </div>
                    <Field label="Status">
                        <div className="grid grid-cols-3 gap-px bg-[var(--ttm-border-heavy)] border border-[var(--ttm-border-heavy)]">
                            {STATUS_COLUMNS.map((s) => (
                                <button
                                    key={s.key}
                                    type="button"
                                    onClick={() => setStatus(s.key)}
                                    data-testid={`task-status-${s.key}`}
                                    className={[
                                        "py-2 font-mono-ui text-[11px] uppercase tracking-[0.18em]",
                                        status === s.key
                                            ? "bg-[var(--ttm-primary)] text-white"
                                            : "bg-[var(--ttm-surface)] text-[var(--ttm-text)] hover:bg-[var(--ttm-bg)]",
                                    ].join(" ")}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </Field>
                </div>

                {error && (
                    <div
                        data-testid="create-task-error"
                        className="mt-4 px-3 py-2 border border-[var(--ttm-accent)] bg-[var(--ttm-accent)]/5 text-[var(--ttm-accent)] font-mono-ui text-[11px] uppercase tracking-[0.15em]"
                    >
                        {error}
                    </div>
                )}

                <div className="mt-7 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        data-testid="create-task-cancel"
                        className="flex-1 bg-[var(--ttm-surface)] text-[var(--ttm-text)] border border-[var(--ttm-border-heavy)] py-3 font-mono-ui text-[11px] uppercase tracking-[0.2em] brutal-btn"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        data-testid="create-task-submit"
                        className="flex-1 bg-[var(--ttm-primary)] text-white border border-[var(--ttm-primary)] py-3 font-mono-ui text-[11px] uppercase tracking-[0.2em] brutal-btn disabled:opacity-60"
                    >
                        {loading ? "Creating…" : "Create task"}
                    </button>
                </div>
            </form>
            <style>{`
              .ttm-input { margin-top: 6px; width: 100%; padding: 10px 12px; border: 1px solid var(--ttm-border-heavy); background: var(--ttm-surface); color: var(--ttm-text); }
              .ttm-input:focus { outline: none; border-color: var(--ttm-primary); box-shadow: 0 0 0 1px var(--ttm-primary); }
            `}</style>
        </div>
    );
}

function Field({ label, children, required }) {
    return (
        <label className="block">
            <span className="font-mono-ui text-[10px] uppercase tracking-[0.25em] text-[var(--ttm-text)]">
                {label}{" "}
                {required && <span className="text-[var(--ttm-accent)]">*</span>}
            </span>
            {children}
        </label>
    );
}
