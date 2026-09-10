import React, { useEffect, useState } from 'react';
import routeService from '../services/routeService';
import vehicleService from '../services/vehicleService';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = {
  name: '',
  routeDate: '',
  vehicleId: '',
  driverName: '',
  driverPhone: '',
  status: 'PLANNED',
};

export default function RoutesPage() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAll = () => {
    setLoading(true);
    Promise.all([routeService.getAll(), vehicleService.getAll()])
      .then(([routeData, vehicleData]) => {
        setRoutes(routeData);
        setVehicles(vehicleData);
      })
      .catch(() => setError('Failed to load routes.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (route) => {
    setEditingId(route.id);
    setForm({
      name: route.name || '',
      routeDate: route.routeDate || '',
      vehicleId: route.vehicle?.id || '',
      driverName: route.driverName || '',
      driverPhone: route.driverPhone || '',
      status: route.status || 'PLANNED',
    });
    setError('');
    setModalOpen(true);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      name: form.name,
      routeDate: form.routeDate,
      driverName: form.driverName,
      driverPhone: form.driverPhone,
      status: form.status,
      vehicle: form.vehicleId ? { id: Number(form.vehicleId) } : null,
    };
    try {
      if (editingId) {
        await routeService.update(editingId, payload);
      } else {
        await routeService.create(payload);
      }
      setModalOpen(false);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save route.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this route? This cannot be undone.')) return;
    try {
      await routeService.remove(id);
      loadAll();
    } catch {
      alert('Failed to delete route.');
    }
  };

  const columns = [
    { key: 'name', label: 'Route' },
    { key: 'routeDate', label: 'Date' },
    { key: 'vehicle', label: 'Vehicle', render: (row) => row.vehicle?.registrationNumber || '—' },
    { key: 'driverName', label: 'Driver' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Collection Routes</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '0.3rem 0 0' }}>Planned collection runs with vehicle and driver assignments.</p>
        </div>
        {!isSuperAdmin && <Button onClick={openCreate}>+ Create Route</Button>}
      </div>

      <DataTable
        columns={columns}
        data={routes}
        loading={loading}
        emptyMessage="No routes created yet."
        actions={(row) => (
          isSuperAdmin ? (
            <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>View</Button>
          ) : (
            <>
              <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>Edit</Button>
              {isAdmin && (
                <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>Delete</Button>
              )}
            </>
          )
        )}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isSuperAdmin ? 'View Route' : (editingId ? 'Edit Route' : 'Create Route')}
        footer={
          isSuperAdmin ? (
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Close</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </>
          )
        }
      >
        <form onSubmit={handleSubmit}>
          <Field label="Route Name"><input name="name" value={form.name} onChange={handleChange} required disabled={isSuperAdmin} style={inputStyle} placeholder="e.g. Route 001" /></Field>
          <div className="form-row" style={{ display: 'flex', gap: '0.75rem' }}>
            <Field label="Date"><input name="routeDate" type="date" value={form.routeDate} onChange={handleChange} required disabled={isSuperAdmin} style={inputStyle} /></Field>
            <Field label="Status">
              <select name="status" value={form.status} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle}>
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </Field>
          </div>
          <Field label="Vehicle">
            <select name="vehicleId" value={form.vehicleId} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle}>
              <option value="">— None —</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.registrationNumber} {v.make ? `(${v.make})` : ''}</option>
              ))}
            </select>
          </Field>
          <div className="form-row" style={{ display: 'flex', gap: '0.75rem' }}>
            <Field label="Driver Name"><input name="driverName" value={form.driverName} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle} /></Field>
            <Field label="Driver Phone"><input name="driverPhone" value={form.driverPhone} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle} /></Field>
          </div>
          {error && <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>{error}</div>}
        </form>
      </Modal>
    </div>
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
