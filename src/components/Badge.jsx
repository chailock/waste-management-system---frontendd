import React from 'react';

/** Small red count pill for nav items — hides itself entirely at 0. */
export default function Badge({ count }) {
  if (!count || count <= 0) return null;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 18,
        height: 18,
        padding: '0 5px',
        borderRadius: 999,
        background: 'var(--color-danger)',
        color: '#fff',
        fontSize: '0.7rem',
        fontWeight: 800,
        lineHeight: 1,
        marginLeft: 'auto',
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
