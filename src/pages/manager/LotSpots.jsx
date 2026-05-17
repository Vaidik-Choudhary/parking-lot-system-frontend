import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { Spinner, Modal, Alert, EmptyState } from '../../components/common/UI';
import { IconEV, IconArrowLeft, IconParking, IconTrash, IconCalendar } from '../../components/common/Icons';
import { api } from '../../utils/api';

const EMPTY_SPOT = { lotId: '', spotNumber: '', floor: 0, spotType: 'STANDARD', vehicleType: 'FOUR_WHEELER', isEVCharging: false, pricePerHour: 50, monthlySubscriptionEnabled: false, monthlyRate: 1500 };
const EMPTY_BULK = { lotId: '', count: 10, prefix: 'A', floor: 0, spotType: 'STANDARD', vehicleType: 'FOUR_WHEELER', isEVCharging: false, pricePerHour: 50, monthlySubscriptionEnabled: false, monthlyRate: 1500 };

const SpotForm = ({ data, onChange }) => (
  <>
    <div className="form-row">
      {data.spotNumber !== undefined && (
        <div className="form-group">
          <label className="form-label">Spot Number</label>
          <input className="form-control" name="spotNumber" placeholder="A-01" value={data.spotNumber || ''} onChange={onChange} required />
        </div>
      )}
      <div className="form-group">
        <label className="form-label">Floor</label>
        <input className="form-control" name="floor" type="number" min="0" value={data.floor || 0} onChange={onChange} />
      </div>
    </div>
    <div className="form-row">
      <div className="form-group">
        <label className="form-label">Spot Type</label>
        <select className="form-control" name="spotType" value={data.spotType || 'STANDARD'} onChange={onChange}>
          {['STANDARD', 'LARGE', 'MOTORBIKE', 'EV'].map(t => (
            <option key={t} value={t}>{t === 'EV' ? 'EV STANDARD' : t}</option>
          ))}
        </select>
      </div>
    </div>
    <div className="form-group">
      <label className="form-label">Price Per Hour (₹)</label>
      <input className="form-control" name="pricePerHour" type="number" min="1" value={data.pricePerHour || ''} onChange={onChange} />
    </div>

    <div className="card bg-dark-soft p-3 mb-3" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
      <label className="checkbox-container mb-3" style={{ display: 'flex', alignItems: 'center' }}>
        <input type="checkbox" name="monthlySubscriptionEnabled" checked={!!data.monthlySubscriptionEnabled} onChange={onChange} />
        <span className="checkbox-label" style={{ marginLeft: 8, fontWeight: 600 }}>Enable Monthly Subscription</span>
      </label>

      {data.monthlySubscriptionEnabled && (
        <div className="form-group">
          <label className="form-label">Monthly Rate (₹)</label>
          <input className="form-control" name="monthlyRate" type="number" min="1" value={data.monthlyRate || ''} onChange={onChange} />
        </div>
      )}
    </div>
  </>
);

