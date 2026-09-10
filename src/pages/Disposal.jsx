import React, { useEffect, useState } from 'react';
import disposalService from '../services/disposalService';
import collectionService from '../services/collectionService';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const METHODS = ['LANDFILL', 'RECYCLING', 'COMPOSTING', 'TRANSFER_STATION', 'OTHER'];

const EMPTY_FORM = {
  collectionId: '',
  quantity: '',
  wasteType: '',
  disposalDate: '',
  method: 'LANDFILL',
  notes: '',
};

const toDatetimeLocal = (iso) => (iso ? iso.slice(0, 16) : '');
const collectionCode = (id) => `COL-${String(id).padStart(3, '0')}`;

export default function Disposal() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [disposals, setDisposals] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAll = () => {
    setLoading(true);
    Promise.all([disposalService.getAll(), collectionService.getAll()])
      .then(([disposalData, collectionData]) => {
        setDisposals(disposalData.sort((a, b) => new Date(b.disposalDate) - new Date(a.disposalDate)));
        setCollections(collectionData);
      })
      .catch(() => setError('Failed to load disposal records.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, disposalDate: new Date().toISOString().slice(0, 16) });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      collectionId: row.collection?.id || '',
      quantity: row.quantity ?? '',
      wasteType: row.wasteType || '',
      disposalDate: toDatetimeLocal(row.disposalDate),
      method: row.method || 'LANDFILL',
      notes: row.notes || '',
    });
    setError('');
    setModalOpen(true);
  };

  // Prefill quantity/waste type from the chosen collection to save re-typing,
  // while still allowing the disposed amount to be corrected if it differs.
  const handleCollectionChange = (e) => {
    const collectionId = e.target.value;
    const source = collections.find((c) => String(c.id) === collectionId);
    setForm((prev) => ({
      ...prev,
      collectionId,
      quantity: source ? source.quantity : prev.quantity,
      wasteType: source ? source.wasteType : prev.wasteType,
    }));
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      quantity: form.quantity === '' ? null : parseFloat(form.quantity),
      wasteType: form.wasteType,
      disposalDate: form.disposalDate,
      method: form.method,
      notes: form.notes,
      collection: form.collectionId ? { id: Number(form.collectionId) } : null,
    };
    try {
      if (editingId) {
        await disposalService.update(editingId, payload);
      } else {
        await disposalService.create(payload);
      }
      setModalOpen(false);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save disposal record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this disposal record?')) return;
    try {
      await disposalService.remove(id);
      loadAll();
    } catch {
      alert('Failed to delete disposal record.');
    }
  };

  const columns = [
    {
      key: 'collection',
      label: 'Collection',
      render: (row) => (row.collection ? collectionCode(row.collection.id) : '—'),
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (row) => `${row.quantity ?? 0} Ton`,
    },
    { key: 'method', label: 'Method', render: (row) => <StatusBadge status={row.method} /> },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Disposal</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '0.3rem 0 0' }}>What happened to each waste collection after pickup.</p>
        </div>
        {!isSuperAdmin && <Button onClick={openCreate}>+ Record Disposal</Button>}
      </div>

      <DataTable
        columns={columns}
        data={disposals}
        loading={loading}
        emptyMessage="No disposal records yet."
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
        title={isSuperAdmin ? 'View Disposal' : (editingId ? 'Edit Disposal' : 'Record Disposal')}
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
          <Field label="Collection">
            <select name="collectionId" value={form.collectionId} onChange={handleCollectionChange} required disabled={isSuperAdmin} style={inputStyle}>
              <option value="">— Select a collection —</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {collectionCode(c.id)} — {c.site?.name || 'Unknown site'} ({c.quantity} {c.unit})
                </option>
              ))}
            </select>
          </Field>
          <div className="form-row" style={{ display: 'flex', gap: '0.75rem' }}>
            <Field label="Quantity (Ton)"><input name="quantity" type="number" step="0.01" value={form.quantity} onChange={handleChange} required disabled={isSuperAdmin} style={inputStyle} /></Field>
            <Field label="Method">
              <select name="method" value={form.method} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle}>
                {METHODS.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Disposal Date & Time">
            <input name="disposalDate" type="datetime-local" value={form.disposalDate} onChange={handleChange} required disabled={isSuperAdmin} style={inputStyle} />
          </Field>
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
