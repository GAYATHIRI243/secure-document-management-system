import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Badge from './Badge';
import { riskLevelFromScore } from '../utils/format';

export default function Topbar({ onMenuClick, title }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 bg-base-900/90 backdrop-blur border-b border-line px-4 lg:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden text-ink-dim hover:text-ink text-xl"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          ☰
        </button>
        <h1 className="text-base font-display font-semibold text-ink">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-ink-dim">Risk</span>
            <Badge value={riskLevelFromScore(user.riskScore || 0)} />
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-base-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent text-sm font-semibold">
              {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
            </div>
            <span className="hidden sm:block text-sm text-ink-dim">{user?.name}</span>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-44 panel py-1 z-20">
                <div className="px-3 py-2 text-xs text-ink-faint border-b border-line">{user?.email}</div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-risk-high hover:bg-base-800 transition-colors"
                >
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
