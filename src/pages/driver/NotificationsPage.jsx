import React, { useEffect, useState, useCallback } from 'react';
import DriverLayout from '../../components/driver/DriverLayout';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { Spinner, Alert, EmptyState } from '../../components/common/UI';
import { IconCheckCircle, IconCar, IconLogout, IconPayment, IconX, IconClock, IconBell } from '../../components/common/Icons';
import { api, getRole } from '../../utils/api';

const TYPE_CONFIG = {
  BOOKING_CONFIRMED: { icon: <IconCheckCircle size={18} />, status: 'success', label: 'Booking Confirmed' },
  CHECKIN:           { icon: <IconCar size={18} />, status: 'info', label: 'Check-In' },
  CHECKOUT:          { icon: <IconLogout size={18} />, status: 'purple', label: 'Check-Out' },
  PAYMENT:           { icon: <IconPayment size={18} />, status: 'warning', label: 'Payment' },
  CANCELLATION:      { icon: <IconX size={18} />, status: 'danger', label: 'Cancellation' },
  EXPIRY_REMINDER:   { icon: <IconClock size={18} />, status: 'warning', label: 'Expired' },
  BROADCAST:         { icon: <IconBell size={18} />, status: 'info', label: 'Announcement' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const role = getRole();
  const Layout = role === 'LOT_MANAGER' ? ManagerLayout : DriverLayout;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [filter, setFilter]               = useState('ALL');

  const load = useCallback(() => {
    api.get('/api/notifications/my')
      .then(setNotifications)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteNotif = async (id) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.notificationId !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filtered = filter === 'ALL'    ? notifications
                 : filter === 'UNREAD' ? notifications.filter(n => !n.isRead)
                 : notifications.filter(n => n.type === filter);

  return (
    <Layout
      title="Notifications"
      topbarRight={
        unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
            <IconCheckCircle size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Mark all as read
          </button>
        )
      }
    >
      <div className="page-header">
        <h1>Notifications <IconBell size={28} style={{ verticalAlign: '-4px' }} /></h1>
        <p>{unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}</p>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      {/* Filter tabs */}
      <div className="notif-filters">
        {['ALL', 'UNREAD', 'BOOKING_CONFIRMED', 'PAYMENT', 'CANCELLATION'].map(f => (
          <button
            key={f}
            className={`notif-filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'ALL'    ? 'All' :
             f === 'UNREAD' ? `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` :
             TYPE_CONFIG[f]?.label || f}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState
          icon={<IconBell size={48} />}
          title="No notifications"
          message={filter === 'UNREAD' ? "You're all caught up!" : "Nothing here yet."}
        />
      ) : (
        <div className="notif-list">
          {filtered.map(n => {
            const cfg = TYPE_CONFIG[n.type] || { icon: <IconBell size={18} />, status: 'muted', label: n.type };
            return (
              <div
                key={n.notificationId}
                className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                onClick={() => !n.isRead && markRead(n.notificationId)}
              >
                {/* Unread dot */}
                {!n.isRead && <div className="notif-unread-dot" />}

                {/* Icon */}
                <div className={`notif-icon ${cfg.status}`}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div className="notif-content">
                  <div className="notif-header-row">
                    <span className={`notif-type-label status-${cfg.status}`}>
                      {cfg.label}
                    </span>
                    <span className="notif-time">{timeAgo(n.sentAt)}</span>
                  </div>
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-message">{n.message}</div>
                </div>

                {/* Actions */}
                <div className="notif-actions">
                  {!n.isRead && (
                    <button
                      className="notif-action-btn"
                      title="Mark as read"
                      onClick={e => { e.stopPropagation(); markRead(n.notificationId); }}
                    >
                      <IconCheckCircle size={14} />
                    </button>
                  )}
                  <button
                    className="notif-action-btn delete"
                    title="Delete"
                    onClick={e => { e.stopPropagation(); deleteNotif(n.notificationId); }}
                  >
                    <IconX size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
