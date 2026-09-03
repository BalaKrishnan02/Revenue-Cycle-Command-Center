import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  CheckCircle2,
  DollarSign,
  Search,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  Building,
  RefreshCw
} from 'lucide-react';
import { getPayments, getDashboardMetrics } from '../services/api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, mRes] = await Promise.all([
        getPayments(),
        getDashboardMetrics()
      ]);
      setPayments(pRes.data);
      setMetrics(mRes.data);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const filtered = payments.filter((p) =>
    p.paymentId?.toLowerCase().includes(search.toLowerCase()) ||
    p.claimId?.toLowerCase().includes(search.toLowerCase()) ||
    p.payerName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--navy-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={24} color="#059669" />
            Payment Reconciliation & Settlements
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time tracking of cleared payer reimbursements, electronic remittance advices (ERA), and revenue ledger
          </p>
        </div>

        <button onClick={loadData} className="btn btn-secondary btn-sm" title="Refresh">
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Sync</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#047857' }}>
            Total Revenue Collected
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#065f46', marginTop: '0.35rem' }}>
            ₹{(metrics?.revenueReceived || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.5rem' }}>
            {payments.length} settled payment transactions
          </div>
        </div>

        <div className="card" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#b45309' }}>
            Pending Reimbursements
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#92400e', marginTop: '0.35rem' }}>
            ₹{(metrics?.pendingRevenue || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.5rem' }}>
            {metrics?.pendingClaims || 0} claims in submission / adjudication pipeline
          </div>
        </div>

        <div className="card" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#1d4ed8' }}>
            Total Billed Revenue
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e40af', marginTop: '0.35rem' }}>
            ₹{(metrics?.totalClaimAmount || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#1d4ed8', marginTop: '0.5rem' }}>
            Across {metrics?.totalClaims || 0} lifetime claims
          </div>
        </div>
      </div>

      {/* Search & Ledger Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>
            Settled Transactions Ledger
          </h3>

          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Payment ID, Claim..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Claim Reference</th>
                <th>Payer Organization</th>
                <th>Billed Amount</th>
                <th>Paid Amount</th>
                <th>Status</th>
                <th>Transaction Reference</th>
                <th>Date Settled</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filtered.map((pay) => (
                  <tr key={pay.id || pay.paymentId}>
                    <td className="font-mono" style={{ fontWeight: '700', color: '#059669' }}>
                      {pay.paymentId}
                    </td>
                    <td className="font-mono" style={{ fontWeight: '700' }}>
                      <Link to={`/claims/${pay.claimId}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                        {pay.claimId}
                      </Link>
                    </td>
                    <td>
                      <strong>{pay.payerName}</strong>
                    </td>
                    <td>₹{(pay.claimAmount || 0).toLocaleString()}</td>
                    <td style={{ fontWeight: '800', color: '#059669' }}>
                      ₹{(pay.paidAmount || 0).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-status-paid">
                        <CheckCircle2 size={12} /> PAID
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {pay.transactionReference || 'TXN-DIRECT'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(pay.createdAt || pay.paymentDate).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
