import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Badge from './Badge';

const OPERATIONAL_NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/sites', label: 'Sites', icon: '📍' },
  { to: '/vehicles', label: 'Vehicles', icon: '🚛' },
  { to: '/routes', label: 'Collection Routes', icon: '🗺️' },
  { to: '/collections', label: 'Waste Quantities', icon: '⚖️' },
  { to: '/disposal', label: 'Disposal', icon: '♻️' },
  { to: '/landfills', label: 'Landfill Records', icon: '🏔️' },
  { to: '/incidents', label: 'Incidents', icon: '⚠️' },
  { to: '/contracts', label: 'Contracts', icon: '📄' },
  { to: '/compliance', label: 'Compliance Docs', icon: '✅' },
  { to: '/reports', label: 'Monthly Reports', icon: '📊' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, isSuperAdmin, viewingBusiness } = useAuth();
  const { messageUnreadCount, municipalitiesUnreadTotal } = useNotifications();

  // A super admin with no municipality selected has no business context to
  // scope these pages to (every one of these calls would 400 without it),
  // so only Municipalities is shown until they click into one.
  const showOperationalNav = !isSuperAdmin || !!viewingBusiness;
  const showMessages = !isSuperAdmin || !!viewingBusiness;

  return (
    <>
      <div
        onClick={onClose}
        className={`sidebar-overlay${isOpen ? ' visible' : ''}`}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 40,
        }}
      />
      <aside
        className={`app-sidebar${isOpen ? ' open' : ''}`}
        style={{
          width: 'var(--sidebar-width)',
          background: 'var(--color-primary-dark)',
          color: '#eaf3ec',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
        }}
      >
        <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.02em' }}>
            ♻️ WasteMS
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9db8a8', marginTop: '0.15rem' }}>
            {isSuperAdmin ? 'Platform Admin' : 'Municipality Portal'}
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.5rem' }}>
          {isSuperAdmin && (
            <NavItem to="/municipalities" icon="🏛️" label="Municipalities" badgeCount={municipalitiesUnreadTotal} onClick={onClose} />
          )}
          {isSuperAdmin && (
            <NavItem to="/audit-log" icon="🕵️" label="Audit Log" onClick={onClose} />
          )}

          {showOperationalNav && OPERATIONAL_NAV_ITEMS.map((item) => (
            <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} onClick={onClose} />
          ))}

          {showMessages && (
            <NavItem to="/messages" icon="✉️" label="Messages" badgeCount={messageUnreadCount} onClick={onClose} />
          )}
        </nav>

        <div style={{ padding: '0.9rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.12)', fontSize: '0.75rem', color: '#9db8a8' }}>
          Signed in as <strong style={{ color: '#eaf3ec' }}>{user?.role}</strong>
        </div>
      </aside>
    </>
  );
}

function NavItem({ to, icon, label, badgeCount, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        padding: '0.6rem 0.75rem',
        borderRadius: 6,
        marginBottom: '0.15rem',
        fontSize: '0.9rem',
        fontWeight: isActive ? 700 : 500,
        background: isActive ? 'var(--color-danger)' : 'transparent',
        color: isActive ? '#ffffff' : '#c9dcd0',
      })}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
      <Badge count={badgeCount} />
    </NavLink>
  );
}
