import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPublicInsuranceCompanies } from '../services/api';
import {
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  User as UserIcon,
  Building,
  ArrowRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  // Selected registration type: 'RCM_ADMIN' or 'INSURANCE_COMPANY'
  const [regType, setRegType] = useState('RCM_ADMIN');

  // Admin fields
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');

  // Insurance Company fields
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('INS001');
  const [contactPerson, setContactPerson] = useState('');

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const res = await getPublicInsuranceCompanies();
        if (res.data && res.data.length > 0) {
          setCompanies(res.data);
          setSelectedCompanyId(res.data[0].companyId || res.data[0].id);
        }
      } catch {
        // Fallback default
        setCompanies([
          { companyId: 'INS001', companyCode: 'NOVA001', companyName: 'Nova Health Insurance' },
          { companyId: 'INS002', companyCode: 'CARE002', companyName: 'CareShield Assurance' },
          { companyId: 'INS003', companyCode: 'MEDI003', companyName: 'MediSecure Benefits' },
          { companyId: 'INS004', companyCode: 'HP004', companyName: 'HealthPrime Plan' },
          { companyId: 'INS005', companyCode: 'UNITY005', companyName: 'Unity Payer Network' }
        ]);
      }
    };

    loadCompanies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify and retry.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        registrationType: regType,
        email: email.trim(),
        password: password,
        fullName: regType === 'RCM_ADMIN' ? fullName.trim() : contactPerson.trim(),
        organizationName: regType === 'RCM_ADMIN' ? orgName.trim() : undefined,
        companyId: regType === 'INSURANCE_COMPANY' ? selectedCompanyId : undefined,
        contactPerson: regType === 'INSURANCE_COMPANY' ? contactPerson.trim() : undefined
      };

      const result = await register(payload);

      setSuccessMsg('Account registered successfully! Redirecting...');
      setTimeout(() => {
        if (regType === 'RCM_ADMIN') {
          navigate('/admin/dashboard');
        } else {
          navigate('/insurance/dashboard');
        }
      }, 1200);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
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
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.85rem', textDecoration: 'none', marginBottom: '0.5rem' }}>
          <img
            src="/rcm-logo.jpg"
            alt="RCM Insight Logo"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              objectFit: 'contain',
              background: '#ffffff',
              padding: '2px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
            }}
          />
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#ffffff', margin: 0 }}>
              RCM Insight
            </h1>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#38bdf8' }}>
              Command Center
            </span>
          </div>
        </Link>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
          Create your account for secure revenue cycle operations
        </p>
      </div>

      {/* Registration Card */}
      <div style={{
        width: '100%',
        maxWidth: '560px',
        background: 'rgba(30, 41, 59, 0.75)',
        backdropFilter: 'blur(16px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        padding: '2.25rem',
        color: '#ffffff'
      }}>
        {/* Register As Selector */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#94a3b8',
            marginBottom: '0.65rem',
            textAlign: 'center'
          }}>
            REGISTER AS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => { setRegType('RCM_ADMIN'); setErrorMsg(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.85rem',
                borderRadius: '10px',
                border: regType === 'RCM_ADMIN' ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                background: regType === 'RCM_ADMIN' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                color: regType === 'RCM_ADMIN' ? '#ffffff' : '#94a3b8',
                fontWeight: '700',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <ShieldCheck size={18} color={regType === 'RCM_ADMIN' ? '#60a5fa' : '#94a3b8'} />
              <span>RCM ADMIN</span>
            </button>

            <button
              type="button"
              onClick={() => { setRegType('INSURANCE_COMPANY'); setErrorMsg(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.85rem',
                borderRadius: '10px',
                border: regType === 'INSURANCE_COMPANY' ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                background: regType === 'INSURANCE_COMPANY' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                color: regType === 'INSURANCE_COMPANY' ? '#ffffff' : '#94a3b8',
                fontWeight: '700',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Building2 size={18} color={regType === 'INSURANCE_COMPANY' ? '#34d399' : '#94a3b8'} />
              <span>INSURANCE COMPANY</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
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
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#6ee7b7',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '1.25rem'
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {regType === 'RCM_ADMIN' ? (
            /* Admin Fields */
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="RCM Administrator"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.5rem',
                      borderRadius: '10px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Organization Name <span style={{ color: '#64748b', fontWeight: 'normal' }}>(optional)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Building size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Metro Health Care System"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.5rem',
                      borderRadius: '10px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            /* Insurance Company Fields (Best Hackathon Registration Model) */
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Select Insurance Company
                </label>
                <select
                  required
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {companies.map((c) => (
                    <option key={c.companyId || c.id} value={c.companyId || c.id}>
                      {c.companyName} ({c.companyCode})
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                  Select from existing registered payer network entities to ensure verified access.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Contact Person / Authorized Agent
                </label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. John Miller"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.5rem',
                      borderRadius: '10px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Common Email & Password Fields */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={regType === 'RCM_ADMIN' ? 'admin@rcminsight.com' : 'officer@insurance.com'}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: '10px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.35rem' }}>
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
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    borderRadius: '10px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
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
              background: regType === 'RCM_ADMIN'
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
              boxShadow: regType === 'RCM_ADMIN'
                ? '0 4px 14px rgba(37, 99, 235, 0.4)'
                : '0 4px 14px rgba(16, 185, 129, 0.4)',
              marginTop: '0.75rem'
            }}
          >
            {isSubmitting ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>{regType === 'RCM_ADMIN' ? 'CREATE RCM ADMIN ACCOUNT' : 'CREATE INSURANCE ACCOUNT'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem', color: '#94a3b8' }}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: '#38bdf8',
              fontWeight: '700',
              textDecoration: 'none',
              marginLeft: '0.25rem'
            }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
