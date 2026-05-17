import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { Spinner, Modal, Alert, EmptyState, StatusBadge } from '../../components/common/UI';
import { IconBuilding, IconMap, IconCheckCircle, IconClock, IconParking, IconEdit, IconBooking, IconChart, IconHandicap, IconEV, IconMotorbike, IconCar, IconTruck } from '../../components/common/Icons';
import { api } from '../../utils/api';

const EMPTY_FORM = {
  name: '', address: '', city: '',
  latitude: '', longitude: '',
  totalSpots: '', openTime: '08:00', closeTime: '22:00', imageUrl: '',
  isHandicappedFriendly: false,
  hasEV: false,
  hasTwoWheeler: false,
  hasFourWheeler: false,
  hasHeavy: false
};

export default function MyLots() {
  const navigate = useNavigate();
  const [lots, setLots]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

const load = () => {
  api.get('/api/lots/my-lots')
    .then(setLots)
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
};

  useEffect(load, []);

  const openAdd  = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (lot) => {
    setEditing(lot.lotId);
    setForm({
      name: lot.name, address: lot.address, city: lot.city,
      latitude: lot.latitude, longitude: lot.longitude,
      totalSpots: lot.totalSpots,
      openTime: lot.openTime || '08:00',
      closeTime: lot.closeTime || '22:00',
      imageUrl: lot.imageUrl || '',
      isHandicappedFriendly: !!lot.isHandicappedFriendly,
      hasEV: !!lot.hasEV,
      hasTwoWheeler: !!lot.hasTwoWheeler,
      hasFourWheeler: !!lot.hasFourWheeler,
      hasHeavy: !!lot.hasHeavy
    });
    setShowModal(true);
  };

  const save = async () => {
    setError('');
    try {
      const payload = { ...form, latitude: Number(form.latitude), longitude: Number(form.longitude), totalSpots: Number(form.totalSpots) };
      if (editing) {
        await api.put(`/api/lots/${editing}`, payload);
        setSuccess('Lot updated successfully.');
      } else {
        await api.post('/api/lots', payload);
        setSuccess('Lot registered! Awaiting admin approval.');
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggle = async (lotId) => {
    try {
      await api.put(`/api/lots/${lotId}/toggle`);
      setSuccess('Lot status updated.');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handle = e => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: v });
  };

  return (
    <ManagerLayout title="My Parking Lots"
      topbarRight={
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          + Register Lot
        </button>
      }
    >
      <div className="page-header">
        <h1>My Parking Lots</h1>
        <p>Register and manage your parking facilities.</p>
      </div>

      {error   && <Alert type="danger"  onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {loading ? <Spinner /> : lots.length === 0 ? (
        <EmptyState icon={<IconBuilding size={48} />} title="No lots registered"
          message="Register your first parking facility to get started."
          action={<button className="btn btn-primary" onClick={openAdd}>Register Lot</button>}
        />
      ) : (
        <div className="lot-grid">
          {lots.map(lot => (
            <div key={lot.lotId} className="card">
              {/* Header */}
              <div className="flex-between mb-3">
                <div>
                  <h3>{lot.name}</h3>
                  <p style={{ fontSize: '0.8rem', marginTop: 2 }}>
                    <IconMap size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {lot.address}, {lot.city}
                  </p>
                </div>
                <span className={`badge ${lot.approved ? 'badge-success' : 'badge-warning'}`}>
                  {lot.approved ? <><IconCheckCircle size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Approved</> : <><IconClock size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Pending</>}
                </span>
                {lot.isHandicappedFriendly && <span className="badge badge-info" style={{ marginLeft: 8 }}><IconHandicap size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Handicapped Friendly</span>}
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span><IconParking size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {lot.availableSpots}/{lot.totalSpots} spots</span>
                <span><IconClock size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {lot.openTime} – {lot.closeTime}</span>
              </div>

              {/* Status toggle */}
              <div className="flex-between mb-3">
                <span style={{ fontSize: '0.875rem' }}>
                  Status:&nbsp;
                  <span className={lot.open ? 'text-success' : 'text-danger'}>
                    {lot.open ? '● Open' : '● Closed'}
                  </span>
                </span>
                <button
                  className={`btn btn-sm ${lot.open ? 'btn-danger' : 'btn-success'}`}
                  onClick={() => toggle(lot.lotId)}
                  disabled={!lot.approved}
                  title={!lot.approved ? 'Awaiting admin approval' : ''}
                >
                  {lot.open ? 'Close Lot' : 'Open Lot'}
                </button>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(lot)}><IconEdit size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Edit</button>
                <button className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/manager/lots/${lot.lotId}/spots`)}><IconParking size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Spots</button>
                <button className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/manager/lots/${lot.lotId}/bookings`)}><IconBooking size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Bookings</button>
                <button className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/manager/lots/${lot.lotId}/analytics`)}><IconChart size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Analytics</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editing ? 'Edit Parking Lot' : 'Register Parking Lot'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>
              {editing ? 'Save Changes' : 'Register Lot'}
            </button>
          </>
        }
      >
        {error && <Alert type="danger">{error}</Alert>}
        <div className="form-group">
          <label className="form-label">Lot Name</label>
          <input className="form-control" name="name" placeholder="MG Road Parking"
            value={form.name} onChange={handle} required />
        </div>
        <div className="form-group">
          <label className="form-label">Address</label>
          <input className="form-control" name="address" placeholder="123 MG Road"
            value={form.address} onChange={handle} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-control" name="city" placeholder="Mumbai"
              value={form.city} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Total Spots</label>
            <input className="form-control" name="totalSpots" type="number" min="1"
              placeholder="50" value={form.totalSpots} onChange={handle} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Latitude</label>
            <input className="form-control" name="latitude" type="number" step="any"
              placeholder="19.0760" value={form.latitude} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Longitude</label>
            <input className="form-control" name="longitude" type="number" step="any"
              placeholder="72.8777" value={form.longitude} onChange={handle} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Open Time</label>
            <input className="form-control" name="openTime" type="time"
              value={form.openTime} onChange={handle} />
          </div>
          <div className="form-group">
            <label className="form-label">Close Time</label>
            <input className="form-control" name="closeTime" type="time"
              value={form.closeTime} onChange={handle} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Image URL (optional)</label>
          <input className="form-control" name="imageUrl" placeholder="https://..."
            value={form.imageUrl} onChange={handle} />
        </div>
        
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label className="checkbox-container">
            <input type="checkbox" name="isHandicappedFriendly" checked={form.isHandicappedFriendly} onChange={handle} />
            <span className="checkbox-label" style={{ marginLeft: 8 }}><IconHandicap size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Handicapped Friendly</span>
          </label>
          <label className="checkbox-container">
            <input type="checkbox" name="hasEV" checked={form.hasEV} onChange={handle} />
            <span className="checkbox-label" style={{ marginLeft: 8 }}><IconEV size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> EV Standard Support</span>
          </label>
          <label className="checkbox-container">
            <input type="checkbox" name="hasTwoWheeler" checked={form.hasTwoWheeler} onChange={handle} />
            <span className="checkbox-label" style={{ marginLeft: 8 }}><IconMotorbike size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Two-Wheeler Parking</span>
          </label>
          <label className="checkbox-container">
            <input type="checkbox" name="hasFourWheeler" checked={form.hasFourWheeler} onChange={handle} />
            <span className="checkbox-label" style={{ marginLeft: 8 }}><IconCar size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Four-Wheeler Parking</span>
          </label>
          <label className="checkbox-container">
            <input type="checkbox" name="hasHeavy" checked={form.hasHeavy} onChange={handle} />
            <span className="checkbox-label" style={{ marginLeft: 8 }}><IconTruck size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Heavy Vehicle Support</span>
          </label>
        </div>
      </Modal>
    </ManagerLayout>
  );
}
