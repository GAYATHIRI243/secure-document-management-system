import React from 'react';

export default function ProgressBar({ value = 0, level }) {
  const colorClass = {
    LOW: 'bg-risk-low',
    MEDIUM: 'bg-risk-medium',
    HIGH: 'bg-risk-high',
  }[level] || 'bg-accent';

  return (
    <div className="w-full h-2 rounded-full bg-base-700 overflow-hidden">
      <div
        className={`h-full rounded-full ${colorClass} transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
