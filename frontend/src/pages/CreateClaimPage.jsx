import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FilePlus2,
  Sparkles,
  Save,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Building,
  User,
  Mail,
  DollarSign,
  ArrowRight,
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { createClaim, predictClaimRisk } from '../services/api';
import InsuranceCardScanner from '../components/InsuranceCardScanner';

export default function CreateClaimPage() {
  const navigate = useNavigate();

  // Fresh, clean patient form data - starts completely blank per patient with no shared state
  const [formData, setFormData] = useState({
    claimId: '',
    patientName: '',
    patientReference: '',
    patientEmail: '',
    payerName: 'CareShield Assurance',
    payerType: 'COMMERCIAL',
    claimAmount: 25000,
    eligibilityVerified: true,
    authorizationAvailable: false,
    codingComplete: true,
    documentationComplete: true,
    previousDenials: 0
  });

  const [scannedCardData, setScannedCardData] = useState(null);
  const [autoFilledFields, setAutoFilledFields] = useState(new Set());
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [checkingRisk, setCheckingRisk] = useState(false);

  const payers = [
    { name: 'CareShield Assurance', type: 'COMMERCIAL' },
    { name: 'Nova Health Insurance', type: 'PRIVATE' },
    { name: 'MediSecure Benefits', type: 'PRIVATE' },
    { name: 'HealthPrime Plan', type: 'COMMERCIAL' },
    { name: 'Unity Payer Network', type: 'PRIVATE' },
  ];

  const handleCardExtracted = (card) => {
    setScannedCardData(card);

    // Resolve matching payer in dropdown
    let matchedPayer = payers.find((p) => {
      const pLow = p.name.toLowerCase();
      const cardPayer = (card.payerName || card.insuranceCompanyName || '').toLowerCase();
      return pLow.includes(cardPayer) || cardPayer.includes(pLow) ||
        (cardPayer.includes('care') && pLow.includes('care')) ||
        (cardPayer.includes('nova') && pLow.includes('nova')) ||
        (cardPayer.includes('medi') && pLow.includes('medi')) ||
        (cardPayer.includes('prime') && pLow.includes('prime')) ||
        (cardPayer.includes('unity') && pLow.includes('unity'));
    });

    const targetPayerName = matchedPayer ? matchedPayer.name : (card.payerName || 'CareShield Assurance');
    const targetPayerType = matchedPayer ? matchedPayer.type : (card.payerType || 'COMMERCIAL');

    const nextForm = {
      ...formData,
      patientName: card.patientName || formData.patientName,
      patientReference: card.patientReference || card.memberId || formData.patientReference,
      claimId: card.claimId || card.claimSupportId || formData.claimId,
      patientEmail: card.patientEmail || formData.patientEmail,
      payerName: targetPayerName,
      payerType: targetPayerType,
      claimAmount: card.suggestedClaimAmount || formData.claimAmount || 45000,
      eligibilityVerified: card.eligibilityVerified !== undefined ? card.eligibilityVerified : true,
      authorizationAvailable: card.authorizationAvailable !== undefined ? card.authorizationAvailable : true,
      codingComplete: card.codingComplete !== undefined ? card.codingComplete : true,
      documentationComplete: card.documentationComplete !== undefined ? card.documentationComplete : true,
      previousDenials: 0
    };

    setFormData(nextForm);

    const filledSet = new Set([
      'patientName',
      'patientReference',
      'payerName',
      'patientEmail',
      'claimAmount',
      'eligibilityVerified',
      'authorizationAvailable',
      'codingComplete',
      'documentationComplete'
    ]);
    if (card.claimId || card.claimSupportId) filledSet.add('claimId');
    setAutoFilledFields(filledSet);

    // Clear any previous validation errors for auto-filled fields
    setErrors({});
  };

  const handleClearCard = () => {
    setScannedCardData(null);
    setAutoFilledFields(new Set());
  };

  const validate = () => {
    const errs = {};
    if (!formData.patientName.trim()) errs.patientName = 'Patient Name is required';
    if (!formData.payerName) errs.payerName = 'Payer Name is required';
    if (!formData.claimAmount || Number(formData.claimAmount) <= 0) {
      errs.claimAmount = 'Claim Amount must be greater than 0';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleToggle = (key) => {
    setFormData((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmit = async (e, runCheckAfter = false) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    try {
      if (runCheckAfter) setCheckingRisk(true);
      else setSubmitting(true);

      const patientRef = formData.patientReference.trim() || `PT-${Math.floor(1000 + Math.random() * 9000)}`;

      const res = await createClaim({
        ...formData,
        patientReference: patientRef,
        claimAmount: Number(formData.claimAmount),
        previousDenials: Number(formData.previousDenials || 0)
      });

      const newClaim = res.data;

      if (runCheckAfter) {
        // Run AI Risk prediction immediately
        await predictClaimRisk(newClaim.claimId);
      }

      navigate(`/claims/${newClaim.claimId}`);
    } catch (err) {
      console.error('Error creating claim:', err);
      alert('Error creating claim. Check server logs.');
    } finally {
      setSubmitting(false);
      setCheckingRisk(false);
    }
  };

  // Demo shortcut fillers with isolated patient identities
  const fillScenarioOne = () => {
    setFormData({
      claimId: 'CLM2055',
      patientName: 'Demo Patient 1',
      patientReference: 'PT-2055',
      patientEmail: 'patient1@demohealth.com',
      payerName: 'Nova Health Insurance',
      payerType: 'PRIVATE',
      claimAmount: 25000,
      eligibilityVerified: true,
      authorizationAvailable: false, // Intentional missing auth for demo
      codingComplete: true,
      documentationComplete: true,
      previousDenials: 0
    });
    setAutoFilledFields(new Set());
    setScannedCardData(null);
  };

  const fillScenarioTwo = () => {
    setFormData({
      claimId: 'CLM2056',
      patientName: 'Demo Patient 2',
      patientReference: 'PT-2056',
      patientEmail: 'patient2@demohealth.com',
      payerName: 'Nova Health Insurance',
      payerType: 'PRIVATE',
      claimAmount: 32000,
      eligibilityVerified: false, // Intentional missing eligibility for denial demo
      authorizationAvailable: true,
      codingComplete: true,
      documentationComplete: true,
      previousDenials: 1
    });
    setAutoFilledFields(new Set());
    setScannedCardData(null);
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '960px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--navy-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <FilePlus2 size={24} color="#2563eb" />
            Create Healthcare Insurance Claim
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Upload health insurance card for instant auto-fill, or enter patient & billing details manually
          </p>
        </div>

        {/* Demo Fast Fillers */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" onClick={fillScenarioOne} className="btn btn-secondary btn-sm" title="Fill Patient 1 (CLM2055)">
            ⚡ Quick Fill: Patient 1
          </button>
          <button type="button" onClick={fillScenarioTwo} className="btn btn-secondary btn-sm" title="Fill Patient 2 (CLM2056)">
            ⚡ Patient 2
          </button>
        </div>
      </div>

      {/* 0. Dedicated AI Health Insurance Card Scanner Widget */}
      <InsuranceCardScanner
        onCardExtracted={handleCardExtracted}
        onClear={handleClearCard}
      />

      <form onSubmit={(e) => handleSubmit(e, false)}>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="#2563eb" />
              1. Patient & Claim Identification
            </h3>
            {autoFilledFields.has('patientName') && (
              <span style={{
                fontSize: '0.725rem',
                background: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0',
                padding: '0.2rem 0.5rem',
                borderRadius: '9999px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <CheckCircle2 size={13} /> Auto-filled from Card
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Claim ID (Optional / Auto)</label>
                {autoFilledFields.has('claimId') && (
                  <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: '700' }}>✨ From Card</span>
                )}
              </div>
              <input
                type="text"
                name="claimId"
                className="form-control font-mono"
                placeholder="e.g. CLM-PRO-2026-1202"
                value={formData.claimId}
                onChange={handleChange}
                style={{
                  border: autoFilledFields.has('claimId') ? '1.5px solid #10b981' : undefined,
                  background: autoFilledFields.has('claimId') ? '#f0fdf4' : undefined
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Leave blank to auto-generate</span>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Patient Full Name *</label>
                {autoFilledFields.has('patientName') && (
                  <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: '700' }}>✨ Auto-filled</span>
                )}
              </div>
              <input
                type="text"
                name="patientName"
                className="form-control"
                placeholder="e.g. Arjun Menon"
                value={formData.patientName}
                onChange={handleChange}
                style={{
                  border: autoFilledFields.has('patientName') ? '1.5px solid #10b981' : undefined,
                  background: autoFilledFields.has('patientName') ? '#f0fdf4' : undefined,
                  fontWeight: autoFilledFields.has('patientName') ? '700' : 'normal'
                }}
              />
              {errors.patientName && (
                <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600' }}>{errors.patientName}</span>
              )}
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Patient MRN / Member ID</label>
                {autoFilledFields.has('patientReference') && (
                  <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: '700' }}>✨ Auto-filled</span>
                )}
              </div>
              <input
                type="text"
                name="patientReference"
                className="form-control font-mono"
                placeholder="e.g. CA-INS-00734192"
                value={formData.patientReference}
                onChange={handleChange}
                style={{
                  border: autoFilledFields.has('patientReference') ? '1.5px solid #10b981' : undefined,
                  background: autoFilledFields.has('patientReference') ? '#f0fdf4' : undefined
                }}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
                  <Mail size={14} color="#2563eb" />
                  Patient / Support Email
                </label>
                {autoFilledFields.has('patientEmail') && (
                  <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: '700' }}>✨ Auto-filled</span>
                )}
              </div>
              <input
                type="email"
                name="patientEmail"
                className="form-control"
                placeholder="e.g. support@careshieldassurance.demo"
                value={formData.patientEmail}
                onChange={handleChange}
                style={{
                  border: autoFilledFields.has('patientEmail') ? '1.5px solid #10b981' : undefined,
                  background: autoFilledFields.has('patientEmail') ? '#f0fdf4' : undefined
                }}
              />
              <span style={{ fontSize: '0.73rem', color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
                📬 Lifecycle stage notifications are dispatched to this address.
              </span>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building size={18} color="#2563eb" />
              2. Payer & Financial Details
            </h3>
            {autoFilledFields.has('payerName') && (
              <span style={{
                fontSize: '0.725rem',
                background: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0',
                padding: '0.2rem 0.5rem',
                borderRadius: '9999px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <CheckCircle2 size={13} /> Auto-filled from Card
              </span>
            )}
          </div>

          {/* Card Policy Context Banner if card was scanned */}
          {scannedCardData && (
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              fontSize: '0.8rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={18} color="#0284c7" />
                <div>
                  <span style={{ fontWeight: '700', color: '#0369a1' }}>
                    Card Plan: {scannedCardData.planType || 'CareShield Silver'}
                  </span>
                  <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>
                    • Max Assistance: <strong style={{ color: '#059669' }}>Up To ₹5 Lakh</strong>
                  </span>
                </div>
              </div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                Patient: <strong>{scannedCardData.patientName}</strong> ({scannedCardData.district || 'Kochi'}, {scannedCardData.state || 'Kerala'})
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Insurance Payer Name *</label>
                {autoFilledFields.has('payerName') && (
                  <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: '700' }}>✨ Auto-filled</span>
                )}
              </div>
              <select
                name="payerName"
                className="form-control"
                value={formData.payerName}
                onChange={(e) => {
                  const selected = payers.find((p) => p.name === e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    payerName: e.target.value,
                    payerType: selected ? selected.type : 'COMMERCIAL'
                  }));
                }}
                style={{
                  border: autoFilledFields.has('payerName') ? '1.5px solid #10b981' : undefined,
                  background: autoFilledFields.has('payerName') ? '#f0fdf4' : undefined,
                  fontWeight: autoFilledFields.has('payerName') ? '700' : 'normal'
                }}
              >
                {payers.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} ({p.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Claim Amount (₹) *</label>
                {autoFilledFields.has('claimAmount') && (
                  <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: '700' }}>✨ Within ₹5 Lakh limit</span>
                )}
              </div>
              <input
                type="number"
                name="claimAmount"
                className="form-control"
                placeholder="45000"
                value={formData.claimAmount}
                onChange={handleChange}
                min="1"
                style={{
                  border: autoFilledFields.has('claimAmount') ? '1.5px solid #10b981' : undefined,
                  background: autoFilledFields.has('claimAmount') ? '#f0fdf4' : undefined,
                  fontWeight: autoFilledFields.has('claimAmount') ? '700' : 'normal'
                }}
              />
              {errors.claimAmount && (
                <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600' }}>{errors.claimAmount}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Previous Denials Count</label>
              <input
                type="number"
                name="previousDenials"
                className="form-control"
                value={formData.previousDenials}
                onChange={handleChange}
                min="0"
                max="10"
              />
            </div>
          </div>
        </div>

        {/* Pre-Submission Quality Checkpoints (Toggles) */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="#2563eb" />
              3. Pre-Submission Quality Checks
            </h3>
            {scannedCardData && (
              <span style={{
                fontSize: '0.725rem',
                background: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0',
                padding: '0.2rem 0.5rem',
                borderRadius: '9999px',
                fontWeight: '700'
              }}>
                ✓ Pre-Validated from Health Card
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Toggle the readiness of each checkpoint. These directly feed into the Random Forest prediction model.
          </p>

          <div className="form-toggle-grid">
            {/* Check 1: Eligibility */}
            <div
              className={`toggle-card ${formData.eligibilityVerified ? 'active' : ''}`}
              onClick={() => handleToggle('eligibilityVerified')}
            >
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--navy-dark)' }}>
                  Eligibility Verified
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Active insurance policy confirmed
                </div>
              </div>
              {formData.eligibilityVerified ? (
                <CheckCircle size={22} color="#10b981" />
              ) : (
                <XCircle size={22} color="#ef4444" />
              )}
            </div>

            {/* Check 2: Authorization */}
            <div
              className={`toggle-card ${formData.authorizationAvailable ? 'active' : ''}`}
              onClick={() => handleToggle('authorizationAvailable')}
            >
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--navy-dark)' }}>
                  Prior Authorization
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Pre-approval code attached
                </div>
              </div>
              {formData.authorizationAvailable ? (
                <CheckCircle size={22} color="#10b981" />
              ) : (
                <XCircle size={22} color="#ef4444" />
              )}
            </div>

            {/* Check 3: Coding Complete */}
            <div
              className={`toggle-card ${formData.codingComplete ? 'active' : ''}`}
              onClick={() => handleToggle('codingComplete')}
            >
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--navy-dark)' }}>
                  Coding Complete
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ICD-10 & CPT validated
                </div>
              </div>
              {formData.codingComplete ? (
                <CheckCircle size={22} color="#10b981" />
              ) : (
                <XCircle size={22} color="#ef4444" />
              )}
            </div>

            {/* Check 4: Documentation Complete */}
            <div
              className={`toggle-card ${formData.documentationComplete ? 'active' : ''}`}
              onClick={() => handleToggle('documentationComplete')}
            >
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--navy-dark)' }}>
                  Documentation Complete
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Clinical notes & operative logs
                </div>
              </div>
              {formData.documentationComplete ? (
                <CheckCircle size={22} color="#10b981" />
              ) : (
                <XCircle size={22} color="#ef4444" />
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-lg"
            onClick={() => navigate('/claims')}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-secondary btn-lg"
            disabled={submitting || checkingRisk}
          >
            <Save size={18} />
            <span>{submitting ? 'Saving...' : 'Save Claim'}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-lg"
            disabled={submitting || checkingRisk}
            onClick={(e) => handleSubmit(e, true)}
            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
          >
            <Sparkles size={18} />
            <span>{checkingRisk ? 'Analyzing Risk...' : 'Save & Check Denial Risk'}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
