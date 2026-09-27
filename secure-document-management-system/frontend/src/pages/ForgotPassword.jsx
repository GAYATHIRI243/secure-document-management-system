import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-base-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md panel p-7">
        <h2 className="text-xl font-display font-semibold text-ink mb-1">Reset your password</h2>
        <p className="text-sm text-ink-dim mb-6">
          Enter your account email. Your administrator can help you regain access.
        </p>

        {sent ? (
          <div className="text-sm text-risk-low bg-risk-low/10 border border-risk-low/25 rounded-lg px-3 py-3">
            If an account exists for {email}, reset instructions have been sent.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              required
              className="input-field"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="btn-primary">Send reset link</button>
          </form>
        )}

        <p className="text-sm text-ink-dim text-center mt-6">
          <Link to="/login" className="text-accent hover:underline">Back to log in</Link>
        </p>
      </div>
    </div>
  );
}
