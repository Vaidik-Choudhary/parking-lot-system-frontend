import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { Spinner, Alert } from '../../components/common/UI';
import { api } from '../../utils/api';

export default function LotAnalytics() {
  const { lotId } = useParams();
  const navigate  = useNavigate();
  const [summary, setSummary]   = useState(null);
  const [hourly, setHourly]     = useState({});
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/api/analytics/lots/${lotId}/summary`),
      api.get(`/api/analytics/lots/${lotId}/hourly`),
    ])
      .then(([s, h]) => { setSummary(s); setHourly(h); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [lotId]);

  if (loading) return <ManagerLayout title="Analytics"><Spinner /></ManagerLayout>;

  // Hourly chart — simple CSS bar chart
  const maxHourly = Math.max(...Object.values(hourly), 0.01);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <ManagerLayout title="Lot Analytics"
      topbarRight={
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Back</button>
      }
    >
      <div className="page-header">
        <h1>Analytics — Lot #{lotId}</h1>
        <p>Occupancy trends, revenue, and performance metrics.</p>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      {summary && (
        <>
          {/* Stat cards */}
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-icon blue">📊</div>
              <div className="stat-info">
                <div className="stat-label">Current Occupancy</div>
                <div className="stat-value">
                  {(summary.currentOccupancyRate * 100).toFixed(0)}%
                </div>
                <div className="stat-sub">{summary.occupiedSpots} / {summary.totalSpots} spots</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">💰</div>
              <div className="stat-info">
                <div className="stat-label">Revenue Today</div>
                <div className="stat-value">₹{summary.revenueToday?.toFixed(0) || 0}</div>
                <div className="stat-sub">₹{summary.revenueThisMonth?.toFixed(0) || 0} this month</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange">📋</div>
              <div className="stat-info">
                <div className="stat-label">Bookings Today</div>
                <div className="stat-value">{summary.bookingsToday || 0}</div>
                <div className="stat-sub">{summary.bookingsThisMonth || 0} this month</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple">⏱️</div>
              <div className="stat-info">
                <div className="stat-label">Avg Duration</div>
                <div className="stat-value">
                  {summary.avgParkingDurationMinutes > 0
                    ? `${(summary.avgParkingDurationMinutes / 60).toFixed(1)}h`
                    : '—'}
                </div>
                <div className="stat-sub">Per visit</div>
              </div>
            </div>
          </div>

          {/* Occupancy bar */}
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="card-title">Current Occupancy</h3>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                <span>{summary.occupiedSpots} occupied</span>
                <span>{summary.totalSpots - summary.occupiedSpots} available</span>
              </div>
              <div className="occupancy-bar" style={{ height: 12 }}>
                <div
                  className={`occupancy-fill ${summary.currentOccupancyRate < 0.5 ? 'low' : summary.currentOccupancyRate < 0.8 ? 'medium' : 'high'}`}
                  style={{ width: `${(summary.currentOccupancyRate * 100).toFixed(1)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Peak hours */}
          {summary.peakHours?.length > 0 && (
            <div className="card mb-4">
              <div className="card-header">
                <h3 className="card-title">Peak Hours</h3>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {summary.peakHours.map((h, i) => (
                  <div key={h} style={{
                    background: i === 0 ? 'var(--danger)' : i === 1 ? 'var(--warning)' : 'var(--info)',
                    color: 'white', borderRadius: 8, padding: '12px 20px', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                      {h}:00
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                      {i === 0 ? '🔥 Busiest' : i === 1 ? '🌟 2nd' : '📈 3rd'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hourly chart */}
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="card-title">24-Hour Occupancy Pattern</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120, padding: '8px 0' }}>
              {hours.map(h => {
                const rate = hourly[h] || 0;
                const pct  = maxHourly > 0 ? (rate / maxHourly) * 100 : 0;
                const isPeak = summary.peakHours?.includes(h);
                return (
                  <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div
                      title={`${h}:00 — ${(rate * 100).toFixed(0)}%`}
                      style={{
                        width: '100%',
                        height: `${Math.max(pct, 3)}%`,
                        background: isPeak ? 'var(--danger)' : 'var(--primary-light)',
                        borderRadius: '3px 3px 0 0',
                        opacity: 0.85,
                        transition: 'all 0.3s',
                        cursor: 'default',
                      }}
                    />
                    {h % 6 === 0 && (
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{h}h</div>
                    )}
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              🔴 Red bars = peak hours
            </p>
          </div>

          {/* Revenue summary */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Revenue Summary</h3>
            </div>
            <div className="grid-3">
              {[
                ['Today',      `₹${summary.revenueToday?.toFixed(2) || '0.00'}`],
                ['This Month', `₹${summary.revenueThisMonth?.toFixed(2) || '0.00'}`],
                ['All Time',   `₹${summary.revenueAllTime?.toFixed(2) || '0.00'}`],
              ].map(([label, value]) => (
                <div key={label} style={{ textAlign: 'center', padding: '16px', background: 'var(--bg)', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', marginTop: 4 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </ManagerLayout>
  );
}
