import React, { useEffect, useState } from 'react';
import complianceService from '../services/complianceService';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const DOCUMENT_TYPES = [
  'Waste Management Licence',
  'Insurance Certificate',
  'Vehicle Licence',
  'Roadworthy Certificate',
  'Training Certificate',
  'Environmental Permit',
  'Contract',
  'Other',
];

const EMPTY_FORM = {
  documentName: '',
  documentType: DOCUMENT_TYPES[0],
  fileName: '',
  fileUrl: '',
  issueDate: '',
  expiryDate: '',
};

export default function Compliance() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadDocuments = () => {
    setLoading(true);
    complianceService
      .getAll()
      .then((data) => setDocuments(data.sort((a, b) => (a.expiryDate || '').localeCompare(b.expiryDate || ''))))
      .catch(() => setError('Failed to load compliance documents.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadDocuments, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (doc) => {
    setEditingId(doc.id);
    setForm({
      documentName: doc.documentName || '',
      documentType: doc.documentType || DOCUMENT_TYPES[0],
      fileName: doc.fileName || '',
      fileUrl: doc.fileUrl || '',
      issueDate: doc.issueDate || '',
      expiryDate: doc.expiryDate || '',
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
    try {
      if (editingId) {
        await complianceService.update(editingId, form);
      } else {
        await complianceService.create(form);
      }
      setModalOpen(false);
      loadDocuments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save document.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this compliance document? This cannot be undone.')) return;
    try {
      await complianceService.remove(id);
      loadDocuments();
    } catch {
      alert('Failed to delete document.');
    }
  };

  const columns = [
    { key: 'documentName', label: 'Document' },
    { key: 'documentType', label: 'Type' },
    { key: 'issueDate', label: 'Issued' },
    { key: 'expiryDate', label: 'Expires' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Compliance Documents</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '0.3rem 0 0' }}>
            Licences, certificates and permits. Status updates automatically as documents approach their expiry date.
          </p>
        </div>
        {isAdmin && <Button onClick={openCreate}>+ Add Document</Button>}
      </div>

      {!isAdmin && !isSuperAdmin && (
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
          Compliance documents are managed by administrators. You can view them here.
        </p>
      )}

      <DataTable
        columns={columns}
        data={documents}
        loading={loading}
        emptyMessage="No compliance documents yet."
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
        title={isSuperAdmin ? 'View Document' : (editingId ? 'Edit Document' : 'Add Document')}
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
          <Field label="Document Name"><input name="documentName" value={form.documentName} onChange={handleChange} required disabled={isSuperAdmin} style={inputStyle} placeholder="e.g. Volksrust Landfill Operating Permit" /></Field>
          <Field label="Document Type">
            <select name="documentType" value={form.documentType} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle}>
              {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <div className="form-row" style={{ display: 'flex', gap: '0.75rem' }}>
            <Field label="File Name"><input name="fileName" value={form.fileName} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle} placeholder="permit-2026.pdf" /></Field>
            <Field label="File URL"><input name="fileUrl" value={form.fileUrl} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle} placeholder="https://…" /></Field>
          </div>
          <div className="form-row" style={{ display: 'flex', gap: '0.75rem' }}>
            <Field label="Issue Date"><input name="issueDate" type="date" value={form.issueDate} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle} /></Field>
            <Field label="Expiry Date"><input name="expiryDate" type="date" value={form.expiryDate} onChange={handleChange} disabled={isSuperAdmin} style={inputStyle} /></Field>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            Status (Valid / Expiring Soon / Expired) is calculated automatically from the expiry date.
          </p>
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
