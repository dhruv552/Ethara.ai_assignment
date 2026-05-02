import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight } from "@phosphor-icons/react";

export default function Login() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("admin@example.com");
    const [password, setPassword] = useState("admin123");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (user && user !== false) return <Navigate to="/dashboard" replace />;

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const result = await login(email, password);
        setLoading(false);
        if (result.ok) navigate("/dashboard");
        else setError(result.error);
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-[#f4f4f5]">
            {/* Left: Brand */}
            <div className="hidden lg:flex flex-col justify-between p-12 bg-[#09090b] text-white border-r-2 border-[#09090b] relative overflow-hidden">
                <div className="font-mono-ui text-[10px] uppercase tracking-[0.3em] text-[#a1a1aa]">
                    /// TEAM TASK MANAGER — V1.0
                </div>
                <div>
                    <h1 className="font-display font-black text-5xl xl:text-7xl leading-[0.9] tracking-tighter">
                        Ship work,
                        <br />
                        not <span className="text-[#0033cc]">status</span>
                        <br />
                        meetings.
                    </h1>
                    <p className="mt-6 font-mono-ui text-xs uppercase tracking-[0.2em] text-[#a1a1aa] max-w-sm">
                        Projects · Tasks · Roles · Deadlines — one
                        high-contrast control room.
                    </p>
                </div>
                <div className="grid grid-cols-3 gap-px bg-[#27272a] border border-[#27272a] font-mono-ui">
                    {[
                        ["TODO", "TASKS"],
                        ["IN-PROG", "ACTIVE"],
                        ["DONE", "COMPLETE"],
                    ].map(([label, sub]) => (
                        <div
                            key={label}
                            className="bg-[#09090b] p-4"
                        >
                            <div className="text-[#0033cc] font-display font-bold text-2xl">
                                {label}
                            </div>
                            <div className="text-[10px] uppercase tracking-[0.2em] text-[#a1a1aa] mt-1">
                                {sub}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Form */}
            <div className="flex items-center justify-center p-6 sm:p-12">
                <form
                    onSubmit={onSubmit}
                    data-testid="login-form"
                    className="w-full max-w-md bg-white border-2 border-[#09090b] p-8 sm:p-10 brutal-shadow-lg"
                >
                    <div className="font-mono-ui text-[10px] uppercase tracking-[0.25em] text-[#52525b]">
                        01 / SIGN IN
                    </div>
                    <h2 className="font-display font-black text-3xl sm:text-4xl mt-2">
                        Welcome back.
                    </h2>
                    <p className="text-sm text-[#52525b] mt-2">
                        Use your team credentials to access the workspace.
                    </p>

                    <div className="mt-8 space-y-5">
                        <Field
                            label="Email"
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            testid="login-email"
                            required
                        />
                        <Field
                            label="Password"
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            testid="login-password"
                            required
                        />
                    </div>

                    {error && (
                        <div
                            data-testid="login-error"
                            className="mt-5 px-3 py-2 border border-[#ff2a2a] bg-[#ff2a2a]/5 text-[#ff2a2a] font-mono-ui text-[11px] uppercase tracking-[0.15em]"
                        >
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        data-testid="login-submit"
                        className="mt-7 w-full bg-[#0033cc] text-white border border-[#0033cc] py-3.5 font-mono-ui text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 brutal-btn disabled:opacity-60"
                    >
                        {loading ? "Signing in…" : "Sign in"}
                        {!loading && <ArrowRight size={14} weight="bold" />}
                    </button>

                    <div className="mt-6 text-sm text-[#52525b]">
                        New here?{" "}
                        <Link
                            to="/signup"
                            data-testid="link-signup"
                            className="text-[#0033cc] font-medium underline underline-offset-2"
                        >
                            Create an account
                        </Link>
                    </div>

                    <div className="mt-7 pt-5 border-t border-dashed border-[#d4d4d8]">
                        <div className="font-mono-ui text-[10px] uppercase tracking-[0.25em] text-[#52525b] mb-2">
                            Demo accounts
                        </div>
                        <div className="grid grid-cols-2 gap-px bg-[#d4d4d8] border border-[#d4d4d8] font-mono-ui text-[11px]">
                            <button
                                type="button"
                                data-testid="demo-admin"
                                onClick={() => {
                                    setEmail("admin@example.com");
                                    setPassword("admin123");
                                }}
                                className="bg-white p-3 text-left hover:bg-[#f4f4f5]"
                            >
                                <div className="text-[#0033cc] font-bold">ADMIN</div>
                                <div className="text-[#52525b]">admin@example.com</div>
                            </button>
                            <button
                                type="button"
                                data-testid="demo-member"
                                onClick={() => {
                                    setEmail("member@example.com");
                                    setPassword("member123");
                                }}
                                className="bg-white p-3 text-left hover:bg-[#f4f4f5]"
                            >
                                <div className="text-[#09090b] font-bold">MEMBER</div>
                                <div className="text-[#52525b]">member@example.com</div>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Field({ label, id, testid, ...rest }) {
    return (
        <label className="block">
            <span className="font-mono-ui text-[10px] uppercase tracking-[0.25em] text-[#09090b]">
                {label}
            </span>
            <input
                id={id}
                data-testid={testid}
                {...rest}
                className="mt-1.5 w-full px-3 py-2.5 border border-[#09090b] bg-white text-[#09090b] focus:outline-none focus:border-[#0033cc] focus:ring-1 focus:ring-[#0033cc]"
            />
        </label>
    );
}
