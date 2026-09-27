import React from 'react';
import { Link } from 'react-router-dom';

const FEATURES = [
  { title: 'Secure Document Storage', desc: 'Every file is stored with strict ownership rules and access checks on every request.', icon: '▤' },
  { title: 'Role-Based Access Control', desc: 'Administrators and users see exactly what they are permitted to see — nothing more.', icon: '◈' },
  { title: 'Real-Time Activity Monitoring', desc: 'Every login, upload, view, and download streams live to the monitoring console.', icon: '◍' },
  { title: 'Suspicious Behavior Detection', desc: 'Failed logins, unauthorized access, and rapid actions are flagged automatically.', icon: '◭' },
  { title: 'Risk Score Analysis', desc: 'Each user carries a live 0–100 risk score, recalculated as behavior changes.', icon: '◉' },
  { title: 'Security Alerts', desc: 'High-risk events generate alerts your admins can review and resolve.', icon: '⚠' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-base-950 text-ink">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent font-display font-bold">S</div>
          <span className="font-display font-semibold">SDMS</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-secondary text-sm">Log in</Link>
          <Link to="/register" className="btn-primary text-sm">Create account</Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-accent border border-accent/25 bg-accent/5 rounded-full px-3 py-1 mb-6 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulseLine" />
          live risk monitoring engine
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold leading-tight mb-6">
          Secure Document<br />Management System
        </h1>
        <p className="text-lg text-ink-dim max-w-2xl mx-auto mb-10">
          Securely manage your documents with intelligent real-time user behavior monitoring.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register" className="btn-primary">Get started</Link>
          <Link to="/login" className="btn-secondary">Log in</Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="panel p-6">
              <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/25 flex items-center justify-center text-accent text-lg mb-4">
                {f.icon}
              </div>
              <h3 className="font-display font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-ink-dim">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-xs text-ink-faint">
        Secure Document Management System — built for internal document security operations.
      </footer>
    </div>
  );
}
