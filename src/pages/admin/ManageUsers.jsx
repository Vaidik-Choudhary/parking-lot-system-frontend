import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Spinner, Alert, EmptyState } from '../../components/common/UI';
import { IconUsers } from '../../components/common/Icons';
import { api } from '../../utils/api';

export default function ManageUsers() {
  const [users, setUsers]       = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [search, setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const load = () => {
    api.get('/api/admin/users')
      .then(data => { setUsers(data); setFiltered(data); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    let result = users;
    if (roleFilter !== 'ALL') result = result.filter(u => u.role === roleFilter);
    if (search.trim()) result = result.filter(u =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, roleFilter, users]);

  const suspend = async (id) => {
    try { await api.put(`/api/admin/users/${id}/suspend`); setSuccess('User suspended.'); load(); }
    catch (err) { setError(err.message); }
  };
  const activate = async (id) => {
    try { await api.put(`/api/admin/users/${id}/activate`); setSuccess('User activated.'); load(); }
    catch (err) { setError(err.message); }
  };
  const remove = async (id) => {
    if (!window.confirm('Permanently delete this user?')) return;
    try { await api.delete(`/api/admin/users/${id}`); setSuccess('User deleted.'); load(); }
    catch (err) { setError(err.message); }
  };

  return (
    <AdminLayout title="Manage Users">
      <div className="page-header">
        <h1>Manage Users</h1>
        <p>{users.length} total users on the platform.</p>
      </div>

      {error   && <Alert type="danger"  onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Filters */}
      <div className="card mb-4">
        <div style={{ display: 'flex', gap: 12 }}>
          <input className="form-control" placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
          <select className="form-control" value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)} style={{ width: 160 }}>
            <option value="ALL">All Roles</option>
            <option value="DRIVER">Drivers</option>
            <option value="LOT_MANAGER">Managers</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon={<IconUsers size={48} />} title="No users found" />
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Provider</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.fullName}</strong></td>
                    <td style={{ fontSize: '0.8rem' }}>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-danger' : u.role === 'LOT_MANAGER' ? 'badge-primary' : 'badge-muted'}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td><span className="badge badge-muted">{u.provider}</span></td>
                    <td>
                      <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`}>
                        {u.active ? '● Active' : '● Suspended'}
                      </span>
                    </td>
                    <td>
                      {u.role !== 'ADMIN' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          {u.active
                            ? <button className="btn btn-warning btn-sm" onClick={() => suspend(u.id)}>Suspend</button>
                            : <button className="btn btn-success btn-sm" onClick={() => activate(u.id)}>Activate</button>
                          }
                          <button className="btn btn-danger btn-sm" onClick={() => remove(u.id)}>Delete</button>
                        </div>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>System Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
