import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Spinner, Alert } from '../../components/common/UI';
import { IconBell, IconUsers, IconCheckCircle, IconAlertTriangle } from '../../components/common/Icons';
import { api } from '../../utils/api';

export default function Broadcast() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [form, setForm] = useState({
    title: '',
    message: '',
    targetRole: 'ALL'
  });

  useEffect(() => {
    api.get('/api/admin/users')
      .then(setUsers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) {
      setError('Title and message are required.');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      // Filter recipients based on targetRole
      let recipients = users;
      if (form.targetRole !== 'ALL') {
        recipients = users.filter(u => u.role === form.targetRole);
      }
      
      const emails = recipients.map(u => u.email);
      
      if (emails.length === 0) {
        throw new Error(`No users found with role: ${form.targetRole}`);
      }

      // Construct URL with query parameters for emails
      const queryParams = emails.map(email => `emails=${encodeURIComponent(email)}`).join('&');
      const path = `/api/notifications/broadcast?${queryParams}`;

      await api.post(path, {
        title: form.title,
        message: form.message,
        targetRole: form.targetRole
      });

      setSuccess(`Broadcast sent successfully to ${emails.length} users.`);
      setForm({ title: '', message: '', targetRole: 'ALL' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const getRecipientCount = () => {
    if (form.targetRole === 'ALL') return users.length;
    return users.filter(u => u.role === form.targetRole).length;
  };

  return (
    <AdminLayout title="Broadcast Announcements">
      <div className="page-header">
        <h1><IconBell size={28} style={{ verticalAlign: '-4px', marginRight: 8 }} /> Broadcast Announcements</h1>
        <p>Send platform-wide notifications to drivers and managers.</p>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {loading ? <Spinner /> : (
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Compose Message</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-4">
              <div className="form-group">
                <label className="form-label">Target Audience</label>
                <select 
                  className="form-control" 
                  name="targetRole" 
                  value={form.targetRole} 
                  onChange={handleChange}
                >
                  <option value="ALL">All Users ({users.length})</option>
                  <option value="DRIVER">Drivers ({users.filter(u => u.role === 'DRIVER').length})</option>
                  <option value="LOT_MANAGER">Managers ({users.filter(u => u.role === 'LOT_MANAGER').length})</option>
                </select>
                <p className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>
                  This message will be sent to {getRecipientCount()} recipients.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Announcement Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="title" 
                  placeholder="e.g. Maintenance Scheduled"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message Content</label>
                <textarea 
                  className="form-control" 
                  name="message" 
                  rows="5" 
                  placeholder="Type your message here..."
                  value={form.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <div className="mt-4">
                <button 
                  type="submit" 
                  className="btn btn-primary w-100" 
                  disabled={sending}
                >
                  {sending ? 'Sending Broadcast...' : 'Send Announcement'}
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">About Broadcasts</h3>
            </div>
            <div className="p-4">
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <div style={{ color: 'var(--primary)' }}><IconCheckCircle size={24} /></div>
                <div>
                  <strong>In-App Delivery</strong>
                  <p className="text-muted" style={{ fontSize: '0.875rem' }}>Users will see a notification in their bell icon immediately.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <div style={{ color: 'var(--info)' }}><IconUsers size={24} /></div>
                <div>
                  <strong>Role Filtering</strong>
                  <p className="text-muted" style={{ fontSize: '0.875rem' }}>Target specific groups of users to keep communications relevant.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ color: 'var(--warning)' }}><IconAlertTriangle size={24} /></div>
                <div>
                  <strong>Permanent Action</strong>
                  <p className="text-muted" style={{ fontSize: '0.875rem' }}>Broadcasts cannot be undone once sent. Please double-check your content.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
