import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GuestLayout from '../../components/guest/GuestLayout';
import { Spinner, Alert, EmptyState } from '../../components/common/UI';
import { api } from '../../utils/api';

export default function LandingPage() {
  const navigate = useNavigate();

  const [city, setCity]         = useState('');
  const [lots, setLots]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [searched, setSearched] = useState(false);

  const searchByCity = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;
    setLoading(true); setError(''); setSearched(true);
    try {
      const data = await api.get(`/api/lots/city/${city.trim()}`);
      setLots(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchNearby = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser.');
      return;
    }
    setLoading(true); setError(''); setSearched(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        try {
          const data = await api.get(`/api/lots/nearby?lat=${lat}&lon=${lon}&radius=10`);
          setLots(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Could not get your location. Please allow location access.');
        setLoading(false);
      }
    );
  };

  const getOccupancyClass = (lot) => {
    const pct = lot.totalSpots > 0
      ? (lot.totalSpots - lot.availableSpots) / lot.totalSpots : 0;
    if (pct < 0.5) return 'low';
    if (pct < 0.8) return 'medium';
    return 'high';
  };

  return (
    <GuestLayout>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="guest-hero">
        <div className="guest-hero-inner">
          <div className="guest-hero-badge">🚗 Smart Parking for Everyone</div>
          <h1 className="guest-hero-title">
            Find & Book<br />
            <span className="guest-hero-accent">Parking Spots</span><br />
            Instantly
          </h1>
          <p className="guest-hero-sub">
            Search available lots near you, compare prices, and reserve your spot
            in seconds — no hassle, no circling.
          </p>

          {/* Search bar */}
          <form className="guest-search-bar" onSubmit={searchByCity}>
            <input
              className="guest-search-input"
              placeholder="Enter city name (e.g. Mumbai, Pune, Delhi)..."
              value={city}
              onChange={e => setCity(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">
              🔍 Search
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={searchNearby}
            >
              📍 Near Me
            </button>
          </form>
        </div>

        {/* Decorative blobs */}
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
      </section>

      {/* ── Features strip ───────────────────────────────── */}
      {!searched && (
        <section className="guest-features">
          {[
            { icon: '⚡', title: 'Instant Booking',   desc: 'Reserve your spot in under 60 seconds' },
            { icon: '🗺️', title: 'Live Availability', desc: 'Real-time spot status, no surprises on arrival' },
            { icon: '💳', title: 'Easy Payments',     desc: 'Pay via UPI, card or net banking via Razorpay' },
            { icon: '🔔', title: 'Smart Alerts',      desc: 'Get notified for check-in, check-out and more' },
          ].map(f => (
            <div key={f.title} className="guest-feature-card">
              <div className="guest-feature-icon">{f.icon}</div>
              <div className="guest-feature-title">{f.title}</div>
              <div className="guest-feature-desc">{f.desc}</div>
            </div>
          ))}
        </section>
      )}

      {/* ── Search results ────────────────────────────────── */}
      {(searched || loading) && (
        <section className="guest-results">
          {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

          {loading ? <Spinner /> : lots.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No lots found"
              message="Try a different city or use 'Near Me' to find lots around you."
            />
          ) : (
            <>
              <div className="guest-results-header">
                <h2>{lots.length} parking lot{lots.length !== 1 ? 's' : ''} found</h2>
                <p>Click a lot to see available spots and book your space.</p>
              </div>
              <div className="lot-grid">
                {lots.map(lot => {
                  const occupied = lot.totalSpots - lot.availableSpots;
                  const pct = lot.totalSpots > 0 ? (occupied / lot.totalSpots) * 100 : 0;
                  return (
                    <div
                      key={lot.lotId}
                      className="lot-card"
                      onClick={() => navigate(`/guest/lots/${lot.lotId}`)}
                    >
                      <div className="lot-card-header">
                        <h3>{lot.name}</h3>
                        <p>📍 {lot.address}, {lot.city}</p>
                      </div>
                      <div className="lot-card-body">
                        <div className="lot-meta">
                          <div className="lot-meta-item">
                            🅿 {lot.availableSpots} / {lot.totalSpots} spots
                          </div>
                          {lot.distanceKm && (
                            <div className="lot-meta-item">📏 {lot.distanceKm} km away</div>
                          )}
                          <div className="lot-meta-item">
                            {lot.open
                              ? <span className="text-success">● Open</span>
                              : <span className="text-danger">● Closed</span>}
                          </div>
                        </div>
                        <div className="occupancy-bar">
                          <div
                            className={`occupancy-fill ${getOccupancyClass(lot)}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="occupancy-text">
                          <span>Occupancy</span>
                          <span>{pct.toFixed(0)}%</span>
                        </div>
                        <div style={{ marginTop: 12 }}>
                          <span className="btn btn-primary btn-sm" style={{ pointerEvents: 'none' }}>
                            View Spots →
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}

    </GuestLayout>
  );
}
