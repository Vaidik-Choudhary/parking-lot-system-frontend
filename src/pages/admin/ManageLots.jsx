import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Spinner, Alert, EmptyState } from '../../components/common/UI';
import { IconCheckCircle, IconClock, IconX } from '../../components/common/Icons';
import { api } from '../../utils/api';

export default function ManageLots() {
  const [pending, setPending]   = useState([]);
  const [allLots, setAllLots]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [tab, setTab]           = useState('pending');

  const load = () => {
    Promise.all([
      api.get('/api/lots/admin/pending'),
      api.get('/api/lots'),
    ])
      .then(([p, a]) => { setPending(p); setAllLots(a); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const approve = async (id) => {
    try { await api.put(`/api/lots/admin/${id}/approve`); setSuccess('Lot approved!'); load(); }
    catch (err) { setError(err.message); }
  };
  const reject = async (id) => {
    try { await api.put(`/api/lots/admin/${id}/reject`); setSuccess('Lot rejected.'); load(); }
    catch (err) { setError(err.message); }
  };

  const LotRow = ({ lot, showActions }) => (
    <tr>
      <td><strong>#{lot.lotId}</strong></td>
      <td>{lot.name}</td>
      <td>{lot.city}</td>
      <td>{lot.totalSpots}</td>
      <td>
        <span className={`badge ${lot.approved ? 'badge-success' : 'badge-warning'}`}>
          {lot.approved ? <><IconCheckCircle size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Approved</> : <><IconClock size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Pending</>}
        </span>
      </td>
      <td>
        <span className={`badge ${lot.open ? 'badge-success' : 'badge-muted'}`}>
          {lot.open ? '● Open' : '● Closed'}
        </span>
      </td>
      {showActions && (
        <td>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-success btn-sm" onClick={() => approve(lot.lotId)}><IconCheckCircle size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Approve</button>
            <button className="btn btn-danger btn-sm"  onClick={() => reject(lot.lotId)}><IconX size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Reject</button>
          </div>
        </td>
      )}
    </tr>
  );

  return (
    <AdminLayout title="Manage Lots">
      <div className="page-header">
        <h1>Manage Parking Lots</h1>
        <p>{pending.length} lots pending approval.</p>
      </div>

      {error   && <Alert type="danger"  onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Tabs */}
      <div className="auth-tabs mb-4" style={{ maxWidth: 360 }}>
        {[['pending', `Pending (${pending.length})`], ['all', `All Lots (${allLots.length})`]].map(([key, label]) => (
          <button key={key} className={`auth-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="card">
          {tab === 'pending' ? (
            pending.length === 0 ? (
              <EmptyState icon={<IconCheckCircle size={48} />} title="No pending lots" message="All lot registrations have been reviewed." />
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>ID</th><th>Name</th><th>City</th><th>Spots</th><th>Status</th><th>Open</th><th>Actions</th></tr></thead>
                  <tbody>{pending.map(l => <LotRow key={l.lotId} lot={l} showActions />)}</tbody>
                </table>
              </div>
            )
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>ID</th><th>Name</th><th>City</th><th>Spots</th><th>Approval</th><th>Open</th></tr></thead>
                <tbody>{allLots.map(l => <LotRow key={l.lotId} lot={l} showActions={false} />)}</tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
