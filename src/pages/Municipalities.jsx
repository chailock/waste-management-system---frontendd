import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import businessService from '../services/businessService';
import Loading from '../components/Loading';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';

export default function Municipalities() {
  const { enterBusiness } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    businessService
      .getAll()
      .then(setBusinesses)
      .catch(() => setError('Failed to load municipalities.'))
      .finally(() => setLoading(false));
  }, []);

  const openMunicipality = (business) => {
    enterBusiness(business);
    navigate('/dashboard');
  };

  const handleToggleActive = async (business, e) => {
    e.stopPropagation();
    const suspending = business.active;
    const message = suspending
      ? `Suspend ${business.name}? Their staff will not be able to log in until reactivated.`
      : `Reactivate ${business.name}? Their staff will be able to log in again.`;
    if (!window.confirm(message)) return;

    setTogglingId(business.id);
    try {
      const updated = await businessService.setActive(business.id, !business.active);
      setBusinesses((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    } catch (err) {
      window.alert(err.response?.data?.message || 'Failed to update this municipality\'s status.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Municipalities</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: '0.3rem 0 0' }}>
          Every municipality on the platform. Click one to view its full dashboard.
        </p>
      </div>

      {loading && <Loading label="Loading municipalities…" />}
      {error && <div style={{ color: 'var(--color-danger)' }}>{error}</div>}

      {!loading && !error && businesses.length === 0 && (
        <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius)' }}>
          No municipalities have signed up yet.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {businesses.map((b) => (
          <div
            key={b.id}
            role="button"
            tabIndex={0}
            onClick={() => openMunicipality(b)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openMunicipality(b);
              }
            }}
            style={{
              textAlign: 'left',
              background: '#fff',
              border: '1px solid var(--color-border)',
              borderTop: `3px solid ${b.active ? 'var(--color-primary)' : 'var(--color-danger)'}`,
              borderRadius: 'var(--radius)',
              padding: '1.1rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.02rem' }}>{b.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{b.address || b.contactEmail || '—'}</div>
                </div>
                <Badge count={b.unreadMessageCount} />
              </div>
              <StatusBadge status={b.active ? 'ACTIVE' : 'INACTIVE'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.78rem' }}>
              <Stat label="Sites" value={b.siteCount} />
              <Stat label="Vehicles" value={b.vehicleCount} />
              <Stat label="Routes" value={b.activeRouteCount} />
              <Stat label="Incidents" value={b.openIncidentCount} danger={b.openIncidentCount > 0} />
              <Stat label="Contracts" value={b.activeContractCount} />
              <Stat label="Collected" value={`${(b.totalCollectedTonsThisMonth ?? 0).toFixed(1)}t`} />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
              <Button size="sm" style={{ flex: 1 }}>Open Dashboard →</Button>
              <Button
                size="sm"
                variant={b.active ? 'danger' : 'secondary'}
                disabled={togglingId === b.id}
                onClick={(e) => handleToggleActive(b, e)}
              >
                {togglingId === b.id ? 'Working…' : b.active ? 'Suspend' : 'Reactivate'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, danger }) {
  return (
    <div>
      <div style={{ fontWeight: 800, color: danger ? 'var(--color-danger)' : 'var(--color-black)' }}>{value}</div>
      <div style={{ color: 'var(--color-text-muted)' }}>{label}</div>
    </div>
  );
}
