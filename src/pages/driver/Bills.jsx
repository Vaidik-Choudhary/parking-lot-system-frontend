import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../components/driver/DriverLayout';
import { Spinner, Alert, EmptyState, StatusBadge } from '../../components/common/UI';
import { IconPayment, IconBooking, IconCalendar, IconArrowRight, IconInfo } from '../../components/common/Icons';
import { api } from '../../utils/api';

export default function Bills() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const load = () => {
    setLoading(true);
    api.get('/api/payments/my')
      .then(data => {
        // Show all pending or failed payments
        setPayments(data.filter(p => p.status === 'PENDING' || p.status === 'FAILED'));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handlePay = (payment) => {
    if (payment.bookingId) {
      navigate(`/driver/payment/${payment.bookingId}`);
    } else if (payment.subscriptionId) {
      // We need a specific payment page for subscriptions or update existing one
      navigate(`/driver/payment/subscription/${payment.subscriptionId}`);
    }
  };

  return (
    <DriverLayout title="My Bills">
      <div className="page-header">
        <h1>Unpaid Bills <IconPayment size={28} style={{ verticalAlign: '-4px' }} /></h1>
        <p>Manage and pay your outstanding parking and subscription charges.</p>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      {loading ? <Spinner /> : payments.length === 0 ? (
        <EmptyState 
          icon={<IconPayment size={48} />} 
          title="All clear!" 
          message="You don't have any pending bills at the moment."
        />
      ) : (
        <div className="bills-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {payments.map(p => (
            <div key={p.paymentId} className="card bill-card animate-slide-in">
              <div className="flex-between">
                <div className="bill-info">
                  <div className="bill-type-tag mb-2">
                    {p.subscriptionId ? (
                      <span className="badge badge-info"><IconCalendar size={12} className="mr-1" /> Monthly Subscription</span>
                    ) : (
                      <span className="badge badge-primary"><IconBooking size={12} className="mr-1" /> Hourly Booking</span>
                    )}
                  </div>
                  <h4 className="m-0">
                    {p.subscriptionId ? `Subscription Bill #${p.subscriptionId}` : `Booking Bill #${p.bookingId}`}
                  </h4>
                  <p className="text-muted small mt-1">{p.description || 'Parking charges'}</p>
                  <div className="bill-meta mt-2">
                    <span className="mr-3"><IconInfo size={12} /> Issued: {new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="bill-action text-right">
                  <div className="bill-amount">₹{p.amount}</div>
                  <StatusBadge status={p.status} />
                  <button 
                    className="btn btn-warning btn-sm btn-block mt-2"
                    onClick={() => handlePay(p)}
                  >
                    Pay Now <IconArrowRight size={14} className="ml-1" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .bill-card {
          transition: transform 0.2s;
        }
        .bill-card:hover {
          transform: translateX(4px);
        }
        .bill-amount {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary);
          line-height: 1;
          margin-bottom: 4px;
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </DriverLayout>
  );
}
