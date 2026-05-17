import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconParking, IconSun, IconMoon } from '../common/Icons';
import { useTheme } from '../../context/ThemeContext';

export default function GuestLayout({ children }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="guest-layout">
      {/* Public navbar */}
      <nav className="guest-nav">
        <div className="guest-nav-inner">
          <div className="guest-logo" onClick={() => navigate('/')}>
            <IconParking size={28} style={{ marginRight: 8, color: 'var(--primary-light)' }} /> 
            <span>ParkEase</span>
          </div>
          <div className="guest-nav-actions">
            <button 
              className="btn btn-icon theme-toggle" 
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '8px', display: 'flex' }}
            >
              {theme === 'light' ? <IconMoon size={20} /> : <IconSun size={20} />}
            </button>
            <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="guest-main">
        {children}
      </main>
    </div>
  );
}
