import React, { useState, useContext } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import API from '../../api/api';
import { ToastContext } from '../../context/ToastContext';

/* ── Reuse the same strength scorer ── */
function getPwStrength(pwd) {
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
}

const LEGEND = [
    { label: 'Weak',        color: '#ef4444', emoji: '🔴' },
    { label: 'Fair',        color: '#f59e0b', emoji: '🟡' },
    { label: 'Good',        color: '#06b6d4', emoji: '🔵' },
    { label: 'Strong',      color: '#22c55e', emoji: '🟢' },
    { label: 'Very Strong', color: '#16a34a', emoji: '🟢' },
];

export default function ResetPassword() {
    const { token }           = useParams();
    const navigate            = useNavigate();
    const { addToast }        = useContext(ToastContext);

    const [password,  setPassword]  = useState('');
    const [confirm,   setConfirm]   = useState('');
    const [showPw,    setShowPw]    = useState(false);
    const [showCf,    setShowCf]    = useState(false);
    const [pwFocused, setPwFocused] = useState(false);
    const [loading,   setLoading]   = useState(false);

    const s = getPwStrength(password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) { addToast('❌ Passwords do not match', 'error'); return; }
        if (password.length < 6)  { addToast('❌ Password must be at least 6 characters', 'error'); return; }
        setLoading(true);
        try {
            const { data } = await API.post(`/auth/reset-password/${token}`, { password });
            addToast(`✅ ${data.msg}`, 'success');
            navigate('/login');
        } catch (err) {
            addToast('❌ ' + (err.response?.data?.msg || 'Reset failed'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto w-full max-w-md"
        >
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0d1628]">

                {/* Banner */}
                <div className="relative overflow-hidden bg-[#060d1f] px-8 py-8">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-rose-500/25 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-10 left-0 h-44 w-64 rounded-full bg-fuchsia-500/20 blur-2xl" />
                    <div className="relative flex flex-col items-center text-center">
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-rose-400 to-fuchsia-600 shadow-lg shadow-rose-500/30">
                            <Lock className="h-7 w-7 text-white" />
                        </div>
                        <h1 className="mt-4 font-['Sora'] text-2xl font-bold text-white">Set New Password</h1>
                        <p className="mt-1.5 text-sm text-slate-400">Choose a strong password for your SafeHer account.</p>
                    </div>
                </div>

                {/* Form */}
                <div className="p-8">
                    <form className="space-y-4" onSubmit={handleSubmit}>

                        {/* New Password */}
                        <div style={{ position: 'relative' }}>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                New Password
                            </label>
                            <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 transition focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-400/20 dark:border-white/10 dark:bg-white/5">
                                <KeyRound className="h-4 w-4 shrink-0 text-slate-400" />
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="w-full bg-transparent py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                                    value={password}
                                    autoComplete="new-password"
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setPwFocused(true)}
                                    onBlur={() => setPwFocused(false)}
                                    required
                                    minLength="6"
                                />
                                <button type="button" onClick={() => setShowPw(v => !v)}
                                    className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    aria-label={showPw ? 'Hide' : 'Show'}>
                                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>

                            {/* Strength popup */}
                            {password && pwFocused && s && (
                                <div className="pw-strength-popup">
                                    <div className="pw-strength-bar">
                                        {[0,1,2,3].map(i => (
                                            <div key={i} className="pw-strength-seg" style={{ background: i < s.score ? s.color : undefined }} />
                                        ))}
                                    </div>
                                    <p className="pw-strength-current" style={{ color: s.color }}>{s.label}</p>
                                    <table className="pw-strength-legend">
                                        <tbody>
                                            {LEGEND.map(row => (
                                                <tr key={row.label} style={{ opacity: s.label === row.label ? 1 : 0.38 }}>
                                                    <td className="pw-legend-emoji">{row.emoji}</td>
                                                    <td className="pw-legend-label" style={{ color: s.label === row.label ? row.color : undefined, fontWeight: s.label === row.label ? 700 : 500 }}>{row.label}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                Confirm Password
                            </label>
                            <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 transition focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-400/20 dark:border-white/10 dark:bg-white/5">
                                <KeyRound className="h-4 w-4 shrink-0 text-slate-400" />
                                <input
                                    type={showCf ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="w-full bg-transparent py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                                    value={confirm}
                                    autoComplete="new-password"
                                    onChange={(e) => setConfirm(e.target.value)}
                                    required
                                    minLength="6"
                                />
                                <button type="button" onClick={() => setShowCf(v => !v)}
                                    className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    aria-label={showCf ? 'Hide' : 'Show'}>
                                    {showCf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {confirm && (
                                <p className="mt-1 text-xs font-semibold" style={{ color: password === confirm ? '#22c55e' : '#ef4444' }}>
                                    {password === confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{ background: 'linear-gradient(to right, #fb7185, #a855f7)' }}
                            className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                        >
                            <ShieldCheck className="h-4 w-4" />
                            {loading ? 'Resetting…' : 'Reset Password'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 transition">
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
