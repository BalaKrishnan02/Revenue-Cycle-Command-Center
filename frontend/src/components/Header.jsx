import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Bell, RefreshCw, Cpu } from 'lucide-react';

export default function Header({ onRefresh, isRefreshing = false, activeAlertCount = 0 }) {
  return (
    <header className="top-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <img
          src="/rcm-logo.jpg"
          alt="RCM Insight"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            objectFit: 'contain',
            background: '#ffffff',
            padding: '2px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            flexShrink: 0
          }}
        />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--navy-dark)', margin: 0 }}>
              Revenue Cycle Command Center
            </h2>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              fontSize: '0.7rem',
              fontWeight: '700'
            }}>
              <span className="live-dot" /> LIVE ENGINE
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500', margin: 0 }}>
            Predict • Prevent • Monitor • Improve
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Refresh Action */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary btn-sm"
            title="Refresh Real-Time Data"
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
          </button>
        )}

        {/* Alerts Link */}
        <Link to="/alerts" className="btn btn-secondary btn-sm" style={{ position: 'relative' }}>
          <Bell size={14} />
          <span>Alerts</span>
          {activeAlertCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: '800',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {activeAlertCount}
            </span>
          )}
        </Link>

        {/* Create Claim Shortcut */}
        <Link to="/create-claim" className="btn btn-primary btn-sm">
          <Plus size={15} />
          <span>New Claim</span>
        </Link>
      </div>
    </header>
  );
}