export default function LotSpots() {
  const { lotId } = useParams();
  const navigate = useNavigate();
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_SPOT, lotId });
  const [bulk, setBulk] = useState({ ...EMPTY_BULK, lotId });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    api.get(`/api/spots/lot/${lotId}`)
      .then(setSpots)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [lotId]);

  const handle = e => { const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value; setForm({ ...form, [e.target.name]: v }); };
  const handleBulk = e => { const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value; setBulk({ ...bulk, [e.target.name]: v }); };

  const addSpot = async () => {
    setError('');
    try {
      await api.post('/api/spots', { 
        ...form, 
        lotId: Number(lotId), 
        floor: Number(form.floor), 
        pricePerHour: Number(form.pricePerHour),
        monthlyRate: Number(form.monthlyRate)
      });
      setSuccess('Spot added.'); setShowAdd(false); load();
    } catch (err) { setError(err.message); }
  };

  const addBulk = async () => {
    setError('');
    try {
      const res = await api.post('/api/spots/bulk', { 
        ...bulk, 
        lotId: Number(lotId), 
        count: Number(bulk.count), 
        floor: Number(bulk.floor), 
        pricePerHour: Number(bulk.pricePerHour),
        monthlyRate: Number(bulk.monthlyRate)
      });
      setSuccess(`${res.length} spots created.`); setShowBulk(false); load();
    } catch (err) { setError(err.message); }
  };

  const deleteSpot = async (spotId) => {
    if (!window.confirm('Delete this spot?')) return;
    try { await api.delete(`/api/spots/${spotId}`); load(); } catch (err) { setError(err.message); }
  };

  // Group by floor
  const floors = {};
  spots.forEach(s => {
    const f = `Floor ${s.floor}`;
    if (!floors[f]) floors[f] = [];
    floors[f].push(s);
  });



  return (
    <ManagerLayout title="Manage Spots"
      topbarRight={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}><IconArrowLeft size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Back</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowBulk(true)}>+ Bulk Add</button>
          <button className="btn btn-primary btn-sm" onClick={() => { setForm({ ...EMPTY_SPOT, lotId }); setShowAdd(true); }}>+ Add Spot</button>
        </div>
      }
    >
      <div className="page-header">
        <h1>Parking Spots — Lot #{lotId}</h1>
        <p>{spots.length} total spots · {spots.filter(s => s.status === 'AVAILABLE').length} available</p>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {loading ? <Spinner /> : spots.length === 0 ? (
        <EmptyState icon={<IconParking size={48} />} title="No spots yet"
          message="Add individual spots or use bulk create to add many at once."
          action={<button className="btn btn-primary" onClick={() => setShowBulk(true)}>Bulk Create Spots</button>}
        />
      ) : (
        Object.entries(floors).map(([floor, floorSpots]) => (
          <div key={floor} className="card mb-3">
            <div className="card-header">
              <h4 className="card-title">{floor}</h4>
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                {floorSpots.filter(s => s.status === 'AVAILABLE').length} / {floorSpots.length} available
              </span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Spot #</th><th>Type</th>
                    <th>Price/hr</th><th>feature</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {floorSpots.map(s => (
                    <tr key={s.spotId}>
                      <td><strong>{s.spotNumber}</strong></td>
                      <td>{s.spotType === 'EV' ? 'EV STANDARD' : s.spotType}</td>
                      <td>₹{s.pricePerHour}</td>
                      <td>
                        {s.spotType === 'EV' && <span className="badge badge-success mr-1" title="EV Charging Available"><IconEV size={12} style={{ verticalAlign: '-2px' }} /></span>}
                        {s.monthlySubscriptionEnabled && <span className="badge badge-info mr-1" title="Monthly Subscriptions Allowed"><IconCalendar size={12} style={{ verticalAlign: '-2px' }} /></span>}
                      </td>
                      <td>
                        <span className={`badge ${s.status === 'AVAILABLE' ? 'badge-success' : s.status === 'OCCUPIED' ? 'badge-danger' : 'badge-warning'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-danger btn-sm"
                          onClick={() => deleteSpot(s.spotId)}
                          disabled={s.status !== 'AVAILABLE'}>
                          <IconTrash size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Single Spot"
        footer={<><button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn btn-primary" onClick={addSpot}>Add Spot</button></>}>
        <SpotForm data={form} onChange={handle} />
      </Modal>

      {/* Bulk Modal */}
      <Modal isOpen={showBulk} onClose={() => setShowBulk(false)} title="Bulk Create Spots"
        footer={<><button className="btn btn-secondary" onClick={() => setShowBulk(false)}>Cancel</button><button className="btn btn-primary" onClick={addBulk}>Create Spots</button></>}>
        <div className="alert alert-info mb-3">
          Spots will be named: <strong>{bulk.prefix}{bulk.floor}-01, {bulk.prefix}{bulk.floor}-02 ...</strong>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Prefix (e.g. A, B, GF)</label>
            <input className="form-control" name="prefix" value={bulk.prefix} onChange={handleBulk} />
          </div>
          <div className="form-group">
            <label className="form-label">Number of Spots</label>
            <input className="form-control" name="count" type="number" min="1" max="200" value={bulk.count} onChange={handleBulk} />
          </div>
        </div>
        <SpotForm data={bulk} onChange={handleBulk} />
      </Modal>
    </ManagerLayout>
  );
}
