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
  ArrowRight
} from 'lucide-react';
import { createClaim, predictClaimRisk } from '../services/api';

export default function CreateClaimPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    claimId: '',
    patientName: '',
    patientReference: '',
    patientEmail: 'balakrishnan206k@gmail.com',
    payerName: 'Nova Health Insurance',
    payerType: 'PRIVATE',
    claimAmount: 25000,
    eligibilityVerified: true,
    authorizationAvailable: false,
    codingComplete: true,
    documentationComplete: true,
    previousDenials: 0
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [checkingRisk, setCheckingRisk] = useState(false);

  const payers = [
    { name: 'Nova Health Insurance', type: 'PRIVATE' },
    { name: 'CareShield', type: 'COMMERCIAL' },
    { name: 'MediSecure', type: 'PRIVATE' },
    { name: 'HealthPrime', type: 'COMMERCIAL' },
    { name: 'Unity Payer Network', type: 'PRIVATE' },
  ];

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

      const res = await createClaim({
        ...formData,
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

  // Demo shortcut filler
  const fillScenarioOne = () => {
    setFormData({
      claimId: 'CLM2055',
      patientName: 'Demo Patient',
      patientReference: 'PT-2055',
      patientEmail: 'balakrishnan206k@gmail.com',
      payerName: 'Nova Health Insurance',
      payerType: 'PRIVATE',
      claimAmount: 25000,
      eligibilityVerified: true,
      authorizationAvailable: false, // Intentional missing auth for demo
      codingComplete: true,
      documentationComplete: true,
      previousDenials: 0
    });
  };

  const fillScenarioTwo = () => {
    setFormData({
      claimId: 'CLM2056',
      patientName: 'Demo Patient 2',
      patientReference: 'PT-2056',
      patientEmail: 'balakrishnan206k@gmail.com',
      payerName: 'Nova Health Insurance',
      payerType: 'PRIVATE',
      claimAmount: 32000,
      eligibilityVerified: false, // Intentional missing eligibility for denial demo
      authorizationAvailable: true,
      codingComplete: true,
      documentationComplete: true,
      previousDenials: 1
    });
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '960px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--navy-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FilePlus2 size={24} color="#2563eb" />
            Create Healthcare Insurance Claim
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Enter patient & billing details to run pre-submission AI denial risk evaluation
          </p>
        </div>

        {/* Demo Fast Fillers */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" onClick={fillScenarioOne} className="btn btn-secondary btn-sm" title="Fill Scenario 1 (Missing Auth Demo)">
            ⚡ Quick Fill: Scenario 1 (CLM2055)
          </button>
          <button type="button" onClick={fillScenarioTwo} className="btn btn-secondary btn-sm" title="Fill Scenario 2 (Denial Demo)">
            ⚡ Scenario 2 (CLM2056)
          </button>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)}>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            <User size={18} color="#2563eb" />
            1. Patient & Claim Identification
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Claim ID (Optional / Auto)</label>
              <input
                type="text"
                name="claimId"
                className="form-control font-mono"
                placeholder="e.g. CLM2055"
                value={formData.claimId}
                onChange={handleChange}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Leave blank to auto-generate</span>
            </div>

            <div className="form-group">
              <label className="form-label">Patient Full Name *</label>
              <input
                type="text"
                name="patientName"
                className="form-control"
                placeholder="e.g. Demo Patient"
                value={formData.patientName}
                onChange={handleChange}
              />
              {errors.patientName && (
                <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600' }}>{errors.patientName}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Patient MRN / Reference</label>
              <input
                type="text"
                name="patientReference"
                className="form-control font-mono"
                placeholder="e.g. PT-2055"
                value={formData.patientReference}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: 0 }}>
                  <Mail size={14} color="#2563eb" />
                  Patient / User Email Address
                </label>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, patientEmail: 'balakrishnan206k@gmail.com' }))}
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1d4ed8',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    cursor: 'pointer'
                  }}
                  title="Click to fill balakrishnan206k@gmail.com"
                >
                  ⚡ My Email
                </button>
              </div>
              <input
                type="email"
                name="patientEmail"
                className="form-control"
                placeholder="balakrishnan206k@gmail.com"
                value={formData.patientEmail}
                onChange={handleChange}
              />
              <span style={{ fontSize: '0.73rem', color: '#2563eb', display: 'block', marginTop: '0.25rem' }}>
                📬 <strong>Process Lifecycle Progress:</strong> Automatic updates sent at each stage (Intake → AI Audit → Submission → Adjudication → Settlement)
              </span>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            <Building size={18} color="#2563eb" />
            2. Payer & Financial Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Insurance Payer Name *</label>
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
              >
                {payers.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} ({p.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Claim Amount (₹) *</label>
              <input
                type="number"
                name="claimAmount"
                className="form-control"
                placeholder="25000"
                value={formData.claimAmount}
                onChange={handleChange}
                min="1"
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
          <h3 className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            <ShieldCheck size={18} color="#2563eb" />
            3. Pre-Submission Quality Checks
          </h3>
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
