import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuth, getUserName, getEmail, getRole } from '../../utils/api';
import { IconParking, IconCar, IconBuilding, IconSettings, IconLogout, IconX, IconSun, IconMoon } from './Icons';
import { useTheme } from '../../context/ThemeContext';

export default function Sidebar({ navItems, title, onMenuToggle, mobileOpen }) {
  const navigate  = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const name      = getUserName() || 'User';
  const email     = getEmail() || '';
  const role      = getRole() || '';
  const initials  = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const roleConfig = {
    DRIVER:      { icon: <IconCar size={14} />, label: 'Driver' },
    LOT_MANAGER: { icon: <IconBuilding size={14} />, label: 'Lot Manager' },
    ADMIN:       { icon: <IconSettings size={14} />, label: 'Admin' },
  };
  const { icon: roleIcon, label: roleLabel } = roleConfig[role] || { icon: null, label: role };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={onMenuToggle} />
      )}

      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <h2><IconParking size={22} style={{ verticalAlign: 'middle', marginRight: 6 }} /> ParkEase</h2>
          <span>Smart Parking Platform</span>
          {/* Mobile close button */}
          <button className="sidebar-close-btn" onClick={onMenuToggle} aria-label="Close menu"><IconX size={20} /></button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {title && <div className="nav-section-label">{title}</div>}
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={() => mobileOpen && onMenuToggle()}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge > 0 && (
                <span className="nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{name}</div>
              <div className="sidebar-user-role">{roleIcon} {roleLabel}</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className="sidebar-logout"
                onClick={toggleTheme}
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '4px' }}
              >
                {theme === 'light' ? <IconMoon size={16} /> : <IconSun size={16} />}
              </button>
              <button
                className="sidebar-logout"
                onClick={handleLogout}
                title="Logout"
              >
                <IconLogout size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
