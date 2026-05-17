import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, saveAuth } from '../../utils/api';
import { Alert } from '../../components/common/UI';
import { IconParking } from '../../components/common/Icons';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', role: 'DRIVER'
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await api.post('/api/auth/register', form);
      saveAuth(data);
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
          <h1><IconParking size={32} style={{ verticalAlign: '-6px', marginRight: 8 }} /> ParkEase</h1>
          <p>Create your account</p>
        </div>

        {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-control" name="fullName"
              placeholder="John Doe"
              value={form.fullName} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-control" type="email" name="email"
              placeholder="you@example.com"
              value={form.email} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" name="password"
              placeholder="At least 6 characters"
              value={form.password} onChange={handle} required minLength={6} />
          </div>
          <div className="form-group">
            <label className="form-label">I am a</label>
            <select className="form-control" name="role"
              value={form.role} onChange={handle}>
              <option value="DRIVER">Driver — Looking for parking</option>
              <option value="LOT_MANAGER">Lot Manager — I own a parking facility</option>
            </select>
          </div>

          <button className="btn btn-primary btn-block btn-lg"
            type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-3" style={{ fontSize: '0.875rem' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
