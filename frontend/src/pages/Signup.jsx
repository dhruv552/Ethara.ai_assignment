import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight } from "@phosphor-icons/react";

export default function Signup() {
    const { user, signup } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "member",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (user && user !== false) return <Navigate to="/dashboard" replace />;

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const result = await signup(form);
        setLoading(false);
        if (result.ok) navigate("/dashboard");
        else setError(result.error);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f4f4f5] p-6">
            <form
                onSubmit={onSubmit}
                data-testid="signup-form"
                className="w-full max-w-md bg-white border-2 border-[#09090b] p-8 brutal-shadow-lg"
            >
                <div className="font-mono-ui text-[10px] uppercase tracking-[0.25em] text-[#52525b]">
                    02 / CREATE ACCOUNT
                </div>
                <h2 className="font-display font-black text-3xl mt-2">
                    Join your team.
                </h2>
                <p className="text-sm text-[#52525b] mt-2">
                    Spin up an account in under a minute.
                </p>

                <div className="mt-7 space-y-5">
                    <Field
                        label="Full name"
                        value={form.name}
                        onChange={set("name")}
                        testid="signup-name"
                        required
                    />
                    <Field
                        label="Email"
                        type="email"
                        value={form.email}
                        onChange={set("email")}
                        testid="signup-email"
                        required
                    />
                    <Field
                        label="Password"
                        type="password"
                        value={form.password}
                        onChange={set("password")}
                        testid="signup-password"
                        minLength={6}
                        required
                    />

                    <div>
                        <span className="font-mono-ui text-[10px] uppercase tracking-[0.25em]">
                            Role
                        </span>
                        <div className="mt-1.5 grid grid-cols-2 gap-px bg-[#09090b] border border-[#09090b]">
                            {["admin", "member"].map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setForm({ ...form, role: r })}
                                    data-testid={`signup-role-${r}`}
                                    className={[
                                        "py-2 font-mono-ui text-[11px] uppercase tracking-[0.2em]",
                                        form.role === r
                                            ? "bg-[#0033cc] text-white"
                                            : "bg-white text-[#09090b] hover:bg-[#f4f4f5]",
                                    ].join(" ")}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {error && (
                    <div
                        data-testid="signup-error"
                        className="mt-5 px-3 py-2 border border-[#ff2a2a] bg-[#ff2a2a]/5 text-[#ff2a2a] font-mono-ui text-[11px] uppercase tracking-[0.15em]"
                    >
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    data-testid="signup-submit"
                    className="mt-7 w-full bg-[#0033cc] text-white border border-[#0033cc] py-3.5 font-mono-ui text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 brutal-btn disabled:opacity-60"
                >
                    {loading ? "Creating…" : "Create account"}
                    {!loading && <ArrowRight size={14} weight="bold" />}
                </button>

                <div className="mt-6 text-sm text-[#52525b]">
                    Already a member?{" "}
                    <Link
                        to="/login"
                        data-testid="link-login"
                        className="text-[#0033cc] font-medium underline underline-offset-2"
                    >
                        Sign in
                    </Link>
                </div>
            </form>
        </div>
    );
}

function Field({ label, testid, ...rest }) {
    return (
        <label className="block">
            <span className="font-mono-ui text-[10px] uppercase tracking-[0.25em]">
                {label}
            </span>
            <input
                data-testid={testid}
                {...rest}
                className="mt-1.5 w-full px-3 py-2.5 border border-[#09090b] bg-white focus:outline-none focus:border-[#0033cc] focus:ring-1 focus:ring-[#0033cc]"
            />
        </label>
    );
}
