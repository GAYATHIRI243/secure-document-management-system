import React, { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import Badge from '../components/Badge';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { activityLabel, timeAgo, riskLevelFromScore } from '../utils/format';

const SUSPICIOUS_TYPES = ['FAILED_LOGIN', 'UNAUTHORIZED_ACCESS'];

export default function Monitoring() {
  const [feed, setFeed] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [mlFeed, setMlFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const activeUsers = useRef(new Map());
  const [activeUserList, setActiveUserList] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [activityRes, alertRes] = await Promise.all([
          api.get('/activities/recent'),
          api.get('/alerts'),
        ]);
        setFeed(activityRes.data.activities);
        setAlerts(alertRes.data.alerts.slice(0, 8));
      } finally {
        setLoading(false);
      }
    };
    load();

    const socket = getSocket();
    setConnected(socket.connected);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onActivity = (activity) => {
      setFeed((prev) => [activity, ...prev].slice(0, 50));
      activeUsers.current.set(activity.userName, Date.now());
      setActiveUserList(Array.from(activeUsers.current.keys()));
    };

    const onAlert = (alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 20));
    };

    const onMLClassification = (result) => {
      setMlFeed((prev) => [result, ...prev].slice(0, 30));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('activityCreated', onActivity);
    socket.on('securityAlert', onAlert);
    socket.on('mlClassification', onMLClassification);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('activityCreated', onActivity);
      socket.off('securityAlert', onAlert);
      socket.off('mlClassification', onMLClassification);
    };
  }, []);

  const suspicious = feed.filter((a) => SUSPICIOUS_TYPES.includes(a.activityType));

  return (
    <DashboardLayout title="Real-Time Monitoring">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-semibold text-ink">Real-Time Monitoring</h2>
          <p className="text-sm text-ink-dim mt-1">Live activity across the system, streamed via Socket.IO.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-risk-low animate-pulseLine' : 'bg-risk-high'}`} />
          {connected ? 'Live' : 'Disconnected'}
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 panel p-5">
            <h3 className="font-display font-semibold text-ink mb-4">Live activity feed</h3>
            {feed.length === 0 ? (
              <EmptyState title="Waiting for activity…" message="Actions will appear here the moment they happen." />
            ) : (
              <div className="flex flex-col divide-y divide-line max-h-[520px] overflow-y-auto">
                {feed.map((a) => (
                  <div key={a._id} className="py-3 flex items-center justify-between gap-3 animate-rowIn">
                    <div className="min-w-0">
                      <p className="text-sm text-ink truncate">
                        <span className="font-medium">{a.userName}</span> — {activityLabel(a.activityType)}
                        {a.document && <span className="text-ink-faint"> · {a.document.documentName}</span>}
                      </p>
                      <p className="text-xs text-ink-faint font-mono">{a.ipAddress}</p>
                    </div>
                    <span className="text-xs text-ink-faint whitespace-nowrap">{timeAgo(a.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div className="panel p-5">
              <h3 className="font-display font-semibold text-ink mb-4">Active users</h3>
              {activeUserList.length === 0 ? (
                <p className="text-xs text-ink-faint">No live sessions detected yet this window.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activeUserList.map((name) => (
                    <span key={name} className="badge badge-neutral">{name}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="panel p-5">
              <h3 className="font-display font-semibold text-ink mb-4">Suspicious activity</h3>
              {suspicious.length === 0 ? (
                <p className="text-xs text-ink-faint">No suspicious activity detected.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {suspicious.slice(0, 6).map((a) => (
                    <div key={a._id} className="flex items-start justify-between gap-2">
                      <p className="text-sm text-ink">{a.userName} — {activityLabel(a.activityType)}</p>
                      <Badge value={riskLevelFromScore(a.riskScore || 30)} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-ink">ML anomaly detection</h3>
                <span className="text-[10px] font-mono text-ink-faint uppercase tracking-wide">Isolation Forest · One-Class SVM</span>
              </div>
              {mlFeed.length === 0 ? (
                <p className="text-xs text-ink-faint">
                  Waiting for classifications… triggers on login, upload, and download.
                </p>
              ) : (
                <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
                  {mlFeed.map((m, idx) => (
                    <div key={`${m.userId}-${m.timestamp}-${idx}`} className="animate-rowIn">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-ink truncate">{m.userName}</span>
                        <Badge value={m.combined_is_anomaly ? 'HIGH' : 'LOW'} />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] font-mono">
                        <span className={m.isolation_forest?.is_anomaly ? 'text-risk-high' : 'text-ink-faint'}>
                          IF: {m.isolation_forest?.is_anomaly ? 'anomaly' : 'normal'}
                        </span>
                        <span className={m.one_class_svm?.is_anomaly ? 'text-risk-high' : 'text-ink-faint'}>
                          SVM: {m.one_class_svm?.is_anomaly ? 'anomaly' : 'normal'}
                        </span>
                        <span className="text-ink-faint ml-auto">{timeAgo(m.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel p-5">
              <h3 className="font-display font-semibold text-ink mb-4">Security alerts</h3>
              {alerts.length === 0 ? (
                <p className="text-xs text-ink-faint">No active alerts.</p>
              ) : (
                <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
                  {alerts.map((alert) => (
                    <div key={alert._id} className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-ink">{alert.alertType.replaceAll('_', ' ')}</p>
                        <p className="text-xs text-ink-faint">{alert.user?.name}</p>
                      </div>
                      <Badge value={alert.riskLevel} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
