import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Spinner, Alert } from '../../components/common/UI';
import { IconBuilding, IconParking, IconBooking, IconPayment, IconCar, IconMotorbike, IconTruck } from '../../components/common/Icons';
import { api } from '../../utils/api';

export default function PlatformAnalytics() {
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    api.get('/api/analytics/platform')
      .then(setPlatform)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Platform Analytics">
      <div className="page-header">
        <h1>Platform Analytics</h1>
        <p>Aggregated stats across all active parking lots.</p>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      {loading ? <Spinner /> : platform && (
        <>
          {/* Main stats */}
          <div className="stat-grid">
            {[
              { icon: <IconBuilding size={24} />, label: 'Active Lots',       value: platform.totalActiveLots,            sub: 'Approved & active',      cls: 'blue'   },
              { icon: <IconParking size={24} />,  label: 'Platform Occupancy',value: `${(platform.platformOccupancyRate || 0).toFixed(1)}%`, sub: `${platform.totalOccupiedSpots} / ${platform.totalSpots} spots`, cls: 'green'  },
              { icon: <IconBooking size={24} />, label: 'Bookings Today',    value: platform.totalBookingsToday,         sub: `${platform.totalBookingsAllTime} all time`, cls: 'orange' },
              { icon: <IconPayment size={24} />, label: 'Revenue All Time',  value: `₹${(platform.totalRevenueAllTime || 0).toFixed(0)}`, sub: `₹${(platform.totalRevenueToday || 0).toFixed(0)} today`, cls: 'purple' },
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

          {/* Platform occupancy bar */}
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="card-title">Platform Occupancy</h3>
            </div>
            <div className="occupancy-bar" style={{ height: 14 }}>
              <div
                className={`occupancy-fill ${(platform.platformOccupancyRate || 0) < 50 ? 'low' : (platform.platformOccupancyRate || 0) < 80 ? 'medium' : 'high'}`}
                style={{ width: `${platform.platformOccupancyRate || 0}%` }}
              />
            </div>
            <div className="occupancy-text mt-1">
              <span>{platform.totalOccupiedSpots} occupied</span>
              <span>{platform.totalSpots - platform.totalOccupiedSpots} available</span>
            </div>
          </div>

          {/* Bookings by vehicle type */}
          {platform.bookingsByVehicleType && Object.keys(platform.bookingsByVehicleType).length > 0 && (
            <div className="card mb-4">
              <div className="card-header">
                <h3 className="card-title">Bookings by Vehicle Type</h3>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {Object.entries(platform.bookingsByVehicleType).map(([type, count]) => {
                  const total = Object.values(platform.bookingsByVehicleType).reduce((a,b) => a+b, 0);
                  const pct   = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                  const icons = { FOUR_WHEELER: <IconCar size={32} />, TWO_WHEELER: <IconMotorbike size={32} />, HEAVY: <IconTruck size={32} /> };
                  return (
                    <div key={type} style={{
                      flex: '1 1 160px', background: 'var(--bg)',
                      borderRadius: 10, padding: '16px', textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: 6, color: 'var(--primary)' }}>{icons[type] || <IconCar size={32} />}</div>
                      <div style={{ fontWeight: 700, fontSize: '1.5rem' }}>{count}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {type.replace('_', ' ')} ({pct}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Revenue summary */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Revenue Overview</h3>
            </div>
            <div className="grid-2">
              {[
                ['Today',    `₹${(platform.totalRevenueToday    || 0).toFixed(2)}`],
                ['All Time', `₹${(platform.totalRevenueAllTime  || 0).toFixed(2)}`],
              ].map(([label, value]) => (
                <div key={label} style={{
                  textAlign: 'center', padding: '24px',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                  borderRadius: 10, color: 'white'
                }}>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: 6 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
