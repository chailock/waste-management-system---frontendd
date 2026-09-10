import React, { useEffect, useState } from 'react';
import auditLogService from '../services/auditLogService';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

export default function AuditLog() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    auditLogService
      .getRecent()
      .then(setEntries)
      .catch(() => setError('Failed to load the audit log.'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      key: 'createdAt',
      label: 'When',
      render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString(undefined, {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      }) : '—'),
    },
    { key: 'businessName', label: 'Municipality', render: (row) => row.businessName || '— Platform —' },
    {
      key: 'actor',
      label: 'Who',
      render: (row) => (
        <span>
          {row.actorUsername} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>({row.actorRole})</span>
        </span>
      ),
    },
    { key: 'action', label: 'Action', render: (row) => <StatusBadge status={row.action} /> },
    { key: 'description', label: 'Details' },
  ];

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0 }}>Audit Log</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: '0.3rem 0 0' }}>
          Recent platform activity — logins, staff changes, and municipality status changes. Showing the most recent 200 events.
        </p>
      </div>

      {error && <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}

      <DataTable
        columns={columns}
        data={entries}
        loading={loading}
        emptyMessage="No activity recorded yet."
      />
    </div>
  );
}
