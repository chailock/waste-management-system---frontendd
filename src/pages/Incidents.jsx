import React, { useEffect, useState } from 'react';
import incidentService from '../services/incidentService';
import photoService from '../services/photoService';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import FileUpload from '../components/FileUpload';
import { useAuth } from '../context/AuthContext';

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUSES = ['OPEN', 'INVESTIGATING', 'RESOLVED'];

const EMPTY_FORM = {
  title: '',
  description: '',
  severity: 'LOW',
  incidentDate: '',
  location: '',
  status: 'OPEN',
};

const toDatetimeLocal = (iso) => (iso ? iso.slice(0, 16) : '');

export default function Incidents() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [detailIncident, setDetailIncident] = useState(null);
  const [detailPhotos, setDetailPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  const loadIncidents = () => {
    setLoading(true);
    incidentService
      .getAll()
      .then((data) => setIncidents(data.sort((a, b) => new Date(b.incidentDate) - new Date(a.incidentDate))))
      .catch(() => setError('Failed to load incidents.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadIncidents, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, incidentDate: new Date().toISOString().slice(0, 16) });
    setError('');
    setFormModalOpen(true);
  };

  const openEdit = (incident) => {
    setEditingId(incident.id);
    setForm({
      title: incident.title || '',
      description: incident.description || '',
      severity: incident.severity || 'LOW',
      incidentDate: toDatetimeLocal(incident.incidentDate),
      location: incident.location || '',
      status: incident.status || 'OPEN',
    });
    setError('');
    setFormModalOpen(true);
  };

  const openDetail = (incident) => {
    setDetailIncident(incident);
    setPhotosLoading(true);
    photoService
      .getByEntity('INCIDENT', incident.id)
      .then(setDetailPhotos)
      .catch(() => setDetailPhotos([]))
      .finally(() => setPhotosLoading(false));
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
        await incidentService.update(editingId, form);
      } else {
        await incidentService.create(form);
      }
      setFormModalOpen(false);
      loadIncidents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save incident.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this incident? This cannot be undone.')) return;
    try {
      await incidentService.remove(id);
      loadIncidents();
    } catch {
      alert('Failed to delete incident.');
    }
  };

  const handlePhotoUpload = async (file) => {
    if (!detailIncident) return;
    const uploaded = await photoService.upload(file, 'INCIDENT', detailIncident.id);
    setDetailPhotos((prev) => [...prev, uploaded]);
  };

  const columns = [
    {
      key: 'incidentDate',
      label: 'Date',
      render: (row) => (row.incidentDate ? new Date(row.incidentDate).toLocaleDateString() : '—'),
    },
    {
      key: 'title',
      label: 'Incident',
      render: (row) => (
        <button
          onClick={() => openDetail(row)}
          style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
        >
          {row.title}
        </button>
      ),
    },
    { key: 'severity', label: 'Severity', render: (row) => <StatusBadge status={row.severity} /> },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Incidents</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '0.3rem 0 0' }}>Safety, vehicle and site incidents. Click a title for details.</p>
        </div>
        {!isSuperAdmin && <Button onClick={openCreate}>+ Report Incident</Button>}
      </div>

      <DataTable
        columns={columns}
        data={incidents}
        loading={loading}
        emptyMessage="No incidents reported."
        actions={(row) => (
          isSuperAdmin ? (
            <Button size="sm" variant="secondary" onClick={() => openDetail(row)}>View</Button>
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

      {/* Report / edit incident */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingId ? 'Edit Incident' : 'Report Incident'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <Field label="Title"><input name="title" value={form.title} onChange={handleChange} required style={inputStyle} placeholder="e.g. Vehicle accident" /></Field>
          <div className="form-row" style={{ display: 'flex', gap: '0.75rem' }}>
            <Field label="Date & Time"><input name="incidentDate" type="datetime-local" value={form.incidentDate} onChange={handleChange} required style={inputStyle} /></Field>
            <Field label="Location"><input name="location" value={form.location} onChange={handleChange} style={inputStyle} placeholder="e.g. Industrial Road" /></Field>
          </div>
          <div className="form-row" style={{ display: 'flex', gap: '0.75rem' }}>
            <Field label="Severity">
              <select name="severity" value={form.severity} onChange={handleChange} style={inputStyle}>
                {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>
          {error && <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>{error}</div>}
        </form>
      </Modal>

      {/* Incident detail view, with photos */}
      <Modal
        isOpen={!!detailIncident}
        onClose={() => setDetailIncident(null)}
        title="Incident Details"
        width={560}
      >
        {detailIncident && (
          <div>
            <h3 style={{ margin: '0 0 1rem' }}>{detailIncident.title}</h3>

            <DetailRow label="Date">
              {detailIncident.incidentDate
                ? new Date(detailIncident.incidentDate).toLocaleString(undefined, {
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })
                : '—'}
            </DetailRow>
            <DetailRow label="Location">{detailIncident.location || '—'}</DetailRow>
            <DetailRow label="Severity"><StatusBadge status={detailIncident.severity} /></DetailRow>
            <DetailRow label="Description">{detailIncident.description || '—'}</DetailRow>
            <DetailRow label="Reported By">{detailIncident.reportedBy?.fullName || detailIncident.reportedBy?.username || '—'}</DetailRow>
            <DetailRow label="Status"><StatusBadge status={detailIncident.status} /></DetailRow>

            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Photos</div>

              {photosLoading ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Loading photos…</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  {detailPhotos.length === 0 && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No photos uploaded yet.</div>
                  )}
                  {detailPhotos.map((photo) => (
                    <a
                      key={photo.id}
                      href={`/${photo.filePath}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        width: 84, height: 84, borderRadius: 6, overflow: 'hidden',
                        border: '1px solid var(--color-border)', display: 'block',
                      }}
                    >
                      <img
                        src={`/${photo.filePath}`}
                        alt={photo.caption || 'Incident photo'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </a>
                  ))}
                </div>
              )}

              {!isSuperAdmin && <FileUpload label="+ Add Photo" onUpload={handlePhotoUpload} />}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailRow({ label, children }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', padding: '0.4rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.88rem' }}>
      <div style={{ width: 110, flexShrink: 0, color: 'var(--color-text-muted)', fontWeight: 600 }}>{label}</div>
      <div style={{ flex: 1 }}>{children}</div>
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
