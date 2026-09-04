import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        color: '#64748b'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spin" style={{
            width: '36px',
            height: '36px',
            border: '3px solid #e2e8f0',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            margin: '0 auto 1rem'
          }} />
          <p style={{ fontWeight: 600 }}>Verifying session & permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const isCompany = user.role === 'INSURANCE_COMPANY';
    const returnPath = isCompany ? '/insurance/dashboard' : '/admin/dashboard';

    return (
      <div style={{
        maxWidth: '560px',
        margin: '4rem auto',
        padding: '2.5rem',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        border: '1px solid #fee2e2',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#fef2f2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          color: '#ef4444'
        }}>
          <ShieldAlert size={36} />
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#991b1b', marginBottom: '0.75rem' }}>
          Access Denied
        </h2>

        <p style={{ color: '#4b5563', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          You are currently authenticated as <strong>{isCompany ? user.companyName : user.name}</strong> ({user.role}).
          This specific resource is restricted to authorized roles.
        </p>

        <div style={{
          background: '#f8fafc',
          padding: '0.875rem',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          fontSize: '0.825rem',
          color: '#64748b',
          marginBottom: '2rem'
        }}>
          Required Role: <span style={{ fontWeight: 700, color: '#1e293b' }}>{allowedRoles.join(' or ')}</span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(returnPath)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={16} />
            <span>Return to Your Dashboard</span>
          </button>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <LogOut size={16} />
            <span>Switch Account</span>
          </button>
        </div>
      </div>
    );
  }

  return children;
}
