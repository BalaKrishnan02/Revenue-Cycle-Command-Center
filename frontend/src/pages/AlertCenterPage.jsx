import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Check,
  Search,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { getAlerts, resolveAlert } from '../services/api';

export default function AlertCenterPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ACTIVE'); // ALL, ACTIVE, RESOLVED

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await getAlerts();
      setAlerts(res.data);
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
  }, []);

  const handleResolve = async (id) => {
    try {
      await resolveAlert(id);
      loadAlerts();
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  const filtered = alerts.filter((a) => {
    if (filter === 'ACTIVE') return !a.resolved;
    if (filter === 'RESOLVED') return a.resolved;
    return true;
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="badge badge-high"><AlertCircle size={12} /> Critical</span>;
      case 'WARNING':
        return <span className="badge badge-medium"><AlertTriangle size={12} /> Warning</span>;
      case 'SUCCESS':
        return <span className="badge badge-low"><CheckCircle2 size={12} /> Success</span>;
      default:
        return <span className="badge badge-status-checked"><Info size={12} /> Info</span>;
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--navy-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={24} color="#ef4444" />
            Revenue Cycle Alert Center
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time proactive notifications for high-risk claims, payer denials, missing authorizations, and payment receipts
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={loadAlerts} className="btn btn-secondary btn-sm" title="Refresh">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`btn btn-sm ${filter === 'ACTIVE' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Active Alerts ({alerts.filter((a) => !a.resolved).length})
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`btn btn-sm ${filter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All History ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('RESOLVED')}
            className={`btn btn-sm ${filter === 'RESOLVED' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Resolved ({alerts.filter((a) => a.resolved).length})
          </button>
        </div>
      </div>

      {/* Alerts Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 0.75rem auto' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--navy-dark)' }}>No active alerts</h4>
            <p style={{ fontSize: '0.85rem' }}>All revenue cycle flags and exceptions have been resolved.</p>
          </div>
        ) : (
          filtered.map((alert) => (
            <div
              key={alert.id || alert.alertId}
              className="card"
              style={{
                borderLeft: `5px solid ${
                  alert.severity === 'CRITICAL' ? '#ef4444' : (alert.severity === 'WARNING' ? '#f59e0b' : (alert.severity === 'SUCCESS' ? '#10b981' : '#3b82f6'))
                }`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                opacity: alert.resolved ? 0.7 : 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1, minWidth: '280px' }}>
                <div style={{ marginTop: '0.2rem' }}>
                  {alert.severity === 'CRITICAL' && <AlertCircle size={24} color="#ef4444" />}
                  {alert.severity === 'WARNING' && <AlertTriangle size={24} color="#f59e0b" />}
                  {alert.severity === 'SUCCESS' && <CheckCircle2 size={24} color="#10b981" />}
                  {alert.severity === 'INFO' && <Info size={24} color="#3b82f6" />}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--navy-dark)' }}>
                      {alert.title}
                    </span>
                    {getSeverityBadge(alert.severity)}
                    {alert.resolved && (
                      <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: '700', backgroundColor: '#ecfdf5', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        RESOLVED
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '0.875rem', color: '#334155', margin: '0 0 0.4rem 0' }}>
                    {alert.message}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Alert ID: <strong className="font-mono">{alert.alertId}</strong></span>
                    <span>•</span>
                    <span>{new Date(alert.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {alert.claimId && (
                  <Link to={`/claims/${alert.claimId}`} className="btn btn-secondary btn-sm">
                    <span>Inspect Claim</span>
                    <ExternalLink size={13} />
                  </Link>
                )}

                {!alert.resolved && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="btn btn-secondary btn-sm"
                    title="Mark as Resolved"
                  >
                    <Check size={14} color="#10b981" />
                    <span>Resolve</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
