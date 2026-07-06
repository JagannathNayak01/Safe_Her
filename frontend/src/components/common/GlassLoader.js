import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

/**
 * Glassmorphism full-page loader with animated shield icon.
 * Usage: <GlassLoader visible={loading} message="Loading dashboard…" />
 */
export default function GlassLoader({ visible = false, message = 'Loading…' }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="glass-loader-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="glass-loader-card"
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          >
            {/* Animated shield icon */}
            <div className="glass-loader-icon">
              <div className="glass-loader-ring" />
              <ShieldCheck size={28} />
            </div>

            {/* Lottie-style dot animation */}
            <div className="glass-loader-dots">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="glass-loader-dot"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>

            <p className="glass-loader-text">{message}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
