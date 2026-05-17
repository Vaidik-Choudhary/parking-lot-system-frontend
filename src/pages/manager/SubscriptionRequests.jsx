import React, { useEffect, useState } from 'react';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { Spinner, Alert, EmptyState, Modal, StatusBadge } from '../../components/common/UI';
import { IconCalendar, IconCheckCircle, IconX, IconUser, IconParking, IconInfo } from '../../components/common/Icons';
import { api } from '../../utils/api';

export default function SubscriptionRequests() {
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Processing state
  const [processingId, setProcessingId] = useState(null);
  const [actionType, setActionType] = useState(null); // 'APPROVE' or 'REJECT'
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch manager's lots
  useEffect(() => {
    api.get('/api/lots/my-lots')
      .then(data => {
        setLots(data);
        if (data.length > 0) setSelectedLot(data[0]);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // 2. Fetch pending requests when selectedLot changes
  const loadRequests = async () => {
    if (!selectedLot) return;
    setLoading(true);
    try {
      const data = await api.get(`/api/subscriptions/requests/lot/${selectedLot.lotId}`);
      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [selectedLot]);

  const handleAction = async () => {
    setSubmitting(true);
    try {
      const endpoint = actionType === 'APPROVE' 
        ? `/api/subscriptions/requests/${processingId}/approve`
        : `/api/subscriptions/requests/${processingId}/reject`;
      
      await api.post(`${endpoint}?comment=${encodeURIComponent(comment)}`);
      
      setSuccess(`Request ${actionType === 'APPROVE' ? 'approved' : 'rejected'} successfully.`);
      setProcessingId(null);
      setComment('');
      loadRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ManagerLayout title="Subscription Requests">
      <div className="page-header">
        <h1>Monthly Subscription Requests</h1>
        <p>Manage driver requests for long-term spot blocking.</p>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Lot Selector */}
      {lots.length > 1 && (
        <div className="mb-4 d-flex align-items-center gap-3">
          <label className="m-0 font-weight-bold">Select Lot:</label>
          <select 
            className="form-control" 
            style={{ width: 'auto', minWidth: 200 }}
            value={selectedLot?.lotId || ''}
            onChange={(e) => setSelectedLot(lots.find(l => l.lotId === Number(e.target.value)))}
          >
            {lots.map(lot => (
              <option key={lot.lotId} value={lot.lotId}>{lot.name}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? <Spinner /> : (
        requests.length === 0 ? (
          <EmptyState 
            icon={<IconCalendar size={48} />} 
            title="No pending requests" 
            message={selectedLot ? `There are no pending subscription requests for ${selectedLot.name}.` : "Select a lot to view requests."} 
          />
        ) : (
          <div className="table-responsive card border-0 shadow-sm">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Driver</th>
                  <th>Spot ID</th>
                  <th>Date Requested</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="avatar-circle mr-3" style={{ background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}>
                          <IconUser size={16} />
                        </div>
                        <div>
                          <div className="font-weight-bold">{req.driverEmail}</div>
                          <div className="text-muted small">Registered Driver</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-weight-bold"><IconParking size={14} className="mr-1" /> {req.spotId}</span>
                    </td>
                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td><StatusBadge status="PENDING" /></td>
                    <td className="text-right">
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-outline-success btn-sm"
                          onClick={() => { setProcessingId(req.id); setActionType('APPROVE'); }}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => { setProcessingId(req.id); setActionType('REJECT'); }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Action Modal */}
      {processingId && (
        <Modal
          isOpen={true}
          onClose={() => setProcessingId(null)}
          title={actionType === 'APPROVE' ? 'Approve Subscription' : 'Reject Subscription'}
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
              <button className="btn btn-secondary" onClick={() => setProcessingId(null)}>Cancel</button>
              <button 
                className={`btn ${actionType === 'APPROVE' ? 'btn-success' : 'btn-danger'}`}
                onClick={handleAction}
                disabled={submitting}
              >
                {submitting ? 'Processing...' : (actionType === 'APPROVE' ? 'Approve Request' : 'Reject Request')}
              </button>
            </div>
          }
        >
          <div>
            <p>
              Are you sure you want to <strong>{actionType.toLowerCase()}</strong> this monthly reservation request?
            </p>
            {actionType === 'APPROVE' && (
              <div className="alert alert-info py-2" style={{ fontSize: '0.85rem' }}>
                <IconInfo size={14} className="mr-2" />
                The system will automatically calculate the next available start date for this spot.
              </div>
            )}
            <div className="form-group mt-3">
              <label className="form-label">Manager Comment (Optional)</label>
              <textarea 
                className="form-control" 
                rows="3" 
                placeholder={actionType === 'APPROVE' ? "e.g. Welcome! Your spot is ready." : "e.g. Sorry, this spot is currently reserved for maintenance."}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}

      <style>{`
        .avatar-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .text-right { text-align: right; }
        .font-weight-bold { font-weight: 600; }
        .bg-light { background-color: rgba(var(--primary-rgb), 0.05) !important; }
        .table-hover tbody tr:hover { background-color: rgba(var(--primary-rgb), 0.02); }
      `}</style>
    </ManagerLayout>
  );
}
