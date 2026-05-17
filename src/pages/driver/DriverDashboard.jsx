import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../components/driver/DriverLayout';
import { Spinner, StatusBadge, EmptyState } from '../../components/common/UI';
import { IconParking, IconHourglass, IconCheckCircle, IconPayment } from '../../components/common/Icons';
import { api, getUserName } from '../../utils/api';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const name = getUserName();

  useEffect(() => {
    api.get('/api/bookings/my')
      .then(data => setBookings(data.slice(0, 5)))  // show latest 5
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const active    = bookings.filter(b => b.status === 'ACTIVE').length;
  const reserved  = bookings.filter(b => b.status === 'RESERVED').length;
  const completed = bookings.filter(b => b.status === 'COMPLETED').length;

  return (
    <DriverLayout
      title="Driver Dashboard"
      topbarRight={
        <button className="btn btn-primary btn-sm"
          onClick={() => navigate('/driver/search')}>
          + Find Parking
        </button>
      }
    >
      {/* Welcome */}
      <div className="page-header"><h1>
        Welcome back, { (name && name !== 'null') ? name.split(' ')[0] : 'Driver' }!
        </h1>
        <p>Here's an overview of your parking activity.</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><IconParking size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Active Parking</div>
            <div className="stat-value">{active}</div>
            <div className="stat-sub">Currently parked</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><IconHourglass size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Reserved</div>
            <div className="stat-value">{reserved}</div>
            <div className="stat-sub">Upcoming bookings</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><IconCheckCircle size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{completed}</div>
            <div className="stat-sub">Total trips</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><IconPayment size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Spent</div>
            <div className="stat-value">
              ₹{bookings.reduce((s, b) => s + (b.totalAmount || 0), 0).toFixed(0)}
            </div>
            <div className="stat-sub">All time</div>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Bookings</h3>
          <button className="btn btn-secondary btn-sm"
            onClick={() => navigate('/driver/bookings')}>
            View All
          </button>
        </div>

        {loading ? <Spinner /> : bookings.length === 0 ? (
          <EmptyState icon={<IconParking size={48} />} title="No bookings yet"
            message="Find a parking spot to get started."
            action={
              <button className="btn btn-primary"
                onClick={() => navigate('/driver/search')}>
                Find Parking
              </button>
            }
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Spot</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.bookingId}>
                    <td><strong>#{b.bookingId}</strong></td>
                    <td>Spot #{b.spotId}</td>
                    <td>{new Date(b.startTime).toLocaleString()}</td>
                    <td>{new Date(b.endTime).toLocaleString()}</td>
                    <td><StatusBadge status={b.status} /></td>
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
        )}
      </div>
    </DriverLayout>
  );
}
