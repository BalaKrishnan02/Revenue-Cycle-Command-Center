import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { getClaims } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import RiskMeter from '../components/RiskMeter';

export default function ClaimsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'ALL';

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(initialFilter);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await getClaims();
      setClaims(res.data);
    } catch (err) {
      console.error('Error loading claims:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
    const interval = setInterval(fetchClaims, 4000);
    return () => clearInterval(interval);
  }, []);

  const filterTabs = [
    { id: 'ALL', label: 'All Claims', count: claims.length },
    { id: 'HIGH_RISK', label: 'High Risk', count: claims.filter((c) => c.riskLevel === 'HIGH').length },
    { id: 'DENIED', label: 'Denied', count: claims.filter((c) => c.status === 'DENIED').length },
    { id: 'PENDING', label: 'Pending', count: claims.filter((c) => ['PENDING', 'SUBMITTED', 'RESUBMITTED'].includes(c.status)).length },
    { id: 'ACCEPTED', label: 'Accepted', count: claims.filter((c) => c.status === 'ACCEPTED').length },
    { id: 'PAID', label: 'Paid', count: claims.filter((c) => c.status === 'PAID' || c.paymentStatus === 'PAID').length },
  ];

  const filteredClaims = claims.filter((c) => {
    // Search match
    const q = searchQuery.toLowerCase();
    const matchSearch =
      c.claimId?.toLowerCase().includes(q) ||
      c.patientName?.toLowerCase().includes(q) ||
      c.payerName?.toLowerCase().includes(q) ||
      c.patientReference?.toLowerCase().includes(q);

    if (!matchSearch) return false;

    // Filter match
    if (activeFilter === 'HIGH_RISK') return c.riskLevel === 'HIGH';
    if (activeFilter === 'DENIED') return c.status === 'DENIED';
    if (activeFilter === 'PENDING') return ['PENDING', 'SUBMITTED', 'RESUBMITTED'].includes(c.status);
    if (activeFilter === 'ACCEPTED') return c.status === 'ACCEPTED';
    if (activeFilter === 'PAID') return c.status === 'PAID' || c.paymentStatus === 'PAID';

    return true;
  });

  return (
    <div className="page-wrapper">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--navy-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={24} color="#2563eb" />
            Claims Command Repository
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Full lifecycle monitoring, AI denial audits, and real-time payer status tracking
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchClaims} className="btn btn-secondary btn-sm" title="Refresh">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Sync</span>
          </button>
          <Link to="/create-claim" className="btn btn-primary btn-sm">
            <Plus size={16} />
            <span>New Claim</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  border: activeFilter === tab.id ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                  backgroundColor: activeFilter === tab.id ? '#eff6ff' : '#ffffff',
                  color: activeFilter === tab.id ? '#1d4ed8' : 'var(--navy-text)',
                  fontWeight: activeFilter === tab.id ? '700' : '500',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '9999px',
                  backgroundColor: activeFilter === tab.id ? '#bfdbfe' : '#f1f5f9',
                  color: activeFilter === tab.id ? '#1e40af' : '#64748b',
                  fontWeight: '700'
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '260px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search claims, patients, payers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {/* Claims Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Claim ID</th>
              <th>Patient</th>
              <th>Payer</th>
              <th>Claim Amount</th>
              <th>AI Risk Score</th>
              <th>Claim Status</th>
              <th>Payment Status</th>
              <th>Quality Flags</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClaims.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No claims found matching the filter criteria.
                </td>
              </tr>
            ) : (
              filteredClaims.map((claim) => (
                <tr key={claim.id || claim.claimId}>
                  <td className="font-mono" style={{ fontWeight: '700', color: 'var(--primary)' }}>
                    <Link to={`/claims/${claim.claimId}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                      {claim.claimId}
                    </Link>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{claim.patientName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{claim.patientReference}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '500' }}>{claim.payerName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{claim.payerType}</div>
                  </td>
                  <td style={{ fontWeight: '700' }}>
                    ₹{(claim.claimAmount || 0).toLocaleString()}
                  </td>
                  <td>
                    {claim.riskScore !== null && claim.riskScore !== undefined ? (
                      <RiskMeter score={claim.riskScore} level={claim.riskLevel} size="compact" />
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unchecked</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={claim.status} />
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: claim.paymentStatus === 'PAID' ? '#059669' : (claim.paymentStatus === 'PENDING' ? '#d97706' : '#94a3b8')
                    }}>
                      {claim.paymentStatus || 'UNPAID'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <span title={claim.eligibilityVerified ? "Eligibility Verified" : "Eligibility Unverified"} style={{ color: claim.eligibilityVerified ? '#10b981' : '#ef4444', fontSize: '0.7rem', fontWeight: '800' }}>
                        ELIG:{claim.eligibilityVerified ? '✓' : '✗'}
                      </span>
                      <span style={{ color: '#cbd5e1' }}>|</span>
                      <span title={claim.authorizationAvailable ? "Authorization Present" : "Missing Authorization"} style={{ color: claim.authorizationAvailable ? '#10b981' : '#ef4444', fontSize: '0.7rem', fontWeight: '800' }}>
                        AUTH:{claim.authorizationAvailable ? '✓' : '✗'}
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link to={`/claims/${claim.claimId}`} className="btn btn-secondary btn-sm">
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
