import React, { useEffect, useState } from 'react';
import DriverLayout from '../../components/driver/DriverLayout';
import { Spinner, Modal, Alert, EmptyState } from '../../components/common/UI';
import { api } from '../../utils/api';

const EMPTY_FORM = { licensePlate: '', make: '', model: '', color: '', vehicleType: 'FOUR_WHEELER', isEV: false };

export default function MyVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const load = () => {
    api.get('/api/vehicles/my')
      .then(setVehicles)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openAdd  = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (v) => {
    setEditing(v.vehicleId);
    setForm({ licensePlate: v.licensePlate, make: v.make, model: v.model,
              color: v.color, vehicleType: v.vehicleType, isEV: v.isEV });
    setShowModal(true);
  };

  const save = async () => {
    setError('');
    try {
      if (editing) {
        await api.put(`/api/vehicles/${editing}`, form);
      } else {
        await api.post('/api/vehicles', form);
      }
      setSuccess(editing ? 'Vehicle updated.' : 'Vehicle registered.');
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this vehicle?')) return;
    try {
      await api.delete(`/api/vehicles/${id}`);
      setSuccess('Vehicle deleted.');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handle = e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  return (
    <DriverLayout title="My Vehicles"
      topbarRight={
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          + Add Vehicle
        </button>
      }
    >
      <div className="page-header">
        <h1>My Vehicles</h1>
        <p>Register and manage your vehicles for quick booking.</p>
      </div>

      {error   && <Alert type="danger"  onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {loading ? <Spinner /> : vehicles.length === 0 ? (
        <EmptyState icon="🚗" title="No vehicles registered"
          message="Add your vehicle to speed up the booking process."
          action={<button className="btn btn-primary" onClick={openAdd}>Add Vehicle</button>}
        />
      ) : (
        <div className="lot-grid">
          {vehicles.map(v => (
            <div key={v.vehicleId} className="card">
              <div className="flex-between mb-3">
                <div style={{ fontSize: '2rem' }}>
                  {v.vehicleType === 'TWO_WHEELER' ? '🛵' : v.vehicleType === 'HEAVY' ? '🚛' : '🚗'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(v)}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(v.vehicleId)}>🗑️</button>
                </div>
              </div>
              <h3 style={{ fontWeight: 700, letterSpacing: '0.05em' }}>{v.licensePlate}</h3>
              <p style={{ fontSize: '0.875rem', marginTop: 4 }}>{v.make} {v.model}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <span className="badge badge-primary">{v.vehicleType.replace('_', ' ')}</span>
                {v.isEV && <span className="badge badge-success">⚡ EV</span>}
                {v.color && <span className="badge badge-muted">{v.color}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editing ? 'Edit Vehicle' : 'Register Vehicle'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>
              {editing ? 'Save Changes' : 'Register'}
            </button>
          </>
        }
      >
        {error && <Alert type="danger">{error}</Alert>}
        <div className="form-group">
          <label className="form-label">License Plate</label>
          <input className="form-control" name="licensePlate" placeholder="MH01AB1234"
            value={form.licensePlate} onChange={handle} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Make</label>
            <input className="form-control" name="make" placeholder="Toyota"
              value={form.make} onChange={handle} />
          </div>
          <div className="form-group">
            <label className="form-label">Model</label>
            <input className="form-control" name="model" placeholder="Camry"
              value={form.model} onChange={handle} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Color</label>
            <input className="form-control" name="color" placeholder="White"
              value={form.color} onChange={handle} />
          </div>
          <div className="form-group">
            <label className="form-label">Vehicle Type</label>
            <select className="form-control" name="vehicleType"
              value={form.vehicleType} onChange={handle}>
              <option value="TWO_WHEELER">Two Wheeler</option>
              <option value="FOUR_WHEELER">Four Wheeler</option>
              <option value="HEAVY">Heavy Vehicle</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" name="isEV" checked={form.isEV} onChange={handle} />
            <span className="form-label" style={{ margin: 0 }}>⚡ This is an Electric Vehicle (EV)</span>
          </label>
        </div>
      </Modal>
    </DriverLayout>
  );
}
