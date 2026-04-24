import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api, saveAuth } from '../../utils/api';
import { Alert } from '../../components/common/UI';

export default function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  // Message passed from GuestLotDetail when guest tries to book
  const guestMessage = location.state?.message;

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await api.post('/api/auth/login', form);
      saveAuth(data);

      // If the guest was trying to go somewhere specific, send them there
      const redirect = sessionStorage.getItem('redirectAfterLogin');
      if (redirect) {
        sessionStorage.removeItem('redirectAfterLogin');
        navigate(redirect);
        return;
      }

      // Otherwise go to their role dashboard
      const routes = { DRIVER: '/driver', LOT_MANAGER: '/manager', ADMIN: '/admin' };
      navigate(routes[data.role] || '/driver');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>🅿 ParkEase</h1>
          <p>Smart Parking Management Platform</p>
        </div>

        {/* Show message from guest redirect */}
        {guestMessage && (
          <Alert type="info" style={{ marginBottom: 16 }}>{guestMessage}</Alert>
        )}

        {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-control"
              type="email" name="email"
              placeholder="you@example.com"
              value={form.email} onChange={handle} required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-control"
              type="password" name="password"
              placeholder="Enter your password"
              value={form.password} onChange={handle} required
            />
          </div>
          <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>
          <button
            className="btn btn-primary btn-block btn-lg"
            type="submit" disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-block btn-lg"
            style={{ marginTop: '12px' }}
            onClick={() => window.location.href = 'http://localhost:8080/oauth2/authorize/google'}
          >
            Continue with Google
          </button>
        </form>

        <p className="text-center mt-3" style={{ fontSize: '0.875rem' }}>
          Don't have an account?{' '}
          <Link to="/register">Create one</Link>
        </p>
        <p className="text-center mt-2" style={{ fontSize: '0.875rem' }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}>← Browse lots without signing in</Link>
        </p>
      </div>
    </div>
  );
}
