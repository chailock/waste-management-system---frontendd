import React from 'react';

/*
 * Status colors are limited to the site palette: green (good/active),
 * red (problem/stopped), black (neutral/closed), and a muted gray-black
 * for informational/in-progress states.
 */
const STATUS_COLORS = {
  ACTIVE: { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  OPERATIONAL: { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  VALID: { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  RESOLVED: { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  LOW: { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },

  CLOSED: { bg: '#eceeea', color: 'var(--color-black)' },
  COMPLETED: { bg: '#eceeea', color: 'var(--color-black)' },
  MEDIUM: { bg: '#eceeea', color: 'var(--color-black)' },

  SUSPENDED: { bg: '#f0efe9', color: '#3a3d33' },
  MAINTENANCE: { bg: '#f0efe9', color: '#3a3d33' },
  NEAR_CAPACITY: { bg: '#f0efe9', color: '#3a3d33' },
  EXPIRING_SOON: { bg: '#f0efe9', color: '#3a3d33' },
  INVESTIGATING: { bg: '#f0efe9', color: '#3a3d33' },
  HIGH: { bg: '#f0efe9', color: '#3a3d33' },

  OPEN: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)' },
  OUT_OF_SERVICE: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)' },
  EXPIRED: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)' },
  TERMINATED: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)' },
  CRITICAL: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)' },
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  const key = status.toUpperCase();
  const palette = STATUS_COLORS[key] || { bg: '#eceeea', color: 'var(--color-black)' };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.2rem 0.65rem',
        borderRadius: 999,
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.02em',
        background: palette.bg,
        color: palette.color,
        whiteSpace: 'nowrap',
      }}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
