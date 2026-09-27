import React from 'react';

export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-dim">
      <div className="w-8 h-8 rounded-full border-2 border-line border-t-accent animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
