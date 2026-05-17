import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../components/driver/DriverLayout';
import { Spinner, Alert, EmptyState } from '../../components/common/UI';
import { IconSearch, IconMap, IconParking, IconMotorbike, IconCar, IconTruck, IconEV, IconHandicap } from '../../components/common/Icons';
import { api } from '../../utils/api';

export default function SearchLots() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    hasEV: false,
    has2W: false,
    has4W: false,
    hasHeavy: false,
    hasHandicap: false
  });

  const [city, setCity]         = useState('');
  const [lots, setLots]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
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

  // Search by city
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

  // Search nearby using GPS
  const searchNearby = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser.');
      return;
    }
    setLoading(true); setError(''); setSearched(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const data = await api.get(
            `/api/lots/nearby?lat=${lat}&lon=${lon}&radius=10${getQueryString()}`
          );
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
      ? (lot.totalSpots - lot.availableSpots) / lot.totalSpots
      : 0;
    if (pct < 0.5) return 'low';
    if (pct < 0.8) return 'medium';
    return 'high';
  };

  return (
    <DriverLayout title="Find Parking">
      <div className="page-header">
        <h1>Find Parking</h1>
        <p>Search by city or use your current location.</p>
      </div>

      {/* Search bar */}
      <div className="card mb-4 guest-search-container" style={{ border: 'none', overflow: 'hidden' }}>
        <div className="card-body">
          <form onSubmit={searchByCity} className="mb-3">
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                className="form-control guest-search-input"
                placeholder="Enter city name (e.g. Mumbai)"
                value={city}
                onChange={e => setCity(e.target.value)}
                style={{ flex: 1, height: 48 }}
              />
              <button className="btn btn-primary" type="submit" style={{ height: 48, fontWeight: 600, padding: '0 24px' }}>
                <IconSearch size={16} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Search
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={searchNearby}
                style={{ height: 48, fontWeight: 500, padding: '0 24px' }}
              >
                <IconMap size={16} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Nearby
              </button>
            </div>
          </form>

          {/* Search Filters */}
          <div className="guest-search-filters" style={{ marginTop: 0 }}>
            <span className="filters-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Filters:</span>
            <div className="filters-list">
              <button className={`filter-chip ${filters.has2W ? 'active' : ''}`} onClick={() => toggleFilter('has2W')}>
                <IconMotorbike size={14} style={{ marginRight: 6 }} /> Motorbike
              </button>
              <button className={`filter-chip ${filters.has4W ? 'active' : ''}`} onClick={() => toggleFilter('has4W')}>
                <IconCar size={14} style={{ marginRight: 6 }} /> Standard/Large
              </button>
              <button className={`filter-chip ${filters.hasHeavy ? 'active' : ''}`} onClick={() => toggleFilter('hasHeavy')}>
                <IconTruck size={14} style={{ marginRight: 6 }} /> Heavy
              </button>
              <button className={`filter-chip ${filters.hasEV ? 'active' : ''}`} onClick={() => toggleFilter('hasEV')}>
                <IconEV size={14} style={{ marginRight: 6 }} /> EV Spot
              </button>
              <button className={`filter-chip ${filters.hasHandicap ? 'active' : ''}`} onClick={() => toggleFilter('hasHandicap')}>
                <IconHandicap size={14} style={{ marginRight: 6 }} /> Handicapped
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      {/* Results */}
      {loading ? <Spinner /> : searched && (
        lots.length === 0 ? (
          <EmptyState icon={<IconSearch size={48} />} title="No lots found"
            message="Try a different city or expand your search area." />
        ) : (
          <>
            <p className="mb-3" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {lots.length} parking lot{lots.length !== 1 ? 's' : ''} found
            </p>
            <div className="lot-grid">
              {lots.map(lot => {
                const occupied = lot.totalSpots - lot.availableSpots;
                const pct = lot.totalSpots > 0 ? (occupied / lot.totalSpots) * 100 : 0;
                return (
                  <div
                    key={lot.lotId}
                    className="lot-card"
                    onClick={() =>
  navigate(`/driver/lots/${lot.lotId}`, {
    state: { refreshKey: Date.now() }
  })
}
                  >
                    <div className="lot-card-header">
                      <h3>{lot.name}</h3>
                      <p><IconMap size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {lot.address}, {lot.city}</p>
                    </div>
                    <div className="lot-card-body">
                      <div className="lot-meta">
                        <div className="lot-meta-item">
                          <IconParking size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {lot.availableSpots} / {lot.totalSpots} spots
                        </div>
                        {lot.distanceKm && (
                          <div className="lot-meta-item">
                            <IconMap size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {lot.distanceKm} km away
                          </div>
                        )}
                        <div className="lot-meta-item">
                          {lot.open
                            ? <span className="text-success">● Open</span>
                            : <span className="text-danger">● Closed</span>}
                        </div>
                        {lot.isHandicappedFriendly && (
                          <div className="lot-meta-item" style={{ color: 'var(--info)', fontWeight: 500 }}>
                            <IconHandicap size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Handicapped Friendly
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
                        <span>Occupancy</span>
                        <span>{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )
      )}
    </DriverLayout>
  );
}
