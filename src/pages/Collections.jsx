import React, { useEffect, useState } from 'react';
import collectionService from '../services/collectionService';
import siteService from '../services/siteService';
import routeService from '../services/routeService';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

const WASTE_TYPES = ['GENERAL', 'PLASTIC', 'ORGANIC', 'RECYCLABLE', 'PAPER', 'HAZARDOUS', 'OTHER'];
const UNITS = ['TON', 'KG'];

const EMPTY_FORM = {
  siteId: '',
  routeId: '',
  wasteType: 'GENERAL',
  quantity: '',
  unit: 'TON',
  collectionDate: '',
  notes: '',
};

const toDatetimeLocal = (iso) => (iso ? iso.slice(0, 16) : '');

export default function Collections() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [collections, setCollections] = useState([]);
  const [sites, setSites] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAll = () => {
    setLoading(true);
    Promise.all([collectionService.getAll(), siteService.getAll(), routeService.getAll()])
      .then(([collectionData, siteData, routeData]) => {
        setCollections(
          collectionData.sort((a, b) => new Date(b.collectionDate) - new Date(a.collectionDate))
        );
        setSites(siteData);
        setRoutes(routeData);
      })
      .catch(() => setError('Failed to load collections.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, collectionDate: new Date().toISOString().slice(0, 16) });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      siteId: row.site?.id || '',
      routeId: row.route?.id || '',
      wasteType: row.wasteType || 'GENERAL',
      quantity: row.quantity ?? '',
      unit: row.unit || 'TON',
      collectionDate: toDatetimeLocal(row.collectionDate),
      notes: row.notes || '',
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
      wasteType: form.wasteType,
      quantity: form.quantity === '' ? null : parseFloat(form.quantity),
      unit: form.unit,
      collectionDate: form.collectionDate,
      notes: form.notes,
      site: form.siteId ? { id: Number(form.siteId) } : null,
      route: form.routeId ? { id: Number(form.routeId) } : null,
    };
    try {
      if (editingId) {
        await collectionService.update(editingId, payload);
      } else {
        await collectionService.create(payload);
      }
      setModalOpen(false);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save collection.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this collection record?')) return;
    try {
      await collectionService.remove(id);
      loadAll();
    } catch {
      alert('Failed to delete collection.');
    }
  };

  const columns = [
    {
      key: 'collectionDate',
      label: 'Date',
      render: (row) => (row.collectionDate ? new Date(row.collectionDate).toLocaleDateString() : '—'),
    },
    { key: 'site', label: 'Site', render: (row) => row.site?.name || '—' },
    { key: 'wasteType', label: 'Waste' },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (row) => `${row.quantity ?? 0} ${(row.unit || 'TON').charAt(0) + (row.unit || 'TON').slice(1).toLowerCase()}`,
    },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Waste Collections</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '0.3rem 0 0' }}>Actual waste picked up from each site.</p>
        </div>
        {!isSuperAdmin && <Button onClick={openCreate}>+ Record Collection</Button>}
      </div>

      <DataTable
        columns={columns}
        data={collections}
        loading={loading}
        emptyMessage="No collections recorded yet."
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
        title={isSuperAdmin ? 'View Collection' : (editingId ? 'Edit Collection' : 'Record Collection')}
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
          <Field label="Site">
            <select name="siteId" value={form.siteId} onChange={handleChange} required disabled={isSuperAdmin} style={inputStyle}>
              <option value="">— Select a site —</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Route (optional)">
            <select name="routeId" value={form.routeId} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle}>
              <option value="">— None —</option>
              {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <div className="form-row" style={{ display: 'flex', gap: '0.75rem' }}>
            <Field label="Waste Type">
              <select name="wasteType" value={form.wasteType} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle}>
                {WASTE_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
              </select>
            </Field>
            <Field label="Date & Time">
              <input name="collectionDate" type="datetime-local" value={form.collectionDate} onChange={handleChange} required disabled={isSuperAdmin} style={inputStyle} />
            </Field>
          </div>
          <div className="form-row" style={{ display: 'flex', gap: '0.75rem' }}>
            <Field label="Quantity">
              <input name="quantity" type="number" step="0.01" value={form.quantity} onChange={handleChange} required disabled={isSuperAdmin} style={inputStyle} />
            </Field>
            <Field label="Unit">
              <select name="unit" value={form.unit} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Notes"><textarea name="notes" value={form.notes} onChange={handleChange} rows={2} disabled={isSuperAdmin} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
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
