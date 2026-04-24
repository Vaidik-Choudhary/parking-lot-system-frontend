import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../components/driver/DriverLayout';
import { Spinner, Alert, EmptyState } from '../../components/common/UI';
import { api } from '../../utils/api';

export default function SearchLots() {
  const navigate = useNavigate();
  const [city, setCity]     = useState('');
  const [lots, setLots]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [searched, setSearched] = useState(false);

  // Search by city
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
            `/api/lots/nearby?lat=${lat}&lon=${lon}&radius=10`
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
      <div className="card mb-4">
        <form onSubmit={searchByCity}>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              className="form-control"
              placeholder="Enter city name (e.g. Mumbai)"
              value={city}
              onChange={e => setCity(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" type="submit">
              🔍 Search
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={searchNearby}
            >
              📍 Nearby
            </button>
          </div>
        </form>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      {/* Results */}
      {loading ? <Spinner /> : searched && (
        lots.length === 0 ? (
          <EmptyState icon="🔍" title="No lots found"
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
                      <p>📍 {lot.address}, {lot.city}</p>
                    </div>
                    <div className="lot-card-body">
                      <div className="lot-meta">
                        <div className="lot-meta-item">
                          🅿 {lot.availableSpots} / {lot.totalSpots} spots
                        </div>
                        {lot.distanceKm && (
                          <div className="lot-meta-item">
                            📏 {lot.distanceKm} km away
                          </div>
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
