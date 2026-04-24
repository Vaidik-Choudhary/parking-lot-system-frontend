import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { Alert } from '../../components/common/UI';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    try {
      await api.post('/api/auth/reset-password', {
        token,
        newPassword: password,
      });

      setSuccess('Password reset successful. Redirecting...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Reset Password</h1>

        {success && <Alert type="success">{success}</Alert>}
        {error && <Alert type="danger">{error}</Alert>}

        <form onSubmit={submit}>
          <input
            className="form-control"
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="btn btn-primary btn-block mt-3">
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}