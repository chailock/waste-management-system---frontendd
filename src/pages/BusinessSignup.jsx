import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const EMPTY_FORM = {
  businessName: '',
  registrationNumber: '',
  contactPhone: '',
  address: '',
  username: '',
  password: '',
  email: '',
  fullName: '',
};

export default function BusinessSignup() {
  const { registerBusiness } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await registerBusiness(form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Sign up failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a4d21 0%, #0f7a34 55%, #12140f 100%)',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: '2.5rem',
          width: '100%',
          maxWidth: 460,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '1.7rem' }}>♻️</div>
          <h1 style={{ fontSize: '1.3rem', margin: '0.4rem 0 0.2rem' }}>Set Up Your Organization</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Creates your own workspace and an admin account.
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>✅</div>
            <p style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Account created!</p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Redirecting you to sign in…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Organization Name</label>
              <input name="businessName" value={form.businessName} onChange={handleChange} required autoFocus style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Registration No. (optional)</label>
                <input name="registrationNumber" value={form.registrationNumber} onChange={handleChange} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Contact Phone</label>
                <input name="contactPhone" value={form.contactPhone} onChange={handleChange} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Address</label>
              <input name="address" value={form.address} onChange={handleChange} style={inputStyle} />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '1.25rem 0' }} />

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Your Full Name</label>
              <input name="fullName" value={form.fullName} onChange={handleChange} required style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Username</label>
                <input name="username" value={form.username} onChange={handleChange} required style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={6} style={inputStyle} />
            </div>

            {error && (
              <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>
            )}

            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>
        )}

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '1.5rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  marginBottom: '0.35rem',
  color: 'var(--color-text)',
};

const inputStyle = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  fontSize: '0.95rem',
};
