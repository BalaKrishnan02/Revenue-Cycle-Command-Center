import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Building,
  Building2,
  DollarSign,
  PieChart as PieIcon,
  ShieldCheck,
  RefreshCw,
  Lock,
  Filter,
  CheckCircle2,
  ArrowDownRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { getPayerAnalytics, getDenialAnalytics, getDashboardMetrics } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AnalyticsPage() {
  const { user, isInsuranceCompany, isRcmAdmin } = useAuth();
  const [payerData, setPayerData] = useState([]);
  const [denialData, setDenialData] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayer, setSelectedPayer] = useState('ALL');

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [pRes, dRes, mRes] = await Promise.all([
        getPayerAnalytics(),
        getDenialAnalytics(),
        getDashboardMetrics()
      ]);
      setPayerData(pRes.data || []);
      setDenialData(dRes.data || []);
      setMetrics(mRes.data || null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  // When logged in as insurance company, automatically default to their company
  useEffect(() => {
    if (isInsuranceCompany() && user?.insuranceCompanyName) {
      setSelectedPayer(user.insuranceCompanyName);
    }
  }, [user]);

  // Determine active payer record based on filter
  const activePayerRecord = selectedPayer !== 'ALL'
    ? payerData.find(
        (p) =>
          p.payerName?.toLowerCase().includes(selectedPayer.toLowerCase()) ||
          selectedPayer.toLowerCase().includes(p.payerName?.toLowerCase())
      )
    : null;

  // Compute displayed denial rate:
  // If a specific payer is selected, show that payer's rate; otherwise show overall metrics denial rate
  const displayedDenialRate = activePayerRecord
    ? activePayerRecord.denialRate
    : (metrics?.denialRate ?? (payerData.length > 0
        ? Math.round(
            (payerData.reduce((sum, p) => sum + (p.deniedClaims || 0), 0) /
              Math.max(1, payerData.reduce((sum, p) => sum + (p.totalClaims || 0), 0))) *
              1000
          ) / 10
        : 18.5));

  const payerOptions = [
    { id: 'ALL', label: 'All Contracted Payers' },
    { id: 'Nova Health Insurance', label: 'Nova Health' },
    { id: 'CareShield Assurance', label: 'CareShield' },
    { id: 'MediSecure Benefits', label: 'MediSecure' },
    { id: 'HealthPrime Plan', label: 'HealthPrime' },
    { id: 'Unity Payer Network', label: 'Unity Network' }
  ];

  const filteredPayerData = selectedPayer === 'ALL'
    ? payerData
    : payerData.filter((p) =>
        p.payerName?.toLowerCase().includes(selectedPayer.toLowerCase()) ||
        selectedPayer.toLowerCase().includes(p.payerName?.toLowerCase())
      );

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--navy-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <BarChart3 size={24} color="#2563eb" />
              {isInsuranceCompany() ? 'Payer Operations & Denial Intelligence' : 'Revenue Cycle Analytics & Payer Intelligence'}
            </h2>
            {isInsuranceCompany() && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.72rem',
                fontWeight: '700',
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0'
              }}>
                <Lock size={12} />
                PAYER PORTAL: {user?.insuranceCompanyName || user?.companyId}
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            {isInsuranceCompany()
              ? `Adjudication KPIs, denial mitigation metrics, and settlement timelines for ${user?.insuranceCompanyName || 'your organization'}`
              : 'Deep-dive financial metrics, payer delay benchmarks, and pre-submission denial mitigation analytics'}
          </p>
        </div>

        <button onClick={loadAnalytics} className="btn btn-secondary btn-sm" title="Refresh">
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Sync Data</span>
        </button>
      </div>

      {/* Payer Operations Filter (For RCM Admin) */}
      {isRcmAdmin() && (
        <div className="card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} color="#475569" />
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Payer Operation:
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {payerOptions.map((opt) => {
                const isSelected = selectedPayer === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedPayer(opt.id)}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? '700' : '500',
                      border: isSelected ? '1px solid #2563eb' : '1px solid #cbd5e1',
                      background: isSelected ? '#2563eb' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 4px rgba(37, 99, 235, 0.2)' : 'none'
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Strategic Impact Highlight Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        color: '#ffffff',
        marginBottom: '2rem',
        border: 'none',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ShieldCheck size={20} color="#a5b4fc" />
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pre-Submission AI Impact Model
              </span>
              {activePayerRecord && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#e0e7ff',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  Payer: {activePayerRecord.payerName}
                </span>
              )}
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>
              Estimated Avoidable Denial Reduction: 30%
            </h3>
            <p style={{ color: '#e0e7ff', fontSize: '0.85rem', marginTop: '0.4rem', maxWidth: '650px', lineHeight: 1.5 }}>
              By auditing insurance eligibility, prior authorizations, and code modifiers <em>before</em> claim submission, RCM Insight prevents costly re-work cycles and accelerates cash flow.
            </p>

            {/* Quick Context Summary when Payer Filter is Active */}
            {activePayerRecord && (
              <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '0.75rem', color: '#c7d2fe' }}>
                  Total Claims: <strong style={{ color: '#ffffff' }}>{activePayerRecord.totalClaims}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#c7d2fe' }}>
                  Accepted: <strong style={{ color: '#86efac' }}>{activePayerRecord.acceptedClaims}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#c7d2fe' }}>
                  Denied: <strong style={{ color: '#fca5a5' }}>{activePayerRecord.deniedClaims}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#c7d2fe' }}>
                  Billed: <strong style={{ color: '#ffffff' }}>₹{(activePayerRecord.totalBilled || 0).toLocaleString()}</strong>
                </div>
              </div>
            )}
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            padding: '1.25rem 1.75rem',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            minWidth: '220px'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#c7d2fe', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
              Current Denial Rate
              {activePayerRecord && (
                <div style={{ fontSize: '0.7rem', color: '#93c5fd', textTransform: 'none', fontWeight: '600', marginTop: '0.1rem' }}>
                  ({activePayerRecord.payerName})
                </div>
              )}
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: '800', color: '#ffffff', margin: '0.2rem 0' }}>
              {displayedDenialRate}%
            </div>
            <div style={{ fontSize: '0.72rem', color: '#a5b4fc', fontWeight: '500' }}>
              Target: &lt; 5.0% post AI pre-audit
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.675rem',
              color: '#86efac',
              background: 'rgba(16, 185, 129, 0.2)',
              padding: '0.2rem 0.5rem',
              borderRadius: '9999px',
              marginTop: '0.5rem',
              fontWeight: '700'
            }}>
              <ArrowDownRight size={12} />
              Pre-audit AI optimization active
            </div>
          </div>
        </div>
      </div>

      {/* Payer Performance Chart */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building size={18} color="#2563eb" />
              Payer Volume & Denial Rates Comparison
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
              {selectedPayer === 'ALL'
                ? 'Comparing claim volume and denial percentages across contracted insurance payers'
                : `Performance metrics for ${selectedPayer}`}
            </p>
          </div>
        </div>

        <div style={{ height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredPayerData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="payerName" />
              <YAxis />
              <Tooltip formatter={(val, name) => [typeof val === 'number' && name.includes('Rate') ? `${val}%` : val, name]} />
              <Legend />
              <Bar dataKey="totalClaims" fill="#3b82f6" name="Total Claims" radius={[4, 4, 0, 0]} />
              <Bar dataKey="acceptedClaims" fill="#10b981" name="Accepted Claims" radius={[4, 4, 0, 0]} />
              <Bar dataKey="deniedClaims" fill="#ef4444" name="Denied Claims" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payer Performance Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>
              Payer Financial Reconciliation Breakdown
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
              Comprehensive adjudication metrics, settlement timelines, and pre-audit denial benchmarks
            </p>
          </div>

          {selectedPayer !== 'ALL' && isRcmAdmin() && (
            <button
              onClick={() => setSelectedPayer('ALL')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              Reset to All Payers
            </button>
          )}
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Payer Organization</th>
                <th>Total Claims</th>
                <th>Accepted</th>
                <th>Denied</th>
                <th>Current Denial Rate</th>
                <th>Post AI Target</th>
                <th>Total Billed</th>
                <th>Total Collected</th>
                <th>Avg Settlement Days</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayerData.map((payer) => (
                <tr
                  key={payer.payerName}
                  style={{
                    backgroundColor: selectedPayer !== 'ALL' && payer.payerName?.toLowerCase().includes(selectedPayer.toLowerCase())
                      ? '#f0fdf4'
                      : 'transparent'
                  }}
                >
                  <td style={{ fontWeight: '700', color: 'var(--navy-dark)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Building2 size={15} color="#64748b" />
                      <span>{payer.payerName}</span>
                    </div>
                  </td>
                  <td>{payer.totalClaims}</td>
                  <td style={{ color: '#059669', fontWeight: '600' }}>{payer.acceptedClaims}</td>
                  <td style={{ color: '#dc2626', fontWeight: '600' }}>{payer.deniedClaims}</td>
                  <td>
                    <span style={{
                      fontWeight: '700',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      background: payer.denialRate > 20 ? '#fee2e2' : (payer.denialRate > 10 ? '#fef3c7' : '#ecfdf5'),
                      color: payer.denialRate > 20 ? '#dc2626' : (payer.denialRate > 10 ? '#d97706' : '#059669')
                    }}>
                      {payer.denialRate}%
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#2563eb' }}>
                      &lt; 5.0%
                    </span>
                  </td>
                  <td>₹{(payer.totalBilled || 0).toLocaleString()}</td>
                  <td style={{ fontWeight: '700', color: '#059669' }}>₹{(payer.totalCollected || 0).toLocaleString()}</td>
                  <td>{payer.averageSettlementDays} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
