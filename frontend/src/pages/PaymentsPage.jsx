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
  RefreshCw,
  Eye,
  Download,
  X,
  FileText,
  Printer,
  ShieldCheck,
  Check,
  Hash,
  ExternalLink
} from 'lucide-react';
import { getPayments, getDashboardMetrics } from '../services/api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, mRes] = await Promise.all([
        getPayments(),
        getDashboardMetrics()
      ]);
      setPayments(pRes.data || []);
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
    p.payerName?.toLowerCase().includes(search.toLowerCase()) ||
    p.transactionReference?.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    if (!filtered || filtered.length === 0) return;
    const headers = ['Payment ID,Claim Reference,Payer Organization,Billed Amount,Paid Amount,Status,Transaction Reference,Date Settled\n'];
    const rows = filtered.map((p) =>
      `"${p.paymentId || ''}","${p.claimId || ''}","${p.payerName || ''}",${p.claimAmount || 0},${p.paidAmount || 0},"${p.paymentStatus || 'PAID'}","${p.transactionReference || ''}","${p.paymentDate || p.createdAt || ''}"`
    );
    const blob = new Blob([...headers, ...rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `payment_reconciliation_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--navy-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={24} color="#059669" />
            Payment Reconciliation & Settlements
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Real-time tracking of cleared payer reimbursements, electronic remittance advices (ERA), and revenue ledger
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary btn-sm" title="Export payments ledger as CSV">
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button onClick={loadData} className="btn btn-secondary btn-sm" title="Sync latest payment records">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
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
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>
              Settled Transactions Ledger
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Click any transaction or the "Inspect" button to examine full ERA settlement details
            </span>
          </div>

          <div style={{ position: 'relative', minWidth: '260px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Payment ID, Claim, Reference..."
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
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filtered.map((pay) => (
                  <tr
                    key={pay.id || pay.paymentId}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedPayment(pay)}
                  >
                    <td className="font-mono" style={{ fontWeight: '700', color: '#059669' }}>
                      {pay.paymentId}
                    </td>
                    <td className="font-mono" style={{ fontWeight: '700' }} onClick={(e) => e.stopPropagation()}>
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
                        <CheckCircle2 size={12} /> {pay.paymentStatus || 'PAID'}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {pay.transactionReference || 'TXN-DIRECT'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(pay.createdAt || pay.paymentDate).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedPayment(pay)}
                        className="btn btn-primary btn-sm"
                        style={{
                          padding: '0.25rem 0.65rem',
                          fontSize: '0.75rem',
                          gap: '0.35rem',
                          background: 'linear-gradient(135deg, #059669, #047857)'
                        }}
                        title="Inspect full payment details"
                      >
                        <Eye size={13} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAYMENT INSPECTION & RECONCILIATION MODAL */}
      {selectedPayment && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setSelectedPayment(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
              color: '#ffffff',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CreditCard size={22} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.01em' }}>
                    Payment Details & ERA Inspection
                  </h3>
                  <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.15rem' }}>
                    Electronic Remittance Advice (835) • Reconciliation Audit
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedPayment(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#ffffff'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
              
              {/* Payment ID & Status Hero */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                backgroundColor: '#f8fafc',
                padding: '0.85rem 1.15rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700', color: '#64748b' }}>
                    Transaction Identifier
                  </span>
                  <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
                    {selectedPayment.paymentId}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    backgroundColor: '#ecfdf5',
                    color: '#065f46',
                    border: '1px solid #a7f3d0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <CheckCircle2 size={13} color="#059669" />
                    <span>{selectedPayment.paymentStatus || 'SETTLED & PAID'}</span>
                  </span>

                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '9999px',
                    backgroundColor: '#eff6ff',
                    color: '#1e40af',
                    border: '1px solid #bfdbfe'
                  }}>
                    Stage 5: Remittance
                  </span>
                </div>
              </div>

              {/* Financial Breakdown Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>
                    Billed Claim
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginTop: '0.25rem' }}>
                    ₹{(selectedPayment.claimAmount || 0).toLocaleString()}
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', color: '#047857' }}>
                    Settled / Reimbursed
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#059669', marginTop: '0.25rem' }}>
                    ₹{(selectedPayment.paidAmount || 0).toLocaleString()}
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', color: '#b45309' }}>
                    Contractual Variance
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#b45309', marginTop: '0.25rem' }}>
                    ₹{Math.max(0, (selectedPayment.claimAmount || 0) - (selectedPayment.paidAmount || 0)).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Detailed Remittance Ledger Table */}
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                overflow: 'hidden',
                marginBottom: '1.25rem'
              }}>
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '0.6rem 1rem',
                  borderBottom: '1px solid #e2e8f0',
                  fontWeight: '700',
                  fontSize: '0.78rem',
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Remittance Advice Specifications
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.65rem 1rem', color: '#64748b', width: '40%' }}>Linked Claim File</td>
                      <td style={{ padding: '0.65rem 1rem', fontWeight: '700' }}>
                        <Link
                          to={`/claims/${selectedPayment.claimId}`}
                          style={{ color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <span>{selectedPayment.claimId}</span>
                          <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>

                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>Insurance Payer Organization</td>
                      <td style={{ padding: '0.65rem 1rem', fontWeight: '700', color: '#0f172a' }}>
                        {selectedPayment.payerName || selectedPayment.insuranceCompanyName || 'Payer Organization'}
                      </td>
                    </tr>

                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>Payer Company Code</td>
                      <td style={{ padding: '0.65rem 1rem', fontWeight: '600', color: '#475569' }} className="font-mono">
                        {selectedPayment.insuranceCompanyId || 'INS-DIRECT-SETTLED'}
                      </td>
                    </tr>

                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>Electronic Transaction Reference</td>
                      <td style={{ padding: '0.65rem 1rem', fontWeight: '700', color: '#047857' }} className="font-mono">
                        {selectedPayment.transactionReference || 'TXN-DIRECT-SETTLED'}
                      </td>
                    </tr>

                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>Settlement Clearance Date</td>
                      <td style={{ padding: '0.65rem 1rem', fontWeight: '600', color: '#0f172a' }}>
                        {new Date(selectedPayment.paymentDate || selectedPayment.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'medium'
                        })}
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>Payment Interchange Method</td>
                      <td style={{ padding: '0.65rem 1rem', color: '#334155' }}>
                        Electronic Remittance Advice (EDI 835) / EFT Automated Clearing House
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Compliance & Audit Confirmation */}
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}>
                <ShieldCheck size={18} color="#059669" />
                <span style={{ fontSize: '0.78rem', color: '#065f46', fontWeight: '600' }}>
                  Transaction verified against revenue cycle ledger. Remittance advice matches claim settlement criteria.
                </span>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <Link
                to={`/claims/${selectedPayment.claimId}`}
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.4rem', color: '#1e40af', borderColor: '#bfdbfe' }}
              >
                <FileText size={14} />
                <span>Open Linked Claim</span>
              </Link>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => window.print()}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '0.4rem' }}
                  title="Print official payment remittance receipt"
                >
                  <Printer size={14} />
                  <span>Print Receipt</span>
                </button>

                <button
                  onClick={() => setSelectedPayment(null)}
                  className="btn btn-primary btn-sm"
                  style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
