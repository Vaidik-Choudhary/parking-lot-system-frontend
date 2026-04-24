import React, { useState } from 'react';
import Sidebar from '../common/Sidebar';
import { Topbar } from '../common/UI';

const MANAGER_NAV = [
  { icon: '🏠', label: 'Dashboard',  path: '/manager',      exact: true },
  { icon: '🏢', label: 'My Lots',    path: '/manager/lots'  },
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
