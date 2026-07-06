import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Eye, EyeOff, KeyRound, Loader2, Mail, Phone, ShieldCheck, ShieldPlus, UserRound, Users, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api/api";
import { ToastContext } from "../../context/ToastContext";
import { TopLoaderContext } from "../../context/TopLoaderContext";

const FEATURES = [
    { icon: Zap,         label: "One-tap SOS with live GPS broadcast" },
    { icon: Users,       label: "Trusted contact emergency pings" },
    { icon: ShieldCheck, label: "Real-time route & incident tracking" },
];

const STEPS = ["Create Profile", "Set Password", "Verify Email"];

const stepVariants = {
    enter:  { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit:   { opacity: 0, x: -40 },
};

export default function Register() {
    const navigate = useNavigate();
    const { addToast } = useContext(ToastContext);
    const { start: loaderStart, done: loaderDone } = useContext(TopLoaderContext);

    // Step state
    const [step, setStep] = useState(1);

    // Step 1 — Profile
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    // Step 2 — Password
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pwFocused, setPwFocused] = useState(false);

    // Step 3 — OTP
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [otpEmail, setOtpEmail] = useState("");
    const [resendTimer, setResendTimer] = useState(0);
    const otpRefs = useRef([]);

    const [loading, setLoading] = useState(false);

    // Countdown for resend
    useEffect(() => {
        if (resendTimer <= 0) return;
        const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
        return () => clearTimeout(t);
    }, [resendTimer]);

    /* ── Password strength scorer ── */
    const getPwStrength = (pwd) => {
        if (!pwd) return null;
        let score = 0;
        if (pwd.length >= 8)  score++;
        if (pwd.length >= 12) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        score = Math.min(score, 4);
        const levels = [
            { label: 'Weak',        color: '#ef4444' },
            { label: 'Fair',        color: '#f59e0b' },
            { label: 'Good',        color: '#06b6d4' },
            { label: 'Strong',      color: '#22c55e' },
            { label: 'Very Strong', color: '#16a34a' },
        ];
        return { score, ...levels[score] };
    };

    /* ── Step 1 → Step 2 ── */
    const handleStep1 = (e) => {
        e.preventDefault();
        if (!name.trim()) return addToast("❌ Name is required", "error");
        if (!email.trim()) return addToast("❌ Email is required", "error");
        setStep(2);
    };

    /* ── Step 2 → Call register API → Step 3 ── */
    const handleStep2 = async (e) => {
        e.preventDefault();
        if (password.length < 6) return addToast("❌ Password must be at least 6 characters", "error");
        if (password !== confirmPassword) return addToast("❌ Passwords do not match", "error");

        setLoading(true);
        loaderStart();
        try {
            const res = await API.post("/auth/register", { name, email, password, phone });
            setOtpEmail(res.data.email || email);
            setResendTimer(60);
            addToast("✅ OTP sent to your email!", "success");
            setStep(3);
        } catch (err) {
            addToast("❌ " + (err.response?.data?.msg || "Registration failed"), "error");
        } finally {
            loaderDone();
            setLoading(false);
        }
    };

    /* ── Step 3 — Verify OTP ── */
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const otpString = otp.join("");
        if (otpString.length !== 6) return addToast("❌ Please enter the full 6-digit OTP", "error");

        setLoading(true);
        loaderStart();
        try {
            const res = await API.post("/auth/verify-otp", { email: otpEmail, otp: otpString });
            localStorage.setItem("safeher_logged_in", "1");
            if (res.data.name) localStorage.setItem("userName", res.data.name);
            localStorage.removeItem("userAvatar");
            addToast("✅ Email verified! Welcome to SafeHer.", "success");
            navigate("/");
        } catch (err) {
            addToast("❌ " + (err.response?.data?.msg || "Verification failed"), "error");
        } finally {
            loaderDone();
            setLoading(false);
        }
    };

    /* ── Resend OTP ── */
    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setLoading(true);
        try {
            await API.post("/auth/resend-otp", { email: otpEmail });
            setResendTimer(60);
            setOtp(["", "", "", "", "", ""]);
            addToast("✅ New OTP sent!", "success");
        } catch (err) {
            addToast("❌ " + (err.response?.data?.msg || "Failed to resend OTP"), "error");
        } finally {
            setLoading(false);
        }
    };

    /* ── OTP input handler ── */
    const handleOtpChange = (index, value) => {
        if (!/^\d?$/.test(value)) return; // only digits
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        // Auto-focus next
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
        if (e.key === "ArrowLeft" && index > 0) {
            e.preventDefault();
            otpRefs.current[index - 1]?.focus();
        }
        if (e.key === "ArrowRight" && index < 5) {
            e.preventDefault();
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const newOtp = [...otp];
        for (let i = 0; i < 6; i++) newOtp[i] = pasted[i] || "";
        setOtp(newOtp);
        const nextEmpty = newOtp.findIndex((d) => !d);
        otpRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
    };

    /* ── Render form by step ── */
    const renderFormStep = () => {
        switch (step) {
            case 1:
                return (
                    <motion.form
                        key="step1"
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        className="mt-7 space-y-4"
                        onSubmit={handleStep1}
                    >
                        {/* Name */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Full Name</label>
                            <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 transition focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-400/20 dark:border-white/10 dark:bg-white/5">
                                <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
                                <input type="text" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className="w-full bg-transparent py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none" />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Email Address</label>
                            <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 transition focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-400/20 dark:border-white/10 dark:bg-white/5">
                                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="w-full bg-transparent py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none" />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Phone Number <span className="text-slate-400 normal-case">(optional)</span></label>
                            <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 transition focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-400/20 dark:border-white/10 dark:bg-white/5">
                                <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                                <input type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" className="w-full bg-transparent py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none" />
                            </div>
                        </div>

                        <button type="submit" style={{ background: "linear-gradient(to right, #fb7185, #a855f7)" }} className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition hover:opacity-90 active:scale-[0.98]">
                            Continue <span className="text-base">→</span>
                        </button>
                    </motion.form>
                );

            case 2:
                return (
                    <motion.form
                        key="step2"
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        className="mt-7 space-y-4"
                        onSubmit={handleStep2}
                    >
                        {/* Password */}
                        <div style={{ position: 'relative' }}>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Password</label>
                            <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 transition focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-400/20 dark:border-white/10 dark:bg-white/5">
                                <KeyRound className="h-4 w-4 shrink-0 text-slate-400" />
                                <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setPwFocused(true)} onBlur={() => setPwFocused(false)} required minLength="6" autoComplete="new-password" className="w-full bg-transparent py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none" />
                                <button type="button" onClick={() => setShowPassword((v) => !v)} className="rounded p-1 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200" aria-label={showPassword ? "Hide" : "Show"}>
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {/* Strength popup */}
                            {password && pwFocused && (() => {
                                const s = getPwStrength(password);
                                if (!s) return null;
                                return (
                                    <div className="pw-strength-popup">
                                        <div className="pw-strength-bar">
                                            {[0, 1, 2, 3].map(i => (
                                                <div key={i} className="pw-strength-seg" style={{ background: i < s.score ? s.color : undefined }} />
                                            ))}
                                        </div>
                                        <p className="pw-strength-current" style={{ color: s.color }}>{s.label}</p>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Confirm Password</label>
                            <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 transition focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-400/20 dark:border-white/10 dark:bg-white/5">
                                <KeyRound className="h-4 w-4 shrink-0 text-slate-400" />
                                <input type={showConfirm ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength="6" autoComplete="new-password" className="w-full bg-transparent py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none" />
                                <button type="button" onClick={() => setShowConfirm((v) => !v)} className="rounded p-1 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200" aria-label={showConfirm ? "Hide" : "Show"}>
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {confirmPassword && (
                                <p className={`mt-1.5 text-xs font-medium ${password === confirmPassword ? 'text-green-500' : 'text-red-500'}`}>
                                    {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button type="button" onClick={() => setStep(1)} className="flex items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                                ← Back
                            </button>
                            <button type="submit" disabled={loading} style={{ background: "linear-gradient(to right, #fb7185, #a855f7)" }} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldPlus className="h-4 w-4" />}
                                {loading ? "Creating account…" : "Create Account"}
                            </button>
                        </div>
                    </motion.form>
                );

            case 3:
                return (
                    <motion.form
                        key="step3"
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        className="mt-7 space-y-5"
                        onSubmit={handleVerifyOtp}
                    >
                        <div className="text-center">
                            <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 ring-1 ring-rose-500/25">
                                <Mail className="h-6 w-6 text-rose-500" />
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                We sent a 6-digit code to<br />
                                <span className="font-semibold text-slate-900 dark:text-white">{otpEmail}</span>
                            </p>
                        </div>

                        {/* OTP Boxes */}
                        <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={(el) => (otpRefs.current[i] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                    aria-label={`Digit ${i + 1} of 6`}
                                    className="h-14 w-12 rounded-xl border border-slate-300 bg-slate-50 text-center text-xl font-bold text-slate-900 transition focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                    autoFocus={i === 0}
                                />
                            ))}
                        </div>

                        <button type="submit" disabled={loading} style={{ background: "linear-gradient(to right, #fb7185, #a855f7)" }} className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                            {loading ? "Verifying…" : "Verify & Continue"}
                        </button>

                        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                            Didn't receive the code?{" "}
                            {resendTimer > 0 ? (
                                <span className="font-medium text-slate-400">Resend in {resendTimer}s</span>
                            ) : (
                                <button type="button" onClick={handleResendOtp} disabled={loading} className="font-semibold text-rose-500 hover:underline dark:text-rose-400">
                                    Resend OTP
                                </button>
                            )}
                        </p>
                    </motion.form>
                );

            default:
                return null;
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
                        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-20 -left-12 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />
                        <div
                            className="pointer-events-none absolute inset-0 opacity-[0.04]"
                            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "38px 38px" }}
                        />

                        <div className="relative space-y-8">
                            {/* Logo */}
                            <div className="flex items-center gap-3">
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl shadow-lg shadow-rose-500/30" style={{ background: "linear-gradient(135deg, #fb7185, #a855f7)" }}>
                                    <ShieldPlus className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="font-['Sora'] text-xl font-bold text-white">SafeHer</p>
                                    <p className="text-[11px] tracking-wide text-rose-300/70">Emergency Safety Platform</p>
                                </div>
                            </div>

                            {/* Heading */}
                            <div>
                                <h1 className="font-['Sora'] text-3xl font-bold leading-tight text-white lg:text-[2.1rem]">
                                    Build your safety<br />
                                    <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(to right, #fb7185, #c084fc)" }}>
                                        network today.
                                    </span>
                                </h1>
                                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                                    Create your emergency identity and instantly connect with your trusted contacts.
                                </p>
                            </div>

                            {/* Feature list */}
                            <div className="space-y-2.5">
                                {FEATURES.map(({ icon: Icon, label }) => (
                                    <div key={label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rose-500/20">
                                            <Icon className="h-4 w-4 text-rose-300" />
                                        </div>
                                        <p className="text-sm text-slate-300">{label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Step indicators — dynamically highlight current step */}
                            <div className="flex items-center gap-1.5">
                                {STEPS.map((s, i) => (
                                    <div key={s} className="flex items-center">
                                        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300 ${
                                            i + 1 === step
                                                ? "bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/40"
                                                : i + 1 < step
                                                ? "bg-green-500/15 text-green-400"
                                                : "bg-white/5 text-slate-500"
                                        }`}>
                                            <span className={`h-1.5 w-1.5 rounded-full transition-colors ${
                                                i + 1 === step ? "bg-rose-400"
                                                : i + 1 < step ? "bg-green-400"
                                                : "bg-slate-600"
                                            }`} />
                                            {i + 1 < step ? `✓ ${s}` : s}
                                        </div>
                                        {i < STEPS.length - 1 && <div className="mx-1 h-px w-4 bg-white/10" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Trust badge */}
                        <div className="relative mt-8">
                            <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" />
                                Secure · Encrypted · Private
                            </span>
                        </div>
                    </div>

                    {/* ── Right: Form panel ── */}
                    <div className="flex flex-col justify-center p-8 lg:p-10">
                        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 ring-1 ring-rose-500/25 dark:bg-rose-400/10 dark:ring-rose-300/25">
                            <ShieldPlus className="h-5 w-5 text-rose-700 dark:text-rose-300" />
                        </div>
                        <h2 className="font-['Sora'] text-2xl font-bold text-slate-900 dark:text-white">
                            {step === 1 && "Create your account"}
                            {step === 2 && "Set your password"}
                            {step === 3 && "Verify your email"}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {step === 1 && "Enter your details to get started with SafeHer."}
                            {step === 2 && "Choose a strong password to protect your account."}
                            {step === 3 && "Enter the verification code to activate your account."}
                        </p>

                        <AnimatePresence mode="wait">
                            {renderFormStep()}
                        </AnimatePresence>

                        {step < 3 && (
                            <p className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">
                                Already have an account?{" "}
                                <Link to="/login" className="font-semibold text-rose-500 hover:underline dark:text-rose-400">
                                    Sign in →
                                </Link>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
