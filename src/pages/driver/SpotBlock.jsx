import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../components/driver/DriverLayout';
import { Spinner, Alert, EmptyState, Modal, StatusBadge } from '../../components/common/UI';
import { IconSearch, IconMap, IconParking, IconCalendar, IconCheckCircle, IconInfo, IconCar, IconMotorbike, IconTruck, IconX } from '../../components/common/Icons';
import { api } from '../../utils/api';

export default function SpotBlock() {
  const navigate = useNavigate();
  
  // Step 1: Lot Search
  const [step, setStep] = useState(1);
  const [city, setCity] = useState('');
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 2: Spot Selection
  const [selectedLot, setSelectedLot] = useState(null);
  const [spots, setSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);

  // Step 3: Confirmation
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // My Requests & Active Subscriptions
  const [myRequests, setMyRequests] = useState([]);
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // Cancellation state
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Load driver's data on mount
  const loadDriverData = async () => {
    setLoadingHistory(true);
    try {
      const [requests, subs] = await Promise.all([
        api.get('/api/subscriptions/requests/driver'),
        api.get('/api/subscriptions/active')
      ]);
      setMyRequests(Array.isArray(requests) ? requests : []);
      setMySubscriptions(Array.isArray(subs) ? subs : []);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadDriverData();
  }, [success]); 

  // Search Lots
  const searchLots = async (e) => {
    if (e) e.preventDefault();
    if (!city.trim()) return;
    setLoading(true); setError('');
    try {
      const data = await api.get(`/api/lots/city/${city.trim()}`);
      setLots(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Select Lot -> Fetch eligible spots
  const handleSelectLot = async (lot) => {
    setSelectedLot(lot);
    setLoading(true); setError('');
    try {
      const [spotData, subscribedIds] = await Promise.all([
        api.get(`/api/spots/lot/${lot.lotId}`),
        api.get(`/api/subscriptions/lot/${lot.lotId}/subscribed-spots`).catch(() => [])
      ]);

      const spotList = Array.isArray(spotData) ? spotData : [];
      const takenIds = new Set(Array.isArray(subscribedIds) ? subscribedIds : []);

      const eligible = spotList.filter(s => 
        (s.monthlySubscriptionEnabled === true || s.monthly_subscription_enabled === true) &&
        !takenIds.has(s.spotId)
      );

      setSpots(eligible);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Request
  const handleSubmitRequest = async () => {
    setSubmitting(true); setError('');
    try {
      await api.post('/api/subscriptions/request', {
        lotId: selectedLot.lotId,
        spotId: selectedSpot.spotId
      });
      setSuccess(true);
      setShowConfirm(false);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel Subscription
  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    try {
      await api.post(`/api/subscriptions/${cancellingId}/cancel`);
      setCancellingId(null);
      loadDriverData(); // Refresh list
    } catch (err) {
      setError("Cancellation failed: " + err.message);
    } finally {
      setCancelLoading(false);
    }
  };

  const getVehicleIcon = (type) => {
    if (type === 'MOTORBIKE') return <IconMotorbike size={16} />;
    if (type === 'HEAVY') return <IconTruck size={16} />;
    return <IconCar size={16} />;
  };

  const getRequestStatusBadge = (status) => {
    const config = {
      PENDING: { cls: 'badge-warning', label: 'Pending Approval' },
      APPROVED: { cls: 'badge-success', label: 'Approved' },
      REJECTED: { cls: 'badge-danger', label: 'Rejected' },
    };
    const c = config[status] || { cls: 'badge-muted', label: status };
    return <span className={`badge ${c.cls}`}>{c.label}</span>;
  };

  const getSubStatusBadge = (status) => {
    const config = {
      ACTIVE: { cls: 'badge-success', label: 'Active' },
      SCHEDULED: { cls: 'badge-info', label: 'Starts Soon' },
    };
    const c = config[status] || { cls: 'badge-muted', label: status };
    return <span className={`badge ${c.cls}`}>{c.label}</span>;
  };

  return (
    <DriverLayout title="Spot Block">
      <div className="page-header">
        <h1>Spot Block</h1>
        <p>Reserve a permanent parking spot on a monthly basis.</p>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      {/* STEP 1: SEARCH LOTS */}
      {step === 1 && (
        <div className="animate-fade-in">
          
          {/* ACTIVE SUBSCRIPTIONS SECTION */}
          {mySubscriptions.length > 0 && (
            <div className="card mb-4 border-primary" style={{ borderLeftWidth: 4 }}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title m-0"><IconCheckCircle size={16} className="mr-2 text-success" />Your Active Subscriptions</h4>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Spot</th>
                      <th>Lot ID</th>
                      <th>Starts</th>
                      <th>Ends</th>
                      <th>Status</th>
                      <th>Monthly Rate</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mySubscriptions.map(sub => (
                      <tr key={sub.id}>
                        <td><strong><IconParking size={14} className="mr-1" />{sub.spotId}</strong></td>
                        <td>{sub.lotId}</td>
                        <td>{new Date(sub.startDate).toLocaleDateString()}</td>
                        <td>{new Date(sub.endDate).toLocaleDateString()}</td>
                        <td>{getSubStatusBadge(sub.status)}</td>
                        <td><span className="text-primary font-weight-bold">₹{sub.monthlyRate}</span></td>
                        <td>
                          <button 
                            className="btn btn-outline-danger btn-xs" 
                            onClick={() => setCancellingId(sub.id)}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card mb-4 guest-search-container" style={{ border: 'none' }}>
            <div className="card-body">
              <form onSubmit={searchLots}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input
                    className="form-control guest-search-input"
                    placeholder="Enter city to find monthly-enabled lots..."
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    style={{ flex: 1, height: 48 }}
                  />
                  <button className="btn btn-primary" type="submit" style={{ height: 48, padding: '0 24px' }}>
                    <IconSearch size={16} style={{ marginRight: 8 }} /> Find Lots
                  </button>
                </div>
              </form>
            </div>
          </div>

          {loading ? <Spinner /> : (
            lots.length > 0 ? (
              <div className="lot-grid">
                {lots.map(lot => (
                  <div key={lot.lotId} className="lot-card" onClick={() => handleSelectLot(lot)}>
                    <div className="lot-card-header">
                      <h3>{lot.name}</h3>
                      <p><IconMap size={12} style={{ marginRight: 4 }} /> {lot.address}, {lot.city}</p>
                    </div>
                    <div className="lot-card-body">
                      <div className="badge badge-info mb-2">Subscriptions Available</div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Click to view available spots and monthly rates.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : city && !loading && (
              <EmptyState icon={<IconSearch size={48} />} title="No lots found" message="Try searching for a different city." />
            )
          )}

          {/* MY REQUESTS SECTION */}
          <div className="card mt-4">
            <div className="card-header">
              <h4 className="card-title"><IconCalendar size={16} style={{ marginRight: 8, verticalAlign: '-2px' }} />My Subscription Requests</h4>
            </div>
            {loadingHistory ? <div style={{ padding: 20 }}><Spinner /></div> : (
              myRequests.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  You haven't submitted any subscription requests yet.
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Spot ID</th>
                        <th>Lot ID</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Manager Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myRequests.map(req => (
                        <tr key={req.id}>
                          <td><strong><IconParking size={14} style={{ marginRight: 4 }} />{req.spotId}</strong></td>
                          <td>{req.lotId}</td>
                          <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                          <td>{getRequestStatusBadge(req.status)}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{req.managerComment || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* STEP 2: SELECT SPOT */}
      {step === 2 && (
        <div className="animate-fade-in">
          <div className="mb-4" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setStep(1)}>← Back to Search</button>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Spots in {selectedLot.name}</h2>
          </div>

          {spots.length === 0 ? (
            <EmptyState 
              icon={<IconInfo size={48} />} 
              title="No available spots" 
              message="All subscription-enabled spots in this lot are either already subscribed or have pending requests." 
            />
          ) : (
            <div className="lot-grid">
              {spots.map(spot => (
                <div 
                  key={spot.spotId} 
                  className={`lot-card spot-selection-card ${selectedSpot?.spotId === spot.spotId ? 'selected' : ''}`}
                  onClick={() => setSelectedSpot(spot)}
                  style={{ 
                    border: selectedSpot?.spotId === spot.spotId ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    background: selectedSpot?.spotId === spot.spotId ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--card-bg)'
                  }}
                >
                  <div className="lot-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ marginBottom: 4 }}>Spot {spot.spotNumber}</h3>
                      <span className="badge badge-secondary">{spot.vehicleType}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                        ₹{spot.monthlyRate}<small>/mo</small>
                      </div>
                    </div>
                  </div>
                  <div className="lot-card-body">
                    <div className="lot-meta" style={{ marginTop: 8 }}>
                      <div className="lot-meta-item">Floor: {spot.floor}</div>
                      <div className="lot-meta-item">
                        {getVehicleIcon(spot.vehicleType)} {spot.vehicleType.toLowerCase()}
                      </div>
                    </div>
                    <button 
                      className="btn btn-primary btn-block mt-3"
                      onClick={(e) => { e.stopPropagation(); setSelectedSpot(spot); setShowConfirm(true); }}
                    >
                      Request Subscription
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: SUCCESS */}
      {step === 3 && (
        <div className="animate-fade-in text-center py-5">
          <div className="mb-4" style={{ color: 'var(--success)' }}>
            <IconCheckCircle size={80} />
          </div>
          <h2 className="mb-3">Request Submitted!</h2>
          <p className="mb-4 text-muted mx-auto" style={{ maxWidth: 400 }}>
            Your request for Spot <strong>{selectedSpot.spotNumber}</strong> at <strong>{selectedLot.name}</strong> has been sent to the Lot Manager. 
            You will be notified once it is approved.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => { setStep(1); setSuccess(false); }}>View My Requests</button>
            <button className="btn btn-secondary" onClick={() => navigate('/driver')}>Go to Dashboard</button>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {showConfirm && (
        <Modal 
          isOpen={showConfirm}
          title="Confirm Subscription Request" 
          onClose={() => setShowConfirm(false)}
          footer={(
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmitRequest} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Confirm Request'}
              </button>
            </div>
          )}
        >
          <div style={{ padding: '10px 0' }}>
            <p>You are requesting a monthly subscription for:</p>
            <div className="card bg-light p-3 border-0">
              <div className="d-flex justify-content-between mb-2">
                <strong>Lot:</strong> <span>{selectedLot.name}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <strong>Spot:</strong> <span>{selectedSpot.spotNumber}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <strong>Monthly Rate:</strong> <span className="text-primary font-weight-bold">₹{selectedSpot.monthlyRate}</span>
              </div>
            </div>
            <div className="mt-3 p-2 bg-info-soft rounded" style={{ fontSize: '0.85rem' }}>
              <IconInfo size={14} style={{ marginRight: 6, verticalAlign: '-2px' }} />
              <strong>Note:</strong> Billing happens at the end of each month. No upfront payment is required today.
            </div>
          </div>
        </Modal>
      )}

      {/* CANCELLATION MODAL */}
      {cancellingId && (
        <Modal
          isOpen={true}
          title="Cancel Subscription?"
          onClose={() => setCancellingId(null)}
          footer={(
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
              <button className="btn btn-secondary" onClick={() => setCancellingId(null)}>Wait, No</button>
              <button className="btn btn-danger" onClick={handleCancelSubscription} disabled={cancelLoading}>
                {cancelLoading ? 'Cancelling...' : 'Yes, End Subscription'}
              </button>
            </div>
          )}
        >
          <div className="text-center py-3">
            <div className="mb-3 text-danger"><IconX size={48} /></div>
            <h3>End Subscription Early?</h3>
            <p className="text-muted">
              You will be charged a <strong>pro-rated amount</strong> for the days you have parked. 
              The spot will be released immediately for other users.
            </p>
            <div className="alert alert-warning py-2 small">
              <IconInfo size={14} className="mr-2" />
              Final charges will be calculated and billed to your account now.
            </div>
          </div>
        </Modal>
      )}

      <style>{`
        .spot-selection-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(0,0,0,0.15);
          border-radius: 12px;
        }
        .spot-selection-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 32px rgba(0,0,0,0.25);
        }
        .bg-info-soft {
          background: rgba(var(--info-rgb), 0.1);
          color: var(--info);
          border: 1px solid rgba(var(--info-rgb), 0.2);
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        .btn-xs { padding: 0.2rem 0.5rem; font-size: 0.75rem; }
        .border-primary { border: 1px solid var(--primary) !important; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </DriverLayout>
  );
}
