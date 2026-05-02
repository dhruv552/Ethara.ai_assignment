import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatApiErrorDetail } from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import { Plus, ArrowUpRight } from "@phosphor-icons/react";

export default function Projects() {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    const load = async () => {
        const { data } = await api.get("/projects");
        setProjects(data);
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="px-6 sm:px-10 py-10 max-w-7xl">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <div className="font-mono-ui text-[10px] uppercase tracking-[0.25em] text-[#52525b]">
                        /// PROJECTS
                    </div>
                    <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tighter mt-2">
                        All projects
                    </h1>
                    <p className="text-[#52525b] mt-2">
                        {isAdmin
                            ? "Create projects, assemble teams, and ship faster."
                            : "Projects you've been added to. Click in to view tasks."}
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowCreate(true)}
                        data-testid="open-create-project"
                        className="self-start sm:self-auto bg-[#0033cc] text-white border border-[#0033cc] px-5 py-3 font-mono-ui text-[11px] uppercase tracking-[0.2em] flex items-center gap-2 brutal-btn"
                    >
                        <Plus size={14} weight="bold" />
                        New project
                    </button>
                )}
            </div>

            <section
                data-testid="projects-grid"
                className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 border-2 border-[#09090b] bg-white grid-skeleton"
            >
                {loading ? (
                    [0, 1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-44 bg-[#f4f4f5] animate-pulse" />
                    ))
                ) : projects.length === 0 ? (
                    <div className="col-span-full p-10 text-center font-mono-ui text-[11px] uppercase tracking-[0.25em] text-[#52525b]">
                        No projects yet.{" "}
                        {isAdmin && "Click 'New project' to create one."}
                    </div>
                ) : (
                    projects.map((p) => <ProjectCard key={p.id} project={p} />)
                )}
            </section>

            {showCreate && (
                <CreateProjectModal
                    onClose={() => setShowCreate(false)}
                    onCreated={() => {
                        setShowCreate(false);
                        load();
                    }}
                />
            )}
        </div>
    );
}

function ProjectCard({ project }) {
    return (
        <Link
            to={`/projects/${project.id}`}
            data-testid={`project-card-${project.id}`}
            className="group block p-6 hover:bg-[#f4f4f5] transition-colors"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="font-mono-ui text-[10px] uppercase tracking-[0.25em] text-[#52525b]">
                    {project.members.length} MEMBERS
                </div>
                <ArrowUpRight
                    size={18}
                    className="text-[#09090b] group-hover:text-[#0033cc]"
                />
            </div>
            <h3 className="mt-4 font-display font-black text-2xl tracking-tight line-clamp-2">
                {project.name}
            </h3>
            <p className="mt-2 text-sm text-[#52525b] line-clamp-3">
                {project.description || "No description."}
            </p>
        </Link>
    );
}

function CreateProjectModal({ onClose, onCreated }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await api.post("/projects", { name, description });
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
            data-testid="create-project-modal"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <form
                onSubmit={submit}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-white border-2 border-[#09090b] p-8 brutal-shadow-lg"
            >
                <div className="font-mono-ui text-[10px] uppercase tracking-[0.25em] text-[#52525b]">
                    /// NEW PROJECT
                </div>
                <h3 className="font-display font-black text-3xl mt-2">
                    Create project
                </h3>

                <div className="mt-6 space-y-4">
                    <label className="block">
                        <span className="font-mono-ui text-[10px] uppercase tracking-[0.25em]">
                            Name
                        </span>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            data-testid="create-project-name"
                            required
                            className="mt-1.5 w-full px-3 py-2.5 border border-[#09090b] bg-white focus:outline-none focus:border-[#0033cc] focus:ring-1 focus:ring-[#0033cc]"
                        />
                    </label>
                    <label className="block">
                        <span className="font-mono-ui text-[10px] uppercase tracking-[0.25em]">
                            Description
                        </span>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            data-testid="create-project-description"
                            rows={4}
                            className="mt-1.5 w-full px-3 py-2.5 border border-[#09090b] bg-white focus:outline-none focus:border-[#0033cc] focus:ring-1 focus:ring-[#0033cc]"
                        />
                    </label>
                </div>

                {error && (
                    <div
                        data-testid="create-project-error"
                        className="mt-4 px-3 py-2 border border-[#ff2a2a] bg-[#ff2a2a]/5 text-[#ff2a2a] font-mono-ui text-[11px] uppercase tracking-[0.15em]"
                    >
                        {error}
                    </div>
                )}

                <div className="mt-7 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        data-testid="create-project-cancel"
                        className="flex-1 bg-white border border-[#09090b] py-3 font-mono-ui text-[11px] uppercase tracking-[0.2em] brutal-btn"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        data-testid="create-project-submit"
                        className="flex-1 bg-[#0033cc] text-white border border-[#0033cc] py-3 font-mono-ui text-[11px] uppercase tracking-[0.2em] brutal-btn disabled:opacity-60"
                    >
                        {loading ? "Creating…" : "Create project"}
                    </button>
                </div>
            </form>
        </div>
    );
}
