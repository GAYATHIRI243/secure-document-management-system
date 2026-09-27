import React from 'react';

const VARIANT_CLASS = {
  LOW: 'badge-low',
  MEDIUM: 'badge-medium',
  HIGH: 'badge-high',
  active: 'badge-low',
  inactive: 'badge-neutral',
  blocked: 'badge-high',
  new: 'badge-high',
  reviewed: 'badge-medium',
  resolved: 'badge-low',
};

export default function Badge({ value, dot = true }) {
  const className = VARIANT_CLASS[value] || 'badge-neutral';
  return (
    <span className={`badge ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {String(value)}
    </span>
  );
}
