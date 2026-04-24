import React, { useState, useEffect } from 'react';
import Sidebar from '../common/Sidebar';
import { Topbar } from '../common/UI';
import { api } from '../../utils/api';

export default function DriverLayout({ title, children, topbarRight }) {
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [unreadCount, setUnreadCount]   = useState(0);

  // Poll unread notification count every 30 seconds
  useEffect(() => {
    const fetchCount = () => {
      api.get('/api/notifications/my/count')
        .then(data => setUnreadCount(data.unreadCount || 0))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const DRIVER_NAV = [
    { icon: '🏠', label: 'Dashboard',      path: '/driver',                  exact: true },
    { icon: '🔍', label: 'Find Parking',   path: '/driver/search'            },
    { icon: '📋', label: 'My Bookings',    path: '/driver/bookings'          },
    { icon: '🚗', label: 'My Vehicles',    path: '/driver/vehicles'          },
    { icon: '🧾', label: 'My Receipts',    path: '/driver/receipts'          },
    { icon: '🔔', label: 'Notifications',  path: '/driver/notifications', badge: unreadCount },
  ];

  return (
    <div className="app-layout">
      <Sidebar
        navItems={DRIVER_NAV}
        title="Driver Menu"
        mobileOpen={mobileOpen}
        onMenuToggle={() => setMobileOpen(o => !o)}
      />
      <div className="main-content">
        <Topbar
          title={title}
          onMenuToggle={() => setMobileOpen(o => !o)}
        >
          {topbarRight}
        </Topbar>
        <div className="page-body">{children}</div>
      </div>
    </div>
  );
}
