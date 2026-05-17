import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DriverLayout from '../../components/driver/DriverLayout';
import { Spinner, Alert } from '../../components/common/UI';
import { IconCheckCircle, IconArrowLeft, IconPayment, IconShield, IconCalendar, IconBooking } from '../../components/common/Icons';
import { api } from '../../utils/api';

export default function PaymentPage() {
  const { bookingId, subscriptionId } = useParams();
  const navigate      = useNavigate();

  const [data, setData]               = useState(null); // Either booking or subscription info
  const [payment, setPayment]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [paying, setPaying]           = useState(false);
  const [error, setError]             = useState('');

  const isSub = !!subscriptionId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isSub) {
          // For subscriptions, we fetch the payment record directly to get the amount
          // because subscription object doesn't store the pro-rated final amount in a simple way
          const payments = await api.get('/api/payments/my');
          const subPayment = payments.find(p => p.subscriptionId === Number(subscriptionId) && p.status !== 'PAID');
          
          if (!subPayment) throw new Error("Subscription bill not found or already paid.");
          
          setData({
            id: subPayment.subscriptionId,
            amount: subPayment.amount,
            description: subPayment.description || `Monthly Subscription #${subscriptionId}`,
            type: 'SUBSCRIPTION'
          });
          setPayment(subPayment);
        } else {
          const [b, p] = await Promise.all([
            api.get(`/api/bookings/${bookingId}`),
            api.get(`/api/payments/booking/${bookingId}`).catch(() => null),
          ]);
          setData({
            id: b.bookingId,
            amount: b.totalAmount,
            description: `Parking Booking #${bookingId}`,
            type: 'BOOKING',
            details: b
          });
          setPayment(p);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId, subscriptionId]);

  const alreadyPaid = payment?.status === 'PAID';

  const handlePay = async () => {
    setPaying(true); setError('');
    try {
      const order = await api.post('/api/payments/order', {
        bookingId: isSub ? null : Number(bookingId),
        subscriptionId: isSub ? Number(subscriptionId) : null,
        amount: data.amount,
        description: data.description,
      });

      const options = {
        key:      order.razorpayKeyId,
        amount:   order.amount * 100,
        currency: 'INR',
        name:     'ParkEase',
        description: data.description,
        order_id: order.razorpayOrderId,

        handler: async (response) => {
          try {
            await api.post('/api/payments/verify', {
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            navigate(isSub ? '/driver/bills' : '/driver/bookings', {
              state: { success: 'Payment successful! Your receipt is now available in My Receipts.' }
            });
          } catch (err) {
            setError('Payment verification failed: ' + err.message);
          }
        },

        prefill: { name: '', email: localStorage.getItem('email') || '' },
        theme: { color: '#2563eb' },
        modal: { ondismiss: () => setPaying(false) }
      };

      if (!window.Razorpay) await loadRazorpayScript();
      new window.Razorpay(options).open();

    } catch (err) {
      setError(err.message);
      setPaying(false);
    }
  };

  const loadRazorpayScript = () => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve; script.onerror = reject;
    document.body.appendChild(script);
  });

  if (loading) return <DriverLayout title="Payment"><Spinner /></DriverLayout>;

  if (alreadyPaid) {
    return (
      <DriverLayout title="Payment Receipt">
        <div className="page-header text-center">
          <div className="mb-3 text-success"><IconCheckCircle size={64} /></div>
          <h1>Payment Complete</h1>
          <p>This bill has already been settled.</p>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/driver/receipts')}>View All Receipts</button>
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout title="Complete Payment">
      <div className="page-header">
        <h1>Complete Your Payment</h1>
        <p>Pay securely via Razorpay (Card, UPI, Net Banking)</p>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      <div className="card shadow-sm mx-auto" style={{ maxWidth: 500 }}>
        <div className="card-body">
          <div className="d-flex align-items-center mb-4">
            <div className={`p-3 rounded-circle mr-3 ${isSub ? 'bg-info-soft text-info' : 'bg-primary-soft text-primary'}`}>
              {isSub ? <IconCalendar size={24} /> : <IconBooking size={24} />}
            </div>
            <div>
              <h3 className="m-0">{isSub ? 'Subscription Bill' : 'Booking Bill'}</h3>
              <p className="text-muted m-0">Reference: #{data.id}</p>
            </div>
          </div>

          <div className="border-top border-bottom py-3 mb-4">
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Description</span>
              <span className="font-weight-bold">{data.description}</span>
            </div>
            {data.type === 'BOOKING' && (
              <>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Spot ID</span>
                  <span>#{data.details.spotId}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Vehicle</span>
                  <span>{data.details.vehiclePlate}</span>
                </div>
              </>
            )}
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <span className="h5 m-0 font-weight-bold">Total Amount</span>
            <span className="h2 m-0 font-weight-bold text-primary">₹{data.amount}</span>
          </div>

          <button
            className="btn btn-primary btn-block btn-lg shadow-sm"
            onClick={handlePay}
            disabled={paying}
          >
            {paying ? 'Processing...' : <><IconPayment size={18} className="mr-2" /> Pay ₹{data.amount} via Razorpay</>}
          </button>

          <div className="text-center mt-4 text-muted small">
            <IconShield size={12} className="mr-1" /> Secure encrypted payment powered by Razorpay
          </div>
        </div>
      </div>

      <style>{`
        .bg-info-soft { background: rgba(var(--info-rgb), 0.1); }
        .bg-primary-soft { background: rgba(var(--primary-rgb), 0.1); }
      `}</style>
    </DriverLayout>
  );
}
