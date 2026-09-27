import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const userLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '◈' },
  { to: '/documents', label: 'Documents', icon: '▤' },
  { to: '/activities', label: 'My Activity', icon: '≡' },
  { to: '/risk', label: 'Risk', icon: '◉' },
  { to: '/alerts', label: 'Alerts', icon: '⚠' },
];

const adminLinks = [
  { to: '/admin', label: 'Admin Overview', icon: '◈' },
  { to: '/admin/users', label: 'User Management', icon: '☺' },
  { to: '/documents', label: 'Documents', icon: '▤' },
  { to: '/activities', label: 'Activity Logs', icon: '≡' },
  { to: '/monitoring', label: 'Live Monitoring', icon: '◍' },
  { to: '/risk', label: 'Risk Detection', icon: '◉' },
  { to: '/alerts', label: 'Security Alerts', icon: '⚠' },
  { to: '/reports', label: 'Reports', icon: '▥' },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const { user } = useAuth();
  const links = user?.role === 'admin' ? adminLinks : userLinks;

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-base-900 border-r border-line z-40 flex flex-col transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-5 py-5 border-b border-line flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent font-display font-bold">
            S
          </div>
          <div className="leading-tight">
            <div className="text-sm font-display font-semibold text-ink">SDMS</div>
            <div className="text-[10px] text-ink-faint uppercase tracking-wide">Secure Docs</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/admin'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent border border-accent/25'
                    : 'text-ink-dim hover:text-ink hover:bg-base-800 border border-transparent'
                }`
              }
            >
              <span className="w-4 text-center">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-line text-[11px] text-ink-faint">
          Signed in as <span className="text-ink-dim">{user?.role}</span>
        </div>
      </aside>
    </>
  );
}
