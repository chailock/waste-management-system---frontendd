import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

/**
 * Only an ADMIN can reach this page (see ProtectedRoute in App.jsx) — it is
 * used to create new staff accounts (admin or manager), mirroring the
 * backend rule that /auth/register requires ROLE_ADMIN.
 */
export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    role: 'MANAGER',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await register(form);
      setSuccess(`Account "${form.username}" created successfully.`);
      setForm({ username: '', password: '', email: '', fullName: '', role: 'MANAGER' });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0 }}>Create Staff Account</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: '0.3rem 0 0' }}>
          Add a new admin or manager to the system.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 480, background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
        <Field label="Full Name">
          <input name="fullName" value={form.fullName} onChange={handleChange} required style={inputStyle} />
        </Field>
        <Field label="Username">
          <input name="username" value={form.username} onChange={handleChange} required style={inputStyle} />
        </Field>
        <Field label="Email">
          <input type="email" name="email" value={form.email} onChange={handleChange} required style={inputStyle} />
        </Field>
        <Field label="Password">
          <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} style={inputStyle} />
        </Field>
        <Field label="Role">
          <select name="role" value={form.role} onChange={handleChange} style={inputStyle}>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
        </Field>

        {error && <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}
        {success && <div style={{ color: 'var(--color-success)', fontSize: '0.85rem', marginBottom: '1rem' }}>{success}</div>}

        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create Account'}
        </Button>
        <Button type="button" variant="ghost" style={{ marginLeft: '0.6rem' }} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.55rem 0.7rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  fontSize: '0.9rem',
};
