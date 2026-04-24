import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function GuestLayout({ children }) {
  const navigate = useNavigate();

  return (
    <div className="guest-layout">
      {/* Public navbar */}
      <nav className="guest-nav">
        <div className="guest-nav-inner">
          <div className="guest-logo" onClick={() => navigate('/')}>
            🅿 ParkEase
          </div>
          <div className="guest-nav-actions">
            <Link to="/login"    className="btn btn-secondary btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary  btn-sm">Get Started</Link>
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
