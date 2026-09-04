import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getClaims,
  reviewClaim,
  getPayments,
  getDashboardMetrics
} from '../services/api';
import {
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  IndianRupee,
  Eye,
  Edit3,
  Search,
  Filter,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Calendar,
  X,
  CreditCard
} from 'lucide-react';

export default function InsuranceCompanyDashboard() {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Review Modal State
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [modalStatus, setModalStatus] = useState('ACCEPTED');
  const [modalReason, setModalReason] = useState('Coverage verified; medical necessity criteria met');
  const [modalAllowedAmount, setModalAllowedAmount] = useState('');
  const [modalComments, setModalComments] = useState('');
  const [modalPaymentStatus, setModalPaymentStatus] = useState('PENDING_PAYER');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processSuccess, setProcessSuccess] = useState('');

  const companyName = user?.companyName || 'Nova Health Insurance';
  const companyId = user?.companyId || 'INS001';

  const loadData = async () => {
    setLoading(true);
    try {
      const [claimsRes, metricsRes, paymentsRes] = await Promise.all([
        getClaims(),
        getDashboardMetrics(),
        getPayments()
      ]);

      const myClaims = claimsRes.data || [];
      setClaims(myClaims);
      setMetrics(metricsRes.data || null);
      setPayments(paymentsRes.data || []);
    } catch (err) {
      console.error('Error loading insurance dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenReviewModal = (claim) => {
    setSelectedClaim(claim);
    setModalStatus(claim.status === 'DENIED' ? 'DENIED' : 'ACCEPTED');
    setModalAllowedAmount(claim.allowedAmount > 0 ? claim.allowedAmount : claim.totalBillAmount);
    setModalReason(claim.denialReason || 'Coverage verified; medical necessity criteria met');
    setModalComments(claim.insurerComments || '');
    setModalPaymentStatus(claim.paymentStatus || 'PENDING_PAYER');
    setProcessSuccess('');
  };

  const handleCloseReviewModal = () => {
    setSelectedClaim(null);
    setProcessSuccess('');
  };

  const handleProcessSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClaim) return;

    setIsProcessing(true);
    setProcessSuccess('');

    try {
      const reviewPayload = {
        status: modalStatus,
        denialReason: modalStatus === 'DENIED' ? modalReason : null,
        allowedAmount: modalStatus === 'ACCEPTED' ? parseFloat(modalAllowedAmount) || selectedClaim.totalBillAmount : 0,
        comments: modalComments,
        paymentStatus: modalStatus === 'ACCEPTED' ? modalPaymentStatus : 'UNPAID'
      };

      await reviewClaim(selectedClaim.id || selectedClaim.claimId, reviewPayload);

      setProcessSuccess(`Claim ${selectedClaim.claimId} successfully updated to ${modalStatus}!`);
      setTimeout(() => {
        handleCloseReviewModal();
        loadData();
      }, 1200);
    } catch (err) {
      alert('Failed to process claim: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsProcessing(false);
    }
  };

  // KPI calculations
  const totalAssigned = claims.length;
  const pendingCount = claims.filter((c) => ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'RESUBMITTED'].includes(c.status)).length;
  const acceptedCount = claims.filter((c) => c.status === 'ACCEPTED' || c.status === 'PAID').length;
  const deniedCount = claims.filter((c) => c.status === 'DENIED').length;
  const totalOutstanding = claims
    .filter((c) => c.paymentStatus !== 'PAID' && c.pendingAmount > 0)
    .reduce((sum, c) => sum + (c.pendingAmount || 0), 0);
  const totalPaid = claims.reduce((sum, c) => sum + (c.paidAmount || 0), 0);

  // Filtered claims
  const filteredClaims = claims.filter((c) => {
    const matchStatus = filterStatus === 'ALL' ||
      (filterStatus === 'PENDING' && ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'RESUBMITTED'].includes(c.status)) ||
      (filterStatus === 'ACCEPTED' && ['ACCEPTED', 'PAID'].includes(c.status)) ||
      (filterStatus === 'DENIED' && c.status === 'DENIED');

    const matchSearch = !searchTerm ||
      c.claimId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.patientReference?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchStatus && matchSearch;
  });

  return (
    <div style={{ padding: '1.75rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
        borderRadius: '16px',
        padding: '2rem 2.25rem',
        color: '#ffffff',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <span style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '700',
              letterSpacing: '0.06em',
              textTransform: 'uppercase'
            }}>
              ID: {companyId} • PAYER ADJUDICATION PORTAL
            </span>
            <span style={{
              background: '#10b981',
              color: '#ffffff',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.7rem',
              fontWeight: '800'
            }}>
              ACTIVE PAYER
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Welcome, {companyName}
          </h1>
          <p style={{ margin: '0.4rem 0 0', color: '#a7f3d0', fontSize: '0.95rem' }}>
            Authorized portal for adjudication, prior-auth verification, and claim settlement.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link
            to="/ar-aging"
            className="btn btn-secondary"
            style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)' }}
          >
            <Calendar size={15} />
            <span>AR Aging</span>
          </Link>
          <Link
            to="/payments"
            className="btn btn-secondary"
            style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)' }}
          >
            <CreditCard size={15} />
            <span>Payments</span>
          </Link>
          <Link
            to="/insurance/profile"
            className="btn btn-primary"
            style={{ background: '#ffffff', color: '#065f46', fontWeight: '700', border: 'none' }}
          >
            <Building2 size={15} />
            <span>Company Profile</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* Total Assigned */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              Assigned Claims
            </span>
            <FileText size={20} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a' }}>
            {totalAssigned}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Total claims submitted to your firm
          </div>
        </div>

        {/* Pending Adjudication */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          border: '1px solid #fed7aa',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#c2410c', textTransform: 'uppercase' }}>
              Pending Review
            </span>
            <Clock size={20} color="#f97316" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#ea580c' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9a3412', marginTop: '0.25rem' }}>
            Awaiting decision from adjudicator
          </div>
        </div>

        {/* Accepted Claims */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          border: '1px solid #bbf7d0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#15803d', textTransform: 'uppercase' }}>
              Accepted Claims
            </span>
            <CheckCircle2 size={20} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#16a34a' }}>
            {acceptedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '0.25rem' }}>
            Approved for disbursement
          </div>
        </div>

        {/* Denied Claims */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          border: '1px solid #fecaca',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#b91c1c', textTransform: 'uppercase' }}>
              Denied Claims
            </span>
            <XCircle size={20} color="#dc2626" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#dc2626' }}>
            {deniedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#991b1b', marginTop: '0.25rem' }}>
            Requires clinic correction / resubmission
          </div>
        </div>

        {/* Outstanding Pending Amount */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              Outstanding Balance
            </span>
            <IndianRupee size={20} color="#2563eb" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#1e293b' }}>
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Total pending payer remittance
          </div>
        </div>
      </div>

      {/* Claims Management Table Section */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden'
      }}>
        {/* Table Header & Controls */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Claims Assigned to {companyName}
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.825rem', color: '#64748b' }}>
              Review electronic claims, verify medical coverage, and adjust decision status.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search claim or patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.825rem'
                }}
              />
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
              {['ALL', 'PENDING', 'ACCEPTED', 'DENIED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: filterStatus === st ? '#ffffff' : 'transparent',
                    color: filterStatus === st ? '#0f172a' : '#64748b',
                    fontWeight: filterStatus === st ? '700' : '600',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    boxShadow: filterStatus === st ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              onClick={loadData}
              className="btn btn-secondary btn-sm"
              title="Refresh Assigned Claims"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Claims Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>Claim ID</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Patient Name & Ref</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Bill Amount</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Allowed Amount</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Decision Status</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Days Pending</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                      <Building2 size={36} color="#cbd5e1" style={{ margin: '0 auto 0.75rem' }} />
                      <div style={{ fontWeight: '700', color: '#475569' }}>No Claims Found</div>
                      <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        No claims currently match the criteria for {companyName}.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => {
                  const isAccepted = claim.status === 'ACCEPTED' || claim.status === 'PAID';
                  const isDenied = claim.status === 'DENIED';
                  const isUnderReview = claim.status === 'UNDER_REVIEW';

                  return (
                    <tr
                      key={claim.id || claim.claimId}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '1rem 1.25rem', fontWeight: '700', color: '#1e293b' }}>
                        <Link
                          to={`/claims/${claim.id || claim.claimId}`}
                          style={{ color: '#2563eb', textDecoration: 'none' }}
                        >
                          {claim.claimId}
                        </Link>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>
                          {claim.patientName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Ref: {claim.patientReference || 'PT-REF'}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', fontWeight: '700', color: '#0f172a' }}>
                        ₹{(claim.totalBillAmount || claim.claimAmount || 0).toLocaleString('en-IN')}
                      </td>

                      <td style={{ padding: '1rem 1.25rem', color: '#059669', fontWeight: '600' }}>
                        {claim.allowedAmount > 0
                          ? `₹${claim.allowedAmount.toLocaleString('en-IN')}`
                          : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Pending Adjudication</span>}
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          backgroundColor: isAccepted ? '#ecfdf5' : (isDenied ? '#fef2f2' : (isUnderReview ? '#eff6ff' : '#fff7ed')),
                          color: isAccepted ? '#065f46' : (isDenied ? '#991b1b' : (isUnderReview ? '#1e40af' : '#9a3412'))
                        }}>
                          {isAccepted && <CheckCircle2 size={13} />}
                          {isDenied && <XCircle size={13} />}
                          {!isAccepted && !isDenied && <Clock size={13} />}
                          {claim.status}
                        </span>
                        {isDenied && claim.denialReason && (
                          <div style={{ fontSize: '0.7rem', color: '#b91c1c', marginTop: '0.25rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={claim.denialReason}>
                            {claim.denialReason}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '1rem 1.25rem', color: '#64748b' }}>
                        <span style={{
                          fontWeight: '600',
                          color: (claim.daysPending || 0) > 60 ? '#dc2626' : ((claim.daysPending || 0) > 30 ? '#d97706' : '#1e293b')
                        }}>
                          {claim.daysPending || 1} Days
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenReviewModal(claim)}
                          className="btn btn-primary btn-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.775rem',
                            padding: '0.35rem 0.75rem'
                          }}
                        >
                          <Edit3 size={13} />
                          <span>Process Claim</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Claim Modal */}
      {selectedClaim && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Adjudicate Claim: {selectedClaim.claimId}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Payer: <strong>{companyName}</strong>
                </span>
              </div>
              <button
                onClick={handleCloseReviewModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleProcessSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Claim Overview Box */}
              <div style={{
                background: '#f1f5f9',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                fontSize: '0.8rem'
              }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Patient</span>
                  <strong style={{ color: '#0f172a' }}>{selectedClaim.patientName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Billed Amount</span>
                  <strong style={{ color: '#0f172a' }}>₹{(selectedClaim.totalBillAmount || selectedClaim.claimAmount || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Current Status</span>
                  <strong style={{ color: '#2563eb' }}>{selectedClaim.status}</strong>
                </div>
              </div>

              {/* Success Notification */}
              {processSuccess && (
                <div style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#065f46',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle2 size={16} />
                  <span>{processSuccess}</span>
                </div>
              )}

              {/* Status Decision Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                  Decision Status
                </label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}
                >
                  <option value="ACCEPTED">ACCEPTED (Approve for payment)</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW (Requires clinical audit)</option>
                  <option value="PENDING">PENDING (Awaiting medical records)</option>
                  <option value="DENIED">DENIED (Reject claim)</option>
                </select>
              </div>

              {/* Conditional: If ACCEPTED */}
              {modalStatus === 'ACCEPTED' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                      Allowed Amount (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={modalAllowedAmount}
                      onChange={(e) => setModalAllowedAmount(e.target.value)}
                      placeholder="e.g. 100000"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                      Payment Status
                    </label>
                    <select
                      value={modalPaymentStatus}
                      onChange={(e) => setModalPaymentStatus(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="PENDING_PAYER">Pending Remittance</option>
                      <option value="PAID">Mark as Paid / Remitted</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Conditional: If DENIED */}
              {modalStatus === 'DENIED' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#b91c1c', marginBottom: '0.35rem' }}>
                    Denial Reason
                  </label>
                  <select
                    value={modalReason}
                    onChange={(e) => setModalReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #f87171',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="Insurance Eligibility Not Verified / Expired">Insurance Eligibility Not Verified / Expired</option>
                    <option value="Missing Prior Authorization">Missing Prior Authorization</option>
                    <option value="Incomplete / Invalid Coding (ICD/CPT)">Incomplete / Invalid Coding (ICD/CPT)</option>
                    <option value="Non-Covered Procedure under Policy">Non-Covered Procedure under Policy</option>
                    <option value="Duplicate Claim Submission">Duplicate Claim Submission</option>
                    <option value="Timely Filing Window Exceeded">Timely Filing Window Exceeded</option>
                  </select>
                </div>
              )}

              {/* Comments */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Adjudicator Comments / Explanations
                </label>
                <textarea
                  rows="3"
                  value={modalComments}
                  onChange={(e) => setModalComments(e.target.value)}
                  placeholder="Enter official notes for RCM hospital billing team..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleCloseReviewModal}
                  className="btn btn-secondary"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn btn-primary"
                  style={{
                    background: modalStatus === 'DENIED' ? '#dc2626' : (modalStatus === 'ACCEPTED' ? '#059669' : '#2563eb'),
                    borderColor: 'transparent'
                  }}
                >
                  {isProcessing ? 'Transmitting Decision...' : `Confirm ${modalStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
