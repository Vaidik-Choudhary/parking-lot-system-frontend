import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { Spinner, StatusBadge, EmptyState } from '../../components/common/UI';
import { api, getUserName } from '../../utils/api';

/**
 * Manager Dashboard
 *
 * New "Notification Section" (bottom of the page):
 *  - Loads GET /api/bookings/manager/{lotId}/dashboard for each lot
 *  - Shows "Active Bookings" (currently parked) and "Upcoming Bookings"
 *    (reservations with startTime > now) for each lot the manager owns
 */
export default function ManagerDashboard() {
  const navigate = useNavigate();
  const name     = getUserName();

  const [lots,          setLots]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  // dashboard data keyed by lotId
  const [dashboards,    setDashboards]    = useState({});
  const [dashLoading,   setDashLoading]   = useState(false);
  const [activeTab,     setActiveTab]     = useState('active'); // 'active' | 'upcoming'
  // which lot's notifications are being viewed (null = show all)
  const [selectedLotId, setSelectedLotId] = useState(null);

  // ── Load lots ─────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/api/lots/my-lots')
      .then(data => {
        setLots(data);
        return data;
      })
      .then(async (data) => {
        // Load dashboard for each approved lot in parallel
        const approved = data.filter(l => l.approved);
        if (approved.length === 0) return;
        setDashLoading(true);
        try {
          const results = await Promise.all(
            approved.map(l =>
              api.get(`/api/bookings/manager/${l.lotId}/dashboard`)
                .then(d => ({ lotId: l.lotId, lotName: l.name, ...d }))
                .catch(() => ({ lotId: l.lotId, lotName: l.name, totalActive: 0, totalUpcoming: 0, activeBookings: [], upcomingBookings: [] }))
            )
          );
          const map = {};
          results.forEach(r => { map[r.lotId] = r; });
          setDashboards(map);
          // Default to first lot in the selector
          if (approved.length > 0 && !selectedLotId) {
            setSelectedLotId(approved[0].lotId);
          }
        } finally {
          setDashLoading(false);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const refreshDashboard = useCallback(async (lotId) => {
    try {
      const d = await api.get(`/api/bookings/manager/${lotId}/dashboard`);
      setDashboards(prev => ({ ...prev, [lotId]: { ...prev[lotId], ...d } }));
    } catch (e) { console.error(e); }
  }, []);

  // ── Aggregate stats ───────────────────────────────────────────────────────
  const totalSpots     = lots.reduce((s, l) => s + l.totalSpots, 0);
  const totalAvailable = lots.reduce((s, l) => s + l.availableSpots, 0);
  const openLots       = lots.filter(l => l.open).length;
  const pendingLots    = lots.filter(l => !l.approved).length;

  // Total active/upcoming across all lots
  const totalActive   = Object.values(dashboards).reduce((s, d) => s + (d.totalActive || 0), 0);
  const totalUpcoming = Object.values(dashboards).reduce((s, d) => s + (d.totalUpcoming || 0), 0);

  // Selected lot dashboard data
  const currentDash = selectedLotId ? dashboards[selectedLotId] : null;
  const displayList = currentDash
    ? (activeTab === 'active' ? currentDash.activeBookings : currentDash.upcomingBookings)
    : [];

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fmt = dt => dt ? new Date(dt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  return (
    <ManagerLayout title="Manager Dashboard"
      topbarRight={
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/manager/lots')}>
          Manage Lots
        </button>
      }
    >
      <div className="page-header">
        <h1>Welcome, {name?.split(' ')[0]}! 🏢</h1>
        <p>Here's an overview of your parking facilities.</p>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon blue">🏢</div>
          <div className="stat-info">
            <div className="stat-label">Total Lots</div>
            <div className="stat-value">{lots.length}</div>
            <div className="stat-sub">{openLots} currently open</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🅿</div>
          <div className="stat-info">
            <div className="stat-label">Total Spots</div>
            <div className="stat-value">{totalSpots}</div>
            <div className="stat-sub">{totalAvailable} available</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">⏳</div>
          <div className="stat-info">
            <div className="stat-label">Pending Approval</div>
            <div className="stat-value">{pendingLots}</div>
            <div className="stat-sub">Awaiting admin review</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">📊</div>
          <div className="stat-info">
            <div className="stat-label">Occupancy</div>
            <div className="stat-value">
              {totalSpots > 0
                ? `${(((totalSpots - totalAvailable) / totalSpots) * 100).toFixed(0)}%`
                : '—'}
            </div>
            <div className="stat-sub">Across all lots</div>
          </div>
        </div>
        {/* New: live booking counts */}
        <div className="stat-card">
          <div className="stat-icon green">🚗</div>
          <div className="stat-info">
            <div className="stat-label">Active Now</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{totalActive}</div>
            <div className="stat-sub">Drivers currently parked</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">📅</div>
          <div className="stat-info">
            <div className="stat-label">Upcoming</div>
            <div className="stat-value" style={{ color: 'var(--primary-light)' }}>{totalUpcoming}</div>
            <div className="stat-sub">Reservations ahead</div>
          </div>
        </div>
      </div>

      {/* ── Lots table ──────────────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title">My Parking Lots</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/manager/lots')}>
            Manage All
          </button>
        </div>
        {loading ? <Spinner /> : lots.length === 0 ? (
          <EmptyState icon="🏢" title="No lots registered yet"
            message="Register your first parking facility."
            action={
              <button className="btn btn-primary" onClick={() => navigate('/manager/lots')}>
                Register Lot
              </button>
            }
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Lot Name</th><th>City</th><th>Spots</th>
                  <th>Active</th><th>Upcoming</th>
                  <th>Status</th><th>Approval</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lots.map(lot => {
                  const dash = dashboards[lot.lotId];
                  return (
                    <tr key={lot.lotId}>
                      <td><strong>{lot.name}</strong></td>
                      <td>{lot.city}</td>
                      <td>{lot.availableSpots} / {lot.totalSpots}</td>
                      <td>
                        {dash
                          ? <span className="badge badge-success">🚗 {dash.totalActive}</span>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        {dash
                          ? <span className="badge badge-primary">📅 {dash.totalUpcoming}</span>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        <span className={`badge ${lot.open ? 'badge-success' : 'badge-danger'}`}>
                          {lot.open ? '● Open' : '● Closed'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${lot.approved ? 'badge-success' : 'badge-warning'}`}>
                          {lot.approved ? '✓ Approved' : '⏳ Pending'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/manager/lots/${lot.lotId}/spots`)}>Spots</button>
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/manager/lots/${lot.lotId}/bookings`)}>Bookings</button>
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/manager/lots/${lot.lotId}/analytics`)}>📊</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 🔔 Manager Notification Dashboard ────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🔔 Booking Notifications</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Lot selector */}
            {Object.keys(dashboards).length > 1 && (
              <select
                className="form-control"
                style={{ width: 'auto', padding: '5px 10px', fontSize: '0.85rem' }}
                value={selectedLotId || ''}
                onChange={e => setSelectedLotId(Number(e.target.value))}
              >
                {Object.values(dashboards).map(d => (
                  <option key={d.lotId} value={d.lotId}>{d.lotName}</option>
                ))}
              </select>
            )}
            <button className="btn btn-secondary btn-sm"
              onClick={() => selectedLotId && refreshDashboard(selectedLotId)}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {dashLoading ? <Spinner /> : Object.keys(dashboards).length === 0 ? (
          <EmptyState icon="🔔" title="No approved lots"
            message="Notifications appear once your lots are approved." />
        ) : (
          <>
            {/* Active / Upcoming tabs */}
            <div className="auth-tabs mb-4" style={{ maxWidth: 340 }}>
              <button
                className={`auth-tab ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                🚗 Active ({currentDash?.totalActive ?? 0})
              </button>
              <button
                className={`auth-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
                onClick={() => setActiveTab('upcoming')}
              >
                📅 Upcoming ({currentDash?.totalUpcoming ?? 0})
              </button>
            </div>

            {/* Context label */}
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              {activeTab === 'active'
                ? '🟢 Drivers currently parked — booking status is ACTIVE.'
                : '🔵 Future reservations — startTime is ahead of now (status RESERVED).'}
            </p>

            {/* Notification list */}
            {displayList.length === 0 ? (
              <EmptyState
                icon={activeTab === 'active' ? '🅿' : '📅'}
                title={activeTab === 'active' ? 'No active bookings right now' : 'No upcoming reservations'}
                message={activeTab === 'active'
                  ? 'No drivers are currently parked in this lot.'
                  : 'No reservations scheduled for the future.'}
              />
            ) : (
              <div className="notif-list">
                {displayList.map(b => (
                  <div key={b.bookingId} className="notif-item">
                    <div className="notif-icon"
                      style={{ background: activeTab === 'active' ? '#dcfce7' : '#eff6ff' }}>
                      {activeTab === 'active' ? '🚗' : '📅'}
                    </div>
                    <div className="notif-content">
                      <div className="notif-header-row">
                        <strong>Booking #{b.bookingId}</strong>
                        <StatusBadge status={b.status} />
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        👤 {b.driverEmail} &nbsp;·&nbsp;
                        🅿 Spot #{b.spotId} &nbsp;·&nbsp;
                        🚘 {b.vehiclePlate}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 16 }}>
                        <span>
                          <span className={`badge ${b.bookingType === 'DRIVE_IN' ? 'badge-success' : 'badge-primary'}`}>
                            {b.bookingType === 'DRIVE_IN' ? '🚗 Drive-In' : '📅 Pre-Booking'}
                          </span>
                        </span>
                        <span>📥 {fmt(b.startTime)}</span>
                        <span>📤 {fmt(b.endTime)}</span>
                        {b.estimatedAmount > 0 && (
                          <span>💰 Est. ₹{b.estimatedAmount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </ManagerLayout>
  );
}
