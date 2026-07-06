import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, MapPin, Clock, ShieldCheck, Activity } from 'lucide-react';
import API from '../../api/api';
import { ToastContext } from '../../context/ToastContext';
import GlassLoader from '../common/GlassLoader';

export default function Dashboard() {
    const { addToast } = useContext(ToastContext);
    const [location, setLocation] = useState(null);
    const [sosLoading, setSosLoading] = useState(false);
    const [incidents, setIncidents] = useState([]);
    const [total, setTotal] = useState(0);
    const [loadingHistory, setLoadingHistory] = useState(true);

    const fetchHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const { data } = await API.get('/incidents?page=1&limit=5');
            setIncidents(data.incidents);
            setTotal(data.total);
        } catch (err) {
            const message = err.response?.data?.message || err.response?.data?.msg || err.message || 'Failed to load history';
            addToast(`❌ ${message}`, 'error');
        } finally {
            setLoadingHistory(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    /* ── Reverse geocode using Nominatim (same as History page) ── */
    const geoCacheRef = useRef({});
    const fetchingRef = useRef(new Set());
    const [geoCache,  setGeoCache]  = useState({});

    const reverseGeocode = useCallback(async (lat, lng) => {
        const key = `${parseFloat(lat).toFixed(4)},${parseFloat(lng).toFixed(4)}`;
        if (geoCacheRef.current[key] || fetchingRef.current.has(key)) return;
        fetchingRef.current.add(key);
        try {
            const res  = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            const addr = data.address || {};
            const label = [addr.suburb || addr.neighbourhood, addr.city || addr.town || addr.village || addr.county].filter(Boolean).slice(0, 2).join(', ');
            const value = label || `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
            geoCacheRef.current[key] = value;
            setGeoCache(prev => ({ ...prev, [key]: value }));
        } catch {
            const value = `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
            geoCacheRef.current[key] = value;
            setGeoCache(prev => ({ ...prev, [key]: value }));
        }
    }, []);

    // Geocode visible incidents whenever they change
    useEffect(() => {
        incidents.slice(0, 5).forEach(inc => {
            if (inc.location?.lat != null && inc.location?.lng != null) {
                reverseGeocode(inc.location.lat, inc.location.lng);
            }
        });
    }, [incidents, reverseGeocode]);

    const getLocLabel = (lat, lng) => {
        if (lat == null || lng == null) return 'Location unavailable';
        const key = `${parseFloat(lat).toFixed(4)},${parseFloat(lng).toFixed(4)}`;
        return geoCache[key] || `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
    };

    const handleSOS = () => {
        if (!navigator.geolocation) {
            addToast('❌ Geolocation not supported', 'error');
            return;
        }
        setSosLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setLocation({ lat: latitude, lng: longitude });
                try {
                    await API.post('/incidents', { lat: latitude, lng: longitude });
                    addToast('\uD83D\uDEA8 SOS alert sent! Emails delivered to all emergency contacts.', 'success');
                    fetchHistory(); // refresh incident list
                } catch (err) {
                    addToast('❌ Failed to send alert', 'error');
                } finally {
                    setSosLoading(false);
                }
            },
            () => {
                addToast('❌ Unable to get your location', 'error');
                setSosLoading(false);
            }
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-8"
        >
            {/* ── Page header ── */}
            <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/10 ring-1 ring-rose-400/30">
                    <Activity className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Emergency Dashboard</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Send SOS alerts and review your incident history.</p>
                </div>
            </div>

            {/* ── Top row: SOS + map ── */}
            <div className="grid gap-6 lg:grid-cols-2">

                {/* SOS card */}
                <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[#0d1628]">
                    <div className="text-center">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Send Emergency Alert</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Tap the button below to broadcast your live location to all trusted contacts.
                        </p>
                    </div>

                    {/* SOS pulse button */}
                    <div className="relative flex items-center justify-center">
                        <span className="absolute inline-flex h-44 w-44 animate-ping rounded-full bg-rose-400 opacity-10" />
                        <span className="absolute inline-flex h-36 w-36 animate-pulse rounded-full bg-rose-500 opacity-15" />
                        <button
                            onClick={handleSOS}
                            disabled={sosLoading}
                            className={`relative z-10 flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 border-rose-400 font-extrabold text-white shadow-[0_0_40px_rgba(244,63,94,0.5)] transition hover:shadow-[0_0_60px_rgba(244,63,94,0.8)] hover:scale-105 active:scale-95 disabled:opacity-60${sosLoading ? ' sos-btn-loading' : ''}`}
                            style={{ background: 'linear-gradient(145deg, #e11d48, #be123c)' }}
                            aria-label="Send SOS alert"
                        >
                            <AlertTriangle className="h-7 w-7 mb-1" />
                            <span className="text-xl tracking-widest">{sosLoading ? '…' : 'SOS'}</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                        Encrypted · Instant · Private
                    </div>
                </div>

                {/* Map card */}
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0d1628]">
                    {location ? (
                        <div className="flex h-full flex-col">
                            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3 dark:border-white/10">
                                <MapPin className="h-4 w-4 text-rose-500" />
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    Live Location Captured
                                </span>
                                <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-500/15 dark:text-green-400">
                                    ● Live
                                </span>
                            </div>

                            {/* OSM embed — no API key, no X-Frame-Options block */}
                            <iframe
                                width="100%"
                                className="flex-1 min-h-[200px]"
                                frameBorder="0"
                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.005},${location.lat - 0.005},${location.lng + 0.005},${location.lat + 0.005}&layer=mapnik&marker=${location.lat},${location.lng}`}
                                title="live-location-map"
                            />

                            {/* Coordinates + open button */}
                            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 dark:border-white/10">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                                </p>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-600"
                                >
                                    <MapPin className="h-3 w-3" /> Open in Maps ↗
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 p-8 text-center">
                            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 dark:bg-white/5">
                                <MapPin className="h-8 w-8 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Location map will appear here</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Your live coordinates are shown after sending an SOS alert.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Incident history ── */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0d1628]">
                <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4 dark:border-white/10">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <h2 className="font-semibold text-slate-900 dark:text-white">Incident History</h2>
                    <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {total} total
                    </span>
                </div>

                <div className="p-6">
                    {loadingHistory ? (
                        /* Skeleton rows while loading */
                        <ul className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <li key={i} className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/8 dark:bg-white/5 animate-pulse">
                                    <div className="mt-0.5 h-8 w-8 shrink-0 rounded-lg bg-slate-200 dark:bg-white/10" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-2/5 rounded bg-slate-200 dark:bg-white/10" />
                                        <div className="h-2.5 w-3/5 rounded bg-slate-200 dark:bg-white/10" />
                                    </div>
                                    <div className="h-5 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-white/10" />
                                </li>
                            ))}
                        </ul>
                    ) : incidents.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-10 text-center">
                            <ShieldCheck className="h-10 w-10 text-green-400" />
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No incidents recorded yet.</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Stay safe. Your history will appear here after an SOS is sent.</p>
                        </div>
                    ) : (
                        <>
                            <ul className="space-y-3">
                                {incidents.slice(0, 5).map((inc, idx) => (
                                    <motion.li
                                        key={inc._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/8 dark:bg-white/5"
                                    >
                                        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rose-500/10">
                                            <AlertTriangle className="h-4 w-4 text-rose-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                                {new Date(inc.timestamp).toLocaleString()}
                                            </p>
                                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                <MapPin className="h-3 w-3 shrink-0" />
                                                {getLocLabel(inc.location?.lat, inc.location?.lng)}
                                            </p>
                                        </div>
                                        <span className="shrink-0 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                                            SOS
                                        </span>
                                    </motion.li>
                                ))}
                            </ul>
                            {total > 5 && (
                                <div className="mt-4 text-center">
                                    <Link
                                        to="/history"
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                                    >
                                        View all {total} incidents in History →
                                    </Link>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            <GlassLoader visible={sosLoading} message="Sending SOS alert…" />
        </motion.div>
    );
}
