import React, { useEffect, useState } from 'react';
import siteService from '../services/siteService';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const WASTE_TYPES = ['GENERAL', 'PLASTIC', 'ORGANIC', 'RECYCLABLE', 'PAPER', 'HAZARDOUS', 'OTHER'];

const EMPTY_FORM = {
  name: '',
  address: '',
  contactPerson: '',
  contactPhone: '',
  wasteType: 'GENERAL',
  active: true,
};

export default function Sites() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadSites = () => {
    setLoading(true);
    siteService
      .getAll()
      .then(setSites)
      .catch(() => setError('Failed to load sites.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadSites, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (site) => {
    setEditingId(site.id);
    setForm({
      name: site.name || '',
      address: site.address || '',
      contactPerson: site.contactPerson || '',
      contactPhone: site.contactPhone || '',
      wasteType: site.wasteType || 'GENERAL',
      active: site.active ?? true,
    });
    setError('');
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await siteService.update(editingId, form);
      } else {
        await siteService.create(form);
      }
      setModalOpen(false);
      loadSites();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save site.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this site? This cannot be undone.')) return;
    try {
      await siteService.remove(id);
      loadSites();
    } catch {
      alert('Failed to delete site.');
    }
  };

  const columns = [
    { key: 'name', label: 'Site' },
    { key: 'address', label: 'Address' },
    {
      key: 'wasteType',
      label: 'Waste',
      render: (row) => <StatusBadge status={row.wasteType} />,
    },
    {
      key: 'active',
      label: 'Status',
      render: (row) => <StatusBadge status={row.active ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Sites</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '0.3rem 0 0' }}>
            Shopping centres, factories, schools and other premises where waste is collected.
          </p>
        </div>
        {!isSuperAdmin && <Button onClick={openCreate}>+ Add Site</Button>}
      </div>

      <DataTable
        columns={columns}
        data={sites}
        loading={loading}
        emptyMessage="No sites recorded yet."
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
        title={isSuperAdmin ? 'View Site' : (editingId ? 'Edit Site' : 'Add Site')}
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
          <Field label="Site Name"><input name="name" value={form.name} onChange={handleChange} required disabled={isSuperAdmin} style={inputStyle} /></Field>
          <Field label="Address"><input name="address" value={form.address} onChange={handleChange} required disabled={isSuperAdmin} style={inputStyle} /></Field>
          <div className="form-row" style={{ display: 'flex', gap: '0.75rem' }}>
            <Field label="Contact Person"><input name="contactPerson" value={form.contactPerson} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle} /></Field>
            <Field label="Contact Phone"><input name="contactPhone" value={form.contactPhone} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle} /></Field>
          </div>
          <Field label="Primary Waste Type">
            <select name="wasteType" value={form.wasteType} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle}>
              {WASTE_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
            </select>
          </Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', marginBottom: '0.5rem' }}>
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange} disabled={isSuperAdmin} />
            Site is active
          </label>
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
