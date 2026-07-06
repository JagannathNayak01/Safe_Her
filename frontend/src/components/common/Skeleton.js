import React from 'react';

/**
 * Reusable skeleton loading primitives.
 * All use the shared @keyframes skeletonShimmer from main.css.
 */

/* ── Single line / block skeleton ── */
export function SkeletonLine({ width = '100%', height = '12px', radius = '6px', style = {} }) {
  return (
    <div
      className="skeleton-base"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

/* ── Circle skeleton (avatars) ── */
export function SkeletonCircle({ size = 48 }) {
  return (
    <div
      className="skeleton-base"
      style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0 }}
    />
  );
}

/* ── Card skeleton (for grid layouts like Dashboard / History) ── */
export function SkeletonCard({ lines = 3, showAvatar = false }) {
  return (
    <div className="skel-card">
      <div className="skel-card-inner">
        {showAvatar && <SkeletonCircle size={40} />}
        <div className="skel-card-lines">
          {Array.from({ length: lines }).map((_, i) => (
            <SkeletonLine
              key={i}
              width={i === 0 ? '45%' : i === lines - 1 ? '60%' : '80%'}
              height={i === 0 ? '14px' : '10px'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Table row skeleton (for Contacts table) ── */
export function SkeletonTableRow({ cols = 8 }) {
  const widths = ['30px', '18%', '16%', '22%', '8%', '12%', '16%', '10%'];
  return (
    <tr className="skeleton-row">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}>
          <div
            className="skeleton-base"
            style={{
              width: widths[i] || '70%',
              height: i === 0 ? '16px' : '11px',
              borderRadius: i === 0 ? '4px' : '6px',
            }}
          />
        </td>
      ))}
    </tr>
  );
}

/* ── Profile page full skeleton ── */
export function ProfileSkeleton() {
  return (
    <div className="profile-skel-wrap">
      {/* Header skeleton */}
      <div className="profile-skel-header">
        <SkeletonCircle size={80} />
        <div className="profile-skel-header-lines">
          <SkeletonLine width="180px" height="18px" />
          <SkeletonLine width="140px" height="12px" />
        </div>
      </div>

      {/* Card skeleton */}
      <div className="profile-skel-card">
        <SkeletonLine width="130px" height="14px" style={{ marginBottom: '20px' }} />
        {[1, 2, 3].map(i => (
          <div key={i} className="profile-skel-field">
            <SkeletonLine width="80px" height="10px" />
            <SkeletonLine width="100%" height="40px" radius="10px" />
          </div>
        ))}
        <SkeletonLine width="140px" height="42px" radius="10px" style={{ marginTop: '12px' }} />
      </div>
    </div>
  );
}
