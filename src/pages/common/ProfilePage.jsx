import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ManagerLayout from '../../components/manager/ManagerLayout';
import DriverLayout from '../../components/driver/DriverLayout';
import { Spinner, Alert } from '../../components/common/UI';
import { IconUser, IconMail, IconShield, IconCalendar, IconX } from '../../components/common/Icons';
import { api, getRole } from '../../utils/api';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const role = getRole();

  useEffect(() => {
    api.get('/api/auth/me')
      .then(setProfile)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passForm, setPassForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passError, setPassError] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassError('');
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }
    setPassLoading(true);
    try {
      await api.post('/api/auth/change-password', {
        oldPassword: passForm.oldPassword,
        newPassword: passForm.newPassword
      });
      setSuccess('Password changed successfully.');
      setShowPasswordModal(false);
      setPassForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPassError(err.message);
    } finally {
      setPassLoading(false);
    }
  };

  const Layout = role === 'ADMIN' ? AdminLayout : (role === 'LOT_MANAGER' ? ManagerLayout : DriverLayout);

  if (loading) return <Layout title="Profile"><Spinner /></Layout>;

  return (
    <Layout title="My Profile">
      {/* Existing content */}
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your account information and preferences.</p>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {profile && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Personal Information</h3>
            </div>
            <div className="p-4">
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 30 }}>
                <div style={{ 
                  width: 80, height: 80, borderRadius: '50%', 
                  backgroundColor: 'var(--primary)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: '#ffffff',
                  fontSize: '2rem', fontWeight: 'bold',
                  boxShadow: 'var(--shadow-md)'
                }}>
                  {profile.fullName.charAt(0)}
                </div>
                <div>
                  <h2 style={{ marginBottom: 4 }}>{profile.fullName}</h2>
                  <span className="badge badge-primary">{profile.role.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="detail-list">
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <IconMail className="text-muted" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Email Address</div>
                    <div>{profile.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <IconShield className="text-muted" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Provider</div>
                    <div><span className="badge badge-muted">{profile.provider}</span></div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <IconCalendar className="text-muted" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Account Status</div>
                    <div>
                      <span className={`badge ${profile.active ? 'badge-success' : 'badge-danger'}`}>
                        {profile.active ? '● Active' : '● Suspended'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Security & Preferences</h3>
            </div>
            <div className="p-4">
              <p className="text-muted mb-4">You are currently logged in as a <strong>{profile.role.toLowerCase().replace('_', ' ')}</strong>.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button className="btn btn-secondary w-100" onClick={() => setShowPasswordModal(true)}>
                  Change Password
                </button>
                <button className="btn btn-outline-danger w-100" onClick={() => window.confirm('Are you sure you want to delete your account? This action is irreversible.')}>
                  Delete Account
                </button>
              </div>

              <div className="alert alert-info mt-4" style={{ fontSize: '0.875rem' }}>
                <IconShield size={16} style={{ verticalAlign: '-3px', marginRight: 8 }} />
                Your data is protected by ParkEase security protocols.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Change Password</h3>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}><IconX size={18} /></button>
            </div>
            <form onSubmit={handlePasswordChange} className="p-4">
              {passError && <Alert type="danger">{passError}</Alert>}
              
              <div className="form-group">
                <label className="form-label">Old Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={passForm.oldPassword}
                  onChange={e => setPassForm({ ...passForm, oldPassword: e.target.value })}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={passForm.newPassword}
                  onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })}
                  required 
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={passForm.confirmPassword}
                  onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                  required 
                />
              </div>

              <div className="modal-footer" style={{ marginTop: 24, padding: 0 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={passLoading}>
                  {passLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
