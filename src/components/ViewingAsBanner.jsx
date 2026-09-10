import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Shown across every page while a SUPER_ADMIN is "viewing as" a chosen
 * municipality, so it's always obvious whose data is on screen and there's
 * always a one-click way back out to the municipalities list.
 */
export default function ViewingAsBanner() {
  const { viewingBusiness, exitBusiness, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  if (!isSuperAdmin || !viewingBusiness) return null;

  const handleExit = () => {
    exitBusiness();
    navigate('/municipalities');
  };

  return (
    <div
      style={{
        background: 'var(--color-black)',
        color: '#fff',
        padding: '0.55rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        fontSize: '0.85rem',
        flexWrap: 'wrap',
      }}
    >
      <span>
        👁 Viewing as <strong>{viewingBusiness.name}</strong> — you're seeing this municipality's own dashboard.
      </span>
      <button
        onClick={handleExit}
        style={{
          background: 'var(--color-danger)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius)',
          padding: '0.35rem 0.8rem',
          fontSize: '0.8rem',
          fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Exit to Municipalities
      </button>
    </div>
  );
}
