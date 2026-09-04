import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Bell,
  RefreshCw,
  Cpu,
  Building2,
  ShieldCheck,
  LogOut,
  User
} from 'lucide-react';

export default function Header({ onRefresh, isRefreshing = false, activeAlertCount = 0 }) {
  const { user, isRcmAdmin, isInsuranceCompany, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="top-header" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.85rem 1.75rem',
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
    }}>
      {/* Brand & Context Title */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--navy-dark)', margin: 0 }}>
              {isInsuranceCompany() ? 'Payer Adjudication Portal' : 'Revenue Cycle Command Center'}
            </h2>

            {isInsuranceCompany() ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#065f46',
                fontSize: '0.7rem',
                fontWeight: '700',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <Building2 size={12} /> {user?.companyName || 'Verified Payer'}
              </span>
            ) : (
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
            )}
          </div>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: '500', margin: 0 }}>
            {isInsuranceCompany()
              ? `Tenant Scope: ${user?.companyId || 'INS001'} • Adjudicate • Authorize • Settle Claims`
              : 'Predict • Prevent • Monitor • Improve Enterprise Receivables'}
          </p>
        </div>
      </div>

      {/* Header Actions & Profile */}
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

        {/* Role Specific Main Action */}
        {isRcmAdmin() ? (
          <Link to="/create-claim" className="btn btn-primary btn-sm">
            <Plus size={15} />
            <span>New Claim</span>
          </Link>
        ) : (
          <Link to="/insurance/profile" className="btn btn-primary btn-sm" style={{ background: '#059669', borderColor: '#059669' }}>
            <Building2 size={15} />
            <span>Payer Profile</span>
          </Link>
        )}

        {/* User Identity Chip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          paddingLeft: '0.75rem',
          borderLeft: '1px solid #e2e8f0'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: isRcmAdmin() ? '#4f46e5' : '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '0.8rem',
            fontWeight: '700'
          }}>
            {user?.fullName?.charAt(0) || 'U'}
          </div>

          <div style={{ display: 'none', mdDisplay: 'block' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.1 }}>
              {user?.fullName || 'User'}
            </div>
            <div style={{ fontSize: '0.675rem', color: '#64748b' }}>
              {isRcmAdmin() ? 'RCM Admin' : (user?.companyId || 'Insurer')}
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'color 0.15s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
