import { Trash } from "@phosphor-icons/react";

const STATUS_COLUMNS = [
    { key: "todo", label: "TODO" },
    { key: "in-progress", label: "IN PROGRESS" },
    { key: "done", label: "DONE" },
];

export function StatusPill({ status }) {
    const map = {
        todo: {
            label: "TODO",
            className:
                "bg-[var(--ttm-surface)] text-[var(--ttm-text)] border-[var(--ttm-border-heavy)]",
        },
        "in-progress": {
            label: "IN-PROG",
            className:
                "bg-[var(--ttm-primary)] text-white border-[var(--ttm-primary)]",
        },
        done: {
            label: "DONE",
            className:
                "bg-[var(--ttm-text)] text-[var(--ttm-surface)] border-[var(--ttm-text)]",
        },
    };
    const cfg = map[status] || map.todo;
    return (
        <span
            className={`font-mono-ui text-[10px] uppercase tracking-[0.15em] px-2 py-1 border ${cfg.className}`}
        >
            {cfg.label}
        </span>
    );
}

export default function TaskCard({
    task,
    userMap,
    canEdit,
    canDelete,
    onChangeStatus,
    onDelete,
}) {
    const assignee = task.assigned_to ? userMap[task.assigned_to] : null;
    const overdue =
        task.due_date &&
        task.status !== "done" &&
        task.due_date < new Date().toISOString().slice(0, 10);

    return (
        <article
            data-testid={`task-${task.id}`}
            className="border border-[var(--ttm-border-heavy)] bg-[var(--ttm-surface)] p-4 hover:translate-x-[1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_var(--ttm-border-heavy)] transition-all"
        >
            <div className="flex items-start justify-between gap-2">
                <StatusPill status={task.status} />
                {canDelete && (
                    <button
                        onClick={onDelete}
                        data-testid={`delete-task-${task.id}`}
                        className="p-1 text-[var(--ttm-text-muted)] hover:text-[var(--ttm-accent)]"
                    >
                        <Trash size={14} />
                    </button>
                )}
            </div>
            <h4 className="font-display font-bold mt-2 leading-tight text-[var(--ttm-text)]">
                {task.title}
            </h4>
            {task.description && (
                <p className="text-xs text-[var(--ttm-text-muted)] mt-1 line-clamp-3">
                    {task.description}
                </p>
            )}
            <div className="mt-3 flex items-center justify-between gap-2 font-mono-ui text-[10px] uppercase tracking-[0.18em]">
                <span
                    className={
                        overdue
                            ? "text-[var(--ttm-accent)]"
                            : "text-[var(--ttm-text-muted)]"
                    }
                >
                    {task.due_date ? `DUE ${task.due_date}` : "NO DUE DATE"}
                </span>
                <span className="text-[var(--ttm-text)] truncate max-w-[50%]">
                    {assignee
                        ? `@ ${assignee.name.split(" ")[0]}`
                        : "UNASSIGNED"}
                </span>
            </div>

            {canEdit && (
                <div className="mt-3 grid grid-cols-3 gap-px bg-[var(--ttm-border-heavy)] border border-[var(--ttm-border-heavy)]">
                    {STATUS_COLUMNS.map((s) => (
                        <button
                            key={s.key}
                            onClick={() => onChangeStatus(s.key)}
                            data-testid={`set-status-${task.id}-${s.key}`}
                            disabled={task.status === s.key}
                            className={[
                                "py-1.5 font-mono-ui text-[10px] uppercase tracking-[0.18em]",
                                task.status === s.key
                                    ? "bg-[var(--ttm-primary)] text-white"
                                    : "bg-[var(--ttm-surface)] text-[var(--ttm-text)] hover:bg-[var(--ttm-bg)]",
                            ].join(" ")}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            )}
        </article>
    );
}

export { STATUS_COLUMNS };
