import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Check,
  Search,
  RefreshCw,
  ExternalLink,
  CheckCheck,
  History,
  Clock,
  Building2,
  Shield,
  ShieldCheck,
  Filter,
  Lock
} from 'lucide-react';
import { getAlerts, resolveAlert, resolveAllAlerts } from '../services/api';

const DEMO_PAYERS = [
  { id: 'ALL', code: 'ALL', name: 'All Insurance Companies' },
  { id: 'INS001', code: 'NOVA001', name: 'Nova Health Insurance' },
  { id: 'INS002', code: 'CARE002', name: 'CareShield Assurance' },
  { id: 'INS003', code: 'MEDI003', name: 'MediSecure Benefits' },
  { id: 'INS004', code: 'HP004', name: 'HealthPrime Plan' },
  { id: 'INS005', code: 'UNITY005', name: 'Unity Payer Network' },
];

export default function AlertCenterPage() {
  const { user, isRcmAdmin, isInsuranceCompany } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ACTIVE'); // 'ACTIVE', 'ALL', 'RESOLVED'
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedPayer, setSelectedPayer] = useState(isInsuranceCompany() ? (user?.companyId || 'INS001') : 'ALL');
  const [notification, setNotification] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // If insurance company logs in, enforce their company ID
  const effectivePayer = isInsuranceCompany() ? (user?.companyId || 'INS001') : selectedPayer;

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await getAlerts(effectivePayer);
      setAlerts(res.data || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 4000);
    return () => clearInterval(interval);
  }, [effectivePayer]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ text: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Mark single alert as read -> moves it to history
  const handleMarkAsRead = async (id, title) => {
    try {
      setActionLoading(true);
      await resolveAlert(id);
      showNotification(`"${title || 'Alert'}" marked as read and moved to history!`);
      await loadAlerts();
    } catch (err) {
      console.error('Error resolving alert:', err);
      showNotification(err.response?.data?.message || 'Could not mark alert as read', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk mark all active alerts as read -> moves all to history
  const handleMarkAllAsRead = async () => {
    const activeCount = alerts.filter((a) => !a.resolved).length;
    if (activeCount === 0) return;

    try {
      setActionLoading(true);
      await resolveAllAlerts();
      showNotification(`All ${activeCount} active alerts marked as read and moved to history!`);
      await loadAlerts();
    } catch (err) {
      console.error('Error marking all as read:', err);
      showNotification('Error processing bulk update', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter alerts by search, severity, and tab
  const filteredAlerts = alerts.filter((a) => {
    // Tab filter
    if (filter === 'ACTIVE' && a.resolved) return false;
    if (filter === 'RESOLVED' && !a.resolved) return false;

    // Severity filter
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = (a.title || '').toLowerCase().includes(term);
      const matchMsg = (a.message || '').toLowerCase().includes(term);
      const matchClaim = (a.claimId || '').toLowerCase().includes(term);
      const matchId = (a.alertId || '').toLowerCase().includes(term);
      const matchCompany = (a.insuranceCompanyName || '').toLowerCase().includes(term);
      return matchTitle || matchMsg || matchClaim || matchId || matchCompany;
    }

    return true;
  });

  const activeCount = alerts.filter((a) => !a.resolved).length;
  const resolvedCount = alerts.filter((a) => a.resolved).length;
  const allCount = alerts.length;

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="badge" style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #f87171', fontWeight: '800' }}>
            <AlertCircle size={12} color="#dc2626" /> Critical
          </span>
        );
      case 'WARNING':
        return (
          <span className="badge" style={{ backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', fontWeight: '700' }}>
            <AlertTriangle size={12} color="#f59e0b" /> Warning
          </span>
        );
      case 'SUCCESS':
        return (
          <span className="badge" style={{ backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', fontWeight: '700' }}>
            <CheckCircle2 size={12} color="#10b981" /> Success
          </span>
        );
      default:
        return (
          <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
            <Info size={12} color="#3b82f6" /> Info
          </span>
        );
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return 'Just now';
    try {
      return new Date(ts).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.75rem 2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Bell size={26} color={isInsuranceCompany() ? '#059669' : '#ef4444'} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--navy-dark)', margin: 0 }}>
              {isInsuranceCompany() ? `${user?.companyName || 'Insurance Company'} — Alert Center` : 'Revenue Cycle Alert Command Center'}
            </h1>
            {isInsuranceCompany() ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#065f46',
                fontSize: '0.75rem',
                fontWeight: '700',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <ShieldCheck size={13} /> Payer Verified
              </span>
            ) : (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: '#4f46e5',
                fontSize: '0.75rem',
                fontWeight: '700',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}>
                <Shield size={13} /> Admin All-Payers View
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.35rem 0 0 0' }}>
            {isInsuranceCompany()
              ? `Real-time adjudication notices, denial warnings, and payment remittance events exclusively for ${user?.companyName || 'your organization'}.`
              : 'Enterprise-wide proactive notification stream for denials, missing pre-auth, high billing priority, and cross-payer remittance.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {activeCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
              className="btn btn-sm"
              style={{
                backgroundColor: '#10b981',
                color: '#ffffff',
                fontWeight: '700',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
              }}
              title="Mark all active alerts as read and move to history"
            >
              <CheckCheck size={16} />
              <span>Mark All as Read ({activeCount})</span>
            </button>
          )}

          <button onClick={loadAlerts} className="btn btn-secondary btn-sm" title="Refresh Feed">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Insurance Company Specific Tenant Isolation Notice */}
      {isInsuranceCompany() ? (
        <div style={{
          marginBottom: '1.5rem',
          padding: '0.9rem 1.25rem',
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <Lock size={18} color="#10b981" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.825rem', color: '#334155' }}>
            <strong style={{ color: '#065f46' }}>Tenant Isolation Active: </strong>
            You are viewing operational alerts exclusively registered to <strong style={{ color: '#047857' }}>{user?.companyName} ({user?.companyId || 'INS001'})</strong>. Alerts from other insurance companies are strictly isolated and not accessible.
          </div>
        </div>
      ) : (
        /* RCM Admin: Quick Company Filter Selector Bar */
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          border: '1px solid #e2e8f0',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={18} color="#2563eb" />
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>
                Filter Alerts by Insurance Company:
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {DEMO_PAYERS.map((payer) => {
                const isSelected = selectedPayer === payer.id;
                return (
                  <button
                    key={payer.id}
                    onClick={() => setSelectedPayer(payer.id)}
                    className="btn btn-sm"
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: isSelected ? '700' : '600',
                      backgroundColor: isSelected ? '#2563eb' : '#f1f5f9',
                      color: isSelected ? '#ffffff' : '#475569',
                      border: isSelected ? '1px solid #1d4ed8' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {payer.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Toast Notification */}
      {notification && (
        <div style={{
          backgroundColor: notification.type === 'danger' ? '#fef2f2' : '#ecfdf5',
          border: `1px solid ${notification.type === 'danger' ? '#fecaca' : '#a7f3d0'}`,
          color: notification.type === 'danger' ? '#991b1b' : '#065f46',
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          marginBottom: '1.25rem',
          fontWeight: '700',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle2 size={18} color="#10b981" />
            <span>{notification.text}</span>
          </div>
          {filter === 'ACTIVE' && (
            <button
              onClick={() => setFilter('ALL')}
              className="btn btn-sm"
              style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', backgroundColor: '#059669', color: '#ffffff' }}
            >
              View in All History →
            </button>
          )}
        </div>
      )}

      {/* Tab Navigation & Search Filter Controls */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Main Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`btn btn-sm ${filter === 'ACTIVE' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontWeight: '700', position: 'relative' }}
            >
              <Bell size={14} />
              <span>Active Alerts</span>
              {activeCount > 0 && (
                <span style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '9999px',
                  marginLeft: '0.35rem'
                }}>
                  {activeCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilter('ALL')}
              className={`btn btn-sm ${filter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontWeight: '700' }}
            >
              <History size={14} />
              <span>All History ({allCount})</span>
            </button>

            <button
              onClick={() => setFilter('RESOLVED')}
              className={`btn btn-sm ${filter === 'RESOLVED' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontWeight: '700' }}
            >
              <CheckCircle2 size={14} />
              <span>Read / Resolved ({resolvedCount})</span>
            </button>
          </div>

          {/* Search & Severity Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1, maxWidth: '520px', justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={isRcmAdmin() ? "Search alerts, claims, company..." : "Search alerts, claims..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '2rem', height: '36px', fontSize: '0.85rem' }}
              />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="form-control"
              style={{ width: '130px', height: '36px', fontSize: '0.85rem' }}
            >
              <option value="ALL">All Severity</option>
              <option value="CRITICAL">Critical</option>
              <option value="WARNING">Warning</option>
              <option value="SUCCESS">Success</option>
              <option value="INFO">Info</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LINE-BY-LINE UPCOMING ALERTS & HISTORY FEED                               */}
      {/* ========================================================================= */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
        <div style={{
          padding: '0.85rem 1.25rem',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>
            {filter === 'ACTIVE' ? 'Active Alerts Feed (Upcoming Line-by-Line)' : (filter === 'ALL' ? 'All Alert History (Chronological Feed)' : 'Resolved Alerts')}
            {isRcmAdmin() && selectedPayer !== 'ALL' && (
              <span style={{ color: '#2563eb', marginLeft: '0.5rem', fontWeight: '700' }}>
                &bull; Payer: {DEMO_PAYERS.find(p => p.id === selectedPayer)?.name}
              </span>
            )}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredAlerts.length}</strong> alerts
          </span>
        </div>

        {filteredAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 0.75rem auto' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--navy-dark)' }}>
              {filter === 'ACTIVE' ? 'No active alerts in queue' : 'No alerts match your filter'}
            </h4>
            <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 1rem 0' }}>
              {filter === 'ACTIVE' ? 'All operational alerts for this company have been addressed.' : 'Try changing your search keywords or severity filter.'}
            </p>
            {filter === 'ACTIVE' && (
              <button onClick={() => setFilter('ALL')} className="btn btn-secondary btn-sm">
                View All History ({allCount})
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredAlerts.map((alert, index) => {
              const isResolved = alert.resolved;
              const severityColor =
                alert.severity === 'CRITICAL' ? '#dc2626' : (alert.severity === 'WARNING' ? '#f59e0b' : (alert.severity === 'SUCCESS' ? '#10b981' : '#3b82f6'));

              return (
                <div
                  key={alert.id || alert.alertId || index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.9rem 1.25rem',
                    borderBottom: index < filteredAlerts.length - 1 ? '1px solid #f1f5f9' : 'none',
                    borderLeft: `5px solid ${severityColor}`,
                    backgroundColor: isResolved ? '#fcfdfd' : '#ffffff',
                    transition: 'background-color 0.15s ease',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isResolved ? '#fcfdfd' : '#ffffff'; }}
                >
                  {/* Left: Severity Indicator + Info Line */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '320px' }}>
                    {/* Severity Icon */}
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: alert.severity === 'CRITICAL' ? '#fef2f2' : (alert.severity === 'WARNING' ? '#fffbeb' : (alert.severity === 'SUCCESS' ? '#ecfdf5' : '#eff6ff')),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {alert.severity === 'CRITICAL' && <AlertCircle size={18} color="#dc2626" />}
                      {alert.severity === 'WARNING' && <AlertTriangle size={18} color="#f59e0b" />}
                      {alert.severity === 'SUCCESS' && <CheckCircle2 size={18} color="#10b981" />}
                      {alert.severity === 'INFO' && <Info size={18} color="#3b82f6" />}
                    </div>

                    {/* Alert Text Line */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.92rem', color: isResolved ? '#475569' : 'var(--navy-dark)' }}>
                          {alert.title}
                        </span>

                        {/* Company Badge */}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.12rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          backgroundColor: 'rgba(37, 99, 235, 0.08)',
                          color: '#2563eb',
                          border: '1px solid rgba(37, 99, 235, 0.2)'
                        }}>
                          <Building2 size={11} />
                          {alert.insuranceCompanyName || (isInsuranceCompany() ? (user?.companyName || 'Assigned Payer') : 'All Payers')}
                        </span>

                        {getSeverityBadge(alert.severity)}

                        {isResolved ? (
                          <span style={{
                            fontSize: '0.68rem',
                            color: '#059669',
                            fontWeight: '700',
                            backgroundColor: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px'
                          }}>
                            READ / IN HISTORY
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.68rem',
                            color: '#b91c1c',
                            fontWeight: '700',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px'
                          }}>
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: '0.82rem', color: isResolved ? '#64748b' : '#334155', margin: '0 0 0.2rem 0', lineHeight: '1.4' }}>
                        {alert.message}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <span className="font-mono">ID: {alert.alertId}</span>
                        <span>•</span>
                        {alert.claimId && (
                          <>
                            <span>Claim: <strong className="font-mono" style={{ color: 'var(--primary)' }}>{alert.claimId}</strong></span>
                            <span>•</span>
                          </>
                        )}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={11} /> {formatTimestamp(alert.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {alert.claimId && (
                      <Link
                        to={`/claims/${alert.claimId}`}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                      >
                        <span>Inspect</span>
                        <ExternalLink size={12} />
                      </Link>
                    )}

                    {!isResolved ? (
                      <button
                        onClick={() => handleMarkAsRead(alert.id || alert.alertId, alert.title)}
                        disabled={actionLoading}
                        className="btn btn-sm"
                        style={{
                          backgroundColor: '#059669',
                          color: '#ffffff',
                          fontWeight: '700',
                          fontSize: '0.78rem',
                          padding: '0.35rem 0.75rem',
                          boxShadow: '0 2px 5px rgba(5, 150, 105, 0.25)'
                        }}
                        title="Click to mark as read and move to All History"
                      >
                        <Check size={13} />
                        <span>Mark as Read</span>
                      </button>
                    ) : (
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#059669',
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.35rem 0.5rem'
                      }}>
                        <CheckCircle2 size={14} /> Read
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
