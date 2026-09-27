import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-base-950 flex items-center justify-center text-center px-4">
      <div>
        <h1 className="text-5xl font-display font-semibold text-ink mb-3">404</h1>
        <p className="text-ink-dim mb-6">This page doesn't exist.</p>
        <Link to="/" className="btn-primary">Back to home</Link>
      </div>
    </div>
  );
}
