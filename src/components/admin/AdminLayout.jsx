import React, { useState } from 'react';
import Sidebar from '../common/Sidebar';
import { Topbar } from '../common/UI';
import { IconHome, IconUsers, IconBuilding, IconBooking, IconChart, IconBell, IconUser, IconMessage } from '../common/Icons';

const ADMIN_NAV = [
  { icon: <IconHome size={18} />,     label: 'Dashboard',  path: '/admin',           exact: true },
  { icon: <IconUsers size={18} />,    label: 'Users',      path: '/admin/users'      },
  { icon: <IconBuilding size={18} />, label: 'Lots',       path: '/admin/lots'       },
  { icon: <IconBooking size={18} />,  label: 'Bookings',   path: '/admin/bookings'   },
  { icon: <IconChart size={18} />,    label: 'Analytics',  path: '/admin/analytics'  },
  { icon: <IconBell size={18} />,     label: 'Broadcast',  path: '/admin/broadcast'  },
  { icon: <IconMessage size={18} />,  label: 'Complaints', path: '/admin/tickets'    },
  { icon: <IconUser size={18} />,     label: 'Profile',    path: '/admin/profile'    },
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
