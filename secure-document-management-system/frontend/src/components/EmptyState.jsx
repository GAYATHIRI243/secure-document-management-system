import React from 'react';

export default function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-2 py-16 px-6">
      <div className="w-12 h-12 rounded-xl bg-base-700 border border-line flex items-center justify-center text-ink-faint text-xl mb-2">
        ⎯
      </div>
      <h4 className="text-ink font-display font-semibold">{title}</h4>
      {message && <p className="text-sm text-ink-dim max-w-sm">{message}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
