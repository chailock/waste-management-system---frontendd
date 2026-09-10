import React, { useEffect, useState, useCallback } from 'react';
import reportService from '../services/reportService';
import collectionService from '../services/collectionService';
import businessService from '../services/businessService';
import Loading from '../components/Loading';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

const CARD_DEFS = [
  { key: 'totalSites', label: 'Sites', icon: '📍', color: 'var(--color-primary)' },
  { key: 'totalVehicles', label: 'Vehicles', icon: '🚛', color: 'var(--color-primary)' },
  { key: 'activeRoutes', label: 'Active Routes', icon: '🗺️', color: 'var(--color-black)' },
  { key: 'openIncidents', label: 'Open Incidents', icon: '⚠️', color: 'var(--color-danger)' },
  { key: 'activeContracts', label: 'Active Contracts', icon: '📄', color: 'var(--color-black)' },
  { key: 'expiringComplianceDocuments', label: 'Expiring Docs (30d)', icon: '✅', color: 'var(--color-danger)' },
];

export default function Dashboard() {
  const { user, isSuperAdmin, viewingBusiness } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentCollections, setRecentCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(() => {
    setLoading(true);
    return Promise.all([reportService.getDashboardStats(), collectionService.getAll()])
      .then(([statsData, collectionData]) => {
        setStats(statsData);
        const recent = [...collectionData]
          .sort((a, b) => new Date(b.collectionDate) - new Date(a.collectionDate))
          .slice(0, 5);
        setRecentCollections(recent);
        setError('');
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Dashboard load failed:', err);
        const detail = err.response?.data?.message || err.response?.statusText || err.message;
        setError(detail ? `Failed to load dashboard data: ${detail}` : 'Failed to load dashboard data.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const collectionColumns = [
    { key: 'site', label: 'Site', render: (row) => row.site?.name || '—' },
    { key: 'wasteType', label: 'Waste' },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (row) => `${row.quantity ?? 0} ${(row.unit || 'TON').charAt(0) + (row.unit || 'TON').slice(1).toLowerCase()}`,
    },
    {
      key: 'collectionDate',
      label: 'Date',
      render: (row) => (row.collectionDate ? new Date(row.collectionDate).toLocaleDateString() : '—'),
    },
  ];

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: '0.3rem 0 0' }}>
          Welcome back, {user?.fullName || user?.username}. Here's what's happening across operations.
        </p>
      </div>

      {loading && <Loading label="Loading dashboard…" />}
      {error && <div style={{ color: 'var(--color-danger)' }}>{error}</div>}

      {stats && (
        <>
          <StaffPanel
            staff={stats.staff}
            isSuperAdmin={isSuperAdmin}
            businessId={viewingBusiness?.id}
            onStaffAdded={loadDashboard}
          />

          <div
            className="stat-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            {CARD_DEFS.map((card) => (
              <div
                key={card.key}
                style={{
                  background: '#fff',
                  border: '1px solid var(--color-border)',
                  borderTop: `3px solid ${card.color}`,
                  borderRadius: 'var(--radius)',
                  padding: '1.1rem',
                }}
              >
                <div style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>{card.icon}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: card.color }}>
                  {stats[card.key] ?? 0}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{card.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <SummaryCard
              title="Waste Collected This Month"
              value={`${(stats.totalCollectedTonsThisMonth ?? 0).toLocaleString()} Tons`}
              icon="⚖️"
            />
            <SummaryCard
              title="Waste Disposed This Month"
              value={`${(stats.totalDisposedTonsThisMonth ?? 0).toLocaleString()} Tons`}
              icon="♻️"
            />
          </div>

          <div>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem' }}>Recent Collections</h3>
            <DataTable
              columns={collectionColumns}
              data={recentCollections}
              loading={false}
              emptyMessage="No collections recorded yet."
            />
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ title, value, icon }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '1.25rem' }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
        {icon} {title}
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)' }}>{value}</div>
    </div>
  );
}

// Who's actually responsible for this municipality's day-to-day operations —
// mainly useful when a SUPER_ADMIN is viewing a municipality's dashboard and
// wants to know who to contact, but shown to everyone for consistency.
function StaffPanel({ staff, isSuperAdmin, businessId, onStaffAdded }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', email: '', fullName: '', role: 'ADMIN' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const isEmpty = !staff || staff.length === 0;

  const openModal = () => {
    setForm({ username: '', password: '', email: '', fullName: '', role: 'ADMIN' });
    setFormError('');
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await businessService.addFirstStaff(businessId, form);
      setModalOpen(false);
      onStaffAdded?.();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create this account.');
    } finally {
      setSaving(false);
    }
  };

  const formatLastLogin = (value) => {
    if (!value) return 'Never logged in';
    return `Last login ${new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  return (
    <>
      {isEmpty ? (
        <div style={{
          background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
          padding: '1rem 1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
        }}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            No staff accounts have been added to this municipality yet.
          </span>
          {isSuperAdmin && businessId && (
            <Button size="sm" onClick={openModal}>+ Add Admin Account</Button>
          )}
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '1rem 1.1rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.7rem', fontSize: '0.95rem' }}>Responsible Staff</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {staff.map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  padding: '0.4rem 0.7rem',
                  opacity: s.enabled ? 1 : 0.55,
                }}
                title={s.enabled ? formatLastLogin(s.lastLoginAt) : 'Account disabled'}
              >
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '999px',
                    background: s.role === 'ADMIN' ? 'var(--color-primary)' : 'var(--color-black)',
                    color: '#fff',
                  }}
                >
                  {s.role}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.fullName}</span>
                {s.email && <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{s.email}</span>}
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>· {formatLastLogin(s.lastLoginAt)}</span>
                {!s.enabled && <span style={{ fontSize: '0.72rem', color: 'var(--color-danger)' }}>(disabled)</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Admin Account"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Creating…' : 'Create Account'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 0 }}>
            This municipality has no staff yet, so no one can currently manage it themselves.
            This creates their first account.
          </p>
          <Field label="Full Name"><input name="fullName" value={form.fullName} onChange={handleChange} required style={inputStyle} /></Field>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Field label="Username"><input name="username" value={form.username} onChange={handleChange} required style={inputStyle} /></Field>
            <Field label="Role">
              <select name="role" value={form.role} onChange={handleChange} style={inputStyle}>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
              </select>
            </Field>
          </div>
          <Field label="Email"><input name="email" type="email" value={form.email} onChange={handleChange} required style={inputStyle} /></Field>
          <Field label="Temporary Password"><input name="password" type="password" value={form.password} onChange={handleChange} required minLength={6} style={inputStyle} /></Field>
          {formError && <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>{formError}</div>}
        </form>
      </Modal>
    </>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '0.9rem', flex: 1 }}>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.65rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  fontSize: '0.88rem',
};
