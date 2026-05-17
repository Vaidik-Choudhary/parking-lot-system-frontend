import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { Spinner, StatusBadge, EmptyState } from '../../components/common/UI';
import { IconBuilding, IconParking, IconClock, IconChart, IconCar, IconCalendar, IconBell, IconRefresh, IconUsers, IconPayment, IconCheck, IconHourglass } from '../../components/common/Icons';
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
            approved.map(async l => {
              try {
                const [d, subs] = await Promise.all([
                  api.get(`/api/bookings/manager/${l.lotId}/dashboard`),
                  api.get(`/api/subscriptions/lot/${l.lotId}/active`)
                ]);
                return { lotId: l.lotId, lotName: l.name, ...d, activeSubscriptions: subs };
              } catch (e) {
                return { lotId: l.lotId, lotName: l.name, totalActive: 0, totalUpcoming: 0, activeBookings: [], upcomingBookings: [], activeSubscriptions: [] };
              }
            })
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
      const [d, subs] = await Promise.all([
        api.get(`/api/bookings/manager/${lotId}/dashboard`),
        api.get(`/api/subscriptions/lot/${lotId}/active`)
      ]);
      setDashboards(prev => ({ ...prev, [lotId]: { ...prev[lotId], ...d, activeSubscriptions: subs } }));
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
  let displayList = [];
  if (currentDash) {
    if (activeTab === 'active') displayList = currentDash.activeBookings || [];
    else if (activeTab === 'upcoming') displayList = currentDash.upcomingBookings || [];
    else if (activeTab === 'subscriptions') displayList = currentDash.activeSubscriptions || [];
  }

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
        <h1>Welcome, {name?.split(' ')[0]}! <IconBuilding size={28} style={{ verticalAlign: '-4px' }} /></h1>
        <p>Here's an overview of your parking facilities.</p>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><IconBuilding size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Lots</div>
            <div className="stat-value">{lots.length}</div>
            <div className="stat-sub">{openLots} currently open</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><IconParking size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Spots</div>
            <div className="stat-value">{totalSpots}</div>
            <div className="stat-sub">{totalAvailable} available</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><IconClock size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Pending Approval</div>
            <div className="stat-value">{pendingLots}</div>
            <div className="stat-sub">Awaiting admin review</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><IconChart size={24} /></div>
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
          <div className="stat-icon green"><IconCar size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Active Now</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{totalActive}</div>
            <div className="stat-sub">Drivers currently parked</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><IconCalendar size={24} /></div>
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
          <EmptyState icon={<IconBuilding size={48} />} title="No lots registered yet"
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
                          ? <span className="badge badge-success"><IconCar size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {dash.totalActive}</span>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        {dash
                          ? <span className="badge badge-primary"><IconCalendar size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {dash.totalUpcoming}</span>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        <span className={`badge ${lot.open ? 'badge-success' : 'badge-danger'}`}>
                          {lot.open ? '● Open' : '● Closed'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${lot.approved ? 'badge-success' : 'badge-warning'}`}>
                          {lot.approved ? <><IconCheck size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Approved</> : <><IconHourglass size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Pending</>}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/manager/lots/${lot.lotId}/spots`)}>Spots</button>
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/manager/lots/${lot.lotId}/bookings`)}>Bookings</button>
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/manager/lots/${lot.lotId}/analytics`)}><IconChart size={14} /></button>
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


      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><IconBell size={18} style={{ verticalAlign: '-2px', marginRight: 8 }} /> Booking Notifications</h3>
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
              <IconRefresh size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Refresh
            </button>
          </div>
        </div>

        {dashLoading ? <Spinner /> : Object.keys(dashboards).length === 0 ? (
          <EmptyState icon={<IconBell size={48} />} title="No approved lots"
            message="Notifications appear once your lots are approved." />
        ) : (
          <>
            {/* Active / Upcoming / Subscriptions tabs */}
            <div className="auth-tabs mb-4" style={{ maxWidth: 480 }}>
              <button
                className={`auth-tab ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                <IconCar size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Active ({currentDash?.totalActive ?? 0})
              </button>
              <button
                className={`auth-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
                onClick={() => setActiveTab('upcoming')}
              >
                <IconCalendar size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Upcoming ({currentDash?.totalUpcoming ?? 0})
              </button>
              <button
                className={`auth-tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
                onClick={() => setActiveTab('subscriptions')}
              >
                <IconParking size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Subs ({currentDash?.activeSubscriptions?.length ?? 0})
              </button>
            </div>

            {/* Context label */}
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              {activeTab === 'active' && 'Drivers currently parked — booking status is ACTIVE.'}
              {activeTab === 'upcoming' && 'Future reservations — startTime is ahead of now (status RESERVED).'}
              {activeTab === 'subscriptions' && 'Permanent monthly blockages.'}
            </p>

            {/* Notification list */}
            {displayList.length === 0 ? (
              <EmptyState
                icon={activeTab === 'active' ? <IconCar size={48} /> : (activeTab === 'subscriptions' ? <IconParking size={48} /> : <IconCalendar size={48} />)}
                title={activeTab === 'active' ? 'No active bookings right now' : (activeTab === 'subscriptions' ? 'No active subscriptions' : 'No upcoming reservations')}
                message={activeTab === 'active'
                  ? 'No drivers are currently parked in this lot.'
                  : (activeTab === 'subscriptions' ? 'No drivers have active monthly subscriptions.' : 'No reservations scheduled for the future.')}
              />
            ) : (
              <div className="notif-list">
                {displayList.map(item => {
                  const isSub = activeTab === 'subscriptions';
                  return (
                    <div key={isSub ? item.id : item.bookingId} className="notif-item">
                      <div className={`notif-icon ${activeTab === 'active' ? 'success' : (isSub ? 'warning' : 'info')}`}>
                        {activeTab === 'active' ? <IconCar size={18} /> : (isSub ? <IconParking size={18} /> : <IconCalendar size={18} />)}
                      </div>
                      <div className="notif-content">
                        <div className="notif-header-row">
                          <strong>{isSub ? `Subscription #${item.id}` : `Booking #${item.bookingId}`}</strong>
                          <StatusBadge status={item.status} />
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          <IconUsers size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {item.driverEmail} &nbsp;·&nbsp;
                          <IconParking size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Spot #{item.spotId}
                          {!isSub && <>&nbsp;·&nbsp;<IconCar size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {item.vehiclePlate}</>}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 16 }}>
                          {!isSub ? (
                            <>
                              <span>
                                <span className={`badge ${item.bookingType === 'DRIVE_IN' ? 'badge-success' : 'badge-primary'}`}>
                                  {item.bookingType === 'DRIVE_IN' ? <><IconCar size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Drive-In</> : <><IconCalendar size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Pre-Booking</>}
                                </span>
                              </span>
                              <span>In: {fmt(item.startTime)}</span>
                              <span>Out: {fmt(item.endTime)}</span>
                              {item.estimatedAmount > 0 && (
                                <span><IconPayment size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Est. ₹{item.estimatedAmount}</span>
                              )}
                            </>
                          ) : (
                            <>
                              <span>Start: {fmt(item.startDate)}</span>
                              <span>Renew: {fmt(item.endDate)}</span>
                              <span><IconPayment size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> ₹{item.monthlyRate}/mo</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </ManagerLayout>
  );
}
