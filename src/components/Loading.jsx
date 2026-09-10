import React from 'react';

export default function Loading({ label = 'Loading…', fullPage = false }) {
  const content = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-text-muted)' }}>
      <span
        style={{
          width: 18,
          height: 18,
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <span>{label}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (fullPage) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        {content}
      </div>
    );
  }

  return <div style={{ padding: '1.5rem' }}>{content}</div>;
}
