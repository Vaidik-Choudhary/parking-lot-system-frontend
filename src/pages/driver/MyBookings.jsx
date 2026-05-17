import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DriverLayout from '../../components/driver/DriverLayout';
import { Spinner, StatusBadge, Alert, Modal, EmptyState } from '../../components/common/UI';
import { IconBooking, IconCar, IconCalendar, IconCheckCircle, IconLogout, IconClock, IconX, IconPayment, IconParking, IconInfo } from '../../components/common/Icons';
import { api } from '../../utils/api';

export default function MyBookings() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('HOURLY'); // 'HOURLY' or 'SUBSCRIPTION'
  
  const [bookings, setBookings] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [extendModal, setExtendModal] = useState(null);
  const [newEndTime, setNewEndTime] = useState('');
  
  // Cancellation state for subscriptions
  const [cancellingSubId, setCancellingSubId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [bData, sData] = await Promise.all([
        api.get('/api/bookings/my'),
        api.get('/api/subscriptions/active')
      ]);
      setBookings(Array.isArray(bData) ? bData : []);
      setSubscriptions(Array.isArray(sData) ? sData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (location.state?.success) {
      setSuccess(location.state.success);
      window.history.replaceState({}, '');
    }
  }, [location.key]);

  const handleAction = async (path, body = null) => {
    setError('');
    try {
      await api.put(path, body);
      setSuccess('Action completed successfully!');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExtend = async () => {
    if (!newEndTime) return;
    const formatted = newEndTime.length === 16 ? `${newEndTime}:00` : newEndTime;
    await handleAction(`/api/bookings/${extendModal}/extend`, { newEndTime: formatted });
    setExtendModal(null);
  };

  const handleCancelSubscription = async () => {
    try {
      await api.post(`/api/subscriptions/${cancellingSubId}/cancel`);
      setSuccess('Subscription cancelled and pro-rated bill generated.');
      setCancellingSubId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <DriverLayout title="My Bookings">
      <div className="page-header">
        <h1>My Bookings & Subscriptions</h1>
        <p>Manage your active parking sessions and monthly contracts.</p>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Tabs */}
      <div className="custom-tabs mb-4">
        <button 
          className={`tab-btn ${activeTab === 'HOURLY' ? 'active' : ''}`}
          onClick={() => setActiveTab('HOURLY')}
        >
          <IconBooking size={16} className="mr-2" /> Hourly Bookings
        </button>
        <button 
          className={`tab-btn ${activeTab === 'SUBSCRIPTION' ? 'active' : ''}`}
          onClick={() => setActiveTab('SUBSCRIPTION')}
        >
          <IconCalendar size={16} className="mr-2" /> Monthly Subscriptions
        </button>
      </div>

      {loading ? <Spinner /> : (
        activeTab === 'HOURLY' ? (
          bookings.length === 0 ? (
            <EmptyState icon={<IconBooking size={48} />} title="No hourly bookings"
              message="You don't have any active or upcoming hourly bookings."
              action={<button className="btn btn-primary" onClick={() => navigate('/driver/search')}>Book a Spot</button>}
            />
          ) : (
            <div className="booking-grid">
              {bookings.map(b => (
                <div key={b.bookingId} className="card animate-fade-in mb-3">
                  <div className="flex-between mb-3">
                    <div>
                      <h4 className="m-0">Booking #{b.bookingId}</h4>
                      <p className="text-muted small mt-1">
                        <IconParking size={12} className="mr-1" /> Spot #{b.spotId} • Lot #{b.lotId}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  
                  <div className="info-row">
                    <div className="info-col">
                      <label>Time Window</label>
                      <span>{new Date(b.startTime).toLocaleString()} - {new Date(b.endTime).toLocaleTimeString()}</span>
                    </div>
                    <div className="info-col">
                      <label>Vehicle</label>
                      <span>{b.vehiclePlate}</span>
                    </div>
                    <div className="info-col">
                      <label>Total Amount</label>
                      <span className="text-primary font-weight-bold">
                        {b.totalAmount > 0 ? `₹${b.totalAmount}` : `Est. ₹${b.estimatedAmount}`}
                      </span>
                    </div>
                  </div>

                  <div className="card-actions mt-3 d-flex gap-2">
                    {b.status === 'RESERVED' && b.bookingType !== 'DRIVE_IN' && (
                      <button className="btn btn-success btn-sm" onClick={() => handleAction(`/api/bookings/${b.bookingId}/checkin`)}>Check In</button>
                    )}
                    {b.status === 'ACTIVE' && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleAction(`/api/bookings/${b.bookingId}/checkout`)}>Check Out</button>
                    )}
                    {(b.status === 'ACTIVE' || b.status === 'RESERVED') && (
                      <button className="btn btn-secondary btn-sm" onClick={() => { setExtendModal(b.bookingId); setNewEndTime(''); }}>Extend</button>
                    )}
                    {b.status === 'RESERVED' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleAction(`/api/bookings/${b.bookingId}/cancel`)}>Cancel</button>
                    )}
                    {b.status === 'COMPLETED' && !b.isPaid && b.totalAmount > 0 && (
                      <button className="btn btn-warning btn-sm" onClick={() => navigate(`/driver/payment/${b.bookingId}`)}>Pay ₹{b.totalAmount}</button>
                    )}
                    {b.isPaid && <span className="badge badge-success">Paid</span>}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          subscriptions.length === 0 ? (
            <EmptyState icon={<IconCalendar size={48} />} title="No active subscriptions"
              message="Subscribe to a permanent spot to see it here."
              action={<button className="btn btn-primary" onClick={() => navigate('/driver/spot-block')}>Explore Spot Block</button>}
            />
          ) : (
            <div className="subscription-list">
              {subscriptions.map(sub => (
                <div key={sub.id} className="card mb-3">
                  <div className="flex-between mb-3">
                    <div className="d-flex align-items-center">
                      <div className="icon-circle bg-info-soft text-info mr-3">
                        <IconParking size={20} />
                      </div>
                      <div>
                        <h4 className="m-0">Monthly Spot #{sub.spotId}</h4>
                        <p className="text-muted small m-0">Permanent spot at Lot #{sub.lotId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="badge badge-info mb-1">{sub.status}</div>
                      <div className="text-primary font-weight-bold h5 m-0">₹{sub.monthlyRate}<small>/mo</small></div>
                    </div>
                  </div>

                  <div className="info-row bg-light p-3 rounded mb-3">
                    <div className="info-col">
                      <label>Start Date</label>
                      <span>{new Date(sub.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="info-col">
                      <label>Renewal Date</label>
                      <span>{new Date(sub.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="info-col">
                      <label>Driver Email</label>
                      <span>{sub.driverEmail}</span>
                    </div>
                  </div>

                  <div className="card-actions">
                    <button 
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => setCancellingSubId(sub.id)}
                    >
                      End Subscription early
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" disabled>
                      <IconInfo size={14} className="mr-1" /> View History
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )
      )}

      {/* Modal for Extension */}
      <Modal isOpen={!!extendModal} onClose={() => setExtendModal(null)} title="Extend Booking">
        <div className="form-group">
          <label className="form-label">New End Time</label>
          <input className="form-control" type="datetime-local" value={newEndTime} onChange={e => setNewEndTime(e.target.value)} />
        </div>
        <div className="card-actions justify-content-end mt-3">
          <button className="btn btn-secondary" onClick={() => setExtendModal(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleExtend}>Confirm Extension</button>
        </div>
      </Modal>

      {/* Modal for Cancellation */}
      {cancellingSubId && (
        <Modal isOpen={true} onClose={() => setCancellingSubId(null)} title="End Subscription?">
          <p>Are you sure you want to end this monthly subscription? You will be charged a pro-rated amount for the days used.</p>
          <div className="card-actions justify-content-end mt-3">
            <button className="btn btn-secondary" onClick={() => setCancellingSubId(null)}>Wait</button>
            <button className="btn btn-danger" onClick={handleCancelSubscription}>Yes, Cancel It</button>
          </div>
        </Modal>
      )}

      <style>{`
        .custom-tabs {
          display: flex;
          border-bottom: 2px solid var(--border-color);
          gap: 24px;
        }
        .card-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .tab-btn {
          background: none;
          border: none;
          padding: 12px 4px;
          font-weight: 600;
          color: var(--text-muted);
          position: relative;
          cursor: pointer;
          transition: color 0.2s;
        }
        .tab-btn:hover { color: var(--primary); }
        .tab-btn.active { color: var(--primary); }
        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--primary);
        }
        .info-row {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }
        .info-col {
          flex: 1;
          min-width: 140px;
        }
        .info-col label {
          display: block;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 4px;
        }
        .info-col span {
          font-weight: 600;
          font-size: 0.9rem;
        }
        .icon-circle {
          width: 40px; height: 40px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .bg-info-soft { background: rgba(var(--info-rgb), 0.1); }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </DriverLayout>
  );
}
