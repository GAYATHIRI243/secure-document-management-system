import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/Card';
import Badge from '../components/Badge';
import ProgressBar from '../components/ProgressBar';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { activityLabel, timeAgo } from '../utils/format';

export default function UserDashboard() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [docsRes, activitiesRes, riskRes] = await Promise.all([
          api.get('/documents'),
          api.get('/activities'),
          api.get('/risk/me'),
        ]);
        setDocuments(docsRes.data.documents);
        setActivities(activitiesRes.data.activities.slice(0, 6));
        setRisk(riskRes.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const today = new Date().toDateString();
  const uploadedToday = documents.filter((d) => new Date(d.uploadedAt).toDateString() === today).length;

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <Loader />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-semibold text-ink">Welcome back, {user?.name?.split(' ')[0]}</h2>
        <p className="text-sm text-ink-dim mt-1">Here's what's happening with your documents today.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card label="Total Documents" value={documents.length} icon="▤" />
        <Card label="Uploaded Today" value={uploadedToday} icon="↥" accent="low" />
        <Card label="Recent Activities" value={activities.length} icon="≡" />
        <Card
          label="Current Risk Score"
          value={risk ? `${risk.riskScore}/100` : '—'}
          icon="◉"
          accent={risk?.riskLevel === 'HIGH' ? 'high' : risk?.riskLevel === 'MEDIUM' ? 'medium' : 'low'}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 panel p-5">
          <h3 className="font-display font-semibold text-ink mb-4">Recent activity</h3>
          {activities.length === 0 ? (
            <EmptyState title="No activity yet" message="Upload a document to see activity here." />
          ) : (
            <div className="flex flex-col divide-y divide-line">
              {activities.map((a) => (
                <div key={a._id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-ink">{activityLabel(a.activityType)}</p>
                    {a.document && <p className="text-xs text-ink-faint">{a.document.documentName}</p>}
                  </div>
                  <span className="text-xs text-ink-faint whitespace-nowrap">{timeAgo(a.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel p-5">
          <h3 className="font-display font-semibold text-ink mb-4">Your risk profile</h3>
          {risk && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-ink-dim">Score</span>
                <Badge value={risk.riskLevel} />
              </div>
              <ProgressBar value={risk.riskScore} level={risk.riskLevel} />
              <p className="text-xs text-ink-faint mt-3">
                {risk.suspiciousActivityCount} suspicious event{risk.suspiciousActivityCount === 1 ? '' : 's'} on record.
              </p>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
