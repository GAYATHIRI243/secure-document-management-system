import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import Badge from '../components/Badge';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import { activityLabel, formatDate, riskLevelFromScore } from '../utils/format';

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/activities')
      .then((res) => setActivities(res.data.activities))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Activity History">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-semibold text-ink">Activity History</h2>
        <p className="text-sm text-ink-dim mt-1">A record of important actions on the system.</p>
      </div>

      <div className="panel overflow-x-auto">
        {loading ? (
          <Loader />
        ) : activities.length === 0 ? (
          <EmptyState title="No activity yet" />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Activity</th>
                <th>Document</th>
                <th>Timestamp</th>
                <th>IP Address</th>
                <th>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a) => (
                <tr key={a._id}>
                  <td className="font-medium">{a.userName}</td>
                  <td className="text-ink-dim">{activityLabel(a.activityType)}</td>
                  <td className="text-ink-dim">{a.document?.documentName || '—'}</td>
                  <td className="text-ink-dim">{formatDate(a.timestamp)}</td>
                  <td className="text-ink-dim font-mono text-xs">{a.ipAddress}</td>
                  <td><Badge value={riskLevelFromScore(a.riskScore || 0)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
