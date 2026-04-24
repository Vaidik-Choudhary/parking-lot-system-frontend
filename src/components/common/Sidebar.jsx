import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuth, getUserName, getEmail, getRole } from '../../utils/api';

export default function Sidebar({ navItems, title, onMenuToggle, mobileOpen }) {
  const navigate  = useNavigate();
  const name      = getUserName() || 'User';
  const email     = getEmail() || '';
  const role      = getRole() || '';
  const initials  = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const roleLabel = {
    DRIVER:      '🚗 Driver',
    LOT_MANAGER: '🏢 Lot Manager',
    ADMIN:       '⚙️ Admin',
  }[role] || role;

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
          <h2>🅿 ParkEase</h2>
          <span>Smart Parking Platform</span>
          {/* Mobile close button */}
          <button className="sidebar-close-btn" onClick={onMenuToggle} aria-label="Close menu">✕</button>
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
              <div className="sidebar-user-role">{roleLabel}</div>
            </div>
            <button
              className="sidebar-logout"
              onClick={handleLogout}
              title="Logout"
            >
              ↩
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
