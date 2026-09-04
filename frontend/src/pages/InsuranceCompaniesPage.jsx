import React, { useState, useEffect } from 'react';
import {
  getInsuranceCompanies,
  createInsuranceCompany,
  updateInsuranceCompanyStatus
} from '../services/api';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  IndianRupee,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  Eye,
  Shield,
  X
} from 'lucide-react';

export default function InsuranceCompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal State for New Company
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    companyCode: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Details Modal State
  const [selectedCompany, setSelectedCompany] = useState(null);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await getInsuranceCompanies();
      setCompanies(res.data || []);
    } catch (err) {
      console.error('Failed to fetch insurance companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.companyName || !formData.companyCode || !formData.email) {
      setFormError('Please fill in Company Name, Code, and Email.');
      return;
    }
    setIsSubmitting(true);
    try {
      await createInsuranceCompany(formData);
      setSuccessMsg(`Company "${formData.companyName}" successfully enrolled into Payer Network.`);
      setShowAddModal(false);
      setFormData({
        companyName: '',
        companyCode: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: ''
      });
      fetchCompanies();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create insurance company.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (company) => {
    const newStatus = company.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateInsuranceCompanyStatus(company.id, newStatus);
      setSuccessMsg(`Status for ${company.companyName} changed to ${newStatus}.`);
      fetchCompanies();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to update company status:', err);
    }
  };

  const filtered = companies.filter(c => {
    const matchesSearch =
      c.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.companyCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === 'ALL' || c.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalCompaniesCount = companies.length;
  const activeCompaniesCount = companies.filter(c => c.status === 'ACTIVE').length;
  const totalClaimsAcrossAll = companies.reduce((acc, c) => acc + (c.totalClaims || 0), 0);
  const totalExposureAcrossAll = companies.reduce((acc, c) => acc + (c.totalAmount || 0), 0);

  return (
    <div style={{ padding: '1.75rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Building2 size={26} color="#2563eb" />
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Insurance Companies Management
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Control payer networks, verify active adjudication channels, and track cross-payer exposure
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={fetchCompanies}
            disabled={loading}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={16} />
            <span>Enroll Insurance Company</span>
          </button>
        </div>
      </div>

      {successMsg && (
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
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {/* Top Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.75rem'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Registered Payers
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>
            {totalCompaniesCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem', fontWeight: '600' }}>
            {activeCompaniesCount} Active &bull; {totalCompaniesCount - activeCompaniesCount} Inactive
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Total Claims Dispatched
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#2563eb' }}>
            {totalClaimsAcrossAll}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Across all contracted payers
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Gross Payer Exposure
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#f59e0b' }}>
            ₹{totalExposureAcrossAll.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Submitted receivables portfolio
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        background: '#ffffff',
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by company name, code, contact or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '0.875rem',
              color: '#0f172a'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-control"
            style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.825rem' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Main Companies Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>COMPANY</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>CODE</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>CONTACT PERSON</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>EMAIL</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textAlign: 'center' }}>USERS</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textAlign: 'center' }}>CLAIMS</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textAlign: 'center' }}>PENDING</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textAlign: 'right' }}>AMOUNT</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textAlign: 'center' }}>STATUS</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem auto' }} />
                    Loading insurance companies directory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    No insurance companies found matching current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((company) => {
                  const isActive = company.status === 'ACTIVE';
                  return (
                    <tr
                      key={company.id}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}
                    >
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: isActive ? 'rgba(37, 99, 235, 0.1)' : 'rgba(148, 163, 184, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isActive ? '#2563eb' : '#64748b'
                          }}>
                            <Building2 size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.875rem' }}>
                              {company.companyName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {company.phone || 'Standard ANSI 837 Channel'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background: '#f1f5f9',
                          color: '#334155',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          fontFamily: 'monospace'
                        }}>
                          {company.companyCode}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#334155', fontWeight: '500' }}>
                        {company.contactPerson || 'Adjudication Desk'}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.825rem', color: '#2563eb' }}>
                        {company.email}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: '600' }}>
                        {company.activeUsersCount ?? 1}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>
                        {company.totalClaims ?? 0}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '9999px',
                          background: (company.pendingClaims || 0) > 0 ? '#fef3c7' : '#f1f5f9',
                          color: (company.pendingClaims || 0) > 0 ? '#92400e' : '#64748b',
                          fontSize: '0.75rem',
                          fontWeight: '700'
                        }}>
                          {company.pendingClaims ?? 0}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '700', color: '#0f172a' }}>
                        ₹{(company.totalAmount || 0).toLocaleString('en-IN')}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          background: isActive ? '#ecfdf5' : '#fef2f2',
                          color: isActive ? '#065f46' : '#991b1b',
                          border: `1px solid ${isActive ? '#a7f3d0' : '#fecaca'}`
                        }}>
                          {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                          <button
                            onClick={() => setSelectedCompany(company)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.3rem 0.5rem' }}
                            title="View Profile Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(company)}
                            className={`btn btn-sm ${isActive ? 'btn-secondary' : 'btn-primary'}`}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            title={isActive ? 'Deactivate Payer' : 'Activate Payer'}
                          >
                            {isActive ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Insurance Company Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '540px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Building2 size={20} color="#2563eb" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Enroll Insurance Company
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} style={{ padding: '1.5rem' }}>
              {formError && (
                <div style={{
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '0.825rem',
                  fontWeight: '600'
                }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Apex Health Plan"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>
                    Company Code *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. APEX006"
                    value={formData.companyCode}
                    onChange={(e) => setFormData({ ...formData, companyCode: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>
                    Contact Person
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Claims Lead / Liaison"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>
                    Official Email *
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="adjudication@payer.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>
                  Phone Helpline
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+91 (080) 4000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>
                  Registered Office Address
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Street, City, Postal Code"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registering Payer...' : 'Register Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Company Details Modal */}
      {selectedCompany && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Building2 size={20} color="#2563eb" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {selectedCompany.companyName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCompany(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.6rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Payer Code</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', fontFamily: 'monospace', color: '#2563eb' }}>
                  {selectedCompany.companyCode}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.6rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Status</span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: selectedCompany.status === 'ACTIVE' ? '#065f46' : '#991b1b',
                  background: selectedCompany.status === 'ACTIVE' ? '#ecfdf5' : '#fef2f2',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px'
                }}>
                  {selectedCompany.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.6rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Contact Officer</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>
                  {selectedCompany.contactPerson || 'Not provided'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.6rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Helpline / Phone</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>
                  {selectedCompany.phone || 'ANSI Direct'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.6rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Assigned Claims</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>
                  {selectedCompany.totalClaims ?? 0}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Exposure Amount</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#f59e0b' }}>
                  ₹{(selectedCompany.totalAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedCompany(null)}
                className="btn btn-primary btn-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
