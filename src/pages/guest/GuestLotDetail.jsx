import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GuestLayout from '../../components/guest/GuestLayout';
import { Spinner, Alert } from '../../components/common/UI';
import { api } from '../../utils/api';

export default function GuestLotDetail() {
  const { lotId } = useParams();
  const navigate  = useNavigate();

  const [lot, setLot]           = useState(null);
  const [spots, setSpots]       = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const loadSpots = useCallback(() => {
    return api.get(`/api/spots/lot/${lotId}`)
      .then(setSpots)
      .catch(err => setError(err.message));
  }, [lotId]);

  useEffect(() => {
    Promise.all([
      api.get(`/api/lots/${lotId}`),
      api.get(`/api/spots/lot/${lotId}`),
    ])
      .then(([lotData, spotsData]) => { setLot(lotData); setSpots(spotsData); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [lotId]);

  // When guest clicks "Book" — save intended destination and redirect to login
  const handleGuestBook = () => {
    // Save where they were trying to go so we can redirect back after login
    sessionStorage.setItem('redirectAfterLogin', `/driver/lots/${lotId}`);
    navigate('/login', {
      state: {
        message: '👋 Please sign in or create a free account to book this spot.',
        lotId,
      }
    });
  };

  const spotsGroups = {};
  spots.forEach(s => {
    const f = `Floor ${s.floor}`;
    if (!spotsGroups[f]) spotsGroups[f] = [];
    spotsGroups[f].push(s);
  });

  const available = spots.filter(s => s.status === 'AVAILABLE').length;

  if (loading) return (
    <GuestLayout>
      <div style={{ padding: '80px 0' }}><Spinner /></div>
    </GuestLayout>
  );

  return (
    <GuestLayout>
      <div className="guest-lot-detail">

        {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

        {/* Back link */}
        <button
          className="btn btn-secondary btn-sm mb-3"
          onClick={() => navigate('/')}
        >
          ← Back to Search
        </button>

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
            <div className="lot-meta-item">🅿 {available} available of {spots.length}</div>
            <div className="lot-meta-item">🕐 {lot?.openTime} – {lot?.closeTime}</div>
          </div>
        </div>

        {/* Guest booking CTA banner */}
        <div className="guest-book-banner">
          <div className="guest-book-banner-text">
            <div className="guest-book-banner-title">
              {selected
                ? `✓ Spot ${selected.spotNumber} selected — ₹${selected.pricePerHour}/hr`
                : '👆 Select an available spot below to book it'}
            </div>
            <div className="guest-book-banner-sub">
              {selected
                ? 'Sign in or create a free account to complete your booking'
                : 'Green spots are available. Click one to select it.'}
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleGuestBook}
            disabled={!selected}
          >
            {selected ? `Book Spot ${selected.spotNumber} →` : 'Select a Spot First'}
          </button>
        </div>

        {/* Spot legend */}
        <div className="spot-legend mt-3">
          {[
            { color: '#dcfce7', label: 'Available — click to select' },
            { color: '#fef3c7', label: 'Reserved' },
            { color: '#fee2e2', label: 'Occupied' },
            { color: '#f1f5f9', label: 'Maintenance' },
          ].map(l => (
            <div key={l.label} className="spot-legend-item">
              <div className="spot-legend-dot" style={{ background: l.color }} />
              {l.label}
            </div>
          ))}
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={loadSpots}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Spot grid per floor */}
        {Object.entries(spotsGroups).map(([floor, floorSpots]) => (
          <div key={floor} className="card mb-3 mt-3">
            <div className="card-header">
              <h4 className="card-title">{floor}</h4>
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                {floorSpots.filter(s => s.status === 'AVAILABLE').length} available
              </span>
            </div>
            <div className="spot-grid">
              {floorSpots.map(spot => {
                const statusClass = spot.status ? spot.status.toLowerCase() : 'available';
                const isSelectable = spot.status === 'AVAILABLE';
                return (
                  <div
                    key={spot.spotId}
                    className={`spot-tile ${statusClass}${selected?.spotId === spot.spotId ? ' selected' : ''}`}
                    onClick={() => isSelectable && setSelected(spot)}
                    title={
                      isSelectable
                        ? `${spot.spotNumber} — ₹${spot.pricePerHour}/hr — Click to select`
                        : `${spot.spotNumber} — ${spot.status}`
                    }
                  >
                    <div className="spot-num">{spot.spotNumber}</div>
                    <div className="spot-type">
                      {spot.isEVCharging ? '⚡' : spot.isHandicapped ? '♿' : spot.spotType}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Bottom CTA */}
        <div className="guest-bottom-cta">
          <div>
            <div className="guest-bottom-cta-title">Ready to park smarter?</div>
            <div className="guest-bottom-cta-sub">
              Create a free account to book, manage and pay for your parking.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/login')}>
              Sign In
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/register')}>
              Create Free Account →
            </button>
          </div>
        </div>

      </div>
    </GuestLayout>
  );
}
