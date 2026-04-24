import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DriverLayout from '../../components/driver/DriverLayout';
import { Spinner, Modal, Alert } from '../../components/common/UI';
import { api } from '../../utils/api';

/**
 * LotDetail — Booking flow redesign
 *
 * STEP 1: User picks a booking mode (PRE_BOOKING or DRIVE_IN)
 *
 * STEP 2a — PRE_BOOKING:
 *   - User enters Start Time + End Time
 *   - "Find Available Spots" calls GET /api/bookings/slots/{lotId}/available?startTime=&endTime=
 *   - Only spots free in that window are shown (BookMyShow-style)
 *
 * STEP 2b — DRIVE_IN:
 *   - Calls GET /api/bookings/slots/{lotId}/drive-in
 *   - Shows live grid: FREE (green) | RESERVED_AVAILABLE (amber) | OCCUPIED (red)
 *   - RESERVED_AVAILABLE tiles show "Available until HH:mm" label
 *
 * STEP 3: User clicks a selectable spot → modal opens → confirm booking
 */
export default function LotDetail() {
  const { lotId } = useParams();
  const navigate  = useNavigate();

  // ── Lot metadata ──────────────────────────────────────────────────────────
  const [lot, setLot]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  // ── Booking mode (Step 1) ─────────────────────────────────────────────────
  // null = not chosen yet, 'PRE_BOOKING' or 'DRIVE_IN'
  const [bookingMode, setBookingMode] = useState(null);

  // ── PRE_BOOKING — time filter state ──────────────────────────────────────
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd,   setFilterEnd]   = useState('');
  const [filterLoading, setFilterLoading] = useState(false);

  // ── Spots (populated after mode is chosen) ────────────────────────────────
  // For PRE_BOOKING → raw spot maps from the filtered endpoint
  // For DRIVE_IN    → DriveInSpotDTO objects
  const [spots, setSpots] = useState([]);
  const [spotsLoaded, setSpotsLoaded] = useState(false);

  // ── Booking modal ─────────────────────────────────────────────────────────
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({ vehiclePlate: '', endTime: '' });

  // ── datetime-local → ISO with seconds ────────────────────────────────────
  const toISO = dt => (!dt ? '' : dt.length === 16 ? `${dt}:00` : dt);

  // ── Load lot + vehicles on mount ──────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const [lotData, vehiclesData] = await Promise.all([
          api.get(`/api/lots/${lotId}`),
          api.get('/api/vehicles/my'),
        ]);
        setLot(lotData);
        setVehicles(vehiclesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [lotId]);

  // ── PRE_BOOKING: load available spots for the selected time window ─────────
  const loadPreBookingSpots = useCallback(async () => {
    if (!filterStart || !filterEnd) {
      setError('Please select both Start Time and End Time.');
      return;
    }
    if (new Date(filterEnd) <= new Date(filterStart)) {
      setError('End time must be after start time.');
      return;
    }
    if (new Date(filterStart) <= new Date()) {
      setError('Start time must be in the future.');
      return;
    }
    setError('');
    setFilterLoading(true);
    setSpotsLoaded(false);
    try {
      const data = await api.get(
        `/api/bookings/slots/${lotId}/available?startTime=${toISO(filterStart)}&endTime=${toISO(filterEnd)}`
      );
      setSpots(data);
      setSpotsLoaded(true);
      setSelected(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setFilterLoading(false);
    }
  }, [lotId, filterStart, filterEnd]);

  // ── DRIVE_IN: load real-time spot grid ────────────────────────────────────
  const loadDriveInSpots = useCallback(async () => {
    setFilterLoading(true);
    setSpotsLoaded(false);
    setSelected(null);
    try {
      const data = await api.get(`/api/bookings/slots/${lotId}/drive-in`);
      setSpots(data);
      setSpotsLoaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setFilterLoading(false);
    }
  }, [lotId]);

  // Auto-load drive-in when mode switches to DRIVE_IN
  useEffect(() => {
    if (bookingMode === 'DRIVE_IN') {
      loadDriveInSpots();
    } else {
      // Reset spots when switching mode
      setSpots([]);
      setSpotsLoaded(false);
      setSelected(null);
    }
  }, [bookingMode, loadDriveInSpots]);

  // ── Fare estimate in modal ─────────────────────────────────────────────────
  const getEstimate = () => {
    if (!form.endTime || !selected) return null;
    const start = bookingMode === 'DRIVE_IN' ? new Date() : new Date(toISO(filterStart));
    const end   = new Date(toISO(form.endTime));
    const diff  = end - start;
    if (diff <= 0) return null;
    return (Math.max(1, diff / 3600000) * selected.pricePerHour).toFixed(2);
  };

  // ── Book the selected spot ────────────────────────────────────────────────
  const handleBook = async () => {
    setError('');
    if (!form.vehiclePlate.trim()) return setError('Please enter your vehicle plate number.');
    if (!form.endTime) return setError('Please select an end/departure time.');

    // For DRIVE_IN, endTime must be in the future
    if (new Date(toISO(form.endTime)) <= new Date()) {
      return setError('End time must be in the future.');
    }
    // For RESERVED_AVAILABLE drive-in spots, endTime must not exceed reservedFrom
    if (bookingMode === 'DRIVE_IN' && selected?.reservedFrom) {
      if (new Date(toISO(form.endTime)) > new Date(selected.reservedFrom)) {
        return setError(
          `This spot is reserved at ${new Date(selected.reservedFrom).toLocaleTimeString()}.` +
          ` Your departure time must be before that.`
        );
      }
    }

    setBookingLoading(true);
    try {
      const payload = {
        lotId:        Number(lotId),
        spotId:       selected.spotId,
        vehiclePlate: form.vehiclePlate.toUpperCase().trim(),
        bookingType:  bookingMode,
        endTime:      toISO(form.endTime),
      };
      // For PRE_BOOKING, include the filtered startTime
      if (bookingMode === 'PRE_BOOKING') {
        payload.startTime = toISO(filterStart);
      }

      const booking = await api.post('/api/bookings', payload);

      const modeLabel = bookingMode === 'DRIVE_IN' ? 'Drive-in active' : 'Reserved';
      setSuccess(
        `Booking #${booking.bookingId} confirmed! Spot ${selected.spotNumber} — ${modeLabel}.`
      );
      setShowModal(false);
      setSelected(null);
      setForm({ vehiclePlate: '', endTime: '' });

      // Refresh the spot grid
      if (bookingMode === 'DRIVE_IN') loadDriveInSpots();
      else loadPreBookingSpots();

      // Best-effort notification
      api.post('/api/notifications/send', {
        recipientEmail: localStorage.getItem('email'),
        type: bookingMode === 'DRIVE_IN' ? 'CHECKIN' : 'BOOKING_CONFIRMED',
        channel: 'BOTH',
        title: bookingMode === 'DRIVE_IN' ? 'Drive-In Active! 🚗' : 'Booking Confirmed! 🎉',
        message: `Spot ${selected.spotNumber} at ${lot?.name}. Booking #${booking.bookingId}`,
        relatedId: booking.bookingId, relatedType: 'BOOKING',
      }).catch(() => {});

    } catch (err) {
      setError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  // ── Group spots by floor ──────────────────────────────────────────────────
  const spotsGroups = {};
  spots.forEach(s => {
    const f = `Floor ${s.floor}`;
    if (!spotsGroups[f]) spotsGroups[f] = [];
    spotsGroups[f].push(s);
  });

  // ── Derive spot tile CSS class ────────────────────────────────────────────
  // PRE_BOOKING: spots are "available" (anything returned is free)
  // DRIVE_IN:    use DriveInSpotDTO.status → FREE / RESERVED_AVAILABLE / OCCUPIED / MAINTENANCE
  const getTileClass = (spot) => {
    if (bookingMode === 'PRE_BOOKING') return 'available';
    const s = (spot.status || '').toLowerCase().replace('_', '-');
    // Map drive-in statuses → CSS classes defined in global.css
    if (s === 'free') return 'available';
    if (s === 'reserved-available') return 'reserved-available';
    if (s === 'occupied') return 'occupied';
    if (s === 'maintenance') return 'maintenance';
    return 'available';
  };

  if (loading) return <DriverLayout title="Lot Details"><Spinner /></DriverLayout>;

  return (
    <DriverLayout
      title={lot?.name || 'Lot Detail'}
      topbarRight={
        <div style={{ display: 'flex', gap: 8 }}>
          {bookingMode && spotsLoaded && (
            <button className="btn btn-secondary btn-sm"
              onClick={bookingMode === 'DRIVE_IN' ? loadDriveInSpots : loadPreBookingSpots}>
              🔄 Refresh
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Back</button>
        </div>
      }
    >
      {error   && <Alert type="danger"  onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Lot info card */}
      <div className="card mb-4">
        <div className="flex-between mb-3">
          <div>
            <h2>{lot?.name}</h2>
            <p>📍 {lot?.address}, {lot?.city}</p>
          </div>
          <span className={`badge ${lot?.open ? 'badge-success' : 'badge-danger'}`}>
            {lot?.open ? '● Open' : '● Closed'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div className="lot-meta-item">🕐 {lot?.openTime} – {lot?.closeTime}</div>
          <div className="lot-meta-item">🅿 {lot?.availableSpots} / {lot?.totalSpots} available</div>
        </div>
      </div>

      {/* ── STEP 1: Choose booking mode ─────────────────────────────────── */}
      <div className="card mb-4">
        <h3 className="card-title mb-3">Step 1 — How would you like to park?</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div
            className={`booking-mode-card ${bookingMode === 'PRE_BOOKING' ? 'active' : ''}`}
            onClick={() => { setBookingMode('PRE_BOOKING'); }}
          >
            <div className="booking-mode-icon">📅</div>
            <div>
              <strong>Pre-Booking</strong>
              <p style={{ fontSize: '0.82rem', marginTop: 4 }}>
                Reserve a spot in advance. Pick a time window and see only available slots.
              </p>
            </div>
          </div>
          <div
            className={`booking-mode-card ${bookingMode === 'DRIVE_IN' ? 'active' : ''}`}
            onClick={() => { setBookingMode('DRIVE_IN'); }}
          >
            <div className="booking-mode-icon">🚗</div>
            <div>
              <strong>Drive-In</strong>
              <p style={{ fontSize: '0.82rem', marginTop: 4 }}>
                You're here now. See live availability and get checked in instantly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── STEP 2a: PRE_BOOKING — time filter ─────────────────────────── */}
      {bookingMode === 'PRE_BOOKING' && (
        <div className="card mb-4">
          <h3 className="card-title mb-3">Step 2 — Select your time window</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input
                className="form-control" type="datetime-local"
                value={filterStart}
                min={new Date().toISOString().slice(0, 16)}
                onChange={e => setFilterStart(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input
                className="form-control" type="datetime-local"
                value={filterEnd}
                min={filterStart || new Date().toISOString().slice(0, 16)}
                onChange={e => setFilterEnd(e.target.value)}
              />
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={loadPreBookingSpots}
            disabled={filterLoading || !filterStart || !filterEnd}
          >
            {filterLoading ? 'Searching...' : '🔍 Find Available Spots'}
          </button>
          {spotsLoaded && (
            <p style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              ✅ Showing {spots.length} spot(s) available for your selected window.
              {spots.length === 0 && ' Try a different time range.'}
            </p>
          )}
        </div>
      )}

      {/* ── STEP 2b: DRIVE_IN — loading indicator ───────────────────────── */}
      {bookingMode === 'DRIVE_IN' && filterLoading && (
        <div className="card mb-4 flex-center" style={{ padding: 40 }}>
          <Spinner />
          <p style={{ marginTop: 12 }}>Loading live spot availability…</p>
        </div>
      )}

      {/* ── STEP 3: Spot grid ────────────────────────────────────────────── */}
      {spotsLoaded && spots.length > 0 && (
        <>
          {/* Legend */}
          <div className="spot-legend mb-3">
            {bookingMode === 'PRE_BOOKING' ? (
              <div className="spot-legend-item">
                <div className="spot-legend-dot" style={{ background: '#dcfce7' }} />
                Available for your window (click to select)
              </div>
            ) : (
              <>
                <div className="spot-legend-item">
                  <div className="spot-legend-dot" style={{ background: '#dcfce7' }} />Free
                </div>
                <div className="spot-legend-item">
                  <div className="spot-legend-dot" style={{ background: '#fef3c7', border: '1px solid #f59e0b' }} />
                  Reserved (available until reservation starts)
                </div>
                <div className="spot-legend-item">
                  <div className="spot-legend-dot" style={{ background: '#fee2e2' }} />Occupied
                </div>
              </>
            )}
            {selected && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                <strong>✓ {selected.spotNumber} — ₹{selected.pricePerHour}/hr</strong>
                <button className="btn btn-primary btn-sm"
                  onClick={() => { setError(''); setShowModal(true); }}>
                  Book This Spot
                </button>
              </div>
            )}
          </div>

          {/* Floor-grouped grid */}
          {Object.entries(spotsGroups).map(([floor, floorSpots]) => (
            <div key={floor} className="card mb-3">
              <div className="card-header">
                <h4 className="card-title">{floor}</h4>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                  {bookingMode === 'DRIVE_IN'
                    ? `${floorSpots.filter(s => s.selectable).length} selectable`
                    : `${floorSpots.length} available`}
                </span>
              </div>
              <div className="spot-grid">
                {floorSpots.map(spot => {
                  const tileClass  = getTileClass(spot);
                  const selectable = bookingMode === 'PRE_BOOKING' ? true : spot.selectable;
                  return (
                    <div
                      key={spot.spotId}
                      className={`spot-tile ${tileClass}${selected?.spotId === spot.spotId ? ' selected' : ''}`}
                      onClick={() => selectable && setSelected(spot)}
                      title={selectable
                        ? `${spot.spotNumber} — ₹${spot.pricePerHour}/hr — Click to select`
                        : `${spot.spotNumber} — ${spot.availabilityLabel || spot.status}`}
                    >
                      <div className="spot-num">{spot.spotNumber}</div>
                      <div className="spot-type">
                        {spot.isEVCharging ? '⚡' : spot.isHandicapped ? '♿' : spot.spotType}
                      </div>
                      {/* Drive-in "Available until" label on reserved-available tiles */}
                      {bookingMode === 'DRIVE_IN' && spot.status === 'RESERVED_AVAILABLE' && (
                        <div className="spot-until">{spot.availabilityLabel}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Spot grid empty state */}
      {spotsLoaded && spots.length === 0 && (
        <div className="card flex-center" style={{ padding: 48, flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: '2.5rem' }}>🚫</div>
          <h3>No available spots</h3>
          <p>
            {bookingMode === 'PRE_BOOKING'
              ? 'All spots are booked for your selected time window. Try different times.'
              : 'All spots are currently occupied.'}
          </p>
        </div>
      )}

      {/* ── Booking Modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setError(''); }}
        title={`Book Spot ${selected?.spotNumber} — ${bookingMode === 'DRIVE_IN' ? 'Drive-In' : 'Pre-Booking'}`}
        footer={
          <>
            <button className="btn btn-secondary"
              onClick={() => { setShowModal(false); setError(''); }}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleBook} disabled={bookingLoading}>
              {bookingLoading ? 'Booking...' : bookingMode === 'DRIVE_IN' ? '🚗 Drive In' : '📅 Confirm Reservation'}
            </button>
          </>
        }
      >
        {/* Mode badge */}
        <div style={{ marginBottom: 16 }}>
          <span className={`badge ${bookingMode === 'DRIVE_IN' ? 'badge-success' : 'badge-primary'}`}>
            {bookingMode === 'DRIVE_IN' ? '🚗 Drive-In — Instant Check-in' : '📅 Pre-Booking — Reserve Ahead'}
          </span>
        </div>

        {/* Spot info */}
        {selected && (
          <div className="alert alert-info mb-3">
            <div className="flex-between">
              <span>
                🅿 <strong>{selected.spotNumber}</strong> — {selected.spotType}
                {selected.isEVCharging && ' ⚡'}{selected.isHandicapped && ' ♿'}
              </span>
              <strong>₹{selected.pricePerHour}/hr</strong>
            </div>
            {/* Warning for RESERVED_AVAILABLE in drive-in */}
            {bookingMode === 'DRIVE_IN' && selected.status === 'RESERVED_AVAILABLE' && (
              <div style={{ marginTop: 8, fontSize: '0.82rem', color: '#b45309' }}>
                ⚠ {selected.availabilityLabel}. Set your departure time before this.
              </div>
            )}
            {/* PRE_BOOKING: show chosen window */}
            {bookingMode === 'PRE_BOOKING' && filterStart && (
              <div style={{ marginTop: 6, fontSize: '0.82rem' }}>
                🕐 {new Date(toISO(filterStart)).toLocaleString()} →
                {form.endTime ? new Date(toISO(form.endTime)).toLocaleString() : '…'}
              </div>
            )}
            {getEstimate() && (
              <div style={{ marginTop: 6, fontSize: '0.85rem' }}>
                💰 Estimated fare: <strong>₹{getEstimate()}</strong>
                <span style={{ opacity: 0.7 }}> (min. 1hr charge applies)</span>
              </div>
            )}
          </div>
        )}

        {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

        {/* Vehicle plate */}
        <div className="form-group">
          <label className="form-label">Vehicle Plate Number</label>
          <input
            className="form-control"
            placeholder="MH01AB1234"
            value={form.vehiclePlate}
            onChange={e => setForm({ ...form, vehiclePlate: e.target.value })}
            list="vehicle-suggestions"
            style={{ textTransform: 'uppercase' }}
          />
          <datalist id="vehicle-suggestions">
            {vehicles.map(v => (
              <option key={v.vehicleId} value={v.licensePlate} />
            ))}
          </datalist>
        </div>

        {/* PRE_BOOKING: start time is fixed from filter; only end time needed */}
        {bookingMode === 'PRE_BOOKING' && (
          <div className="form-group">
            <label className="form-label">Booking Window</label>
            <div className="alert alert-info" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
              📅 {filterStart ? new Date(toISO(filterStart)).toLocaleString() : '—'}
              &nbsp;→&nbsp;
              {filterEnd  ? new Date(toISO(filterEnd)).toLocaleString() : '—'}
            </div>
          </div>
        )}

        {/* DRIVE_IN: only end (estimated departure) needed */}
        {bookingMode === 'DRIVE_IN' && (
          <div className="form-group">
            <label className="form-label">
              Estimated Departure Time
              {selected?.reservedFrom && (
                <span style={{ color: '#b45309', fontWeight: 400, marginLeft: 6 }}>
                  (must be before {new Date(selected.reservedFrom).toLocaleTimeString()})
                </span>
              )}
            </label>
            <input
              className="form-control" type="datetime-local"
              value={form.endTime}
              min={new Date().toISOString().slice(0, 16)}
              max={selected?.reservedFrom
                ? new Date(selected.reservedFrom).toISOString().slice(0, 16) : undefined}
              onChange={e => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
        )}

        {/* PRE_BOOKING: override endTime if user wants a different one */}
        {bookingMode === 'PRE_BOOKING' && (
          <div className="form-group">
            <label className="form-label">End Time (from your filter)</label>
            <input
              className="form-control" type="datetime-local"
              value={form.endTime || filterEnd}
              min={filterStart || new Date().toISOString().slice(0, 16)}
              onChange={e => setForm({ ...form, endTime: e.target.value })}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Pre-filled from your time filter. Adjust if needed.
            </div>
          </div>
        )}
      </Modal>
    </DriverLayout>
  );
}
