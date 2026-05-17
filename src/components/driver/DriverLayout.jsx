import React, { useState, useEffect } from 'react';
import Sidebar from '../common/Sidebar';
import { Topbar } from '../common/UI';
import { api } from '../../utils/api';
import { IconHome, IconSearch, IconBooking, IconCar, IconReceipt, IconBell, IconUser, IconHelp, IconCalendar, IconPayment } from '../common/Icons';

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
    { icon: <IconHome size={18} />,    label: 'Dashboard',      path: '/driver',                  exact: true },
    { icon: <IconSearch size={18} />,  label: 'Find Parking',   path: '/driver/search'            },
    { icon: <IconCalendar size={18} />, label: 'Spot Block',     path: '/driver/spot-block'        },
    { icon: <IconBooking size={18} />, label: 'My Bookings',    path: '/driver/bookings'          },
    { icon: <IconPayment size={18} />, label: 'My Bills',       path: '/driver/bills'             },
    { icon: <IconCar size={18} />,     label: 'My Vehicles',    path: '/driver/vehicles'          },
    { icon: <IconReceipt size={18} />, label: 'My Receipts',    path: '/driver/receipts'          },
    { icon: <IconBell size={18} />,    label: 'Notifications',  path: '/driver/notifications', badge: unreadCount },
    { icon: <IconUser size={18} />,    label: 'Profile',        path: '/driver/profile'           },
    { icon: <IconHelp size={18} />,    label: 'Help & Support', path: '/driver/help'              },
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
