import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Sun, Moon, Monitor, LogOut, User, Briefcase } from 'lucide-react';

export const BrandHeader = ({ onNavigateRecruiter, onNavigateCandidate }) => {
  const { themeMode, setThemeMode, activeTheme } = useTheme();
  const { user, logout, isRecruiter, isCandidate } = useAuth();

  return (
    <header className="brand-header">
      <div className="brand-header-left">
        <div className="brand-symbol">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <div className="brand-text">
          <span className="brand-name">Aura · Talent</span>
          <span className="brand-tagline">AI Interview Platform</span>
        </div>
      </div>

      <div className="brand-header-right" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Navigation Switch between Candidate and Recruiter views if authenticated */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
            {onNavigateCandidate && (
              <button
                type="button"
                onClick={onNavigateCandidate}
                className="btn-header-link"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <User size={13} />
                Candidate
              </button>
            )}
            {onNavigateRecruiter && (
              <button
                type="button"
                onClick={onNavigateRecruiter}
                className="btn-header-link"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <Briefcase size={13} />
                Recruiter
              </button>
            )}
          </div>
        )}

        {/* Theme Mode Selector (Dark, Light, System) */}
        <div
          className="theme-selector-pill"
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 20,
            padding: '2px 4px',
            gap: 2
          }}
        >
          <button
            type="button"
            title="Dark Mode"
            onClick={() => setThemeMode('dark')}
            style={{
              background: themeMode === 'dark' ? 'var(--accent-soft)' : 'none',
              color: themeMode === 'dark' ? 'var(--accent)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 16,
              padding: '4px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              fontSize: 12,
              gap: 4
            }}
          >
            <Moon size={12} />
          </button>
          <button
            type="button"
            title="Light Mode"
            onClick={() => setThemeMode('light')}
            style={{
              background: themeMode === 'light' ? 'var(--accent-soft)' : 'none',
              color: themeMode === 'light' ? 'var(--accent)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 16,
              padding: '4px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              fontSize: 12,
              gap: 4
            }}
          >
            <Sun size={12} />
          </button>
          <button
            type="button"
            title="System Preference"
            onClick={() => setThemeMode('system')}
            style={{
              background: themeMode === 'system' ? 'var(--accent-soft)' : 'none',
              color: themeMode === 'system' ? 'var(--accent)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 16,
              padding: '4px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              fontSize: 12,
              gap: 4
            }}
          >
            <Monitor size={12} />
          </button>
        </div>

        {/* User Session Info / Logout */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 12,
                background: user.role === 'RECRUITER' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: user.role === 'RECRUITER' ? 'var(--accent-brass)' : 'var(--status-emerald)',
                border: `1px solid ${user.role === 'RECRUITER' ? 'rgba(212, 175, 55, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.4px'
              }}
            >
              {user.role}
            </span>
            <button
              type="button"
              onClick={logout}
              title="Log out"
              style={{
                background: 'none',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '4px 8px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12
              }}
            >
              <LogOut size={12} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
