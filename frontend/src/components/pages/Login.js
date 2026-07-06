import React, { useState, useContext } from "react";
import { Eye, EyeOff, KeyRound, Loader2, Lock, Mail, ShieldCheck, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/api";
import { ToastContext } from "../../context/ToastContext";
import { TopLoaderContext } from "../../context/TopLoaderContext";

const FEATURES = [
    { icon: Zap,        label: "One-tap SOS with live GPS broadcast" },
    { icon: Users,      label: "Trusted contact emergency pings" },
    { icon: ShieldCheck, label: "Real-time route & incident tracking" },
];

export default function Login() {
    const navigate = useNavigate();
    const { addToast } = useContext(ToastContext);
    const { start: loaderStart, done: loaderDone } = useContext(TopLoaderContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            addToast("❌ Email and password are required.", "error");
            return;
        }
        setLoading(true);
        loaderStart();
        try {
            const res = await API.post("/auth/login", { email, password });
            // JWT is now stored in an httpOnly cookie by the backend — never in JS
            localStorage.setItem("safeher_logged_in", "1");
            if (res.data.name) localStorage.setItem("userName", res.data.name);

            // Pre-fetch avatar so Navbar shows it without a page refresh
            try {
                const profileRes = await API.get("/profile");
                const avatarVal = profileRes.data.avatarBase64 || profileRes.data.avatar || '';
                localStorage.setItem("userAvatar", avatarVal);
            } catch {
                localStorage.removeItem("userAvatar");
            }

            addToast("✅ Login successful!", "success");
            navigate("/");
        } catch (err) {
            addToast("❌ " + (err.response?.data?.msg || "Login failed"), "error");
        } finally {
            loaderDone();
            setLoading(false);
        }
    };

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48 }}
            className="mx-auto w-full max-w-5xl"
        >
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0d1628]">
                <div className="grid md:grid-cols-[1fr_1.05fr]">

                    {/* ── Left: Dark brand panel ── */}
                    <div className="relative flex flex-col justify-between overflow-hidden bg-[#060d1f] p-8 lg:p-10">
                        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-20 -left-12 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl" />
                        <div
                            className="pointer-events-none absolute inset-0 opacity-[0.04]"
                            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "38px 38px" }}
                        />

                        <div className="relative space-y-8">
                            {/* Logo */}
                            <div className="flex items-center gap-3">
                                <div
                                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl shadow-lg shadow-cyan-500/30"
                                    style={{ background: "linear-gradient(135deg, #22d3ee, #0ea5e9)" }}
                                >
                                    <ShieldCheck className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="font-['Sora'] text-xl font-bold text-white">SafeHer</p>
                                    <p className="text-[11px] tracking-wide text-cyan-300/70">Emergency Safety Platform</p>
                                </div>
                            </div>

                            {/* Heading */}
                            <div>
                                <h1 className="font-['Sora'] text-3xl font-bold leading-tight text-white lg:text-[2.1rem]">
                                    Your safety network<br />
                                    <span
                                        className="bg-clip-text text-transparent"
                                        style={{ backgroundImage: "linear-gradient(to right, #67e8f9, #38bdf8)" }}
                                    >
                                        starts here.
                                    </span>
                                </h1>
                                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                                    Access live incident tracking, one-tap SOS, and your full emergency contact circle.
                                </p>
                            </div>

                            {/* Feature list */}
                            <div className="space-y-2.5">
                                {FEATURES.map(({ icon: Icon, label }) => (
                                    <div key={label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cyan-500/20">
                                            <Icon className="h-4 w-4 text-cyan-300" />
                                        </div>
                                        <p className="text-sm text-slate-300">{label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Trust badge */}
                        <div className="relative mt-8">
                            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                                Secure · Encrypted · Private
                            </span>
                        </div>
                    </div>

                    {/* ── Right: Form panel ── */}
                    <div className="flex flex-col justify-center p-8 lg:p-10">
                        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 ring-1 ring-cyan-500/25 dark:bg-cyan-400/10 dark:ring-cyan-300/25">
                            <Lock className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
                        </div>
                        <h2 className="font-['Sora'] text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sign in to your SafeHer account to continue.</p>

                        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
                            {/* Email */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                    Email Address
                                </label>
                                <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 transition focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20 dark:border-white/10 dark:bg-white/5">
                                    <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                        className="w-full bg-transparent py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                    Password
                                </label>
                                <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 transition focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20 dark:border-white/10 dark:bg-white/5">
                                    <KeyRound className="h-4 w-4 shrink-0 text-slate-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                        className="w-full bg-transparent py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="rounded p-1 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Forgot password link */}
                            <div className="text-right">
                                <Link
                                    to="/forgot-password"
                                    className="text-xs font-semibold text-cyan-600 hover:underline dark:text-cyan-400"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                style={{ background: "linear-gradient(to right, #22d3ee, #0ea5e9)" }}
                                className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-[#040d1a] shadow-lg shadow-cyan-500/20 transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                            >
                                {loading
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <ShieldCheck className="h-4 w-4" />}
                                {loading ? "Signing in…" : "Sign In Securely"}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">
                            New to SafeHer?{" "}
                            <Link to="/register" className="font-semibold text-cyan-600 hover:underline dark:text-cyan-400">
                                Create an account →
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
