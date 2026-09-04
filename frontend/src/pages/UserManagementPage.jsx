import React, { useState, useEffect } from 'react';
import {
  getAdminUsers,
  approveUser,
  rejectUser,
  disableUser
} from '../services/api';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Building2,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  UserX,
  ShieldAlert
} from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notification, setNotification] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers();
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId, userName) => {
    setActionLoadingId(userId);
    try {
      await approveUser(userId);
      setNotification(`User "${userName}" has been APPROVED and activated.`);
      fetchUsers();
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to REJECT and remove registration for "${userName}"?`)) return;
    setActionLoadingId(userId);
    try {
      await rejectUser(userId);
      setNotification(`Registration for "${userName}" was rejected.`);
      fetchUsers();
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      console.error('Rejection failed:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleActive = async (user) => {
    const isCurrentlyActive = user.active !== false && user.accountStatus === 'ACTIVE';
    const actionText = isCurrentlyActive ? 'SUSPEND / DISABLE' : 'ACTIVATE';
    if (!window.confirm(`Are you sure you want to ${actionText} user "${user.fullName}"?`)) return;

    setActionLoadingId(user.id);
    try {
      await disableUser(user.id);
      setNotification(`User status toggled for "${user.fullName}".`);
      fetchUsers();
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      console.error('Status change failed:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = users.filter(u => {
    const matchesSearch =
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.insuranceCompanyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || (u.accountStatus || (u.active ? 'ACTIVE' : 'SUSPENDED')) === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUsers = users.length;
  const pendingCount = users.filter(u => u.accountStatus === 'PENDING_APPROVAL').length;
  const activeCount = users.filter(u => u.accountStatus === 'ACTIVE' || (u.accountStatus == null && u.active)).length;
  const insurerCount = users.filter(u => u.role === 'INSURANCE_COMPANY').length;

  return (
    <div style={{ padding: '1.75rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Users size={26} color="#2563eb" />
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              User Access & Verification Management
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Review pending payer registrations, authorize insurance claim representatives, and manage role-based permissions
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="btn btn-secondary btn-sm"
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {notification && (
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
          <CheckCircle2 size={18} /> {notification}
        </div>
      )}

      {/* KPI Cards */}
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
            Total User Accounts
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>
            {totalUsers}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            All platform operators
          </div>
        </div>

        <div style={{
          background: pendingCount > 0 ? '#fffbeb' : '#ffffff',
          borderRadius: '12px',
          padding: '1.25rem',
          border: pendingCount > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: pendingCount > 0 ? '#b45309' : '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Pending Approval
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: pendingCount > 0 ? '#d97706' : '#0f172a' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: pendingCount > 0 ? '#b45309' : '#64748b', marginTop: '0.25rem', fontWeight: '600' }}>
            {pendingCount > 0 ? 'Action required by RCM Admin' : 'All accounts verified'}
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
            Active Insurer Accounts
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#2563eb' }}>
            {insurerCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Contracted payer representatives
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
            Active Accounts
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#10b981' }}>
            {activeCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem', fontWeight: '600' }}>
            Full system credentials active
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
            placeholder="Search by user name, email, or affiliated insurance company..."
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="form-control"
              style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.825rem' }}
            >
              <option value="ALL">All Roles</option>
              <option value="RCM_ADMIN">RCM Admin</option>
              <option value="INSURANCE_COMPANY">Insurance Company</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control"
              style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.825rem' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
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
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>USER NAME</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>EMAIL</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>ASSIGNED ROLE</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>INSURANCE AFFILIATION</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textAlign: 'center' }}>STATUS</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem auto' }} />
                    Loading user management directory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    No users found matching current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const status = user.accountStatus || (user.active !== false ? 'ACTIVE' : 'SUSPENDED');
                  const isPending = status === 'PENDING_APPROVAL';
                  const isActive = status === 'ACTIVE';
                  const isSuspended = status === 'SUSPENDED';
                  const isActionBusy = actionLoadingId === user.id;

                  return (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isPending ? 'rgba(254, 243, 199, 0.2)' : 'transparent',
                        transition: 'background-color 0.15s'
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.875rem' }}>
                          {user.fullName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          ID: {user.id ? String(user.id).slice(-8) : 'Sys'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#334155' }}>
                        {user.email}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          background: user.role === 'RCM_ADMIN' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(59, 130, 246, 0.12)',
                          color: user.role === 'RCM_ADMIN' ? '#4f46e5' : '#2563eb',
                          border: `1px solid ${user.role === 'RCM_ADMIN' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(59, 130, 246, 0.25)'}`
                        }}>
                          {user.role === 'RCM_ADMIN' ? <ShieldCheck size={12} /> : <Building2 size={12} />}
                          {user.role === 'RCM_ADMIN' ? 'RCM Admin' : 'Insurance Company'}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        {user.insuranceCompanyName ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.85rem' }}>
                              {user.insuranceCompanyName}
                            </span>
                            {user.insuranceCompanyId && (
                              <span style={{
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                background: '#f1f5f9',
                                color: '#475569',
                                fontSize: '0.7rem',
                                fontFamily: 'monospace',
                                fontWeight: '700'
                              }}>
                                {user.insuranceCompanyId}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>
                            Enterprise Hospital Admin (All Payers)
                          </span>
                        )}
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
                          background: isPending ? '#fef3c7' : isActive ? '#ecfdf5' : '#fef2f2',
                          color: isPending ? '#92400e' : isActive ? '#065f46' : '#991b1b',
                          border: `1px solid ${isPending ? '#fde68a' : isActive ? '#a7f3d0' : '#fecaca'}`
                        }}>
                          {isPending && <Clock size={12} />}
                          {isActive && <CheckCircle2 size={12} />}
                          {isSuspended && <XCircle size={12} />}
                          {status}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          {isPending ? (
                            <>
                              <button
                                onClick={() => handleApprove(user.id, user.fullName)}
                                disabled={isActionBusy}
                                className="btn btn-primary btn-sm"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: '#10b981', borderColor: '#10b981' }}
                                title="Approve Registration"
                              >
                                <UserCheck size={13} style={{ marginRight: '0.25rem' }} /> Approve
                              </button>
                              <button
                                onClick={() => handleReject(user.id, user.fullName)}
                                disabled={isActionBusy}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: '#ef4444' }}
                                title="Reject Registration"
                              >
                                <UserX size={13} style={{ marginRight: '0.25rem' }} /> Reject
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleToggleActive(user)}
                              disabled={isActionBusy}
                              className={`btn btn-sm ${isActive ? 'btn-secondary' : 'btn-primary'}`}
                              style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                              title={isActive ? 'Disable User Access' : 'Reactivate User Account'}
                            >
                              {isActive ? 'Disable' : 'Enable'}
                            </button>
                          )}
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
    </div>
  );
}
