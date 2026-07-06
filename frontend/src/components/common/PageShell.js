import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Siren } from 'lucide-react';
import SosAlertModal from './SosAlertModal';
import Navbar from './Navbar';
import { TopLoaderContext } from '../../context/TopLoaderContext';

// simple footer columns data; replace with real links if needed
const footerColumns = [
  { heading: 'Company', items: ['About', 'Blog', 'Careers'] },
  { heading: 'Product', items: ['Features', 'Pricing', 'FAQs'] },
  { heading: 'Support', items: ['Help Center', 'Contact Us', 'Privacy Policy'] },
  { heading: 'Social', items: ['Twitter', 'Facebook', 'LinkedIn'] },
];

function PageShell({ children }) {
    const [showSosModal, setShowSosModal] = useState(false);
    const [theme, setTheme] = useState("system");
    const [showThemeTransition, setShowThemeTransition] = useState(false);
    // determine login state from stored token instead of custom key
    const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('safeher_logged_in'));
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const isAuthRoute = pathname.startsWith("/auth");
    const isInitialThemeRender = useRef(true);

    // keep login state in sync when navigating (e.g. after login redirect)
    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem('safeher_logged_in'));
    }, [pathname]);

    const { start: loaderStart, done: loaderDone } = useContext(TopLoaderContext);

    const handleLogout = async () => {
        loaderStart();
        try {
            await import('../../api/api').then(m => m.default.post('/auth/logout'));
        } catch { /* ignore network errors on logout */ }
        localStorage.removeItem('safeher_logged_in');
        localStorage.removeItem('userName');
        localStorage.removeItem('userAvatar');
        setIsLoggedIn(false);
        loaderDone();
        navigate('/login');
    };

    // Remove any legacy tokens that may still be in localStorage from before the cookie migration
    useEffect(() => {
        localStorage.removeItem('safeher_logged_in_legacy');
        localStorage.removeItem('token'); // legacy — JWT is now in httpOnly cookie
        const stored = localStorage.getItem("theme");
        if (stored === "dark" || stored === "light" || stored === "system") {
            setTheme(stored);
        }
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        const media = window.matchMedia("(prefers-color-scheme: dark)");

        const applyTheme = () => {
            const shouldDark = theme === "dark" || (theme === "system" && media.matches);
            root.classList.toggle("dark", shouldDark);
        };

        applyTheme();
        media.addEventListener("change", applyTheme);

        if (theme === "system") {
            localStorage.removeItem("theme");
        } else {
            localStorage.setItem("theme", theme);
        }

        return () => media.removeEventListener("change", applyTheme);
    }, [theme]);

    const effectiveTheme = useMemo(() => {
        if (theme !== "system") return theme;
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }, [theme]);

    useEffect(() => {
        if (isInitialThemeRender.current) {
            isInitialThemeRender.current = false;
            return;
        }

        setShowThemeTransition(true);
        const timer = window.setTimeout(() => setShowThemeTransition(false), 480);
        return () => window.clearTimeout(timer);
    }, [effectiveTheme]);

    return (
        <div className="relative min-h-screen overflow-auto bg-slate-100 text-slate-900 dark:bg-[#070b15] dark:text-slate-100">
            <AnimatePresence>
                {showThemeTransition ? (
                    <motion.div
                        key={effectiveTheme}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.42, ease: "easeInOut" }}
                        className={`pointer-events-none fixed inset-0 z-90 ${
                            effectiveTheme === "dark"
                                ? "bg-linear-to-b from-slate-950/50 via-slate-900/35 to-cyan-950/30"
                                : "bg-linear-to-b from-sky-100/70 via-white/60 to-cyan-100/45"
                        }`}
                    />
                ) : null}
            </AnimatePresence>

            <div className="pointer-events-none absolute -top-24 left-1/2 h-136 w-136 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-400/25" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl dark:bg-fuchsia-500/15" />
            <div className="pointer-events-none absolute left-0 top-40 h-72 w-72 rounded-full bg-sky-300/25 blur-3xl dark:bg-rose-500/10" />

            <div className="relative mx-auto w-full max-w-7xl px-4 pb-14 pt-6 sm:px-6 lg:px-8">
                {isAuthRoute ? null : <Navbar theme={effectiveTheme} setTheme={setTheme} isLoggedIn={isLoggedIn} onLogout={handleLogout} />}
                <main className="mt-8 min-h-[62vh]">{children}</main>

                {isAuthRoute ? null : (
                    <motion.footer
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-14 rounded-3xl border border-slate-200 bg-white/75 p-6 shadow-lg backdrop-blur-xl dark:border-white/15 dark:bg-white/10 sm:p-8"
                    >
                        <div className="grid gap-8 lg:grid-cols-[1.1fr,1fr]">
                            <div>
                                <h3 className="font-['Sora'] text-2xl font-bold text-slate-900 dark:text-white pagefooter-heading">SafeHer Emergency Platform</h3>
                                <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                    Professional safety infrastructure for one-click SOS, live route sharing, emergency contact
                                    notification, and automatic escalation for faster intervention.
                                </p>
                                <div className="mt-5 flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTheme("light")}
                                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                                            effectiveTheme === "light"
                                                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100"
                                                : "border-slate-300 text-slate-600 dark:border-white/20 dark:text-slate-300"
                                        }`}
                                    >
                                        Light
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTheme("dark")}
                                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                                            effectiveTheme === "dark"
                                                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100"
                                                : "border-slate-300 text-slate-600 dark:border-white/20 dark:text-slate-300"
                                        }`}
                                    >
                                        Dark
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTheme("system")}
                                        className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-white/20 dark:text-slate-300"
                                    >
                                        System
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                                {footerColumns.map((column) => (
                                    <div key={column.heading}>
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{column.heading}</h4>
                                        <ul className="footer-links mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                            {column.items.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-8 border-t border-slate-200 pt-5 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                SafeHer | Women Safety and Emergency Alert System | Built for real-time support and social security.
                            </span>
                            {/* Animated social icon tiles */}
                            <div className="social-icons-wrapper" style={{ marginLeft: 0 }}>
                                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-icon" style={{ '--color': '#e1306c' }} aria-label="Instagram">
                                    <i className="fa-brands fa-instagram" />
                                </a>
                                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-icon" style={{ '--color': '#0077b5' }} aria-label="LinkedIn">
                                    <i className="fa-brands fa-linkedin-in" />
                                </a>
                                <a href="https://github.com" target="_blank" rel="noreferrer" className="social-icon" style={{ '--color': '#333' }} aria-label="GitHub">
                                    <i className="fa-brands fa-github" />
                                </a>
                                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-icon" style={{ '--color': '#1da1f2' }} aria-label="Twitter / X">
                                    <i className="fa-brands fa-x-twitter" />
                                </a>
                            </div>
                        </div>
                    </motion.footer>
                )}
            </div>

            {!isAuthRoute && isLoggedIn && (
                <button
                    type="button"
                    onClick={() => setShowSosModal(true)}
                    className="sos-fab"
                    aria-label="Send SOS Alert"
                >
                    <Siren className="h-4 w-4" />
                    SOS Alert
                </button>
            )}

            <SosAlertModal open={showSosModal} onClose={() => setShowSosModal(false)} />
        </div>
    );
}

export default PageShell;
