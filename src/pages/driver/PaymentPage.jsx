import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DriverLayout from '../../components/driver/DriverLayout';
import { Spinner, Alert } from '../../components/common/UI';
import { api } from '../../utils/api';

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate      = useNavigate();

  const [booking, setBooking]         = useState(null);
  const [payment, setPayment]         = useState(null);  // FIX: check existing payment
  const [loading, setLoading]         = useState(true);
  const [paying, setPaying]           = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    // Load booking AND check if it's already been paid
    Promise.all([
      api.get(`/api/bookings/${bookingId}`),
      // Check payment status — returns 404 if no payment yet, so we catch that
      api.get(`/api/payments/booking/${bookingId}`).catch(() => null),
    ])
      .then(([b, p]) => { setBooking(b); setPayment(p); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [bookingId]);

  // Already paid — redirect back
  const alreadyPaid = payment?.status === 'PAID';

  const handlePay = async () => {
    setPaying(true); setError('');
    try {
      // Step 1: Create Razorpay order
      const order = await api.post('/api/payments/order', {
        bookingId: Number(bookingId),
        amount: booking.totalAmount,
        description: `Parking Booking #${bookingId}`,
      });

      // Step 2: Open Razorpay checkout UI
      const options = {
        key:      order.razorpayKeyId,
        amount:   order.amount * 100,
        currency: 'INR',
        name:     'ParkEase',
        description: `Parking Booking #${bookingId}`,
        order_id: order.razorpayOrderId,

        handler: async (response) => {
          try {
            await api.post('/api/payments/verify', {
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            // FIX: navigate back to bookings with success message
            // MyBookings will re-fetch on navigation and Pay button will be gone
            navigate('/driver/bookings', {
              state: { success: '✅ Payment successful! Your receipt will be emailed to you.' }
            });
          } catch (err) {
            setError('Payment verification failed: ' + err.message);
          }
        },

        prefill: { name: '', email: localStorage.getItem('email') || '' },
        theme: { color: '#2563eb' },
        modal: {
          ondismiss: () => setPaying(false)
        }
      };

      if (!window.Razorpay) await loadRazorpayScript();
      const rzp = new window.Razorpay(options);
      rzp.open();

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

  // If already paid — show receipt info instead of payment button
  if (alreadyPaid) {
    return (
      <DriverLayout title="Payment Receipt"
        topbarRight={
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/driver/bookings')}>
            ← My Bookings
          </button>
        }
      >
        <div className="page-header">
          <h1>Payment Complete ✅</h1>
          <p>This booking has already been paid.</p>
        </div>
        <div className="card" style={{ maxWidth: 480 }}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
            <h3>Booking #{bookingId} is paid</h3>
            <p style={{ marginTop: 8 }}>Amount: <strong>₹{booking?.totalAmount}</strong></p>
            <p style={{ marginTop: 4, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Transaction ID: {payment?.razorpayPaymentId || '—'}
            </p>
          </div>
          <button className="btn btn-primary btn-block mt-3"
            onClick={() => navigate('/driver/bookings')}>
            Back to My Bookings
          </button>
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout title="Complete Payment"
      topbarRight={
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Back</button>
      }
    >
      <div className="page-header">
        <h1>Complete Your Payment</h1>
        <p>Pay securely via Razorpay (Card, UPI, Net Banking)</p>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      <div className="card" style={{ maxWidth: 480 }}>
        <h3 className="mb-4">Booking Summary</h3>

        {[
          ['Booking ID',  `#${booking?.bookingId}`],
          ['Spot',        `#${booking?.spotId}`],
          ['Vehicle',     booking?.vehiclePlate],
          ['Check-in',    booking?.checkInTime ? new Date(booking.checkInTime).toLocaleString() : '—'],
          ['Check-out',   booking?.checkOutTime ? new Date(booking.checkOutTime).toLocaleString() : '—'],
        ].map(([label, value]) => (
          <div key={label} className="flex-between"
            style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{label}</span>
            <span style={{ fontWeight: 500 }}>{value}</span>
          </div>
        ))}

        <div className="flex-between mt-3"
          style={{ padding: '16px 0', borderTop: '2px solid var(--border)' }}>
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>Total Amount</span>
          <span style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--primary)' }}>
            ₹{booking?.totalAmount}
          </span>
        </div>

        <button
          className="btn btn-primary btn-block btn-lg mt-3"
          onClick={handlePay}
          disabled={paying}
        >
          {paying ? 'Processing...' : `💳 Pay ₹${booking?.totalAmount} via Razorpay`}
        </button>

        <p className="text-center mt-3" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          🔒 Secured by Razorpay. Your payment info is never stored on our servers.
        </p>
      </div>
    </DriverLayout>
  );
}
