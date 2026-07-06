import React, { useContext } from 'react';
import { TopLoaderContext } from '../../context/TopLoaderContext';

/**
 * YouTube / GitHub-style top progress bar.
 * Controlled via TopLoaderContext's start() and done().
 */
export default function TopLoader() {
  const { isLoading, progress } = useContext(TopLoaderContext);

  if (!isLoading && progress === 0) return null;

  return (
    <>
      {/* Progress bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '3.5px',
          zIndex: 99999,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #06b6d4, #22d3ee, #a855f7)',
            borderRadius: '0 4px 4px 0',
            transition: progress === 100
              ? 'width 0.2s ease-out, opacity 0.4s ease 0.15s'
              : 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: progress === 100 ? 0 : 1,
            boxShadow: '0 0 12px rgba(6, 182, 212, 0.6), 0 0 4px rgba(168, 85, 247, 0.4)',
          }}
        />
        {/* Glowing pulse at the leading edge */}
        {progress < 100 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '80px',
              height: '100%',
              transform: `translateX(${progress < 100 ? 0 : 80}px)`,
              background: 'linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.5))',
              borderRadius: '0 4px 4px 0',
              animation: 'topLoaderPulse 1.5s ease-in-out infinite',
              left: `calc(${progress}% - 80px)`,
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes topLoaderPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  );
}
