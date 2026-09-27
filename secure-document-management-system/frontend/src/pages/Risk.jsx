import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import DashboardLayout from '../layouts/DashboardLayout';
import Badge from '../components/Badge';
import ProgressBar from '../components/ProgressBar';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Card from '../components/Card';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, riskLevelFromScore } from '../utils/format';

const COLORS = { LOW: '#34D399', MEDIUM: '#F5A623', HIGH: '#F0475C' };

// Shows the live verdict from the Isolation Forest + One-Class SVM
// microservice for a single behavior snapshot.
function MLStatusPanel({ status, className = '' }) {
  if (!status) return null;

  if (!status.available) {
    return (
      <div className={`panel p-5 ${className}`}>
        <h3 className="font-display font-semibold text-ink mb-1">ML anomaly detection</h3>
        <p className="text-xs text-ink-faint">
          ML service unavailable{status.reason ? ` (${status.reason})` : ''}. Start it with{' '}
          <code className="text-accent">uvicorn main:app --port 8001</code> inside <code>ml-service/</code>.
        </p>
      </div>
    );
  }

  const models = [
    { name: 'Isolation Forest', result: status.isolation_forest },
    { name: 'One-Class SVM', result: status.one_class_svm },
  ];

  return (
    <div className={`panel p-5 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold text-ink">ML anomaly detection</h3>
        <Badge value={status.combined_is_anomaly ? 'HIGH' : 'LOW'} />
      </div>
      <div className="flex flex-col gap-2 mb-3">
        {models.map((m) => (
          <div key={m.name} className="flex items-center justify-between text-sm">
            <span className="text-ink-dim">{m.name}</span>
            <span className={m.result.is_anomaly ? 'text-risk-high' : 'text-risk-low'}>
              {m.result.is_anomaly ? 'Anomaly detected' : 'Normal'}{' '}
              <span className="text-ink-faint font-mono text-xs">({m.result.score.toFixed(3)})</span>
            </span>
          </div>
        ))}
      </div>
      {status.snapshot && (
        <div className="text-xs text-ink-faint font-mono border-t border-line pt-2">
          {Object.entries(status.snapshot).map(([k, v]) => `${k}=${v}`).join('  ·  ')}
        </div>
      )}
    </div>
  );
}

export default function Risk() {
  const { user } = useAuth();
  const [overview, setOverview] = useState([]);
  const [distribution, setDistribution] = useState(null);
  const [myRisk, setMyRisk] = useState(null);
  const [myMlStatus, setMyMlStatus] = useState(null);
  const [mlPanel, setMlPanel] = useState({ userId: null, data: null, loading: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (user?.role === 'admin') {
          const res = await api.get('/risk');
          setOverview(res.data.overview);
          setDistribution(res.data.distribution);
        } else {
          const [riskRes, mlRes] = await Promise.all([
            api.get('/risk/me'),
            api.get('/risk/me/ml-status').catch(() => ({ data: { available: false } })),
          ]);
          setMyRisk(riskRes.data);
          setMyMlStatus(mlRes.data);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const inspectUser = async (userId) => {
    if (mlPanel.userId === userId) {
      setMlPanel({ userId: null, data: null, loading: false });
      return;
    }
    setMlPanel({ userId, data: null, loading: true });
    try {
      const res = await api.get(`/risk/${userId}/ml-status`);
      setMlPanel({ userId, data: res.data, loading: false });
    } catch (err) {
      setMlPanel({ userId, data: { available: false, reason: 'Request failed' }, loading: false });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Risk Detection">
        <Loader />
      </DashboardLayout>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <DashboardLayout title="Risk Detection">
        <div className="mb-6">
          <h2 className="text-2xl font-display font-semibold text-ink">Your Risk Profile</h2>
          <p className="text-sm text-ink-dim mt-1">A live view of your account's risk score.</p>
        </div>
        <div className="panel p-6 max-w-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-ink-dim">Score</span>
            <Badge value={myRisk?.riskLevel} />
          </div>
          <ProgressBar value={myRisk?.riskScore || 0} level={myRisk?.riskLevel} />
          <p className="text-3xl font-display font-semibold text-ink mt-4">{myRisk?.riskScore}/100</p>
          <p className="text-xs text-ink-faint mt-2">
            {myRisk?.suspiciousActivityCount} suspicious event{myRisk?.suspiciousActivityCount === 1 ? '' : 's'} on record.
          </p>
        </div>

        <MLStatusPanel status={myMlStatus} className="max-w-md mt-6" />
      </DashboardLayout>
    );
  }

  const pieData = distribution
    ? [
        { name: 'Low', value: distribution.LOW, color: COLORS.LOW },
        { name: 'Medium', value: distribution.MEDIUM, color: COLORS.MEDIUM },
        { name: 'High', value: distribution.HIGH, color: COLORS.HIGH },
      ]
    : [];

  return (
    <DashboardLayout title="Risk Detection">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-semibold text-ink">Risk Detection</h2>
        <p className="text-sm text-ink-dim mt-1">Behavioral risk scoring across all users.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card label="Low Risk Users" value={distribution?.LOW ?? 0} accent="low" icon="◉" />
        <Card label="Medium Risk Users" value={distribution?.MEDIUM ?? 0} accent="medium" icon="◉" />
        <Card label="High Risk Users" value={distribution?.HIGH ?? 0} accent="high" icon="◉" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="panel p-5">
          <h3 className="font-display font-semibold text-ink mb-4">Risk distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#111A2E', border: '1px solid #243046', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 panel overflow-x-auto">
          {overview.length === 0 ? (
            <EmptyState title="No users to assess yet" />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Risk Score</th>
                  <th>Level</th>
                  <th>Suspicious Events</th>
                  <th>Last Activity</th>
                  <th>ML Check</th>
                </tr>
              </thead>
              <tbody>
                {overview.map((u) => (
                  <React.Fragment key={u.userId}>
                    <tr>
                      <td>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-ink-faint">{u.email}</div>
                      </td>
                      <td className="w-40">
                        <ProgressBar value={u.riskScore} level={u.riskLevel} />
                      </td>
                      <td><Badge value={u.riskLevel} /></td>
                      <td className="text-ink-dim">{u.suspiciousActivityCount}</td>
                      <td className="text-ink-dim">{formatDate(u.lastActivity)}</td>
                      <td>
                        <button onClick={() => inspectUser(u.userId)} className="text-xs text-accent hover:underline">
                          {mlPanel.userId === u.userId ? 'Hide' : 'Run ML check'}
                        </button>
                      </td>
                    </tr>
                    {mlPanel.userId === u.userId && (
                      <tr>
                        <td colSpan={6} className="bg-base-800/40">
                          {mlPanel.loading ? (
                            <Loader label="Classifying behavior…" />
                          ) : (
                            <MLStatusPanel status={mlPanel.data} className="my-2" />
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
