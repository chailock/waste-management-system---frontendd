import React, { useEffect, useState } from 'react';
import vehicleService from '../services/vehicleService';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = {
  registrationNumber: '',
  make: '',
  model: '',
  capacity: '',
  status: 'ACTIVE',
  licenseExpiry: '',
  roadworthyExpiry: '',
};

// Highlights an upcoming expiry the same way across licence + roadworthy dates.
function expiryWarning(dateStr) {
  if (!dateStr) return null;
  const days = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { text: `Expired ${Math.abs(days)}d ago`, danger: true };
  if (days <= 30) return { text: `Expires in ${days}d`, danger: days <= 14 };
  return null;
}

export default function Vehicles() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadVehicles = () => {
    setLoading(true);
    vehicleService
      .getAll()
      .then(setVehicles)
      .catch(() => setError('Failed to load vehicles.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadVehicles, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (vehicle) => {
    setEditingId(vehicle.id);
    setForm({
      registrationNumber: vehicle.registrationNumber || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      capacity: vehicle.capacity ?? '',
      status: vehicle.status || 'ACTIVE',
      licenseExpiry: vehicle.licenseExpiry || '',
      roadworthyExpiry: vehicle.roadworthyExpiry || '',
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
      ...form,
      capacity: form.capacity === '' ? null : parseFloat(form.capacity),
      licenseExpiry: form.licenseExpiry || null,
      roadworthyExpiry: form.roadworthyExpiry || null,
    };
    try {
      if (editingId) {
        await vehicleService.update(editingId, payload);
      } else {
        await vehicleService.create(payload);
      }
      setModalOpen(false);
      loadVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save vehicle.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle? This cannot be undone.')) return;
    try {
      await vehicleService.remove(id);
      loadVehicles();
    } catch {
      alert('Failed to delete vehicle.');
    }
  };

  const columns = [
    { key: 'registrationNumber', label: 'Registration' },
    { key: 'vehicle', label: 'Vehicle', render: (row) => [row.make, row.model].filter(Boolean).join(' ') || '—' },
    {
      key: 'capacity',
      label: 'Capacity',
      render: (row) => (row.capacity != null ? `${row.capacity} Ton` : '—'),
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'expiry',
      label: 'Licence / Roadworthy',
      render: (row) => {
        const licence = expiryWarning(row.licenseExpiry);
        const roadworthy = expiryWarning(row.roadworthyExpiry);
        if (!licence && !roadworthy) return <span style={{ color: 'var(--color-text-muted)' }}>—</span>;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {licence && (
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: licence.danger ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                ⚠ Licence: {licence.text}
              </span>
            )}
            {roadworthy && (
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: roadworthy.danger ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                ⚠ Roadworthy: {roadworthy.text}
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Vehicles</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '0.3rem 0 0' }}>Fleet used for waste collection and disposal.</p>
        </div>
        {!isSuperAdmin && <Button onClick={openCreate}>+ Add Vehicle</Button>}
      </div>

      <DataTable
        columns={columns}
        data={vehicles}
        loading={loading}
        emptyMessage="No vehicles recorded yet."
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
        title={isSuperAdmin ? 'View Vehicle' : (editingId ? 'Edit Vehicle' : 'Add Vehicle')}
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
          <Field label="Registration Number"><input name="registrationNumber" value={form.registrationNumber} onChange={handleChange} required disabled={isSuperAdmin} style={inputStyle} /></Field>
          <div className="form-row" style={{ display: 'flex', gap: '0.75rem' }}>
            <Field label="Make"><input name="make" value={form.make} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle} /></Field>
            <Field label="Model"><input name="model" value={form.model} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle} /></Field>
          </div>
          <div className="form-row" style={{ display: 'flex', gap: '0.75rem' }}>
            <Field label="Capacity (Tons)"><input name="capacity" type="number" step="0.1" value={form.capacity} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle} /></Field>
            <Field label="Status">
              <select name="status" value={form.status} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle}>
                <option value="ACTIVE">Active</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
            </Field>
          </div>
          <div className="form-row" style={{ display: 'flex', gap: '0.75rem' }}>
            <Field label="Licence Expiry"><input name="licenseExpiry" type="date" value={form.licenseExpiry} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle} /></Field>
            <Field label="Roadworthy Expiry"><input name="roadworthyExpiry" type="date" value={form.roadworthyExpiry} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle} /></Field>
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
