import React, { useEffect, useState } from 'react';
import DriverLayout from '../../components/driver/DriverLayout';
import { Spinner, Alert, EmptyState, StatusBadge } from '../../components/common/UI';
import { IconReceipt, IconClock, IconDownload } from '../../components/common/Icons';
import { api, GATEWAY_URL, getToken } from '../../utils/api';

export default function ReceiptsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    api.get('/api/payments/my')
      .then(data => setPayments(data.filter(p => p.status === 'PAID')))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const downloadReceipt = async (paymentId) => {
    setDownloading(paymentId);
    try {
      const response = await fetch(
        `${GATEWAY_URL}/api/payments/${paymentId}/receipt`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      if (!response.ok) {
        throw new Error('Receipt not available. Please try again.');
      }

      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `ParkEase_Receipt_${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <DriverLayout title="My Receipts">
      <div className="page-header">
        <h1>My Receipts <IconReceipt size={28} style={{ verticalAlign: '-4px' }} /></h1>
        <p>Download PDF receipts for all your completed payments.</p>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      {loading ? <Spinner /> : payments.length === 0 ? (
        <EmptyState
          icon={<IconReceipt size={48} />}
          title="No receipts yet"
          message="Receipts appear here after a completed payment."
        />
      ) : (
        <div className="receipts-list">
          {payments.map(p => (
            <div key={p.paymentId} className="receipt-card">
              <div className="receipt-card-left">
                <div className="receipt-icon"><IconReceipt size={24} /></div>
                <div className="receipt-info">
                  <div className="receipt-title">
                    {p.subscriptionId ? `Subscription #${p.subscriptionId}` : `Booking #${p.bookingId}`}
                  </div>
                  <div className="receipt-meta">
                    Payment #{p.paymentId}
                    {p.razorpayPaymentId && (
                      <span className="receipt-txn"> · TXN: {p.razorpayPaymentId}</span>
                    )}
                  </div>
                  <div className="receipt-date">
                    {p.paidAt ? new Date(p.paidAt).toLocaleString() : '—'}
                  </div>
                </div>
              </div>

              <div className="receipt-card-right">
                <div className="receipt-amount">₹{p.amount}</div>
                <StatusBadge status={p.status} />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => downloadReceipt(p.paymentId)}
                  disabled={downloading === p.paymentId}
                >
                  {downloading === p.paymentId ? <><IconClock size={14} className="spin" style={{ marginRight: 4 }} /> Downloading...</> : <><IconDownload size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Download PDF</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DriverLayout>
  );
}
