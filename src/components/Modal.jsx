import React from 'react';

export default function Modal({ isOpen, onClose, title, children, footer, width = 520 }) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 26, 20, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius)',
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.3rem',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '1.25rem' }}>{children}</div>

        {footer && (
          <div
            style={{
              padding: '1rem 1.25rem',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.6rem',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
