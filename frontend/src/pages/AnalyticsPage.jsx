import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Building,
  DollarSign,
  PieChart as PieIcon,
  ShieldCheck,
  RefreshCw
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

export default function AnalyticsPage() {
  const [payerData, setPayerData] = useState([]);
  const [denialData, setDenialData] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [pRes, dRes, mRes] = await Promise.all([
        getPayerAnalytics(),
        getDenialAnalytics(),
        getDashboardMetrics()
      ]);
      setPayerData(pRes.data);
      setDenialData(dRes.data);
      setMetrics(mRes.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--navy-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={24} color="#2563eb" />
            Revenue Cycle Analytics & Payer Intelligence
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Deep-dive financial metrics, payer delay benchmarks, and pre-submission denial mitigation analytics
          </p>
        </div>

        <button onClick={loadAnalytics} className="btn btn-secondary btn-sm" title="Refresh">
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Sync</span>
        </button>
      </div>

      {/* Strategic Impact Highlight */}
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
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>
              Estimated Avoidable Denial Reduction: 30%
            </h3>
            <p style={{ color: '#e0e7ff', fontSize: '0.85rem', marginTop: '0.4rem', maxWidth: '650px' }}>
              By auditing insurance eligibility, prior authorizations, and code modifiers <em>before</em> claim submission, RCM Insight prevents costly re-work cycles and accelerates cash flow.
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            padding: '1.25rem 1.75rem',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#c7d2fe', textTransform: 'uppercase', fontWeight: '700' }}>
              Current Denial Rate
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#ffffff', margin: '0.2rem 0' }}>
              {metrics?.denialRate || 0}%
            </div>
            <div style={{ fontSize: '0.7rem', color: '#a5b4fc' }}>
              Target: &lt; 5.0% post AI pre-audit
            </div>
          </div>
        </div>
      </div>

      {/* Payer Performance Chart */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="card-title">
          <Building size={18} color="#2563eb" />
          Payer Volume & Denial Rates Comparison
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Comparing claim volume and denial percentages across contracted insurance payers
        </p>

        <div style={{ height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={payerData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="payerName" />
              <YAxis />
              <Tooltip />
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
        <h3 className="card-title" style={{ marginBottom: '1rem' }}>
          Payer Financial Reconciliation Breakdown
        </h3>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Payer Organization</th>
                <th>Total Claims</th>
                <th>Accepted</th>
                <th>Denied</th>
                <th>Denial Rate (%)</th>
                <th>Total Billed</th>
                <th>Total Collected</th>
                <th>Avg Settlement Days</th>
              </tr>
            </thead>
            <tbody>
              {payerData.map((payer) => (
                <tr key={payer.payerName}>
                  <td style={{ fontWeight: '700', color: 'var(--navy-dark)' }}>
                    {payer.payerName}
                  </td>
                  <td>{payer.totalClaims}</td>
                  <td style={{ color: '#059669', fontWeight: '600' }}>{payer.acceptedClaims}</td>
                  <td style={{ color: '#dc2626', fontWeight: '600' }}>{payer.deniedClaims}</td>
                  <td>
                    <span style={{
                      fontWeight: '700',
                      color: payer.denialRate > 20 ? '#dc2626' : (payer.denialRate > 10 ? '#d97706' : '#059669')
                    }}>
                      {payer.denialRate}%
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
