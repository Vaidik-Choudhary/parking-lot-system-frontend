import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GuestLayout from '../../components/guest/GuestLayout';
import { Spinner, Alert, EmptyState } from '../../components/common/UI';
import { IconCar, IconMap, IconPayment, IconBell, IconSearch, IconParking, IconEV, IconMotorbike, IconTruck, IconHandicap } from '../../components/common/Icons';
import { api } from '../../utils/api';

export default function LandingPage() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    hasEV: false,
    has2W: false,
    has4W: false,
    hasHeavy: false,
    hasHandicap: false
  });

  const [city, setCity] = useState('');
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const getQueryString = () => {
    let q = '';
    if (filters.hasEV) q += '&hasEV=true';
    if (filters.has2W) q += '&has2W=true';
    if (filters.has4W) q += '&has4W=true';
    if (filters.hasHeavy) q += '&hasHeavy=true';
    if (filters.hasHandicap) q += '&hasHandicap=true';
    return q;
  };

  const searchByCity = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;
    setLoading(true); setError(''); setSearched(true);
    try {
      const data = await api.get(`/api/lots/city/${city.trim()}?${getQueryString().substring(1)}`);
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
          const data = await api.get(`/api/lots/nearby?lat=${lat}&lon=${lon}&radius=10${getQueryString()}`);
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

  const toggleFilter = (name) => {
    setFilters(prev => ({ ...prev, [name]: !prev[name] }));
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
        <div
          className="guest-hero-bg"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=2070&auto=format&fit=crop")' }}
        />
        <div className="guest-hero-overlay" />

        <div className="guest-hero-inner">
          <div className="guest-hero-badge">
            <IconCar size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Trusted by 50,000+ Drivers
          </div>
          <h1 className="guest-hero-title">
            Parking Made <span className="guest-hero-accent">Simple</span><br />
            Search, Book & Park.
          </h1>
          <p className="guest-hero-sub">
            The smartest way to find parking in India's busiest cities.
            Real-time availability, instant reservations, and secure payments.
          </p>

          {/* Search bar */}
          <form className="guest-search-bar" onSubmit={searchByCity}>
            <input
              className="guest-search-input"
              placeholder=" Where are you going? (e.g. Mumbai, Bangalore...)"
              value={city}
              onChange={e => setCity(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-primary"
                type="submit"
              >
                <IconSearch size={20} /> Search
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={searchNearby}
              >
                <IconMap size={20} /> Nearby
              </button>
            </div>
          </form>

          {/* Search Filters */}
          <div className="guest-search-filters">
            <span className="filters-label">I need:</span>
            <div className="filters-list">
              <button className={`filter-chip ${filters.has2W ? 'active' : ''}`} onClick={() => toggleFilter('has2W')}><IconMotorbike size={14} style={{ marginRight: 6 }} /> 2-Wheeler</button>
              <button className={`filter-chip ${filters.has4W ? 'active' : ''}`} onClick={() => toggleFilter('has4W')}><IconCar size={14} style={{ marginRight: 6 }} /> 4-Wheeler</button>
              <button className={`filter-chip ${filters.hasHeavy ? 'active' : ''}`} onClick={() => toggleFilter('hasHeavy')}><IconTruck size={14} style={{ marginRight: 6 }} /> Heavy</button>
              <button className={`filter-chip ${filters.hasEV ? 'active' : ''}`} onClick={() => toggleFilter('hasEV')}><IconEV size={14} style={{ marginRight: 6 }} /> EV Spot</button>
              <button className={`filter-chip ${filters.hasHandicap ? 'active' : ''}`} onClick={() => toggleFilter('hasHandicap')}><IconHandicap size={14} style={{ marginRight: 6 }} /> Handicap</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features strip ───────────────────────────────── */}
      {!searched && (
        <>
          <section className="guest-features">
            {[
              { icon: <IconEV size={28} />, title: 'Smart Reservations', desc: 'Secure your spot in seconds with our optimized booking flow.' },
              { icon: <IconMap size={28} />, title: 'Real-time Data', desc: 'Never circle the block again with live occupancy tracking.' },
              { icon: <IconPayment size={28} />, title: 'Sleek Payments', desc: 'Seamless UPI and card payments integrated via Razorpay.' },
              { icon: <IconBell size={28} />, title: 'Active Support', desc: '24/7 assistance for all your parking and payment queries.' },
            ].map(f => (
              <div key={f.title} className="guest-feature-card">
                <div className="guest-feature-icon">{f.icon}</div>
                <div className="guest-feature-title">{f.title}</div>
                <div className="guest-feature-desc">{f.desc}</div>
              </div>
            ))}
          </section>

          {/* ── Stats Section ────────────────────────────── */}
          <section className="how-it-works">
            <h2 className="section-title">ParkEase in Numbers</h2>
            <p className="section-sub">Empowering drivers across the nation with smart technology.</p>

            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">50k+</div>
                <div className="stat-label">Happy Drivers</div>
                <p className="stat-desc">Growing community of daily commuters trusting our platform.</p>
              </div>
              <div className="stat-item">
                <div className="stat-number">500+</div>
                <div className="stat-label">Parking Lots</div>
                <p className="stat-desc">Premium partnerships with top-tier lots in prime locations.</p>
              </div>
              <div className="stat-item">
                <div className="stat-number">15+</div>
                <div className="stat-label">Major Cities</div>
                <p className="stat-desc">Expanding rapidly across India's busiest metropolitan areas.</p>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── Search results ────────────────────────────────── */}
      {(searched || loading) && (
        <section className="guest-results">
          {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

          {loading ? <Spinner /> : lots.length === 0 ? (
            <EmptyState
              icon={<IconSearch size={48} />}
              title="No lots found"
              message="Try a different city or use 'Near Me' to find lots around you."
            />
          ) : (
            <>
              <div className="guest-results-header">
                <h2>{lots.length} Premium Parking Lots</h2>
                <p>Curated results based on your city and filters.</p>
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
                        <p><IconMap size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {lot.address}, {lot.city}</p>
                      </div>
                      <div className="lot-card-body">
                        <div className="lot-meta">
                          <div className="lot-meta-item">
                            <IconParking size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {lot.availableSpots} / {lot.totalSpots} spots
                          </div>
                          {lot.distanceKm && (
                            <div className="lot-meta-item"><IconMap size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {lot.distanceKm} km away</div>
                          )}
                          <div className="lot-meta-item">
                            {lot.open
                              ? <span className="text-success">● Open Now</span>
                              : <span className="text-danger">● Currently Closed</span>}
                          </div>
                          {lot.isHandicappedFriendly && (
                            <div className="lot-meta-item" style={{ color: 'var(--info)', fontWeight: 500 }}>
                              <IconHandicap size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Accessible
                            </div>
                          )}
                        </div>
                        <div className="occupancy-bar">
                          <div
                            className={`occupancy-fill ${getOccupancyClass(lot)}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="occupancy-text">
                          <span>Real-time Occupancy</span>
                          <span>{pct.toFixed(0)}%</span>
                        </div>
                        <div style={{ marginTop: 20 }}>
                          <button className="btn btn-primary btn-block">
                            Select Spot <span style={{ marginLeft: 8 }}>→</span>
                          </button>
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
