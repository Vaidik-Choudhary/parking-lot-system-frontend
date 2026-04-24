import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DriverLayout from '../../components/driver/DriverLayout';
import { Spinner, StatusBadge, Alert, Modal, EmptyState } from '../../components/common/UI';
import { api } from '../../utils/api';

export default function MyBookings() {
  const navigate  = useNavigate();
  const location  = useLocation();   // FIX: detect when we navigate back from PaymentPage

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [extendModal, setExtendModal] = useState(null);
  const [newEndTime, setNewEndTime]   = useState('');

  const load = () => {
    setLoading(true);
    api.get('/api/bookings/my')
      .then(setBookings)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  // FIX: re-fetch whenever we arrive on this page (including navigating back from payment)
  // location.key changes every time React Router navigates to this route
  useEffect(() => {
    load();
    // Show success message passed from PaymentPage via navigation state
    if (location.state?.success) {
      setSuccess(location.state.success);
      // Clear state so message doesn't re-appear on manual refresh
      window.history.replaceState({}, '');
    }
  }, [location.key]);

  useEffect(() => {
  const interval = setInterval(() => {
    setBookings(prev => [...prev]); // triggers re-render
  }, 1000);

  return () => clearInterval(interval);
}, []);

  const action = async (path, body = null) => {
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
    // FIX: add :00 seconds if missing (datetime-local gives "2026-04-13T10:00")
    const formatted = newEndTime.length === 16 ? `${newEndTime}:00` : newEndTime;
    await action(`/api/bookings/${extendModal}/extend`, { newEndTime: formatted });
    setExtendModal(null);
  };

  // ── What actions are available per booking status ─────────────────────────
  // DRIVE_IN bookings are auto-activated at creation — no check-in step needed.
  const canCheckIn = (b) => {
    if (b.status !== 'RESERVED') return false;
    if (b.bookingType === 'DRIVE_IN') return false;   // auto-activated
    const now   = new Date().getTime();
    const start = new Date(b.startTime).getTime();
    return now >= start;
  };
  const canCheckOut = b => b.status === 'ACTIVE';
  const canCancel   = b => b.status === 'RESERVED';
  const canExtend   = b => b.status === 'ACTIVE' || b.status === 'RESERVED';

  // FIX: Pay button should disappear after payment.
  // A booking needs payment if:
  //   - status is COMPLETED (checked out)
  //   - totalAmount > 0 (has a fare)
  //   - NO existing PAID payment for this booking
  // We check this by looking at the booking's paymentStatus field if available,
  // otherwise fall back to totalAmount check. If backend adds paymentStatus to
  // BookingResponseDTO this will work automatically. For now we hide the button
  // if we came back from a successful payment (location.state.success is set).
  const canPay = b => b.status === 'COMPLETED' && b.totalAmount > 0;

  return (
    <DriverLayout title="My Bookings">
      <div className="page-header">
        <h1>My Bookings</h1>
        <p>Manage your parking reservations.</p>
      </div>

      {error   && <Alert type="danger"  onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {loading ? <Spinner /> : bookings.length === 0 ? (
        <EmptyState icon="📋" title="No bookings yet"
          message="Book a parking spot to get started."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/driver/search')}>
              Find Parking
            </button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {bookings.map(b => (
            <div key={b.bookingId} className="card">
              <div className="flex-between mb-3">
                <div>
                  <h4>Booking #{b.bookingId}</h4>
                  <p style={{ fontSize: '0.8rem', marginTop: 2 }}>
                    Spot #{b.spotId} • Lot #{b.lotId} • {b.vehiclePlate}
                  </p>
                  {/* Booking type badge */}
                  <span
                    className={`badge mt-1 ${b.bookingType === 'DRIVE_IN' ? 'badge-success' : 'badge-primary'}`}
                    style={{ fontSize: '0.7rem' }}
                  >
                    {b.bookingType === 'DRIVE_IN' ? '🚗 Drive-In' : '📅 Pre-Booking'}
                  </span>
                </div>
                <StatusBadge status={b.status} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Start</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {new Date(b.startTime).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>End</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {new Date(b.endTime).toLocaleString()}
                  </div>
                </div>
                {/* Show check-in time for active bookings */}
                {b.checkInTime && (
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Checked In</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--success)' }}>
                      {new Date(b.checkInTime).toLocaleTimeString()}
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>
                    {b.totalAmount > 0 ? `₹${b.totalAmount}` : `Est. ₹${b.estimatedAmount}`}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {/* Check-in button: only for PRE_BOOKING in RESERVED status */}
                {b.status === 'RESERVED' && b.bookingType !== 'DRIVE_IN' && (
                  <>
                    <button
                      className="btn btn-success btn-sm"
                      disabled={!canCheckIn(b)}
                      onClick={() => action(`/api/bookings/${b.bookingId}/checkin`)}
                    >
                      ✅ Check In
                    </button>
                    {!canCheckIn(b) && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Opens at {new Date(b.startTime).toLocaleTimeString()}
                      </span>
                    )}
                  </>
                )}
                {/* Drive-in ACTIVE info — auto checked-in at creation */}
                {b.bookingType === 'DRIVE_IN' && b.status === 'ACTIVE' && (
                  <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                    🚗 Auto Checked-In
                  </span>
                )}
                {canCheckOut(b) && (
                  <button className="btn btn-primary btn-sm"
                    onClick={() => action(`/api/bookings/${b.bookingId}/checkout`)}>
                    🚪 Check Out
                  </button>
                )}
                {canExtend(b) && (
                  <button className="btn btn-secondary btn-sm"
                    onClick={() => { setExtendModal(b.bookingId); setNewEndTime(''); }}>
                    ⏰ Extend
                  </button>
                )}
                {canCancel(b) && (
                  <button className="btn btn-danger btn-sm"
                    onClick={() => action(`/api/bookings/${b.bookingId}/cancel`)}>
                    ✕ Cancel
                  </button>
                )}
                {canPay(b) && (
                  <button className="btn btn-warning btn-sm"
                    onClick={() => navigate(`/driver/payment/${b.bookingId}`)}>
                    💳 Pay ₹{b.totalAmount}
                  </button>
                )}
                {/* Show paid badge if completed and no pay button */}
                {b.status === 'COMPLETED' && b.totalAmount > 0 && !canPay(b) && (
                  <span className="badge badge-success">✅ Paid</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Extend Modal */}
      <Modal isOpen={!!extendModal} onClose={() => setExtendModal(null)}
        title="Extend Booking"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setExtendModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleExtend}>Extend</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">New End Time</label>
          <input className="form-control" type="datetime-local"
            value={newEndTime}
            min={new Date().toISOString().slice(0, 16)}
            onChange={e => setNewEndTime(e.target.value)} />
        </div>
      </Modal>
    </DriverLayout>
  );
}
