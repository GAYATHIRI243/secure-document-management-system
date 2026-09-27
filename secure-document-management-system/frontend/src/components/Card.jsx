import React from 'react';

export default function Card({ label, value, icon, accent = 'accent', sub }) {
  const accentClass = {
    accent: 'text-accent',
    low: 'text-risk-low',
    medium: 'text-risk-medium',
    high: 'text-risk-high',
  }[accent];

  return (
    <div className="panel p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-ink-faint font-semibold">{label}</span>
        {icon && <span className={`text-lg ${accentClass}`}>{icon}</span>}
      </div>
      <div className="text-3xl font-display font-semibold text-ink">{value}</div>
      {sub && <span className="text-xs text-ink-dim">{sub}</span>}
    </div>
  );
}
