import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldOff, Home, LayoutDashboard } from 'lucide-react';

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '2rem',
        gap: '1.5rem',
      }}
    >
      {/* Animated icon */}
      <motion.div
        animate={{ rotate: [0, -8, 8, -8, 0] }}
        transition={{ duration: 1.2, delay: 0.3, ease: 'easeInOut' }}
        style={{
          width: 80, height: 80,
          borderRadius: 22,
          background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
          border: '1px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#ef4444',
        }}
      >
        <ShieldOff size={38} />
      </motion.div>

      {/* Error code */}
      <div>
        <h1 style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: 'clamp(4rem, 12vw, 7rem)',
          fontWeight: 900,
          lineHeight: 1,
          background: 'linear-gradient(135deg, #ef4444, #f97316)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0,
        }}>404</h1>
        <h2 style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--text-primary, #0f172a)',
          margin: '0.5rem 0 0.25rem',
        }}>Page Not Found</h2>
        <p style={{
          fontSize: '0.92rem',
          color: '#64748b',
          maxWidth: 380,
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          The page you're looking for doesn't exist or may have been moved.
          Your safety is our priority — let's get you back on track.
        </p>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.7rem 1.4rem', borderRadius: 12,
            background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)',
            color: '#fff', fontWeight: 700, fontSize: '0.9rem',
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(6,182,212,0.35)',
            transition: 'opacity 0.2s, transform 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Home size={16} /> Go Home
        </Link>

        {localStorage.getItem('safeher_logged_in') && (
          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.7rem 1.4rem', borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.1)',
              background: 'rgba(255,255,255,0.7)',
              color: '#334155', fontWeight: 600, fontSize: '0.9rem',
              textDecoration: 'none', transition: 'background 0.2s',
            }}
          >
            <LayoutDashboard size={16} /> Dashboard
          </Link>
        )}
      </div>
    </motion.div>
  );
}
