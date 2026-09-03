import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Plus,
  Flame,
  CreditCard,
  Coins,
  Sliders,
  Send,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import {
  getDashboardMetrics,
  getDenialAnalytics,
  getRevenueAnalytics,
  getClaims,
  getBillingPriorityQueue,
  recordPartialPayment,
  recordFollowUp,
  payClaim
} from '../services/api';
import StatusBadge from '../components/StatusBadge';
import RiskMeter from '../components/RiskMeter';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [denialData, setDenialData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [recentClaims, setRecentClaims] = useState([]);
  const [priorityQueue, setPriorityQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  // Follow-Up & Partial Payment Modal State
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [partialAmount, setPartialAmount] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [modalFeedback, setModalFeedback] = useState(null);

  const fetchData = async () => {
    try {
      const [mRes, dRes, rRes, cRes, pRes] = await Promise.all([
        getDashboardMetrics(),
        getDenialAnalytics(),
        getRevenueAnalytics(),
        getClaims(),
        getBillingPriorityQueue()
      ]);
      setMetrics(mRes.data);
      setDenialData(dRes.data);
      setRevenueData(rRes.data);
      setRecentClaims(cRes.data.slice(0, 7));
      setPriorityQueue(pRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000); // Live sync polling every 4s
    return () => clearInterval(interval);
  }, []);

  // Handle Partial Payment
  const handlePartialPayment = async (e) => {
    if (e) e.preventDefault();
    if (!selectedClaim || !partialAmount || Number(partialAmount) <= 0) return;

    try {
      setActionLoading(true);
      const payAmount = Number(partialAmount);
      await recordPartialPayment(selectedClaim.claimId, {
        amount: payAmount,
        transactionReference: 'TXN-PARTIAL-' + Math.floor(100000 + Math.random() * 900000)
      });

      setModalFeedback({
        type: 'success',
        text: `Recorded partial payment of ₹${payAmount.toLocaleString()} for ${selectedClaim.claimId}!`
      });

      setPartialAmount('');
      await fetchData();

      // Refresh selectedClaim in modal
      const qRes = await getBillingPriorityQueue();
      const updated = qRes.data.find((c) => c.claimId === selectedClaim.claimId);
      if (updated) {
        setSelectedClaim(updated);
      } else {
        // Claim was fully paid and removed from queue
        setTimeout(() => {
          setSelectedClaim(null);
          setModalFeedback(null);
        }, 1500);
      }
    } catch (err) {
      console.error('Error recording partial payment:', err);
      setModalFeedback({ type: 'danger', text: 'Error recording payment.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Full Settle Remaining Payment
  const handleFullSettle = async () => {
    if (!selectedClaim) return;
    try {
      setActionLoading(true);
      const remaining = selectedClaim.pendingAmount || selectedClaim.claimAmount;
      await payClaim(selectedClaim.claimId, {
        amount: remaining,
        transactionReference: 'TXN-FULL-' + Math.floor(100000 + Math.random() * 900000)
      });

      setModalFeedback({
        type: 'success',
        text: `Full settlement of ₹${remaining.toLocaleString()} recorded! Claim is now PAID and cleared from the priority queue.`
      });

      await fetchData();
      setTimeout(() => {
        setSelectedClaim(null);
        setModalFeedback(null);
      }, 1500);
    } catch (err) {
      console.error('Error recording full settlement:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Follow-Up Note
  const handleAddFollowUpNote = async () => {
    if (!selectedClaim || !followUpNote.trim()) return;
    try {
      setActionLoading(true);
      await recordFollowUp(selectedClaim.claimId, followUpNote);
      setModalFeedback({ type: 'success', text: 'Follow-up note logged in audit timeline.' });
      setFollowUpNote('');
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Status Colors for Distribution
  const statusColors = {
    ACCEPTED: '#10b981',
    PAID: '#059669',
    DENIED: '#ef4444',
    PENDING: '#f59e0b',
    SUBMITTED: '#3b82f6',
    CREATED: '#94a3b8',
    HIGH_RISK: '#f43f5e',
    AI_CHECKED: '#8b5cf6',
    CORRECTED: '#6366f1',
    RESUBMITTED: '#0ea5e9'
  };

  const statusPieData = metrics?.statusBreakdown
    ? Object.entries(metrics.statusBreakdown).map(([status, count]) => ({
        name: status.replace('_', ' '),
        value: count,
        color: statusColors[status] || '#64748b'
      }))
    : [];

  const riskPieData = [
    { name: 'Low Risk (0-39%)', value: metrics?.lowRiskClaims || 0, color: '#10b981' },
    { name: 'Medium Risk (40-69%)', value: metrics?.mediumRiskClaims || 0, color: '#f59e0b' },
    { name: 'High Risk (70-100%)', value: metrics?.highRiskClaims || 0, color: '#ef4444' }
  ];

  return (
    <div className="page-wrapper">
      {/* Top Banner / Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        color: '#ffffff',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span style={{
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '700',
              border: '1px solid rgba(59, 130, 246, 0.4)'
            }}>
              REAL-TIME REVENUE CYCLE INTELLIGENCE
            </span>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>• Smart Billing Priority Active</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
            RCM Insight Command Center
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem', maxWidth: '680px' }}>
            Pre-submission AI denial detection + Bill-amount based smart priority queuing. Proactively audits claims and organizes unpaid balances by financial urgency.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/create-claim" className="btn btn-primary btn-lg" style={{ boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)' }}>
            <Plus size={18} />
            <span>Create & Check Claim</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* Card 1: Total Claims */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                Total Claims
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--navy-dark)', marginTop: '0.35rem' }}>
                {metrics?.totalClaims || 0}
              </div>
            </div>
            <div style={{ padding: '0.6rem', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <FileText size={20} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Active in RCM database
          </div>
        </div>

        {/* Card 2: Total Outstanding (NEW) */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)', borderColor: '#fed7aa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#c2410c', letterSpacing: '0.05em' }}>
                Total Outstanding
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#9a3412', marginTop: '0.35rem' }}>
                ₹{metrics?.totalOutstanding ? (metrics.totalOutstanding / 100000).toFixed(2) + 'L' : '0.00L'}
              </div>
            </div>
            <div style={{ padding: '0.6rem', borderRadius: '10px', backgroundColor: '#ffedd5', color: '#ea580c' }}>
              <Coins size={20} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#c2410c', fontWeight: '600' }}>
            Total unpaid / pending bill value
          </div>
        </div>

        {/* Card 3: High-Priority Outstanding (NEW) */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)', borderColor: '#fecaca' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#b91c1c', letterSpacing: '0.05em' }}>
                High-Priority Due
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#991b1b', marginTop: '0.35rem' }}>
                ₹{metrics?.highPriorityOutstanding ? (metrics.highPriorityOutstanding / 100000).toFixed(2) + 'L' : '0.00L'}
              </div>
            </div>
            <div style={{ padding: '0.6rem', borderRadius: '10px', backgroundColor: '#fee2e2', color: '#dc2626' }}>
              <Flame size={20} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#b91c1c', fontWeight: '600' }}>
            From CRITICAL + HIGH priority bills
          </div>
        </div>

        {/* Card 4: Revenue Collected */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', borderColor: '#bbf7d0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#047857', letterSpacing: '0.05em' }}>
                Revenue Collected
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#065f46', marginTop: '0.35rem' }}>
                ₹{metrics?.revenueReceived ? (metrics.revenueReceived / 100000).toFixed(2) + 'L' : '0.00L'}
              </div>
            </div>
            <div style={{ padding: '0.6rem', borderRadius: '10px', backgroundColor: '#dcfce7', color: '#059669' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#047857', fontWeight: '600' }}>
            Total settled: ₹{(metrics?.revenueReceived || 0).toLocaleString()}
          </div>
        </div>

        {/* Card 5: Accepted vs Denied Rate */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                Acceptance / Denial
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--navy-dark)', marginTop: '0.35rem' }}>
                {metrics?.acceptanceRate || 0}%
              </div>
            </div>
            <div style={{ padding: '0.6rem', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#dc2626', fontWeight: '600' }}>
            {metrics?.denialRate || 0}% Denial Rate ({metrics?.deniedClaims || 0} claims)
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NEW FEATURE: SMART BILLING PRIORITY QUEUE SECTION (Directly below KPIs)   */}
      {/* ========================================================================= */}
      <div className="card" style={{ marginBottom: '2rem', border: '2px solid #fed7aa', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#9a3412', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Flame size={22} color="#ea580c" />
                Smart Billing Priority Queue
              </h3>
              <span style={{
                backgroundColor: '#ffedd5',
                color: '#9a3412',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '800'
              }}>
                {priorityQueue.length} UNPAID / DUE
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#7c2d12', marginTop: '0.35rem' }}>
              <strong>Bill Amount Driven Ranking:</strong> Prioritizes highest unpaid claims (70%) + longest pending duration (30%). Does NOT use AI denial risk score.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Top Priority Outstanding: <strong>₹{(metrics?.highPriorityOutstanding || 0).toLocaleString()}</strong>
            </span>
          </div>
        </div>

        {/* Priority Queue Table */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr style={{ background: '#fff7ed' }}>
                <th>Billing Priority</th>
                <th>Claim ID</th>
                <th>Payer Organization</th>
                <th>Total Bill (₹)</th>
                <th>Paid (₹)</th>
                <th>Pending Amount (₹)</th>
                <th>Pending Days</th>
                <th>Payment Status</th>
                <th style={{ textAlign: 'right' }}>Follow-up Action</th>
              </tr>
            </thead>
            <tbody>
              {priorityQueue.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: '#059669', fontWeight: '600' }}>
                    <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 0.5rem auto' }} />
                    All outstanding hospital bills have been fully paid and reconciled!
                  </td>
                </tr>
              ) : (
                priorityQueue.map((item) => (
                  <tr key={item.id || item.claimId} style={{ backgroundColor: item.billingPriority === 'CRITICAL' ? '#fffbf7' : 'inherit' }}>
                    <td>
                      <StatusBadge status={item.billingPriority} type="priority" />
                    </td>
                    <td className="font-mono" style={{ fontWeight: '700' }}>
                      <Link to={`/claims/${item.claimId}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                        {item.claimId}
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{item.payerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.patientName}</div>
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      ₹{(item.totalBillAmount || item.claimAmount || 0).toLocaleString()}
                    </td>
                    <td style={{ color: '#059669', fontWeight: '600' }}>
                      ₹{(item.paidAmount || 0).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: '800', color: '#dc2626', fontSize: '0.95rem' }}>
                      ₹{(item.pendingAmount || 0).toLocaleString()}
                    </td>
                    <td>
                      <span style={{
                        fontWeight: '700',
                        color: item.daysPending > 30 ? '#dc2626' : (item.daysPending > 15 ? '#ea580c' : '#475569')
                      }}>
                        {item.daysPending || 1} days
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={item.paymentStatus} type="payment" />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setSelectedClaim(item);
                          setPartialAmount('');
                          setFollowUpNote('');
                          setModalFeedback(null);
                        }}
                        className="btn btn-sm"
                        style={{
                          backgroundColor: item.billingPriority === 'CRITICAL' ? '#ea580c' : '#2563eb',
                          color: '#ffffff',
                          fontWeight: '700',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                        }}
                      >
                        FOLLOW UP
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4 Interactive Analytics Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Chart 1: Claim Status Distribution */}
        <div className="card">
          <div className="card-title">
            <CheckCircle2 size={18} color="#2563eb" />
            <span>Claim Status Distribution</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Current breakdown across all lifecycle states
          </p>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Top Denial Reasons */}
        <div className="card">
          <div className="card-title">
            <AlertTriangle size={18} color="#ef4444" />
            <span>Top Denial Reasons (Root Causes)</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Identified reasons behind claim rejection & pre-check risk
          </p>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={denialData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <XAxis type="number" />
                <YAxis dataKey="reason" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Revenue Trend */}
        <div className="card">
          <div className="card-title">
            <DollarSign size={18} color="#10b981" />
            <span>Revenue Cycle Trend (₹)</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Billed vs Collected vs Pending reimbursement
          </p>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="billed" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBilled)" name="Billed (₹)" />
                <Area type="monotone" dataKey="collected" stroke="#10b981" fillOpacity={1} fill="url(#colorCollected)" name="Collected (₹)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: AI Risk Distribution */}
        <div className="card">
          <div className="card-title">
            <Sparkles size={18} color="#8b5cf6" />
            <span>AI Denial Risk Distribution</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Claims segmented by machine learning risk severity
          </p>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`risk-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Claims Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--navy-dark)' }}>
              Recent Claims Stream
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Live claim stream with real-time status and AI risk scores
            </p>
          </div>
          <Link to="/claims" className="btn btn-secondary btn-sm">
            <span>View All Claims</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Claim ID</th>
                <th>Patient</th>
                <th>Payer</th>
                <th>Amount</th>
                <th>AI Risk Score</th>
                <th>Claim Status</th>
                <th>Payment</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentClaims.map((claim) => (
                <tr key={claim.id || claim.claimId}>
                  <td className="font-mono" style={{ fontWeight: '700', color: 'var(--primary)' }}>
                    {claim.claimId}
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{claim.patientName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{claim.patientReference}</div>
                  </td>
                  <td>
                    <div>{claim.payerName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{claim.payerType}</div>
                  </td>
                  <td style={{ fontWeight: '700' }}>
                    ₹{(claim.totalBillAmount || claim.claimAmount || 0).toLocaleString()}
                  </td>
                  <td>
                    {claim.riskScore !== null && claim.riskScore !== undefined ? (
                      <RiskMeter score={claim.riskScore} level={claim.riskLevel} size="compact" />
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Unchecked</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={claim.status} />
                  </td>
                  <td>
                    <StatusBadge status={claim.paymentStatus} type="payment" />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link to={`/claims/${claim.claimId}`} className="btn btn-secondary btn-sm">
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FOLLOW-UP & PARTIAL PAYMENT INTERACTIVE MODAL                             */}
      {/* ========================================================================= */}
      {selectedClaim && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '660px',
            boxShadow: 'var(--shadow-xl)',
            padding: '2rem',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--navy-dark)', margin: 0 }}>
                    Billing Follow-up: {selectedClaim.claimId}
                  </h3>
                  <StatusBadge status={selectedClaim.billingPriority} type="priority" />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  Patient: {selectedClaim.patientName} • Payer: {selectedClaim.payerName}
                </p>
              </div>
              <button onClick={() => setSelectedClaim(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b' }}>
                ✕
              </button>
            </div>

            {modalFeedback && (
              <div style={{
                backgroundColor: modalFeedback.type === 'danger' ? '#fef2f2' : '#ecfdf5',
                color: modalFeedback.type === 'danger' ? '#991b1b' : '#065f46',
                border: `1px solid ${modalFeedback.type === 'danger' ? '#fecaca' : '#a7f3d0'}`,
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}>
                {modalFeedback.text}
              </div>
            )}

            {/* Financial Status Summary */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                  Total Bill Amount
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--navy-dark)', marginTop: '0.25rem' }}>
                  ₹{(selectedClaim.totalBillAmount || selectedClaim.claimAmount || 0).toLocaleString()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                  Paid Amount
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#059669', marginTop: '0.25rem' }}>
                  ₹{(selectedClaim.paidAmount || 0).toLocaleString()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                  Pending Amount
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#dc2626', marginTop: '0.25rem' }}>
                  ₹{(selectedClaim.pendingAmount || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Priority Reason Banner */}
            <div style={{
              backgroundColor: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9a3412', textTransform: 'uppercase' }}>
                  Priority Reason:
                </span>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#7c2d12', fontWeight: '600' }}>
                  {selectedClaim.priorityReason || `₹${(selectedClaim.pendingAmount || 0).toLocaleString()} pending for ${selectedClaim.daysPending || 1} days`}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: '#9a3412', fontWeight: '700' }}>Score:</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#c2410c', marginLeft: '0.3rem' }}>
                  {selectedClaim.billingPriorityScore || 0}/100
                </span>
              </div>
            </div>

            {/* Action 1: Record Partial Payment */}
            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--navy-dark)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Coins size={16} color="#2563eb" />
                Record Partial Payment (Reduces Priority Dynamically)
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Enter the amount received. The system will deduct from pending amount and immediately re-rank this claim.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="number"
                  placeholder="e.g. 70000"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  className="form-control"
                  style={{ flex: 1 }}
                  min="1"
                  max={selectedClaim.pendingAmount}
                />
                <button
                  type="button"
                  onClick={handlePartialPayment}
                  disabled={actionLoading || !partialAmount}
                  className="btn btn-primary"
                >
                  Record Payment
                </button>
              </div>
            </div>

            {/* Action 2: Settle Full Remaining Balance */}
            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--navy-dark)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} color="#059669" />
                Settle Full Balance (Removes from Priority Queue)
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                If full reimbursement has cleared, settle remaining ₹{(selectedClaim.pendingAmount || 0).toLocaleString()} to mark claim as <strong>PAID</strong>.
              </p>
              <button
                type="button"
                onClick={handleFullSettle}
                disabled={actionLoading}
                className="btn btn-success"
                style={{ width: '100%', padding: '0.75rem', fontWeight: '800' }}
              >
                ✓ Settle Full Remaining Balance (₹{(selectedClaim.pendingAmount || 0).toLocaleString()})
              </button>
            </div>

            {/* Action 3: Add Follow-Up Note */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--navy-dark)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={16} color="#475569" />
                Log Staff Follow-up Note
              </h4>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="e.g. Spoke with Nova Health representative; check is in transit."
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  className="form-control"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleAddFollowUpNote}
                  disabled={actionLoading || !followUpNote.trim()}
                  className="btn btn-secondary"
                >
                  Log Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
