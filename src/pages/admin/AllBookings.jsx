import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Spinner, Alert, EmptyState, StatusBadge } from '../../components/common/UI';
import { IconBooking, IconCar, IconCalendar } from '../../components/common/Icons';
import { api } from '../../utils/api';

export default function AllBookings() {
  const [bookings, setBookings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    api.get('/api/bookings/admin/all')
      .then(data => { setBookings(data); setFiltered(data); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = bookings;
    if (statusFilter !== 'ALL') result = result.filter(b => b.status === statusFilter);
    if (search.trim()) result = result.filter(b =>
      b.driverEmail?.toLowerCase().includes(search.toLowerCase()) ||
      b.vehiclePlate?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, statusFilter, bookings]);

  const totalRevenue = bookings
    .filter(b => b.status === 'COMPLETED')
    .reduce((s, b) => s + (b.totalAmount || 0), 0);

  return (
    <AdminLayout title="All Bookings">
      <div className="page-header">
        <h1>All Bookings</h1>
        <p>{bookings.length} total bookings · ₹{totalRevenue.toFixed(2)} total revenue</p>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      {/* Filters */}
      <div className="card mb-4">
        <div style={{ display: 'flex', gap: 12 }}>
          <input className="form-control" placeholder="Search by driver email or plate..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
          <select className="form-control" value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)} style={{ width: 180 }}>
            {['ALL','RESERVED','ACTIVE','COMPLETED','CANCELLED'].map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon={<IconBooking size={48} />} title="No bookings found" />
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Driver</th><th>Lot</th><th>Spot</th>
                  <th>Vehicle</th><th>Type</th><th>Status</th>
                  <th>Start</th><th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.bookingId}>
                    <td><strong>#{b.bookingId}</strong></td>
                    <td style={{ fontSize: '0.8rem', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.driverEmail}</td>
                    <td>#{b.lotId}</td>
                    <td>#{b.spotId}</td>
                    <td>{b.vehiclePlate}</td>
                    <td>
                      <span className={`badge ${b.bookingType === 'DRIVE_IN' ? 'badge-success' : 'badge-primary'}`}
                        style={{ fontSize: '0.72rem' }}>
                        {b.bookingType === 'DRIVE_IN' ? <><IconCar size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Drive-In</> : <><IconCalendar size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Pre-Booking</>}
                      </span>
                    </td>
                    <td><StatusBadge status={b.status} /></td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(b.startTime).toLocaleDateString()}</td>
                    <td>
                      {b.totalAmount > 0
                        ? <strong>₹{b.totalAmount}</strong>
                        : <span className="text-muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
