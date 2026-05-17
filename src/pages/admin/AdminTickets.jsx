import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { api } from '../../utils/api';
import { Spinner, Alert, Card, Modal, StatusBadge } from '../../components/common/UI';
import { IconMessage, IconClock, IconUser, IconTag, IconEdit } from '../../components/common/Icons';

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: '', notes: '' });

  const loadTickets = () => {
    api.get('/api/support/admin/tickets')
      .then(setTickets)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const openUpdateModal = (ticket) => {
    setSelectedTicket(ticket);
    setUpdateForm({ status: ticket.status, notes: ticket.adminNotes || '' });
    setShowModal(true);
  };

  const handleUpdate = async () => {
    try {
      const notesParam = updateForm.notes ? `&notes=${encodeURIComponent(updateForm.notes)}` : '';
      await api.patch(`/api/support/admin/tickets/${selectedTicket.ticketId}/status?status=${updateForm.status}${notesParam}`);
      setSuccess('Ticket updated successfully.');
      setShowModal(false);
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
      case 'CLOSED': return 'secondary';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return '#ff4d4d';
      case 'HIGH': return '#ffa502';
      case 'MEDIUM': return '#3742fa';
      default: return '#747d8c';
    }
  };

  return (
    <AdminLayout title="Manage Complaints">
      <div className="page-header">
        <h1>Support Complaints</h1>
        <p>Review and resolve issues raised by drivers and lot managers.</p>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {loading ? <Spinner /> : tickets.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p>No complaints found in the system.</p>
        </Card>
      ) : (
        <div className="admin-ticket-grid" style={{ display: 'grid', gap: 20 }}>
          {tickets.map(ticket => (
            <Card key={ticket.ticketId} style={{ borderLeft: `5px solid ${getPriorityColor(ticket.priority)}` }}>
              <div className="flex-between mb-3">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <StatusBadge type={getStatusColor(ticket.status)}>{ticket.status}</StatusBadge>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: getPriorityColor(ticket.priority) }}>
                    {ticket.priority} PRIORITY
                  </span>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => openUpdateModal(ticket)}>
                  <IconEdit size={14} style={{ marginRight: 4 }} /> Handle
                </button>
              </div>

              <h3 style={{ marginBottom: 8 }}>{ticket.subject}</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>{ticket.description}</p>

              <div style={{ display: 'flex', gap: 24, fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
                <span title="User"><IconUser size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {ticket.userName} ({ticket.userRole})</span>
                <span title="Time"><IconClock size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {new Date(ticket.createdAt).toLocaleString()}</span>
                <span title="ID"><IconTag size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> #{ticket.ticketId}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Update Status Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Handle Complaint"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUpdate}>Update Ticket</button>
          </>
        }
      >
        {selectedTicket && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Update Status</label>
              <select 
                className="form-control"
                value={updateForm.status}
                onChange={e => setUpdateForm({...updateForm, status: e.target.value})}
              >
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
            <div>
              <label className="form-label">Admin Notes / Response</label>
              <textarea 
                className="form-control"
                rows="5"
                placeholder="Write a response to the user..."
                value={updateForm.notes}
                onChange={e => setUpdateForm({...updateForm, notes: e.target.value})}
              />
              <p style={{ fontSize: '0.75rem', marginTop: 4, color: 'var(--text-muted)' }}>
                These notes will be visible to the user.
              </p>
            </div>
          </>
        )}
      </Modal>
    </AdminLayout>
  );
}
