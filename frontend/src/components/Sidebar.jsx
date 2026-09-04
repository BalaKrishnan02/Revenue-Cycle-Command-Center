import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarClock,
  FilePlus2,
  FileText,
  CreditCard,
  Bell,
  BarChart3,
  ShieldCheck,
  Building2,
  Users,
  LogOut,
  User,
  ShieldAlert,
  ArrowRightLeft
} from 'lucide-react';

export default function Sidebar({ activeAlertCount = 0 }) {
  const { user, isRcmAdmin, isInsuranceCompany, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminNavItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/ar-aging', label: 'AR Aging', icon: CalendarClock },
    { to: '/create-claim', label: 'Create Claim', icon: FilePlus2 },
    { to: '/claims', label: 'Claims Command', icon: FileText },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/alerts', label: 'Alert Center', icon: Bell, badge: activeAlertCount },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const adminManagementItems = [
    { to: '/insurance-companies', label: 'Insurance Companies', icon: Building2 },
    { to: '/admin/users', label: 'User Management', icon: Users },
  ];

  const insurerNavItems = [
    { to: '/insurance/dashboard', label: 'Payer Portal', icon: LayoutDashboard },
    { to: '/claims', label: 'Assigned Claims', icon: FileText },
    { to: '/ar-aging', label: 'AR Aging (Payer)', icon: CalendarClock },
    { to: '/payments', label: 'Remittance & Payouts', icon: CreditCard },
    { to: '/alerts', label: 'Alert Center', icon: Bell, badge: activeAlertCount },
    { to: '/analytics', label: 'Payer Analytics', icon: BarChart3 },
  ];

  const insurerAccountItems = [
    { to: '/insurance/profile', label: 'Company Profile', icon: Building2 },
  ];

  const homeRoute = isInsuranceCompany() ? '/insurance/dashboard' : '/admin/dashboard';

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ padding: '1.25rem 1.25rem', borderBottom: '1px solid #1e293b' }}>
        <NavLink to={homeRoute} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', textDecoration: 'none' }}>
          <img
            src="/rcm-logo.jpg"
            alt="RCM Insight Logo"
            style={{
              width: '44px',
              height: '44px',
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
            <div style={{ fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff', lineHeight: 1.2 }}>
              RCM Insight
            </div>
            <div style={{ fontSize: '0.675rem', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.01em', marginTop: '0.15rem' }}>
              Command Center
            </div>
          </div>
        </NavLink>
      </div>

      {/* Role Indicator Banner */}
      <div style={{
        padding: '0.75rem 1.25rem',
        background: isRcmAdmin() ? 'rgba(99, 102, 241, 0.12)' : 'rgba(16, 185, 129, 0.12)',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
          {isRcmAdmin() ? (
            <ShieldCheck size={14} color="#818cf8" style={{ flexShrink: 0 }} />
          ) : (
            <Building2 size={14} color="#34d399" style={{ flexShrink: 0 }} />
          )}
          <span style={{
            fontSize: '0.7rem',
            fontWeight: '700',
            color: isRcmAdmin() ? '#a5b4fc' : '#6ee7b7',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {isRcmAdmin() ? 'RCM ADMIN CONSOLE' : (user?.companyName || 'INSURANCE PAYER')}
          </span>
        </div>
        {user?.companyId && (
          <span style={{
            fontSize: '0.625rem',
            padding: '0.1rem 0.35rem',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            fontFamily: 'monospace',
            fontWeight: '700'
          }}>
            {user.companyId}
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ padding: '0.85rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
        <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em' }}>
          {isInsuranceCompany() ? 'Payer Operations' : 'Main Operations'}
        </div>

        {(isInsuranceCompany() ? insurerNavItems : adminNavItems).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin/dashboard' || item.to === '/insurance/dashboard'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.7rem 0.85rem',
                borderRadius: '8px',
                color: isActive ? '#ffffff' : '#94a3b8',
                backgroundColor: isActive ? 'rgba(37, 99, 235, 0.18)' : 'transparent',
                fontWeight: isActive ? '600' : '500',
                fontSize: '0.85rem',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent'
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={17} />
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

        {/* Administration Section for RCM Admin */}
        {isRcmAdmin() && (
          <>
            <div style={{ padding: '0.85rem 0.75rem 0.35rem 0.75rem', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em' }}>
              Administration
            </div>
            {adminManagementItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '8px',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    backgroundColor: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    fontWeight: isActive ? '600' : '500',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent'
                  })}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </div>
                </NavLink>
              );
            })}
          </>
        )}

        {/* Account Section for Insurance Company */}
        {isInsuranceCompany() && (
          <>
            <div style={{ padding: '0.85rem 0.75rem 0.35rem 0.75rem', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em' }}>
              Payer Account
            </div>
            {insurerAccountItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '8px',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    backgroundColor: isActive ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                    fontWeight: isActive ? '600' : '500',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent'
                  })}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </div>
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      {/* User Info & Logout Footer */}
      <div style={{ padding: '1rem', borderTop: '1px solid #1e293b', background: '#0b1120' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
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
              fontWeight: '700',
              flexShrink: 0
            }}>
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontSize: '0.8rem',
                color: '#f1f5f9',
                fontWeight: '700',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {user?.fullName || 'Active User'}
              </div>
              <div style={{
                fontSize: '0.675rem',
                color: '#94a3b8',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {user?.email || 'user@rcminsight.io'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              borderRadius: '6px',
              padding: '0.4rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut size={15} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.675rem', color: '#64748b' }}>
          <span>RCM v1.0 Enterprise</span>
          <span style={{ color: '#10b981' }}>&bull; Online</span>
        </div>
      </div>
    </aside>
  );
}
