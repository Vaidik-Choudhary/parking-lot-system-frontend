import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { Alert } from '../../components/common/UI';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    try {
      await api.post('/api/auth/forgot-password', { email });
      setSuccess('Password reset link sent to your email.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Forgot Password</h1>
        <p>Enter your email to receive reset link.</p>

        {success && <Alert type="success">{success}</Alert>}
        {error && <Alert type="danger">{error}</Alert>}

        <form onSubmit={submit}>
          <input
            className="form-control"
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button className="btn btn-primary btn-block mt-3">
            Send Reset Link
          </button>
        </form>

        <p className="mt-3">
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}