import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { activityLabel, timeAgo } from '../utils/format';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [highRiskUsers, setHighRiskUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    try {
      const [usersRes, docsRes, activityRes, alertRes, riskRes] = await Promise.all([
        api.get('/users'),
        api.get('/documents'),
        api.get('/activities/recent'),
        api.get('/alerts'),
        api.get('/risk'),
      ]);

      const users = usersRes.data.users;
      const activeUsers = users.filter((u) => u.status === 'active').length;
      const suspiciousActivities = activityRes.data.activities.filter((a) =>
        ['FAILED_LOGIN', 'UNAUTHORIZED_ACCESS'].includes(a.activityType)
      ).length;

      setStats({
        totalUsers: users.length,
        activeUsers,
        totalDocuments: docsRes.data.documents.length,
        suspiciousActivities,
        highRiskUsers: riskRes.data.distribution.HIGH,
        securityAlerts: alertRes.data.alerts.filter((a) => a.status === 'new').length,
      });

      setActivities(activityRes.data.activities.slice(0, 8));
      setAlerts(alertRes.data.alerts.slice(0, 6));
      setHighRiskUsers(riskRes.data.overview.filter((u) => u.riskLevel === 'HIGH').slice(0, 6));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();

    const socket = getSocket();
    const refresh = () => loadAll();
    socket.on('activityCreated', refresh);
    socket.on('securityAlert', refresh);
    socket.on('riskUpdated', refresh);
    return () => {
      socket.off('activityCreated', refresh);
      socket.off('securityAlert', refresh);
      socket.off('riskUpdated', refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Admin Overview">
        <Loader />
      </DashboardLayout>
    );
  }

  const chartData = [
    { name: 'Users', value: stats.totalUsers },
    { name: 'Docs', value: stats.totalDocuments },
    { name: 'Suspicious', value: stats.suspiciousActivities },
    { name: 'High Risk', value: stats.highRiskUsers },
    { name: 'Alerts', value: stats.securityAlerts },
  ];

  return (
    <DashboardLayout title="Admin Overview">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-semibold text-ink">System Overview</h2>
        <p className="text-sm text-ink-dim mt-1">Live snapshot of users, documents, and security posture.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <Card label="Total Users" value={stats.totalUsers} icon="☺" />
        <Card label="Active Users" value={stats.activeUsers} icon="●" accent="low" />
        <Card label="Total Documents" value={stats.totalDocuments} icon="▤" />
        <Card label="Suspicious Activities" value={stats.suspiciousActivities} icon="◭" accent="medium" />
        <Card label="High Risk Users" value={stats.highRiskUsers} icon="◉" accent="high" />
        <Card label="Security Alerts" value={stats.securityAlerts} icon="⚠" accent="high" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1 panel p-5">
          <h3 className="font-display font-semibold text-ink mb-4">System activity chart</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="#182338" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#5C6A88', fontSize: 11 }} axisLine={{ stroke: '#243046' }} tickLine={false} />
                <YAxis tick={{ fill: '#5C6A88', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111A2E', border: '1px solid #243046', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="#22D3EE" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-5">
          <h3 className="font-display font-semibold text-ink mb-4">High risk users</h3>
          {highRiskUsers.length === 0 ? (
            <p className="text-xs text-ink-faint">No high risk users right now.</p>
          ) : (
            <div className="flex flex-col divide-y divide-line">
              {highRiskUsers.map((u) => (
                <div key={u.userId} className="py-2.5 flex items-center justify-between">
                  <span className="text-sm text-ink">{u.name}</span>
                  <Badge value="HIGH" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel p-5">
          <h3 className="font-display font-semibold text-ink mb-4">Recent alerts</h3>
          {alerts.length === 0 ? (
            <p className="text-xs text-ink-faint">No alerts recorded.</p>
          ) : (
            <div className="flex flex-col divide-y divide-line">
              {alerts.map((a) => (
                <div key={a._id} className="py-2.5 flex items-center justify-between gap-2">
                  <span className="text-sm text-ink truncate">{a.alertType.replaceAll('_', ' ')}</span>
                  <Badge value={a.riskLevel} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="panel p-5">
        <h3 className="font-display font-semibold text-ink mb-4">Recent activity</h3>
        {activities.length === 0 ? (
          <EmptyState title="No activity yet" />
        ) : (
          <div className="flex flex-col divide-y divide-line">
            {activities.map((a) => (
              <div key={a._id} className="py-3 flex items-center justify-between gap-3">
                <p className="text-sm text-ink">
                  <span className="font-medium">{a.userName}</span> — {activityLabel(a.activityType)}
                </p>
                <span className="text-xs text-ink-faint whitespace-nowrap">{timeAgo(a.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
