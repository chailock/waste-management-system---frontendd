import React, { useEffect, useState } from 'react';
import landfillService from '../services/landfillService';
import disposalService from '../services/disposalService';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = {
  landfillName: '',
  landfillLocation: '',
  weighbridgeNumber: '',
  quantity: '',
  wasteType: '',
  disposalDate: '',
  ticketNumber: '',
  notes: '',
  disposalId: '',
};

export default function Landfills() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [records, setRecords] = useState([]);
  const [disposals, setDisposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAll = () => {
    setLoading(true);
    Promise.all([landfillService.getAll(), disposalService.getAll()])
      .then(([recordData, disposalData]) => {
        setRecords(recordData.sort((a, b) => new Date(b.disposalDate) - new Date(a.disposalDate)));
        setDisposals(disposalData);
      })
      .catch(() => setError('Failed to load landfill records.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, disposalDate: new Date().toISOString().slice(0, 10) });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      landfillName: row.landfillName || '',
      landfillLocation: row.landfillLocation || '',
      weighbridgeNumber: row.weighbridgeNumber || '',
      quantity: row.quantity ?? '',
      wasteType: row.wasteType || '',
      disposalDate: row.disposalDate || '',
      ticketNumber: row.ticketNumber || '',
      notes: row.notes || '',
      disposalId: row.disposal?.id || '',
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
      landfillName: form.landfillName,
      landfillLocation: form.landfillLocation,
      weighbridgeNumber: form.weighbridgeNumber,
      quantity: form.quantity === '' ? null : parseFloat(form.quantity),
      wasteType: form.wasteType,
      disposalDate: form.disposalDate,
      ticketNumber: form.ticketNumber,
      notes: form.notes,
      disposal: form.disposalId ? { id: Number(form.disposalId) } : null,
    };
    try {
      if (editingId) {
        await landfillService.update(editingId, payload);
      } else {
        await landfillService.create(payload);
      }
      setModalOpen(false);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save landfill record. The ticket number may already be in use.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this landfill record?')) return;
    try {
      await landfillService.remove(id);
      loadAll();
    } catch {
      alert('Failed to delete landfill record.');
    }
  };

  const columns = [
    { key: 'landfillName', label: 'Landfill' },
    { key: 'ticketNumber', label: 'Ticket', render: (row) => row.ticketNumber || '—' },
    { key: 'wasteType', label: 'Waste' },
    { key: 'quantity', label: 'Weight', render: (row) => `${row.quantity ?? 0} Ton` },
    { key: 'disposalDate', label: 'Date' },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Landfill Records</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '0.3rem 0 0' }}>Weighbridge tickets confirming loads reached a landfill.</p>
        </div>
        {!isSuperAdmin && <Button onClick={openCreate}>+ Add Landfill Record</Button>}
      </div>

      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        emptyMessage="No landfill records yet."
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
        title={isSuperAdmin ? 'View Landfill Record' : (editingId ? 'Edit Landfill Record' : 'Add Landfill Record')}
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
          <div className="form-row" style={{ display: 'flex', gap: '0.75rem' }}>
            <Field label="Landfill Name"><input name="landfillName" value={form.landfillName} onChange={handleChange} required disabled={isSuperAdmin} style={inputStyle} /></Field>
            <Field label="Location"><input name="landfillLocation" value={form.landfillLocation} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle} /></Field>
          </div>
          <div className="form-row" style={{ display: 'flex', gap: '0.75rem' }}>
            <Field label="Ticket Number">
              <input name="ticketNumber" value={form.ticketNumber} onChange={handleChange} required disabled={isSuperAdmin} style={inputStyle} placeholder="e.g. VL-2026-000182" />
            </Field>
            <Field label="Weighbridge Number"><input name="weighbridgeNumber" value={form.weighbridgeNumber} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle} /></Field>
          </div>
          <div className="form-row" style={{ display: 'flex', gap: '0.75rem' }}>
            <Field label="Weight (Ton)"><input name="quantity" type="number" step="0.01" value={form.quantity} onChange={handleChange} required disabled={isSuperAdmin} style={inputStyle} /></Field>
            <Field label="Waste Type"><input name="wasteType" value={form.wasteType} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle} /></Field>
          </div>
          <Field label="Disposal Date"><input name="disposalDate" type="date" value={form.disposalDate} onChange={handleChange} required disabled={isSuperAdmin} style={inputStyle} /></Field>
          <Field label="Linked Disposal (optional)">
            <select name="disposalId" value={form.disposalId} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle}>
              <option value="">— None —</option>
              {disposals.map((d) => (
                <option key={d.id} value={d.id}>Disposal #{d.id} — {d.quantity} Ton ({d.method})</option>
              ))}
            </select>
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
