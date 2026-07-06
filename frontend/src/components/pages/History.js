import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, ShieldAlert, Users, ChevronLeft, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';
import API from '../../api/api';
import { ToastContext } from '../../context/ToastContext';

const ITEMS_PER_PAGE = 8;

function SkeletonCard() {
  return (
    <div className="history-skeleton-card">
      <div className="history-skeleton-line history-skeleton-line--short" />
      <div className="history-skeleton-line" />
      <div className="history-skeleton-line history-skeleton-line--med" />
    </div>
  );
}

function StatBadge({ icon: Icon, value, label, color }) {
  return (
    <div className="history-stat">
      <div className="history-stat-icon" style={{ background: color + '20', color }}>
        <Icon size={18} />
      </div>
      <div className="history-stat-text">
        <p className="history-stat-value">{value}</p>
        <p className="history-stat-label">{label}</p>
      </div>
    </div>
  );
}

export default function History() {
  const { addToast } = useContext(ToastContext);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);   // server-side total count
  const [pageCount, setPageCount] = useState(1);   // total pages from server
  const [geoCache, setGeoCache] = useState({});   // lat,lng → display string
  const fetchingRef = useRef(new Set()); // keys currently being fetched
  const geoCacheRef = useRef((() => {
    // ── #29: seed geoCacheRef from sessionStorage so re-geocoding is skipped on revisit
    try {
      return JSON.parse(sessionStorage.getItem('safeher_geocache') || '{}');
    } catch { return {}; }
  })());

  /* ── Reverse geocode a single location (Nominatim, free, no key) ── */
  const reverseGeocode = useCallback(async (lat, lng) => {
    const key = `${parseFloat(lat).toFixed(4)},${parseFloat(lng).toFixed(4)}`;
    // Read from ref (not state) so this callback never needs geoCache as a dep
    if (geoCacheRef.current[key] || fetchingRef.current.has(key)) return;
    fetchingRef.current.add(key);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const addr = data.address || {};
      const label = [
        addr.suburb || addr.neighbourhood || addr.quarter,
        addr.city || addr.town || addr.village || addr.county,
        addr.state,
      ].filter(Boolean).slice(0, 2).join(', ');
      const value = label || `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
      geoCacheRef.current[key] = value;
      try { sessionStorage.setItem('safeher_geocache', JSON.stringify(geoCacheRef.current)); } catch { }
      setGeoCache(prev => ({ ...prev, [key]: value }));
    } catch {
      const value = `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
      geoCacheRef.current[key] = value;
      try { sessionStorage.setItem('safeher_geocache', JSON.stringify(geoCacheRef.current)); } catch { }
      setGeoCache(prev => ({ ...prev, [key]: value }));
    }
  }, []); // ← stable — reads from refs only, no geoCache dep

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { data } = await API.get(`/incidents?page=${page}&limit=${ITEMS_PER_PAGE}`);
        if (!cancelled) {
          setIncidents(data.incidents);
          setTotal(data.total);
          setPageCount(data.pages);
        }
      } catch (err) {
        if (!cancelled)
          addToast(
            `❌ ${err.response?.data?.msg || err.message || 'Failed to load history'}`,
            'error'
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [page]);

  /* ── Geocode visible incidents whenever page data changes ── */
  useEffect(() => {
    incidents.forEach(inc => {
      const lat = inc.location?.lat;
      const lng = inc.location?.lng;
      if (lat != null && lng != null) reverseGeocode(lat, lng);
    });
  }, [incidents]);

  const totalContacts = incidents.reduce(
    (acc, i) => acc + (i.contactsNotified?.length || 0),
    0
  );

  const lastAlert = incidents.length > 0
    ? new Date(incidents[0].timestamp || incidents[0].createdAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
    : '—';

  /* ── Helper: get cached address or coord string ── */
  const getLocation = (lat, lng) => {
    if (lat == null || lng == null) return null;
    const key = `${parseFloat(lat).toFixed(4)},${parseFloat(lng).toFixed(4)}`;
    return geoCache[key] || `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
  };

  return (
    <div className="page history-page">

      {/* ── Page heading ── */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="history-heading-wrap"
      >
        <div className="history-icon-wrap">
          <ShieldAlert size={28} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 className="history-title">SOS Alert History</h2>
          <p className="history-subtitle">
            A full log of every emergency alert you have triggered.
          </p>
        </div>
        <Link to="/dashboard" className="history-back-link">
          <ArrowLeft size={14} /> Dashboard
        </Link>
      </motion.div>

      {/* ── Stats strip — no explicit dividers needed, CSS handles them ── */}
      <motion.div
        className="history-stats-strip"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <StatBadge icon={ShieldAlert} value={total} label="Total Alerts" color="#ef4444" />
        <StatBadge icon={Clock} value={lastAlert} label="Last Alert" color="#f59e0b" />
        <StatBadge icon={Users} value={totalContacts} label="People Notified" color="#06b6d4" />
      </motion.div>

      {/* ── Content ── */}
      {loading ? (
        <div className="history-grid">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : incidents.length === 0 ? (
        /* ── Empty state ── */
        <motion.div
          className="history-empty"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="history-empty-icon">🛡️</div>
          <h3>No SOS Alerts Yet</h3>
          <p>You have never triggered an emergency alert — stay safe out there! 💜</p>
        </motion.div>
      ) : (
        <>
          {/* ── Timeline grid ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              className="history-grid"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28 }}
            >
              {incidents.map((inc, idx) => {
                const lat = inc.location?.lat;
                const lng = inc.location?.lng;
                const hasLoc = lat != null && lng != null;
                const mapsUrl = hasLoc
                  ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                  : null;
                const alertTime = new Date(inc.timestamp || inc.createdAt);
                const notifiedCount = inc.contactsNotified?.length || 0;

                return (
                  <motion.div
                    key={inc._id}
                    className="history-card"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                  >
                    {/* Card top stripe */}
                    <div className="history-card-stripe" />

                    <div className="history-card-body">
                      {/* Number badge */}
                      <div className="history-card-num">
                        #{total - (page - 1) * ITEMS_PER_PAGE - idx}
                      </div>

                      {/* Date + time */}
                      <div className="history-card-datetime">
                        <Clock size={14} />
                        <span>
                          {alertTime.toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}{' '}
                          at{' '}
                          {alertTime.toLocaleTimeString('en-IN', {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="history-card-loc">
                        <MapPin size={14} />
                        {hasLoc ? (
                          <a href={mapsUrl} target="_blank" rel="noreferrer"
                            className="history-card-map-link">
                            {getLocation(lat, lng)} — Open in Maps ↗
                          </a>
                        ) : (
                          <span className="history-card-no-loc">Location unavailable</span>
                        )}
                      </div>

                      {/* Contacts notified */}
                      <div className="history-card-contacts">
                        <Users size={14} />
                        <span>
                          {notifiedCount === 0
                            ? 'No contacts notified'
                            : (() => {
                              const names = inc.contactsNotified
                                .map(c => (typeof c === 'object' ? c.name : null))
                                .filter(Boolean);
                              if (names.length === 0)
                                return `${notifiedCount} contact${notifiedCount !== 1 ? 's' : ''} notified`;
                              const shown = names.slice(0, 2).join(', ');
                              const extra = names.length > 2 ? ` +${names.length - 2} more` : '';
                              return `${shown}${extra} notified`;
                            })()
                          }
                        </span>
                      </div>

                      {/* Status badge */}
                      <span className="history-card-status history-card-status--sent">
                        ✓ Alert Sent
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* ── Pagination ── */}
          {pageCount > 1 && (
            <div className="history-pagination">
              <button
                className="history-page-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>

              {Array.from({ length: pageCount }).map((_, i) => (
                <button
                  key={i}
                  className={`history-page-btn ${page === i + 1 ? 'history-page-btn--active' : ''}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}

              <button
                className="history-page-btn"
                disabled={page === pageCount}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
