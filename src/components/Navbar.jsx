import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import userService from '../services/userService';

export default function Navbar({ onMenuClick }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [emailNotifEnabled, setEmailNotifEnabled] = useState(null); // null = not loaded yet
  const [savingPref, setSavingPref] = useState(false);

  // Fetch the current preference lazily, only once the dropdown is opened —
  // this is a rarely-used setting, no reason to hit the API on every page load.
  useEffect(() => {
    if (menuOpen && emailNotifEnabled === null) {
      userService.getMe()
        .then((me) => setEmailNotifEnabled(me.emailNotificationsEnabled))
        .catch(() => { /* silently skip — logout/other menu items still work */ });
    }
  }, [menuOpen, emailNotifEnabled]);

  const handleTogglePreference = async () => {
    const next = !emailNotifEnabled;
    setEmailNotifEnabled(next); // optimistic
    setSavingPref(true);
    try {
      await userService.updateNotificationPreference(next);
    } catch {
      setEmailNotifEnabled(!next); // revert on failure
    } finally {
      setSavingPref(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      style={{
        height: 'var(--navbar-height)',
        background: 'var(--color-surface)',
        borderBottom: '2px solid var(--color-black)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.25rem',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
        <button
          onClick={onMenuClick}
          aria-label="Toggle menu"
          className="navbar-menu-btn"
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: 'var(--color-black)',
            lineHeight: 1,
            padding: '0.25rem',
          }}
        >
          ☰
        </button>

        <div className="navbar-title" style={{ fontWeight: 800, color: 'var(--color-black)', whiteSpace: 'nowrap' }}>
          Municipality Waste Management
        </div>
      </div>

      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 999,
            padding: '0.3rem 0.7rem 0.3rem 0.3rem',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--color-primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
          </span>
          <span className="navbar-user-label" style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>
            {user?.fullName || user?.username}
          </span>
        </button>

        {menuOpen && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '110%',
              background: '#fff',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
              minWidth: 190,
              padding: '0.5rem',
              zIndex: 40,
            }}
          >
            <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {user?.email}
            </div>
            <div style={{ padding: '0.2rem 0.6rem 0.6rem', fontSize: '0.75rem' }}>
              Role: <strong>{user?.role}</strong>
            </div>
            {emailNotifEnabled !== null && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.6rem',
                  fontSize: '0.78rem',
                  color: 'var(--color-text)',
                  cursor: savingPref ? 'default' : 'pointer',
                  opacity: savingPref ? 0.6 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={emailNotifEnabled}
                  disabled={savingPref}
                  onChange={handleTogglePreference}
                  style={{ cursor: savingPref ? 'default' : 'pointer' }}
                />
                Email me about new messages
              </label>
            )}
            {isAdmin && (
              <Button
                variant="ghost"
                fullWidth
                size="sm"
                style={{ marginBottom: '0.4rem' }}
                onClick={() => { setMenuOpen(false); navigate('/register'); }}
              >
                + Add Staff Account
              </Button>
            )}
            <Button variant="danger" fullWidth size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
