import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Full name is required.';
    if (!EMAIL_REGEX.test(form.email)) next.email = 'Enter a valid email address.';
    if (form.password.length < 6) next.password = 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password);
      showToast('Account created. Please log in.', 'success');
      navigate('/login');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent font-display font-bold">S</div>
            <span className="font-display font-semibold text-ink">SDMS</span>
          </Link>
        </div>

        <div className="panel p-7">
          <h2 className="text-xl font-display font-semibold text-ink mb-1">Create your account</h2>
          <p className="text-sm text-ink-dim mb-6">Get a secure space to store and track your documents.</p>

          {serverError && (
            <div className="mb-4 text-sm text-risk-high bg-risk-high/10 border border-risk-high/25 rounded-lg px-3 py-2">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-ink-dim block mb-1.5">Full name</label>
              <input
                className="input-field"
                placeholder="Jordan Lee"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <p className="text-xs text-risk-high mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-ink-dim block mb-1.5">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <p className="text-xs text-risk-high mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-ink-dim block mb-1.5">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {errors.password && <p className="text-xs text-risk-high mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-ink-dim block mb-1.5">Confirm password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              />
              {errors.confirmPassword && <p className="text-xs text-risk-high mt-1">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={submitting} className="btn-primary mt-2">
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-ink-dim text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
