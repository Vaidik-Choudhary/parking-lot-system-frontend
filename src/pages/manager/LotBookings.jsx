import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { Spinner, Alert, EmptyState, StatusBadge } from '../../components/common/UI';
import { api } from '../../utils/api';

/**
 * LotBookings — Updated to use the new manager dashboard APIs.
 *
 * Tab layout:
 *   ACTIVE   → GET /api/bookings/manager/{lotId}/active   (currently parked)
 *   UPCOMING → GET /api/bookings/manager/{lotId}/upcoming  (startTime > now)
 *   ALL      → GET /api/bookings/lot/{lotId}               (full history)
 *   RESERVED / COMPLETED / CANCELLED  → client-side filter on ALL
 */
export default function LotBookings() {
  const { lotId } = useParams();
  const navigate  = useNavigate();

  const [allBookings,     setAllBookings]     = useState([]);
  const [activeBookings,  setActiveBookings]  = useState([]);
  const [upcomingBookings,setUpcomingBookings]= useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');
  const [tab,             setTab]             = useState('ACTIVE'); // 'ACTIVE'|'UPCOMING'|'ALL'|'RESERVED'|'COMPLETED'|'CANCELLED'

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      // Load all three in parallel
      const [all, active, upcoming] = await Promise.all([
        api.get(`/api/bookings/lot/${lotId}`),
        api.get(`/api/bookings/manager/${lotId}/active`),
        api.get(`/api/bookings/manager/${lotId}/upcoming`),
      ]);
      setAllBookings(all);
      setActiveBookings(active);
      setUpcomingBookings(upcoming);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [lotId]); // eslint-disable-line

  // ── Derive displayed list from current tab ────────────────────────────────
  const getDisplayList = () => {
    switch (tab) {
      case 'ACTIVE':    return activeBookings;
      case 'UPCOMING':  return upcomingBookings;
      case 'RESERVED':  return allBookings.filter(b => b.status === 'RESERVED');
      case 'COMPLETED': return allBookings.filter(b => b.status === 'COMPLETED');
      case 'CANCELLED': return allBookings.filter(b => b.status === 'CANCELLED');
      default:          return allBookings;
    }
  };

  const counts = {
    ACTIVE:    activeBookings.length,
    UPCOMING:  upcomingBookings.length,
    ALL:       allBookings.length,
    RESERVED:  allBookings.filter(b => b.status === 'RESERVED').length,
    COMPLETED: allBookings.filter(b => b.status === 'COMPLETED').length,
    CANCELLED: allBookings.filter(b => b.status === 'CANCELLED').length,
  };

  const tabLabels = {
    ACTIVE:    '🚗 Active',
    UPCOMING:  '📅 Upcoming',
    ALL:       'All',
    RESERVED:  'Reserved',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };

  const fmt = dt => dt ? new Date(dt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const displayed = getDisplayList();

  return (
    <ManagerLayout title="Lot Bookings"
      topbarRight={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={load}>🔄 Refresh</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Back</button>
        </div>
      }
    >
      <div className="page-header">
        <h1>Bookings — Lot #{lotId}</h1>
        <p>View all reservations and check-ins for this lot.</p>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      {/* ── Context banners ───────────────────────────────────────────────── */}
      {tab === 'ACTIVE' && (
        <div className="alert alert-success mb-3" style={{ fontSize: '0.85rem' }}>
          🟢 <strong>Active Bookings</strong> — Drivers currently parked (status = ACTIVE, checked in now).
        </div>
      )}
      {tab === 'UPCOMING' && (
        <div className="alert alert-info mb-3" style={{ fontSize: '0.85rem' }}>
          🔵 <strong>Upcoming Reservations</strong> — Pre-bookings with startTime in the future (status = RESERVED).
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {Object.entries(tabLabels).map(([key, label]) => (
          <button
            key={key}
            className={`auth-tab ${tab === key ? 'active' : ''}`}
            style={{ flex: 'none', borderRadius: 20, padding: '6px 14px' }}
            onClick={() => setTab(key)}
          >
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : displayed.length === 0 ? (
        <EmptyState
          icon={tab === 'ACTIVE' ? '🅿' : tab === 'UPCOMING' ? '📅' : '📋'}
          title="No bookings found"
          message={
            tab === 'ACTIVE'   ? 'No drivers currently parked.' :
            tab === 'UPCOMING' ? 'No upcoming reservations.' :
                                 'No bookings match the selected filter.'
          }
        />
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Driver</th>
                  <th>Spot</th>
                  <th>Vehicle</th>
                  <th>Type</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(b => (
                  <tr key={b.bookingId}>
                    <td><strong>#{b.bookingId}</strong></td>
                    <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {b.driverEmail}
                    </td>
                    <td>#{b.spotId}</td>
                    <td>{b.vehiclePlate}</td>
                    <td>
                      <span className={`badge ${b.bookingType === 'DRIVE_IN' ? 'badge-success' : 'badge-primary'}`}>
                        {b.bookingType === 'DRIVE_IN' ? '🚗 Drive-In' : '📅 Pre-Booking'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{fmt(b.startTime)}</td>
                    <td style={{ fontSize: '0.8rem' }}>{fmt(b.endTime)}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>
                      {b.totalAmount > 0
                        ? <strong>₹{b.totalAmount}</strong>
                        : b.estimatedAmount > 0
                          ? <span className="text-muted">Est. ₹{b.estimatedAmount}</span>
                          : <span className="text-muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '8px 4px' }}>
            Showing {displayed.length} booking(s)
          </div>
        </div>
      )}
    </ManagerLayout>
  );
}
