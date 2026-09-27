import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/Card';
import Loader from '../components/Loader';
import api from '../services/api';

const RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Range' },
];

export default function Reports() {
  const [range, setRange] = useState('7d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = { range };
      if (range === 'custom' && from && to) {
        params.from = from;
        params.to = to;
      }
      const res = await api.get('/reports', { params });
      setReport(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (range !== 'custom') load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  return (
    <DashboardLayout title="Reports">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-semibold text-ink">Reports</h2>
        <p className="text-sm text-ink-dim mt-1">System-wide statistics for a selected time period.</p>
      </div>

      <div className="panel p-4 mb-6 flex flex-wrap items-end gap-3">
        <div className="flex gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                range === opt.value
                  ? 'border-accent/40 bg-accent/10 text-accent'
                  : 'border-line text-ink-dim hover:text-ink'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {range === 'custom' && (
          <div className="flex items-end gap-3">
            <div>
              <label className="text-xs text-ink-dim block mb-1">From</label>
              <input type="date" className="input-field" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-ink-dim block mb-1">To</label>
              <input type="date" className="input-field" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={load} disabled={!from || !to}>Apply</button>
          </div>
        )}
      </div>

      {loading || !report ? (
        <Loader />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card label="Total Users" value={report.totalUsers} icon="☺" />
          <Card label="Total Documents" value={report.totalDocuments} icon="▤" />
          <Card label="Documents In Range" value={report.documentsInRange} icon="↥" accent="low" />
          <Card label="Total Activities" value={report.totalActivities} icon="≡" />
          <Card label="Suspicious Activities" value={report.suspiciousActivities} icon="◭" accent="medium" />
          <Card label="High-Risk Users" value={report.highRiskUsers} icon="◉" accent="high" />
          <Card label="Alerts Generated" value={report.alertsInRange} icon="⚠" accent="high" />
        </div>
      )}
    </DashboardLayout>
  );
}
