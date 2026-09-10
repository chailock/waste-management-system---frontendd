import React from 'react';

const VARIANT_STYLES = {
  primary: { background: 'var(--color-primary)', color: '#fff', border: '1px solid var(--color-primary)' },
  secondary: { background: '#fff', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' },
  danger: { background: 'var(--color-danger)', color: '#fff', border: '1px solid var(--color-danger)' },
  dark: { background: 'var(--color-black)', color: '#fff', border: '1px solid var(--color-black)' },
  ghost: { background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)' },
};

export default function Button({
  children,
  variant = 'primary',
  onClick,
  type = 'button',
  disabled = false,
  fullWidth = false,
  size = 'md',
  style = {},
  ...rest
}) {
  const padding = size === 'sm' ? '0.45rem 0.8rem' : '0.65rem 1.1rem';
  const fontSize = size === 'sm' ? '0.85rem' : '0.95rem';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...VARIANT_STYLES[variant],
        padding,
        fontSize,
        borderRadius: 'var(--radius)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        width: fullWidth ? '100%' : 'auto',
        fontWeight: 600,
        transition: 'opacity 0.15s ease, transform 0.05s ease',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
