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
  Mail,
  CheckCircle,
  HelpCircle,
  Sliders,
  Flame,
  Coins,
  FileCheck2,
  FileWarning
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
  recordFollowUp,
  reviewClaim,
  getClaimEmails,
  sendClaimStageEmail
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import RiskMeter from '../components/RiskMeter';
import ClaimTimeline from '../components/ClaimTimeline';

export default function ClaimDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isInsuranceCompany, isRcmAdmin } = useAuth();

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
    patientReference: '',
    patientEmail: '',
    payerName: '',
    claimAmount: 0,
    eligibilityVerified: true,
    authorizationAvailable: true,
    codingComplete: true,
    documentationComplete: true,
    previousDenials: 0
  });

  // Payer Adjudication Modal State
  const [showAdjudicateModal, setShowAdjudicateModal] = useState(false);
  const [adjudicateForm, setAdjudicateForm] = useState({
    status: 'ACCEPTED',
    allowedAmount: '',
    denialReason: 'Prior Authorization Absent: Pre-auth required for surgical procedure code 99214',
    customReason: '',
    comments: ''
  });

  // Lifecycle Email Notifications State
  const [emails, setEmails] = useState([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [previewEmail, setPreviewEmail] = useState(null);
  const [showCustomEmailModal, setShowCustomEmailModal] = useState(false);
  const [customEmailTarget, setCustomEmailTarget] = useState('balakrishnana206k@gmail.com');

  const loadClaimData = async () => {
    try {
      setLoading(true);
      const [cRes, hRes, eRes] = await Promise.all([
        getClaim(id),
        getClaimHistory(id),
        getClaimEmails(id)
      ]);
      setClaim(cRes.data);
      setHistory(hRes.data || []);
      setEmails(eRes.data || []);
      setCustomEmailTarget(cRes.data.patientEmail || 'balakrishnana206k@gmail.com');
      setEditForm({
        patientName: cRes.data.patientName || '',
        patientReference: cRes.data.patientReference || '',
        patientEmail: cRes.data.patientEmail || '',
        payerName: cRes.data.payerName || '',
        claimAmount: cRes.data.totalBillAmount || cRes.data.claimAmount || 0,
        eligibilityVerified: !!cRes.data.eligibilityVerified,
        authorizationAvailable: !!cRes.data.authorizationAvailable,
        codingComplete: !!cRes.data.codingComplete,
        documentationComplete: !!cRes.data.documentationComplete,
        previousDenials: cRes.data.previousDenials || 0
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

  const handleSendStageEmail = async (targetEmail = null) => {
    try {
      setSendingEmail(true);
      const to = targetEmail || claim.patientEmail || 'balakrishnana206k@gmail.com';
      await sendClaimStageEmail(claim.claimId, to);
      showNotification(`Process Lifecycle Stage progress email successfully sent to ${to}!`);
      const eRes = await getClaimEmails(claim.claimId);
      setEmails(eRes.data || []);
      setShowCustomEmailModal(false);
    } catch (err) {
      console.error(err);
      showNotification('Failed to dispatch lifecycle stage email', 'danger');
    } finally {
      setSendingEmail(false);
    }
  };

  // Actions
  const handlePredict = async () => {
    try {
      setActionLoading(true);
      const res = await predictClaimRisk(claim.claimId);
      setClaim(res.data);
      const hRes = await getClaimHistory(claim.claimId);
      setHistory(hRes.data || []);
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
      setHistory(hRes.data || []);
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
      setHistory(hRes.data || []);
      showNotification('Corrected claim resubmitted successfully!');
    } catch (err) {
      console.error(err);
      showNotification('Error resubmitting claim', 'danger');
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
      setHistory(hRes.data || []);
      showNotification('Claim corrections saved successfully! Status updated to CORRECTED.');
    } catch (err) {
      console.error(err);
      showNotification('Error updating claim', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // Payer Adjudication Submit
  const handleAdjudicateSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      setActionLoading(true);
      const isDeny = adjudicateForm.status === 'DENIED';
      const reason = isDeny
        ? (adjudicateForm.denialReason === 'CUSTOM' ? adjudicateForm.customReason : adjudicateForm.denialReason)
        : null;
      const allowed = adjudicateForm.status === 'ACCEPTED'
        ? Number(adjudicateForm.allowedAmount || claim.totalBillAmount || claim.claimAmount)
        : 0;

      const reviewData = {
        status: adjudicateForm.status,
        allowedAmount: allowed,
        denialReason: reason,
        comments: adjudicateForm.comments || 'Payer adjudication determination recorded.',
        paymentStatus: adjudicateForm.status === 'ACCEPTED' ? 'PENDING' : (isDeny ? 'UNPAID' : claim.paymentStatus)
      };

      const res = await reviewClaim(claim.claimId, reviewData);
      setClaim(res.data);
      setShowAdjudicateModal(false);
      const hRes = await getClaimHistory(claim.claimId);
      setHistory(hRes.data || []);
      showNotification(
        `Adjudication completed: Claim is now ${adjudicateForm.status}!`,
        adjudicateForm.status === 'DENIED' ? 'warning' : 'success'
      );
    } catch (err) {
      console.error('Error adjudicating claim:', err);
      showNotification('Error recording claim adjudication.', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickApprove = () => {
    setAdjudicateForm({
      status: 'ACCEPTED',
      allowedAmount: claim.totalBillAmount || claim.claimAmount,
      denialReason: '',
      customReason: '',
      comments: 'Adjudicated & approved by insurance payer reviewer.'
    });
    setShowAdjudicateModal(true);
  };

  const handleQuickDeny = () => {
    setAdjudicateForm({
      status: 'DENIED',
      allowedAmount: 0,
      denialReason: 'Prior Authorization Absent: Pre-auth required for surgical procedure code 99214',
      customReason: '',
      comments: 'Claim denied due to missing pre-authorization documentation.'
    });
    setShowAdjudicateModal(true);
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
            <span>{isInsuranceCompany() ? 'Assigned Claims' : 'Claims List'}</span>
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

        {/* Action Group: Tailored for Insurance Company vs RCM Admin */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {isInsuranceCompany() ? (
            /* Insurance Company Adjudicator Actions */
            <>
              <button
                onClick={() => {
                  setAdjudicateForm({
                    status: claim.status === 'DENIED' ? 'DENIED' : 'ACCEPTED',
                    allowedAmount: claim.allowedAmount || claim.totalBillAmount || claim.claimAmount,
                    denialReason: claim.denialReason || 'Prior Authorization Absent: Pre-auth required for surgical procedure code 99214',
                    customReason: '',
                    comments: ''
                  });
                  setShowAdjudicateModal(true);
                }}
                disabled={actionLoading}
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
              >
                <Sliders size={15} />
                <span>Review & Adjudicate</span>
              </button>

              {claim.status !== 'ACCEPTED' && claim.status !== 'PAID' && (
                <button
                  onClick={handleQuickApprove}
                  disabled={actionLoading}
                  className="btn btn-success"
                >
                  <CheckCircle2 size={15} />
                  <span>Approve Claim</span>
                </button>
              )}

              {claim.status !== 'DENIED' && (
                <button
                  onClick={handleQuickDeny}
                  disabled={actionLoading}
                  className="btn btn-danger"
                >
                  <XCircle size={15} />
                  <span>Issue Denial</span>
                </button>
              )}

              {!isPaid && (
                <button
                  onClick={handleProcessPayment}
                  disabled={actionLoading}
                  className="btn btn-secondary"
                  style={{ borderColor: '#86efac', color: '#065f46', background: '#f0fdf4' }}
                >
                  <DollarSign size={15} />
                  <span>Settle Full Balance</span>
                </button>
              )}
            </>
          ) : (
            /* RCM Admin Hospital Billing Actions */
            <>
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

              <button
                onClick={() => setShowEditModal(true)}
                disabled={actionLoading}
                className="btn btn-secondary"
              >
                <Edit3 size={16} />
                <span>Edit / Correct</span>
              </button>

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

              {!isPaid && (
                <button
                  onClick={handleProcessPayment}
                  disabled={actionLoading}
                  className="btn btn-success"
                  style={{ background: '#059669', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)' }}
                >
                  <DollarSign size={16} />
                  <span>Settle Full Balance</span>
                </button>
              )}

              {/* Admin Adjudication Override Button */}
              <button
                onClick={() => {
                  setAdjudicateForm({
                    status: claim.status === 'DENIED' ? 'DENIED' : 'ACCEPTED',
                    allowedAmount: claim.allowedAmount || claim.totalBillAmount || claim.claimAmount,
                    denialReason: claim.denialReason || 'Prior Authorization Absent: Pre-auth required for surgical procedure code 99214',
                    customReason: '',
                    comments: ''
                  });
                  setShowAdjudicateModal(true);
                }}
                disabled={actionLoading}
                className="btn btn-secondary btn-sm"
                title="Simulate or override payer adjudication"
              >
                <Sliders size={14} />
                <span>Payer Adjudication</span>
              </button>
            </>
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
          {isRcmAdmin() && (
            <button
              onClick={() => setShowEditModal(true)}
              className="btn btn-danger"
            >
              <RotateCcw size={16} />
              <span>Correct & Resubmit</span>
            </button>
          )}
        </div>
      )}

      {/* Main Grid: Details + AI Intelligence + Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Left Column: Claim Financial Details & Priority */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Billing Priority & Financial Status Card */}
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
                <span style={{ fontSize: '0.7rem', color: '#991b1b', textTransform: 'uppercase', fontWeight: '700' }}>Pending</span>
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
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>
                  <Mail size={12} style={{ display: 'inline', marginRight: '3px' }} /> Patient Email
                </span>
                <strong style={{ color: claim.patientEmail ? '#2563eb' : '#94a3b8', fontSize: '0.85rem' }}>
                  {claim.patientEmail || 'Not provided'}
                </strong>
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
              {isRcmAdmin() && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="btn btn-secondary btn-sm"
                >
                  <Sliders size={12} /> Toggle
                </button>
              )}
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

          {/* Process Lifecycle Stage Email Notifications Section */}
          <div className="card" style={{ marginTop: '1.5rem', border: '1px solid #bfdbfe', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e3a8a' }}>
                  <Mail size={18} color="#2563eb" />
                  Process Lifecycle Stage Progress Notifications
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Real-time milestone alerts dispatched across all 5 lifecycle stages
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: '#1d4ed8',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <Mail size={12} />
                  {claim.patientEmail || 'balakrishnana206k@gmail.com'}
                </span>

                <button
                  type="button"
                  onClick={() => handleSendStageEmail()}
                  disabled={sendingEmail}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                >
                  <Send size={13} />
                  <span>{sendingEmail ? 'Sending...' : 'Send Stage Email Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCustomEmailModal(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.8rem' }}
                  title="Send to another email address"
                >
                  Send to Other...
                </button>
              </div>
            </div>

            {/* Email Dispatch History Log */}
            {emails.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', background: '#ffffff', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <Mail size={28} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>No email dispatches recorded yet</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Click "Send Stage Email Now" above to dispatch the current stage progress report to <strong>{claim.patientEmail || 'balakrishnana206k@gmail.com'}</strong>.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {emails.map((em, idx) => (
                  <div
                    key={em.id || idx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#eff6ff',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '0.78rem',
                        flexShrink: 0
                      }}>
                        S{em.stageIndex || 1}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>
                            {em.stageName}
                          </span>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: '700',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '9999px',
                            background: '#ecfdf5',
                            color: '#047857',
                            border: '1px solid #a7f3d0'
                          }}>
                            ✓ {em.deliveryStatus || 'DELIVERED'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#475569', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '0.15rem' }}>
                          {em.subject}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                          Recipient: <strong style={{ color: '#334155' }}>{em.patientEmail}</strong> &bull; {new Date(em.sentAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewEmail(em)}
                      className="btn btn-secondary btn-sm"
                      style={{ flexShrink: 0, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <FileText size={12} />
                      <span>Preview Email</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Payer Adjudication Modal */}
      {showAdjudicateModal && (
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
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '540px', width: '100%', padding: '2rem', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--navy-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={20} color="#2563eb" />
                Payer Adjudication Determination
              </h3>
              <button onClick={() => setShowAdjudicateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b' }}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Claim: <strong className="font-mono">{claim.claimId}</strong> • Patient: <strong>{claim.patientName}</strong> • Bill: <strong>₹{(claim.totalBillAmount || claim.claimAmount)?.toLocaleString()}</strong>
            </p>

            <form onSubmit={handleAdjudicateSubmit}>
              {/* Adjudication Status Selection */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: '700' }}>Adjudication Decision *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setAdjudicateForm((p) => ({ ...p, status: 'ACCEPTED', allowedAmount: claim.totalBillAmount || claim.claimAmount }))}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: '8px',
                      border: adjudicateForm.status === 'ACCEPTED' ? '2px solid #059669' : '1px solid #e2e8f0',
                      background: adjudicateForm.status === 'ACCEPTED' ? '#ecfdf5' : '#ffffff',
                      color: adjudicateForm.status === 'ACCEPTED' ? '#065f46' : '#64748b',
                      fontWeight: '700',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <CheckCircle2 size={18} color="#059669" />
                    <span>Approve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjudicateForm((p) => ({ ...p, status: 'DENIED', allowedAmount: 0 }))}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: '8px',
                      border: adjudicateForm.status === 'DENIED' ? '2px solid #dc2626' : '1px solid #e2e8f0',
                      background: adjudicateForm.status === 'DENIED' ? '#fef2f2' : '#ffffff',
                      color: adjudicateForm.status === 'DENIED' ? '#991b1b' : '#64748b',
                      fontWeight: '700',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <XCircle size={18} color="#dc2626" />
                    <span>Deny</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjudicateForm((p) => ({ ...p, status: 'UNDER_REVIEW' }))}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: '8px',
                      border: adjudicateForm.status === 'UNDER_REVIEW' ? '2px solid #d97706' : '1px solid #e2e8f0',
                      background: adjudicateForm.status === 'UNDER_REVIEW' ? '#fffbeb' : '#ffffff',
                      color: adjudicateForm.status === 'UNDER_REVIEW' ? '#92400e' : '#64748b',
                      fontWeight: '700',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Clock size={18} color="#d97706" />
                    <span>Hold / Review</span>
                  </button>
                </div>
              </div>

              {/* If Accepted: Allowed Amount */}
              {adjudicateForm.status === 'ACCEPTED' && (
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: '700' }}>Allowed Settlement Amount (₹) *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={adjudicateForm.allowedAmount}
                    onChange={(e) => setAdjudicateForm((p) => ({ ...p, allowedAmount: e.target.value }))}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Total claim bill amount: ₹{(claim.totalBillAmount || claim.claimAmount)?.toLocaleString()}
                  </span>
                </div>
              )}

              {/* If Denied: Denial Reason Selector */}
              {adjudicateForm.status === 'DENIED' && (
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: '700' }}>Official Denial Reason *</label>
                  <select
                    className="form-control"
                    value={adjudicateForm.denialReason}
                    onChange={(e) => setAdjudicateForm((p) => ({ ...p, denialReason: e.target.value }))}
                    style={{ marginBottom: '0.5rem' }}
                  >
                    <option value="Prior Authorization Absent: Pre-auth required for surgical procedure code 99214">
                      Prior Authorization Absent: Pre-auth required for procedure
                    </option>
                    <option value="Eligibility Issue: Coverage expired or inactive on date of service">
                      Eligibility Issue: Coverage expired or inactive on service date
                    </option>
                    <option value="Invalid Coding / CPT Modifier: Consultation code requires modifier -25">
                      Coding Error: Consultation code requires modifier -25
                    </option>
                    <option value="Filing Limit Exceeded: Claim submitted past 90-day adjudication window">
                      Filing Limit Exceeded: Submitted past payer adjudication window
                    </option>
                    <option value="Documentation Deficient: Operative notes missing physician signature">
                      Documentation Deficient: Operative notes missing required signature
                    </option>
                    <option value="CUSTOM">Other / Custom Reason...</option>
                  </select>

                  {adjudicateForm.denialReason === 'CUSTOM' && (
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Specify custom denial reason..."
                      value={adjudicateForm.customReason}
                      onChange={(e) => setAdjudicateForm((p) => ({ ...p, customReason: e.target.value }))}
                      required
                    />
                  )}
                </div>
              )}

              {/* Reviewer Notes */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Adjudication Comments / Notes</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="e.g. Coverage verified; prior authorization approved on file."
                  value={adjudicateForm.comments}
                  onChange={(e) => setAdjudicateForm((p) => ({ ...p, comments: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowAdjudicateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  className={adjudicateForm.status === 'DENIED' ? 'btn btn-danger' : 'btn btn-success'}
                  disabled={actionLoading}
                >
                  Confirm Adjudication ({adjudicateForm.status})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <label className="form-label">Patient / User Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="patient@gmail.com"
                    value={editForm.patientEmail}
                    onChange={(e) => setEditForm((p) => ({ ...p, patientEmail: e.target.value }))}
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
                <div className="form-group">
                  <label className="form-label">Patient MRN / Reference</label>
                  <input
                    type="text"
                    className="form-control font-mono"
                    value={editForm.patientReference}
                    onChange={(e) => setEditForm((p) => ({ ...p, patientReference: e.target.value }))}
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

      {/* Email Preview Modal */}
      {previewEmail && (
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
          zIndex: 110,
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '720px',
            width: '100%',
            height: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', background: '#0f172a', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#38bdf8', fontWeight: '800' }}>
                  Lifecycle Email Dispatch Preview
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff', marginTop: '0.2rem' }}>
                  {previewEmail.subject}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  To: <span style={{ color: '#f8fafc', fontWeight: '600' }}>{previewEmail.patientEmail}</span> &bull; Status: <span style={{ color: '#4ade80' }}>{previewEmail.deliveryStatus}</span>
                </div>
              </div>
              <button
                onClick={() => setPreviewEmail(null)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ffffff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>

            {/* Rendered HTML iframe */}
            <div style={{ flex: 1, background: '#f1f5f9', overflow: 'hidden' }}>
              <iframe
                title="Email Preview"
                srcDoc={previewEmail.htmlBody}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '0.85rem 1.5rem', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Sent: {new Date(previewEmail.sentAt).toLocaleString()}
              </span>
              <button onClick={() => setPreviewEmail(null)} className="btn btn-secondary btn-sm">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send to Custom Email Modal */}
      {showCustomEmailModal && (
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
          zIndex: 110,
          padding: '1rem'
        }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '1.75rem', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--navy-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={18} color="#2563eb" />
                Dispatch Stage Progress Email
              </h3>
              <button onClick={() => setShowCustomEmailModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b' }}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Send an instant report of the current lifecycle progress for claim <strong>{claim.claimId}</strong>.
            </p>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: '700' }}>Recipient Email Address</label>
              <input
                type="email"
                className="form-control"
                value={customEmailTarget}
                onChange={(e) => setCustomEmailTarget(e.target.value)}
                placeholder="balakrishnana206k@gmail.com"
                required
              />
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setCustomEmailTarget('balakrishnana206k@gmail.com')}
                  style={{ fontSize: '0.72rem', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: '4px', padding: '0.15rem 0.4rem', cursor: 'pointer' }}
                >
                  ⚡ balakrishnana206k@gmail.com
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={() => setShowCustomEmailModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSendStageEmail(customEmailTarget)}
                className="btn btn-primary"
                disabled={sendingEmail || !customEmailTarget}
              >
                {sendingEmail ? 'Sending...' : 'Send Notification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
