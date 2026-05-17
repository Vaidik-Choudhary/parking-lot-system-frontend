import React, { useState, useEffect } from 'react';
import { api, getEmail, getUserName, getRole } from '../../utils/api';
import DriverLayout from '../../components/driver/DriverLayout';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { Spinner, Alert, Card, Modal, StatusBadge } from '../../components/common/UI';
import { IconHelp, IconSend, IconMessage, IconClock, IconCheckCircle } from '../../components/common/Icons';

export default function Help() {
  const user = {
    email: getEmail(),
    name: getUserName(),
    role: getRole()
  };
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', priority: 'MEDIUM' });

  const isDriver = user?.role === 'DRIVER';
  const Layout = isDriver ? DriverLayout : ManagerLayout;

  const loadTickets = () => {
    api.get(`/api/support/my-tickets?userId=${user.email}`)
      .then(setTickets)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        userId: user.email,
        userName: user.name,
        userRole: user.role
      };
      await api.post('/api/support/tickets', payload);
      setSuccess('Your complaint has been submitted successfully.');
      setShowModal(false);
      setForm({ subject: '', description: '', priority: 'MEDIUM' });
      loadTickets();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'danger';
      case 'IN_PROGRESS': return 'info';
      case 'RESOLVED': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <Layout title="Help & Support">
      <div className="page-header flex-between">
        <div>
          <h1>Help & Support</h1>
          <p>Raise a complaint or get help with your account.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <IconSend size={16} style={{ marginRight: 8 }} /> Raise Complaint
        </button>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      <div style={{ marginTop: 24 }}>
        <h3>Your Recent Complaints</h3>
        {loading ? <Spinner /> : tickets.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
            <IconHelp size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
            <p>No complaints raised yet. Need help? Click the button above.</p>
          </Card>
        ) : (
          <div className="ticket-list" style={{ display: 'grid', gap: 16, marginTop: 16 }}>
            {tickets.map(ticket => (
              <Card key={ticket.ticketId} className="ticket-card">
                <div className="flex-between mb-2">
                  <h4 style={{ margin: 0 }}>{ticket.subject}</h4>
                  <StatusBadge type={getStatusColor(ticket.status)}>{ticket.status.replace('_', ' ')}</StatusBadge>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                  {ticket.description}
                </p>
                <div className="flex-between" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>
                    <IconClock size={12} style={{ marginRight: 4 }} /> 
                    Submitted on {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                  {ticket.priority !== 'MEDIUM' && (
                    <span className={`text-${ticket.priority === 'HIGH' ? 'danger' : 'info'}`}>
                      Priority: {ticket.priority}
                    </span>
                  )}
                </div>
                {ticket.adminNotes && (
                  <div style={{ marginTop: 12, padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8, borderLeft: '3px solid var(--primary)' }}>
                    <strong style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}>Admin Response:</strong>
                    <p style={{ margin: 0, fontSize: '0.85rem italic' }}>{ticket.adminNotes}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Submit Ticket Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title="Raise a New Complaint"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>Submit Ticket</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Subject</label>
          <input 
            className="form-control" 
            placeholder="e.g. Booking issue, Payment failed..." 
            value={form.subject}
            onChange={e => setForm({...form, subject: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea 
            className="form-control" 
            rows="4" 
            placeholder="Please describe your issue in detail..."
            value={form.description}
            onChange={e => setForm({...form, description: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select 
            className="form-control"
            value={form.priority}
            onChange={e => setForm({...form, priority: e.target.value})}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </Modal>
    </Layout>
  );
}
