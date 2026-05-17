import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { Spinner, Alert } from '../../components/common/UI';
import { IconBuilding, IconParking, IconBooking, IconPayment, IconUsers, IconChart, IconSettings, IconBell } from '../../components/common/Icons';
import { api, getUserName } from '../../utils/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const name = getUserName();

  useEffect(() => {
    api.get('/api/analytics/platform')
      .then(setPlatform)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="page-header">
        <h1><IconSettings size={28} style={{ verticalAlign: '-4px', marginRight: 8 }} /> Admin Dashboard</h1>
        <p>Platform-wide overview for {name}.</p>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      {loading ? <Spinner /> : (
        <>
          <div className="stat-grid">
            {[
              { icon: <IconBuilding size={24} />, label: 'Active Lots',     value: platform?.totalActiveLots    || 0, sub: 'Approved lots', cls: 'blue'   },
              { icon: <IconParking size={24} />,  label: 'Total Spots',     value: platform?.totalSpots         || 0, sub: `${platform?.totalOccupiedSpots || 0} occupied`, cls: 'green' },
              { icon: <IconBooking size={24} />, label: 'Bookings Today',  value: platform?.totalBookingsToday || 0, sub: `${platform?.totalBookingsAllTime || 0} all time`, cls: 'orange' },
              { icon: <IconPayment size={24} />, label: 'Revenue Today',   value: `₹${(platform?.totalRevenueToday || 0).toFixed(0)}`, sub: `₹${(platform?.totalRevenueAllTime || 0).toFixed(0)} all time`, cls: 'purple' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                <div className="stat-info">
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-sub">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Platform occupancy */}
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="card-title">Platform Occupancy Rate</h3>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                <span>{platform?.totalOccupiedSpots} occupied</span>
                <span>{(platform?.platformOccupancyRate || 0).toFixed(1)}%</span>
              </div>
              <div className="occupancy-bar" style={{ height: 12 }}>
                <div
                  className={`occupancy-fill ${(platform?.platformOccupancyRate || 0) < 50 ? 'low' : (platform?.platformOccupancyRate || 0) < 80 ? 'medium' : 'high'}`}
                  style={{ width: `${platform?.platformOccupancyRate || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid-2">
            {[
              { icon: <IconUsers size={32} />, title: 'Manage Users',    desc: 'View, suspend or delete user accounts.', path: '/admin/users',    btn: 'Manage Users'   },
              { icon: <IconBuilding size={32} />, title: 'Approve Lots',    desc: 'Review and approve new lot registrations.', path: '/admin/lots', btn: 'Review Lots'    },
              { icon: <IconBell size={32} />, title: 'Broadcast',       desc: 'Send platform-wide announcements.',       path: '/admin/broadcast', btn: 'Send Broadcast' },
              { icon: <IconBooking size={32} />, title: 'All Bookings',    desc: 'Platform-wide booking history.',         path: '/admin/bookings', btn: 'View Bookings'  },
              { icon: <IconChart size={32} />, title: 'Platform Analytics', desc: 'Revenue and occupancy analytics.',   path: '/admin/analytics', btn: 'View Analytics' },
            ].map(c => (
              <div key={c.title} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(c.path)}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>{c.icon}</div>
                <h3 style={{ marginBottom: 6 }}>{c.title}</h3>
                <p style={{ fontSize: '0.875rem', marginBottom: 16 }}>{c.desc}</p>
                <button className="btn btn-primary btn-sm">{c.btn}</button>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
