import React, { useState } from 'react';
import Sidebar from '../common/Sidebar';
import { Topbar } from '../common/UI';
import { IconHome, IconBuilding, IconUser, IconHelp, IconCalendar, IconBell } from '../common/Icons';

const MANAGER_NAV = [
  { icon: <IconHome size={18} />,     label: 'Dashboard',  path: '/manager',      exact: true },
  { icon: <IconBuilding size={18} />, label: 'My Lots',    path: '/manager/lots'  },
  { icon: <IconCalendar size={18} />, label: 'Subscription Requests', path: '/manager/subscriptions' },
  { icon: <IconBell size={18} />,     label: 'Notifications',       path: '/manager/notifications' },
  { icon: <IconUser size={18} />,     label: 'Profile',    path: '/manager/profile' },
  { icon: <IconHelp size={18} />,     label: 'Help & Support', path: '/manager/help' },
];

export default function ManagerLayout({ title, children, topbarRight }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="app-layout">
      <Sidebar
        navItems={MANAGER_NAV}
        title="Manager Menu"
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
