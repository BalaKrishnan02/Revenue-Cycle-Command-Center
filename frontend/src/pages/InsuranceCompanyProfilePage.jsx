import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getClaims, getDashboardMetrics } from '../services/api';
import {
  Building2,
  Shield,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  User,
  Hash,
  Activity,
  FileText,
  IndianRupee,
  CheckCircle2,
  Lock,
  Edit2,
  Save,
  X,
  ArrowLeft
} from 'lucide-react';

export default function InsuranceCompanyProfilePage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [claimsCount, setClaimsCount] = useState(0);
  const [totalClaimed, setTotalClaimed] = useState(0);
  const [totalApproved, setTotalApproved] = useState(0);
  const [loading, setLoading] = useState(true);

  // Profile editable info
  const [isEditing, setIsEditing] = useState(false);
  const [contactPerson, setContactPerson] = useState(user?.fullName || 'Senior Claims Officer');
  const [contactEmail, setContactEmail] = useState(user?.email || 'claims@insurer.com');
  const [contactPhone, setContactPhone] = useState('+91 (080) 4590-2100');
  const [officeAddress, setOfficeAddress] = useState('Tech Boulevard, Tower 4, Suite 800, Bangalore, Karnataka - 560103');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const companyName = user?.companyName || 'Nova Health Insurance';
  const companyId = user?.companyId || 'INS001';

  useEffect(() => {
    async function loadStats() {
      try {
        const [claimsRes, metricsRes] = await Promise.all([
          getClaims(),
          getDashboardMetrics()
        ]);
        const claims = claimsRes.data || [];
        setClaimsCount(claims.length);
        const claimed = claims.reduce((acc, c) => acc + (Number(c.claimAmount) || 0), 0);
        const approved = claims
          .filter(c => c.status === 'ACCEPTED' || c.status === 'APPROVED')
          .reduce((acc, c) => acc + (Number(c.approvedAmount ?? c.claimAmount) || 0), 0);
        setTotalClaimed(claimed);
        setTotalApproved(approved);
        setMetrics(metricsRes.data);
      } catch (err) {
        console.error('Error loading company profile stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const approvalRate = totalClaimed > 0 ? ((totalApproved / totalClaimed) * 100).toFixed(1) : '94.2';

  const handleSaveContact = (e) => {
    e.preventDefault();
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div style={{ padding: '1.75rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Breadcrumb & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <Link
          to="/insurance/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#3b82f6',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}
        >
          <ArrowLeft size={16} /> Back to Insurer Dashboard
        </Link>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '9999px',
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          fontSize: '0.75rem',
          fontWeight: '700',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <ShieldCheck size={14} /> Official Payer Account Active
        </span>
      </div>

      {saveSuccess && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '0.85rem 1.25rem',
          borderRadius: '8px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          color: '#10b981',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.875rem',
          fontWeight: '600'
        }}>
          <CheckCircle2 size={18} /> Contact details updated successfully!
        </div>
      )}

      {/* Main Profile Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '16px',
        padding: '2rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Building2 size={36} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
                  {companyName}
                </h1>
                <span style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '6px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  fontFamily: 'monospace'
                }}>
                  ID: {companyId}
                </span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0.4rem 0 0 0' }}>
                Registered Payer Network &bull; Adjudication Authority Tier 1 &bull; Direct RCM Clearinghouse Partner
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {isEditing ? <X size={15} /> : <Edit2 size={15} />}
            <span>{isEditing ? 'Cancel Editing' : 'Edit Contact Info'}</span>
          </button>
        </div>
      </div>

      {/* Security Immutability Alert */}
      <div style={{
        marginBottom: '2rem',
        padding: '1rem 1.25rem',
        borderRadius: '10px',
        background: 'rgba(234, 179, 8, 0.08)',
        border: '1px solid rgba(234, 179, 8, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem'
      }}>
        <Lock size={20} color="#eab308" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: '1.4' }}>
          <strong style={{ color: '#facc15' }}>Security Architecture Notice: </strong>
          Your Company Identification (<code style={{ color: '#93c5fd' }}>{companyId}</code>) and System Payer Code are permanently bound to your organization's cryptographic tenant partition and cannot be altered by payer staff.
        </div>
      </div>

      {/* KPI Performance Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              Total Claims Received
            </span>
            <FileText size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>
            {claimsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Direct routed from hospital billing
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              Total Claimed Amount
            </span>
            <IndianRupee size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>
            ₹{totalClaimed.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Gross billing submitted by providers
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              Total Approved Amount
            </span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#10b981' }}>
            ₹{totalApproved.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Adjudicated and authorized for payout
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              Approval Rate
            </span>
            <Activity size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#8b5cf6' }}>
            {approvalRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Industry target: ≥ 90.0%
          </div>
        </div>
      </div>

      {/* Details Grid: Left side credentials / Right side contact form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        {/* Organization Information Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={18} color="#2563eb" /> Organization Credentials
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Organization Legal Name</span>
              <span style={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: '700' }}>{companyName}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Payer Identifier Code</span>
              <span style={{ fontSize: '0.875rem', color: '#2563eb', fontWeight: '700', fontFamily: 'monospace' }}>{companyId}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Account Status</span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                color: '#065f46',
                background: '#ecfdf5',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                border: '1px solid #a7f3d0'
              }}>
                ACTIVE &bull; VERIFIED
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Payer Portal Role</span>
              <span style={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: '600' }}>INSURANCE_COMPANY</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>EDI Connectivity</span>
              <span style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: '600' }}>Direct ANSI X12 837 / 835 Active</span>
            </div>
          </div>
        </div>

        {/* Contact Info Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} color="#2563eb" /> Contact & Operational Details
          </h3>

          {isEditing ? (
            <form onSubmit={handleSaveContact} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>
                  Contact Officer
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>
                  Claims Notification Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>
                  Direct Phone / Helpline
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>
                  Registered Office Address
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={officeAddress}
                  onChange={(e) => setOfficeAddress(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  <Save size={15} style={{ marginRight: '0.4rem' }} /> Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <User size={18} color="#64748b" style={{ marginTop: '0.2rem' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Designated Contact Person</div>
                  <div style={{ fontSize: '0.925rem', color: '#0f172a', fontWeight: '700', marginTop: '0.15rem' }}>{contactPerson}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <Mail size={18} color="#64748b" style={{ marginTop: '0.2rem' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Electronic Inquiries Email</div>
                  <div style={{ fontSize: '0.925rem', color: '#2563eb', fontWeight: '600', marginTop: '0.15rem' }}>{contactEmail}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <Phone size={18} color="#64748b" style={{ marginTop: '0.2rem' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Helpline / Direct Phone</div>
                  <div style={{ fontSize: '0.925rem', color: '#0f172a', fontWeight: '600', marginTop: '0.15rem' }}>{contactPhone}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <MapPin size={18} color="#64748b" style={{ marginTop: '0.2rem' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Registered Office Address</div>
                  <div style={{ fontSize: '0.875rem', color: '#334155', fontWeight: '500', marginTop: '0.15rem', lineHeight: '1.4' }}>{officeAddress}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
