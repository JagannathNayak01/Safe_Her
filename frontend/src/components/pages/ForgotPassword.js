import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ShieldCheck, ArrowLeft, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import API from '../../api/api';
import { ToastContext } from '../../context/ToastContext';

export default function ForgotPassword() {
    const { addToast } = useContext(ToastContext);
    const [email, setEmail]       = useState('');
    const [loading, setLoading]   = useState(false);
    const [sent, setSent]         = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) { addToast('❌ Please enter your email address.', 'error'); return; }
        setLoading(true);
        try {
            await API.post('/auth/forgot-password', { email });
            setSent(true);
        } catch (err) {
            addToast('❌ ' + (err.response?.data?.msg || 'Something went wrong'), 'error');
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

                {/* Top gradient banner */}
                <div className="relative overflow-hidden bg-[#060d1f] px-8 py-8">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-rose-500/25 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-10 left-0 h-44 w-64 rounded-full bg-fuchsia-500/20 blur-2xl" />
                    <div className="relative flex flex-col items-center text-center">
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-rose-400 to-fuchsia-600 shadow-lg shadow-rose-500/30">
                            <ShieldCheck className="h-7 w-7 text-white" />
                        </div>
                        <h1 className="mt-4 font-['Sora'] text-2xl font-bold text-white">Forgot Password?</h1>
                        <p className="mt-1.5 text-sm text-slate-400">
                            Enter your email and we'll send you a reset link.
                        </p>
                    </div>
                </div>

                {/* Form / Success body */}
                <div className="p-8">
                    {sent ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-4"
                        >
                            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-500/15 ring-1 ring-rose-400/30">
                                <Send className="h-7 w-7 text-rose-400" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Check your inbox</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                We've sent a password reset link to <strong className="text-slate-700 dark:text-slate-200">{email}</strong>.
                                The link expires in&nbsp;<strong>1&nbsp;hour</strong>.
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                Didn't receive it? Check your spam folder or{' '}
                                <button
                                    type="button"
                                    className="text-rose-500 hover:underline font-semibold"
                                    onClick={() => setSent(false)}
                                >
                                    try again
                                </button>.
                            </p>
                        </motion.div>
                    ) : (
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                    Email Address
                                </label>
                                <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 transition focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-400/20 dark:border-white/10 dark:bg-white/5">
                                    <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        className="w-full bg-transparent py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                                        value={email}
                                        autoComplete="email"
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{ background: 'linear-gradient(to right, #fb7185, #a855f7)' }}
                                className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                            >
                                <Send className="h-4 w-4" />
                                {loading ? 'Sending…' : 'Send Reset Link'}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 transition"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
