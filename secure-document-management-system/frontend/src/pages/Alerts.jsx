import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import Badge from '../components/Badge';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSocket } from '../services/socket';
import { formatDate } from '../utils/format';

export default function Alerts() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/alerts');
        setAlerts(res.data.alerts);
      } catch (err) {
        // Normal users don't have list access; show empty state instead of an error page.
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };
    load();

    const socket = getSocket();
    const onAlert = (alert) => setAlerts((prev) => [alert, ...prev]);
    socket.on('securityAlert', onAlert);
    return () => socket.off('securityAlert', onAlert);
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/alerts/${id}/status`, { status });
      setAlerts((prev) => prev.map((a) => (a._id === id ? { ...a, status } : a)));
      showToast(`Alert marked as ${status}.`, 'success');
    } catch (err) {
      showToast('Failed to update alert.', 'error');
    }
  };

  return (
    <DashboardLayout title="Security Alerts">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-semibold text-ink">Security Alerts</h2>
        <p className="text-sm text-ink-dim mt-1">
          {isAdmin ? 'Alerts generated from suspicious behavior across the system.' : 'Notifications related to your account.'}
        </p>
      </div>

      <div className="panel overflow-x-auto">
        {loading ? (
          <Loader />
        ) : alerts.length === 0 ? (
          <EmptyState title="No alerts" message="You're all clear — no suspicious activity has been flagged." />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Alert Type</th>
                <th>User</th>
                <th>Description</th>
                <th>Risk Level</th>
                <th>Timestamp</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert._id}>
                  <td className="font-medium">{alert.alertType.replaceAll('_', ' ')}</td>
                  <td className="text-ink-dim">{alert.user?.name || '—'}</td>
                  <td className="text-ink-dim max-w-xs">{alert.description}</td>
                  <td><Badge value={alert.riskLevel} /></td>
                  <td className="text-ink-dim">{formatDate(alert.createdAt)}</td>
                  <td><Badge value={alert.status} /></td>
                  {isAdmin && (
                    <td>
                      <div className="flex items-center gap-2">
                        {alert.status !== 'reviewed' && (
                          <button onClick={() => updateStatus(alert._id, 'reviewed')} className="text-xs text-accent hover:underline">
                            Mark reviewed
                          </button>
                        )}
                        {alert.status !== 'resolved' && (
                          <button onClick={() => updateStatus(alert._id, 'resolved')} className="text-xs text-risk-low hover:underline">
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
