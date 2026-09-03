import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  CalendarClock,
  FilePlus2,
  FileText,
  CreditCard,
  Bell,
  BarChart3,
  ShieldCheck,
  Activity
} from 'lucide-react';

export default function Sidebar({ activeAlertCount = 0 }) {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/ar-aging', label: 'AR Aging', icon: CalendarClock },
    { to: '/create-claim', label: 'Create Claim', icon: FilePlus2 },
    { to: '/claims', label: 'Claims Command', icon: FileText },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/alerts', label: 'Alert Center', icon: Bell, badge: activeAlertCount },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ padding: '1.25rem 1.25rem', borderBottom: '1px solid #1e293b' }}>
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', textDecoration: 'none' }}>
          <img
            src="/rcm-logo.jpg"
            alt="RCM Insight Logo"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              objectFit: 'contain',
              background: '#ffffff',
              padding: '2px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              border: '1.5px solid rgba(255, 255, 255, 0.25)',
              flexShrink: 0
            }}
          />
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff', lineHeight: 1.2 }}>
              RCM Insight
            </div>
            <div style={{ fontSize: '0.675rem', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.01em', marginTop: '0.15rem' }}>
              Command Center
            </div>
          </div>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '1rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em' }}>
          Main Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                color: isActive ? '#ffffff' : '#94a3b8',
                backgroundColor: isActive ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                fontWeight: isActive ? '600' : '500',
                fontSize: '0.875rem',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent'
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '9999px'
                }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Team / System Footer */}
      <div style={{ padding: '1.25rem', borderTop: '1px solid #1e293b', background: '#0b1120' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldCheck size={16} color="#10b981" />
          <span style={{ fontSize: '0.75rem', color: '#e2e8f0', fontWeight: '600' }}>
            XIRO TECH Hackathon
          </span>
        </div>
        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
          Version 1.0.0 • Demo Ready
        </div>
      </div>
    </aside>
  );
}
