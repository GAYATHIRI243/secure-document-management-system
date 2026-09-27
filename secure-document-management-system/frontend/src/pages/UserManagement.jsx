import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatDate, riskLevelFromScore } from '../utils/format';

export default function UserManagement() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);

  const loadUsers = async (query = '') => {
    setLoading(true);
    try {
      const res = await api.get('/users', { params: query ? { search: query } : {} });
      setUsers(res.data.users);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => loadUsers(search), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openDetails = async (user) => {
    setSelected(user);
    setDetails(null);
    try {
      const res = await api.get(`/users/${user._id}`);
      setDetails(res.data);
    } catch (err) {
      showToast('Failed to load user details.', 'error');
    }
  };

  const changeStatus = async (userId, status) => {
    try {
      await api.put(`/users/${userId}/status`, { status });
      showToast(`User status set to ${status}.`, 'success');
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, status } : u)));
      if (selected?._id === userId) setSelected((prev) => ({ ...prev, status }));
    } catch (err) {
      showToast('Failed to update user status.', 'error');
    }
  };

  return (
    <DashboardLayout title="User Management">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-semibold text-ink">User Management</h2>
        <p className="text-sm text-ink-dim mt-1">View, search, and manage all user accounts.</p>
      </div>

      <div className="panel p-4 mb-4">
        <input
          className="input-field max-w-sm"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="panel overflow-x-auto">
        {loading ? (
          <Loader />
        ) : users.length === 0 ? (
          <EmptyState title="No users found" />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Risk Score</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="font-medium cursor-pointer hover:text-accent" onClick={() => openDetails(u)}>{u.name}</td>
                  <td className="text-ink-dim">{u.email}</td>
                  <td className="text-ink-dim capitalize">{u.role}</td>
                  <td><Badge value={u.status} /></td>
                  <td><Badge value={riskLevelFromScore(u.riskScore)} /></td>
                  <td className="text-ink-dim">{formatDate(u.lastLogin)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {u.status !== 'active' && (
                        <button onClick={() => changeStatus(u._id, 'active')} className="text-xs text-risk-low hover:underline">Activate</button>
                      )}
                      {u.status !== 'inactive' && (
                        <button onClick={() => changeStatus(u._id, 'inactive')} className="text-xs text-risk-medium hover:underline">Deactivate</button>
                      )}
                      {u.status !== 'blocked' && (
                        <button onClick={() => changeStatus(u._id, 'blocked')} className="text-xs text-risk-high hover:underline">Block</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name || 'User details'}>
        {!details ? (
          <Loader />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-ink-faint">Email</span><p className="text-ink">{details.user.email}</p></div>
              <div><span className="text-ink-faint">Role</span><p className="text-ink capitalize">{details.user.role}</p></div>
              <div><span className="text-ink-faint">Status</span><p><Badge value={details.user.status} /></p></div>
              <div><span className="text-ink-faint">Risk</span><p><Badge value={riskLevelFromScore(details.user.riskScore)} /></p></div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-ink mb-2">Recent activity</h4>
              <div className="flex flex-col divide-y divide-line max-h-56 overflow-y-auto">
                {details.activities.length === 0 && <p className="text-xs text-ink-faint">No activity recorded.</p>}
                {details.activities.map((a) => (
                  <div key={a._id} className="py-2 text-xs text-ink-dim flex justify-between">
                    <span>{a.activityType.replaceAll('_', ' ')}</span>
                    <span>{formatDate(a.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
