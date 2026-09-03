import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  DollarSign,
  AlertTriangle,
  ArrowLeft,
  Edit3,
  Clock,
  ShieldCheck,
  Building,
  User,
  CheckCircle,
  HelpCircle,
  Sliders,
  Flame,
  Coins
} from 'lucide-react';
import {
  getClaim,
  getClaimHistory,
  predictClaimRisk,
  submitClaim,
  resubmitClaim,
  correctClaim,
  acceptClaim,
  denyClaim,
  setPendingClaim,
  payClaim,
  recordPartialPayment,
  recordFollowUp
} from '../services/api';
import StatusBadge from '../components/StatusBadge';
import RiskMeter from '../components/RiskMeter';
import ClaimTimeline from '../components/ClaimTimeline';

export default function ClaimDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [claim, setClaim] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Partial Payment Modal State
  const [showPartialModal, setShowPartialModal] = useState(false);
  const [partialAmount, setPartialAmount] = useState('');

  // Edit/Correction Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    patientName: '',
    payerName: '',
    claimAmount: 0,
    eligibilityVerified: true,
    authorizationAvailable: true,
    codingComplete: true,
    documentationComplete: true,
    previousDenials: 0
  });

  const loadClaimData = async () => {
    try {
      setLoading(true);
      const [cRes, hRes] = await Promise.all([
        getClaim(id),
        getClaimHistory(id)
      ]);
      setClaim(cRes.data);
      setHistory(hRes.data);
      setEditForm({
        patientName: cRes.data.patientName,
        payerName: cRes.data.payerName,
        claimAmount: cRes.data.totalBillAmount || cRes.data.claimAmount,
        eligibilityVerified: cRes.data.eligibilityVerified,
        authorizationAvailable: cRes.data.authorizationAvailable,
        codingComplete: cRes.data.codingComplete,
        documentationComplete: cRes.data.documentationComplete,
        previousDenials: cRes.data.previousDenials
      });
    } catch (err) {
      console.error('Error fetching claim:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaimData();
  }, [id]);

  const showNotification = (msg, type = 'success') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // Actions
  const handlePredict = async () => {
    try {
      setActionLoading(true);
      const res = await predictClaimRisk(claim.claimId);
      setClaim(res.data);
      const hRes = await getClaimHistory(claim.claimId);
      setHistory(hRes.data);
      showNotification(`AI Check Complete: ${res.data.riskScore}% (${res.data.riskLevel} Risk)`);
    } catch (err) {
      console.error(err);
      showNotification('Could not connect to AI service. Fallback evaluated.', 'warning');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setActionLoading(true);
      const res = await submitClaim(claim.claimId);
      setClaim(res.data);
      const hRes = await getClaimHistory(claim.claimId);
      setHistory(hRes.data);
      if (res.data.status === 'ACCEPTED') {
        showNotification('Claim successfully submitted & ACCEPTED by payer!');
      } else if (res.data.status === 'DENIED') {
        showNotification(`Claim submitted but DENIED: ${res.data.denialReason}`, 'danger');
      } else {
        showNotification('Claim submitted to payer. Adjudication pending.');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error submitting claim', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResubmit = async () => {
    try {
      setActionLoading(true);
      const res = await resubmitClaim(claim.claimId);
      setClaim(res.data);
      const hRes = await getClaimHistory(claim.claimId);
      setHistory(hRes.data);
      showNotification('Corrected claim resubmitted successfully!');
    } catch (err) {
      console.error(err);
      showNotification('Error resubmitting claim', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptManual = async () => {
    try {
      setActionLoading(true);
      const res = await acceptClaim(claim.claimId);
      setClaim(res.data);
      const hRes = await getClaimHistory(claim.claimId);
      setHistory(hRes.data);
      showNotification('Simulated Payer Acceptance recorded.');
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDenyManual = async () => {
    try {
      setActionLoading(true);
      const reason = prompt('Enter denial reason:', 'Eligibility verification missing') || 'Eligibility Issue';
      const res = await denyClaim(claim.claimId, reason);
      setClaim(res.data);
      const hRes = await getClaimHistory(claim.claimId);
      setHistory(hRes.data);
      showNotification(`Claim marked as DENIED: ${reason}`, 'danger');
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetPending = async () => {
    try {
      setActionLoading(true);
      const res = await setPendingClaim(claim.claimId);
      setClaim(res.data);
      const hRes = await getClaimHistory(claim.claimId);
      setHistory(hRes.data);
      showNotification('Claim status changed to PENDING.');
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    try {
      setActionLoading(true);
      const remaining = claim.pendingAmount > 0 ? claim.pendingAmount : (claim.totalBillAmount || claim.claimAmount);
      await payClaim(claim.claimId, {
        amount: remaining,
        transactionReference: 'TXN-' + Math.floor(100000 + Math.random() * 900000)
      });
      await loadClaimData();
      showNotification(`Full settlement of ₹${remaining.toLocaleString()} processed successfully!`);
    } catch (err) {
      console.error(err);
      showNotification('Error processing payment', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePartialPayment = async (e) => {
    if (e) e.preventDefault();
    if (!partialAmount || Number(partialAmount) <= 0) return;
    try {
      setActionLoading(true);
      const amt = Number(partialAmount);
      await recordPartialPayment(claim.claimId, {
        amount: amt,
        transactionReference: 'TXN-PARTIAL-' + Math.floor(100000 + Math.random() * 900000)
      });
      setShowPartialModal(false);
      setPartialAmount('');
      await loadClaimData();
      showNotification(`Recorded partial payment of ₹${amt.toLocaleString()}! Priority updated.`);
    } catch (err) {
      console.error(err);
      showNotification('Error recording partial payment', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveCorrection = async (e) => {
    if (e) e.preventDefault();
    try {
      setActionLoading(true);
      const res = await correctClaim(claim.claimId, editForm);
      setClaim(res.data);
      setShowEditModal(false);
      const hRes = await getClaimHistory(claim.claimId);
      setHistory(hRes.data);
      showNotification('Claim updated & corrected! Ready to re-check risk.');
    } catch (err) {
      console.error(err);
      showNotification('Error updating claim', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !claim) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '4rem' }}>
        <p>Loading claim intelligence data...</p>
      </div>
    );
  }

  const isPaid = claim.status === 'PAID' || claim.paymentStatus === 'PAID';
  const isAccepted = claim.status === 'ACCEPTED';
  const isDenied = claim.status === 'DENIED';

  return (
    <div className="page-wrapper">
      {/* Top Notification Banner */}
      {message && (
        <div style={{
          backgroundColor: message.type === 'danger' ? '#fef2f2' : (message.type === 'warning' ? '#fffbeb' : '#ecfdf5'),
          border: `1px solid ${message.type === 'danger' ? '#fecaca' : (message.type === 'warning' ? '#fde68a' : '#a7f3d0')}`,
          color: message.type === 'danger' ? '#991b1b' : (message.type === 'warning' ? '#92400e' : '#065f46'),
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {message.type === 'danger' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/claims" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} />
            <span>Claims List</span>
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h2 className="font-mono" style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--navy-dark)', margin: 0 }}>
                {claim.claimId}
              </h2>
              <StatusBadge status={claim.status} />
              {claim.billingPriority && <StatusBadge status={claim.billingPriority} type="priority" />}
              {claim.riskLevel && <StatusBadge status={claim.riskLevel} type="risk" />}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
              Created on {new Date(claim.createdAt).toLocaleDateString()} • Reference: {claim.patientReference}
            </p>
          </div>
        </div>

        {/* Quick Lifecycle Action Group */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* 1. Run AI Check */}
          <button
            onClick={handlePredict}
            disabled={actionLoading}
            className="btn btn-primary"
            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
            title="Evaluate denial probability with Random Forest Model"
          >
            <Sparkles size={16} />
            <span>Check Denial Risk (AI)</span>
          </button>

          {/* 2. Correct / Edit */}
          <button
            onClick={() => setShowEditModal(true)}
            disabled={actionLoading}
            className="btn btn-secondary"
          >
            <Edit3 size={16} />
            <span>Edit / Correct</span>
          </button>

          {/* 3. Partial Payment */}
          {!isPaid && (
            <button
              onClick={() => setShowPartialModal(true)}
              disabled={actionLoading}
              className="btn btn-secondary"
              style={{ borderColor: '#93c5fd', color: '#1d4ed8' }}
            >
              <Coins size={16} />
              <span>Partial Payment</span>
            </button>
          )}

          {/* 4. Submit / Resubmit */}
          {isDenied ? (
            <button
              onClick={handleResubmit}
              disabled={actionLoading}
              className="btn btn-warning"
            >
              <RotateCcw size={16} />
              <span>Resubmit Claim</span>
            </button>
          ) : !isAccepted && !isPaid ? (
            <button
              onClick={handleSubmit}
              disabled={actionLoading}
              className="btn btn-success"
            >
              <Send size={16} />
              <span>Submit to Payer</span>
            </button>
          ) : null}

          {/* 5. Process Full Payment */}
          {!isPaid && (
            <button
              onClick={handleProcessPayment}
              disabled={actionLoading}
              className="btn btn-success"
              style={{ background: '#059669', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)' }}
            >
              <DollarSign size={16} />
              <span>Settle Full Balance (₹{(claim.pendingAmount || claim.totalBillAmount || claim.claimAmount)?.toLocaleString()})</span>
            </button>
          )}
        </div>
      </div>

      {/* Denial Reason Alert Box (If Denied) */}
      {isDenied && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b', fontWeight: '800', fontSize: '1.05rem' }}>
              <XCircle size={22} color="#dc2626" />
              Claim Denied by {claim.payerName}
            </div>
            <p style={{ color: '#7f1d1d', fontSize: '0.9rem', margin: '0.35rem 0 0 0', fontWeight: '500' }}>
              <strong>Denial Reason:</strong> {claim.denialReason || 'General Policy Ineligibility'}
            </p>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="btn btn-danger"
          >
            <RotateCcw size={16} />
            <span>Correct & Resubmit</span>
          </button>
        </div>
      )}

      {/* Main Grid: Details + AI Intelligence + Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Left Column: Claim Financial Details & Priority */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Billing Priority & Financial Status Card (NEW) */}
          <div className="card" style={{ border: '2px solid #fed7aa', backgroundColor: '#fffbf7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 className="card-title" style={{ margin: 0, color: '#9a3412', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Flame size={18} color="#ea580c" />
                Smart Billing Priority
              </h3>
              <StatusBadge status={claim.billingPriority} type="priority" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                <span style={{ fontSize: '0.7rem', color: '#7c2d12', textTransform: 'uppercase', fontWeight: '700' }}>Total Bill</span>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--navy-dark)' }}>
                  ₹{(claim.totalBillAmount || claim.claimAmount || 0).toLocaleString()}
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '0.7rem', color: '#047857', textTransform: 'uppercase', fontWeight: '700' }}>Paid</span>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#059669' }}>
                  ₹{(claim.paidAmount || 0).toLocaleString()}
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <span style={{ fontSize: '0.7rem', color: '#b91c1c', textTransform: 'uppercase', fontWeight: '700' }}>Pending</span>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#dc2626' }}>
                  ₹{(claim.pendingAmount !== undefined ? claim.pendingAmount : (claim.totalBillAmount || claim.claimAmount))?.toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#7c2d12', backgroundColor: '#ffffff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #fed7aa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>Pending Age: <strong>{claim.daysPending || 1} days</strong></span>
                <span>Priority Score: <strong>{claim.billingPriorityScore || 0}/100</strong></span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#9a3412', fontWeight: '600' }}>
                <strong>Reason:</strong> {claim.priorityReason || 'Based on pending balance & days overdue'}
              </p>
            </div>
          </div>

          {/* Claim Summary Card */}
          <div className="card">
            <h3 className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <Building size={18} color="#2563eb" />
              Patient & Payer Identification
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Patient Name</span>
                <strong style={{ color: 'var(--navy-dark)', fontSize: '1rem' }}>{claim.patientName}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Patient MRN</span>
                <strong className="font-mono">{claim.patientReference}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Insurance Payer</span>
                <strong style={{ color: 'var(--navy-dark)' }}>{claim.payerName}</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>{claim.payerType}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Payment Status</span>
                <StatusBadge status={claim.paymentStatus} type="payment" />
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Previous Denials</span>
                <strong>{claim.previousDenials} previous events</strong>
              </div>
            </div>
          </div>

          {/* Quality Flags */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 className="card-title" style={{ margin: 0 }}>
                <ShieldCheck size={18} color="#2563eb" />
                Pre-Submission Quality Flags
              </h3>
              <button
                onClick={() => setShowEditModal(true)}
                className="btn btn-secondary btn-sm"
              >
                <Sliders size={12} /> Toggle
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: claim.eligibilityVerified ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${claim.eligibilityVerified ? '#bbf7d0' : '#fecaca'}`
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Active Insurance Eligibility</span>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: claim.eligibilityVerified ? '#059669' : '#dc2626' }}>
                  {claim.eligibilityVerified ? '✓ Verified' : '✗ Unverified'}
                </span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: claim.authorizationAvailable ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${claim.authorizationAvailable ? '#bbf7d0' : '#fecaca'}`
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Prior Authorization Attached</span>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: claim.authorizationAvailable ? '#059669' : '#dc2626' }}>
                  {claim.authorizationAvailable ? '✓ Available' : '✗ Missing'}
                </span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: claim.codingComplete ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${claim.codingComplete ? '#bbf7d0' : '#fecaca'}`
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Diagnosis / CPT Coding Verified</span>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: claim.codingComplete ? '#059669' : '#dc2626' }}>
                  {claim.codingComplete ? '✓ Complete' : '✗ Incomplete'}
                </span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: claim.documentationComplete ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${claim.documentationComplete ? '#bbf7d0' : '#fecaca'}`
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Clinical Documentation Attached</span>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: claim.documentationComplete ? '#059669' : '#dc2626' }}>
                  {claim.documentationComplete ? '✓ Complete' : '✗ Missing Docs'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Risk Engine + Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* AI Denial Risk Card */}
          <div className="card" style={{ border: '2px solid #e0e7ff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="card-title" style={{ margin: 0, color: '#1e40af' }}>
                <Sparkles size={20} color="#2563eb" />
                AI Pre-Submission Denial Risk Analysis
              </h3>
              <button
                onClick={handlePredict}
                disabled={actionLoading}
                className="btn btn-secondary btn-sm"
              >
                Re-Run Check
              </button>
            </div>

            {claim.riskScore !== null && claim.riskScore !== undefined ? (
              <div>
                <RiskMeter score={claim.riskScore} level={claim.riskLevel} />

                {/* Detected Issues */}
                <div style={{ marginTop: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--navy-dark)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertTriangle size={15} color="#ef4444" />
                    Detected Risk Factors:
                  </h4>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {claim.detectedReasons && claim.detectedReasons.length > 0 ? (
                      claim.detectedReasons.map((reason, idx) => (
                        <li key={idx} style={{ color: reason.includes('Clean') ? '#059669' : '#dc2626', fontWeight: '600' }}>
                          {reason}
                        </li>
                      ))
                    ) : (
                      <li style={{ color: '#059669' }}>Clean claim quality metrics.</li>
                    )}
                  </ul>
                </div>

                {/* Recommended Corrective Actions */}
                <div style={{ marginTop: '1.25rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#065f46', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={16} color="#10b981" />
                    Recommended Pre-Submission Actions:
                  </h4>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#047857', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {claim.recommendations && claim.recommendations.length > 0 ? (
                      claim.recommendations.map((rec, idx) => (
                        <li key={idx} style={{ fontWeight: '500' }}>
                          {rec}
                        </li>
                      ))
                    ) : (
                      <li>{claim.recommendation || 'Proceed to submit.'}</li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  No risk prediction has been run for this claim yet.
                </p>
                <button onClick={handlePredict} className="btn btn-primary">
                  <Sparkles size={16} />
                  <span>Run AI Denial Risk Check Now</span>
                </button>
              </div>
            )}
          </div>

          {/* Complete Lifecycle Timeline */}
          <div className="card">
            <h3 className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <Clock size={18} color="#2563eb" />
              Claim Audit & Lifecycle Timeline
            </h3>
            <ClaimTimeline history={history} currentStatus={claim.status} createdAt={claim.createdAt} />
          </div>

        </div>
      </div>

      {/* Partial Payment Modal */}
      {showPartialModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '1.75rem', boxShadow: 'var(--shadow-xl)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
              Record Partial Payment
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Current Pending Balance: <strong>₹{(claim.pendingAmount || claim.totalBillAmount || claim.claimAmount)?.toLocaleString()}</strong>
            </p>

            <form onSubmit={handleSavePartialPayment}>
              <div className="form-group">
                <label className="form-label">Payment Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 30000"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  className="form-control"
                  min="1"
                  max={claim.pendingAmount}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowPartialModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  Record Partial Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Correct Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
            maxWidth: '620px',
            boxShadow: 'var(--shadow-xl)',
            padding: '2rem',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--navy-dark)' }}>
                Edit & Correct Claim ({claim.claimId})
              </h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCorrection}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Patient Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.patientName}
                    onChange={(e) => setEditForm((p) => ({ ...p, patientName: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Claim Amount (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editForm.claimAmount}
                    onChange={(e) => setEditForm((p) => ({ ...p, claimAmount: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                  Pre-Submission Quality Toggles (Fix Errors Here)
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Active Insurance Eligibility Verified</span>
                    <input
                      type="checkbox"
                      checked={editForm.eligibilityVerified}
                      onChange={(e) => setEditForm((p) => ({ ...p, eligibilityVerified: e.target.checked }))}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Prior Authorization Available / Attached</span>
                    <input
                      type="checkbox"
                      checked={editForm.authorizationAvailable}
                      onChange={(e) => setEditForm((p) => ({ ...p, authorizationAvailable: e.target.checked }))}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Diagnosis & Procedure Coding Complete</span>
                    <input
                      type="checkbox"
                      checked={editForm.codingComplete}
                      onChange={(e) => setEditForm((p) => ({ ...p, codingComplete: e.target.checked }))}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Supporting Clinical Documentation Complete</span>
                    <input
                      type="checkbox"
                      checked={editForm.documentationComplete}
                      onChange={(e) => setEditForm((p) => ({ ...p, documentationComplete: e.target.checked }))}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Corrections
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
