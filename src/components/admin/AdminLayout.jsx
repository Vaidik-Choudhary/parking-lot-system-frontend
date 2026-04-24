import React, { useState } from 'react';
import Sidebar from '../common/Sidebar';
import { Topbar } from '../common/UI';

const ADMIN_NAV = [
  { icon: '🏠', label: 'Dashboard',  path: '/admin',           exact: true },
  { icon: '👥', label: 'Users',      path: '/admin/users'      },
  { icon: '🏢', label: 'Lots',       path: '/admin/lots'       },
  { icon: '📋', label: 'Bookings',   path: '/admin/bookings'   },
  { icon: '📊', label: 'Analytics',  path: '/admin/analytics'  },
];

export default function AdminLayout({ title, children, topbarRight }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="app-layout">
      <Sidebar
        navItems={ADMIN_NAV}
        title="Admin Panel"
        mobileOpen={mobileOpen}
        onMenuToggle={() => setMobileOpen(o => !o)}
      />
      <div className="main-content">
        <Topbar title={title} onMenuToggle={() => setMobileOpen(o => !o)}>
          {topbarRight}
        </Topbar>
        <div className="page-body">{children}</div>
      </div>
    </div>
  );
}
