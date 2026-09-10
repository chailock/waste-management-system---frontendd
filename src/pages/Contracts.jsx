import React, { useEffect, useState } from 'react';
import contractService from '../services/contractService';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED'];

const EMPTY_FORM = {
  contractNumber: '',
  clientName: '',
  description: '',
  startDate: '',
  endDate: '',
  monthlyValue: '',
  status: 'PENDING',
};

export default function Contracts() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadContracts = () => {
    setLoading(true);
    contractService
      .getAll()
      .then(setContracts)
      .catch(() => setError('Failed to load contracts.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadContracts, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (contract) => {
    setEditingId(contract.id);
    setForm({
      contractNumber: contract.contractNumber || '',
      clientName: contract.clientName || '',
      description: contract.description || '',
      startDate: contract.startDate || '',
      endDate: contract.endDate || '',
      monthlyValue: contract.monthlyValue ?? '',
      status: contract.status || 'PENDING',
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
      monthlyValue: form.monthlyValue === '' ? null : parseFloat(form.monthlyValue),
    };
    try {
      if (editingId) {
        await contractService.update(editingId, payload);
      } else {
        await contractService.create(payload);
      }
      setModalOpen(false);
      loadContracts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save contract.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contract? This cannot be undone.')) return;
    try {
      await contractService.remove(id);
      loadContracts();
    } catch {
      alert('Failed to delete contract.');
    }
  };

  const columns = [
    { key: 'contractNumber', label: 'Contract #' },
    { key: 'clientName', label: 'Client' },
    { key: 'startDate', label: 'Start' },
    { key: 'endDate', label: 'End' },
    {
      key: 'monthlyValue',
      label: 'Monthly Value',
      render: (row) => (row.monthlyValue != null ? `R ${Number(row.monthlyValue).toLocaleString()}` : '—'),
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Contracts</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '0.3rem 0 0' }}>Service agreements with clients and contractors.</p>
        </div>
        {isAdmin && <Button onClick={openCreate}>+ Add Contract</Button>}
      </div>

      {!isAdmin && !isSuperAdmin && (
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
          Contracts are managed by administrators. You can view them here.
        </p>
      )}

      <DataTable
        columns={columns}
        data={contracts}
        loading={loading}
        emptyMessage="No contracts recorded yet."
        actions={
          isSuperAdmin
            ? (row) => <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>View</Button>
            : isAdmin
            ? (row) => (
                <>
                  <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>Delete</Button>
                </>
              )
            : undefined
        }
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isSuperAdmin ? 'View Contract' : (editingId ? 'Edit Contract' : 'Add Contract')}
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
            <Field label="Contract Number"><input name="contractNumber" value={form.contractNumber} onChange={handleChange} required disabled={isSuperAdmin} style={inputStyle} /></Field>
            <Field label="Client Name"><input name="clientName" value={form.clientName} onChange={handleChange} required disabled={isSuperAdmin} style={inputStyle} /></Field>
          </div>
          <Field label="Description"><textarea name="description" value={form.description} onChange={handleChange} rows={2} disabled={isSuperAdmin} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
          <div className="form-row" style={{ display: 'flex', gap: '0.75rem' }}>
            <Field label="Start Date"><input name="startDate" type="date" value={form.startDate} onChange={handleChange} required disabled={isSuperAdmin} style={inputStyle} /></Field>
            <Field label="End Date"><input name="endDate" type="date" value={form.endDate} onChange={handleChange} required disabled={isSuperAdmin} style={inputStyle} /></Field>
          </div>
          <div className="form-row" style={{ display: 'flex', gap: '0.75rem' }}>
            <Field label="Monthly Value (ZAR)"><input name="monthlyValue" type="number" step="0.01" value={form.monthlyValue} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle} /></Field>
            <Field label="Status">
              <select name="status" value={form.status} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
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
