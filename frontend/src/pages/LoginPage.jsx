import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Zap,
  CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Selected role tab: 'RCM_ADMIN' or 'INSURANCE_COMPANY'
  const [selectedRole, setSelectedRole] = useState('RCM_ADMIN');
  const [email, setEmail] = useState('admin@rcminsight.demo');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick 1-Click Demo Fill
  const handleSelectDemoAccount = (role, demoEmail, demoPass) => {
    setSelectedRole(role);
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setErrorMsg('');
    if (role === 'RCM_ADMIN') {
      setEmail('admin@rcminsight.demo');
      setPassword('admin123');
    } else {
      setEmail('nova@rcminsight.demo');
      setPassword('nova123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const user = await login(email, password);

      // Role-based redirection per requirement 33
      if (user.role === 'RCM_ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'INSURANCE_COMPANY') {
        navigate('/insurance/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid credentials or account suspended.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0b1329 0%, #0f172a 50%, #1e293b 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.75rem' }}>
          <img
            src="/rcm-logo.jpg"
            alt="RCM Insight Logo"
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '12px',
              objectFit: 'contain',
              background: '#ffffff',
              padding: '3px',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}
          />
          <div style={{ textAlign: 'left' }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '900',
              letterSpacing: '-0.03em',
              color: '#ffffff',
              margin: 0,
              lineHeight: 1.1
            }}>
              RCM Insight
            </h1>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#38bdf8'
            }}>
              Command Center
            </span>
          </div>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0, fontWeight: '500' }}>
          AI-Powered Revenue Cycle Command Center
        </p>
      </div>

      {/* Main Login Card */}
      <div style={{
        width: '100%',
        maxWidth: '520px',
        background: 'rgba(30, 41, 59, 0.75)',
        backdropFilter: 'blur(16px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        padding: '2.25rem',
        color: '#ffffff'
      }}>
        {/* Role Selection Tabs */}
        <div style={{ marginBottom: '1.75rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#94a3b8',
            marginBottom: '0.75rem'
          }}>
            Select Login Portal:
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem'
          }}>
            {/* RCM Admin Option */}
            <button
              type="button"
              onClick={() => handleRoleChange('RCM_ADMIN')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem 0.75rem',
                borderRadius: '12px',
                border: selectedRole === 'RCM_ADMIN' ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                background: selectedRole === 'RCM_ADMIN' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                color: selectedRole === 'RCM_ADMIN' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: selectedRole === 'RCM_ADMIN' ? '#2563eb' : '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '800', color: selectedRole === 'RCM_ADMIN' ? '#ffffff' : '#cbd5e1' }}>
                  RCM ADMIN
                </div>
                <div style={{ fontSize: '0.675rem', color: '#94a3b8', marginTop: '0.2rem', lineHeight: 1.2 }}>
                  Global claims & revenue
                </div>
              </div>
            </button>

            {/* Insurance Company Option */}
            <button
              type="button"
              onClick={() => handleRoleChange('INSURANCE_COMPANY')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem 0.75rem',
                borderRadius: '12px',
                border: selectedRole === 'INSURANCE_COMPANY' ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                background: selectedRole === 'INSURANCE_COMPANY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                color: selectedRole === 'INSURANCE_COMPANY' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: selectedRole === 'INSURANCE_COMPANY' ? '#059669' : '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <Building2 size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '800', color: selectedRole === 'INSURANCE_COMPANY' ? '#ffffff' : '#cbd5e1' }}>
                  INSURANCE CO.
                </div>
                <div style={{ fontSize: '0.675rem', color: '#94a3b8', marginTop: '0.2rem', lineHeight: 1.2 }}>
                  Assigned claims & review
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: '10px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.15s ease'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: '10px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.15s ease'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: '10px',
              border: 'none',
              background: selectedRole === 'RCM_ADMIN'
                ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: '700',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: selectedRole === 'RCM_ADMIN'
                ? '0 4px 14px rgba(37, 99, 235, 0.4)'
                : '0 4px 14px rgba(16, 185, 129, 0.4)',
              transition: 'opacity 0.2s ease, transform 0.1s ease',
              marginTop: '0.5rem'
            }}
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{selectedRole === 'RCM_ADMIN' ? 'ADMIN LOGIN' : 'INSURANCE LOGIN'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Demo Evaluation Bar */}
        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.725rem',
              fontWeight: '700',
              color: '#38bdf8',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <Sparkles size={14} /> 1-Click Quick Demo Accounts
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Password: role123</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.5rem'
          }}>
            <button
              type="button"
              onClick={() => handleSelectDemoAccount('RCM_ADMIN', 'admin@rcminsight.demo', 'admin123')}
              style={{
                padding: '0.5rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid #1e3a8a',
                background: 'rgba(30, 58, 138, 0.4)',
                color: '#93c5fd',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <ShieldCheck size={14} color="#60a5fa" />
              <span>RCM Administrator</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemoAccount('INSURANCE_COMPANY', 'nova@rcminsight.demo', 'nova123')}
              style={{
                padding: '0.5rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid #064e3b',
                background: 'rgba(6, 78, 59, 0.4)',
                color: '#6ee7b7',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Building2 size={14} color="#34d399" />
              <span>Nova Health</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemoAccount('INSURANCE_COMPANY', 'careshield@rcminsight.demo', 'careshield123')}
              style={{
                padding: '0.5rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(15, 23, 42, 0.6)',
                color: '#cbd5e1',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Building2 size={14} color="#94a3b8" />
              <span>CareShield</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemoAccount('INSURANCE_COMPANY', 'medisecure@rcminsight.demo', 'medisecure123')}
              style={{
                padding: '0.5rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(15, 23, 42, 0.6)',
                color: '#cbd5e1',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Building2 size={14} color="#94a3b8" />
              <span>MediSecure</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemoAccount('INSURANCE_COMPANY', 'healthprime@rcminsight.demo', 'healthprime123')}
              style={{
                padding: '0.5rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(15, 23, 42, 0.6)',
                color: '#cbd5e1',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Building2 size={14} color="#94a3b8" />
              <span>HealthPrime</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemoAccount('INSURANCE_COMPANY', 'unity@rcminsight.demo', 'unity123')}
              style={{
                padding: '0.5rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(15, 23, 42, 0.6)',
                color: '#cbd5e1',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Building2 size={14} color="#94a3b8" />
              <span>Unity Network</span>
            </button>
          </div>
        </div>

        {/* Footer Link to Register */}
        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem', color: '#94a3b8' }}>
          Don't have an account?{' '}
          <Link
            to="/register"
            style={{
              color: '#38bdf8',
              fontWeight: '700',
              textDecoration: 'none',
              marginLeft: '0.25rem'
            }}
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
