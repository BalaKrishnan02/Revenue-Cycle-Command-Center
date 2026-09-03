import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle2,
  DollarSign,
  Calendar,
  CalendarDays,
  PhoneCall,
  CreditCard,
  Eye,
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  Coins,
  Building2,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import {
  getArAgingSummary,
  getArAgingClaims,
  getArAgingPayers,
  getArAgingDailyStats,
  recordArFollowUp,
  recordPartialPayment,
  payClaim
} from '../services/api';

export default function ArAgingPage() {
  const [summary, setSummary] = useState(null);
  const [claims, setClaims] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState('ALL');
  const [selectedPayer, setSelectedPayer] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('ALL');
  const [payersList, setPayersList] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal States
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [modalType, setModalType] = useState(null); // 'FOLLOW_UP', 'PARTIAL_PAY', 'PAY_FULL'
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Follow-Up Form
  const [followUpStatus, setFollowUpStatus] = useState('CONTACTED');
  const [followUpNote, setFollowUpNote] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState('');

  const fetchData = async (bucket = selectedBucket, payer = selectedPayer, date = selectedDate) => {
    try {
      setError(null);
      const [sumRes, claimsRes, payersRes, dailyRes] = await Promise.all([
        getArAgingSummary(payer, date),
        getArAgingClaims(bucket, payer, date),
        getArAgingPayers(),
        getArAgingDailyStats(payer)
      ]);
      setSummary(sumRes.data);
      setClaims(claimsRes.data);
      if (payersRes?.data) setPayersList(payersRes.data);
      if (dailyRes?.data) setDailyStats(dailyRes.data);
    } catch (err) {
      console.error('Error loading AR Aging data:', err);
      setError('Unable to load AR Aging data. Please retry.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(selectedBucket, selectedPayer, selectedDate);
    const interval = setInterval(() => fetchData(selectedBucket, selectedPayer, selectedDate), 4000);
    return () => clearInterval(interval);
  }, [selectedBucket, selectedPayer, selectedDate]);

  const handleBucketSelect = (bucketKey) => {
    const nextBucket = selectedBucket === bucketKey ? 'ALL' : bucketKey;
    setSelectedBucket(nextBucket);
    setLoading(true);
    fetchData(nextBucket, selectedPayer, selectedDate);
  };

  const handlePayerSelect = (payerName) => {
    const nextPayer = selectedPayer === payerName ? 'ALL' : payerName;
    setSelectedPayer(nextPayer);
    setLoading(true);
    fetchData(selectedBucket, nextPayer, selectedDate);
  };

  const handleDateSelect = (dateStr) => {
    const nextDate = selectedDate === dateStr ? 'ALL' : dateStr;
    setSelectedDate(nextDate);
    setLoading(true);
    fetchData(selectedBucket, selectedPayer, nextDate);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData(selectedBucket, selectedPayer, selectedDate);
  };

  // Open Follow-up Modal
  const openFollowUpModal = (claim) => {
    setSelectedClaim(claim);
    setFollowUpStatus(claim.followUpStatus || 'CONTACTED');
    setFollowUpNote(claim.followUpNotes || claim.followUpNote || '');
    setNextFollowUpDate(claim.nextFollowUpDate ? claim.nextFollowUpDate.split('T')[0] : '');
    setFeedback(null);
    setModalType('FOLLOW_UP');
  };

  // Open Partial Payment Modal
  const openPartialPayModal = (claim) => {
    setSelectedClaim(claim);
    setPaymentAmount('');
    setFeedback(null);
    setModalType('PARTIAL_PAY');
  };

  // Open Full Pay Confirmation
  const openPayFullModal = (claim) => {
    setSelectedClaim(claim);
    setPaymentAmount(claim.pendingAmount || 0);
    setFeedback(null);
    setModalType('PAY_FULL');
  };

  const closeModal = () => {
    setSelectedClaim(null);
    setModalType(null);
    setFeedback(null);
  };

  // Submit Follow-up
  const submitFollowUp = async (e) => {
    if (e) e.preventDefault();
    if (!selectedClaim) return;

    try {
      setActionLoading(true);
      await recordArFollowUp(selectedClaim.claimId || selectedClaim.id, {
        followUpStatus,
        followUpNote,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate).toISOString() : null
      });

      setFeedback({ type: 'success', message: `Follow-up logged for ${selectedClaim.claimId}.` });
      setTimeout(() => {
        closeModal();
        fetchData(selectedBucket, selectedPayer, selectedDate);
      }, 1000);
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to record follow-up. Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Payment (Partial or Full)
  const submitPayment = async (isFull = false) => {
    if (!selectedClaim) return;
    const amount = isFull ? selectedClaim.pendingAmount : Number(paymentAmount);

    if (!amount || amount <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid payment amount.' });
      return;
    }

    try {
      setActionLoading(true);
      if (isFull || amount >= selectedClaim.pendingAmount) {
        await payClaim(selectedClaim.claimId || selectedClaim.id, { amount });
        setFeedback({
          type: 'success',
          message: `Claim ${selectedClaim.claimId} fully paid (₹${amount.toLocaleString()})! Removed from active AR aging.`
        });
      } else {
        await recordPartialPayment(selectedClaim.claimId || selectedClaim.id, {
          amount,
          transactionReference: 'TXN-AR-' + Date.now().toString().slice(-6)
        });
        setFeedback({
          type: 'success',
          message: `Partial payment of ₹${amount.toLocaleString()} recorded. Remaining balance: ₹${(selectedClaim.pendingAmount - amount).toLocaleString()}.`
        });
      }

      setTimeout(() => {
        closeModal();
        fetchData(selectedBucket, selectedPayer, selectedDate);
      }, 1200);
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to process payment. Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Currency Formatter
  const formatINR = (amt) => {
    if (amt === undefined || amt === null) return '₹0';
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)}L`;
    return `₹${Math.round(amt).toLocaleString()}`;
  };

  // Format Date for Display
  const formatDisplayDate = (dateStr) => {
    if (!dateStr || dateStr === 'ALL') return 'All Dates';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch (e) {}
    return dateStr;
  };

  // Get Claim Display Date
  const getClaimDisplayDate = (claim) => {
    const raw = claim.claimSubmittedDate || claim.createdAt;
    if (raw) {
      try {
        const d = new Date(raw);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      } catch (e) {}
    }
    const days = claim.daysPending || 1;
    const d = new Date(Date.now() - days * 86400000);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Filtered Claims
  const filteredClaims = claims.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.claimId?.toLowerCase().includes(term) ||
      c.payerName?.toLowerCase().includes(term) ||
      c.patientName?.toLowerCase().includes(term)
    );
  });

  // Selected Day Calculations
  const activeDayStat = dailyStats.find((s) => s.date === selectedDate);
  const selectedDayTotalClaimed = activeDayStat
    ? activeDayStat.totalClaimAmount
    : claims.reduce((acc, c) => acc + (c.totalBillAmount || c.claimAmount || 0), 0);
  const selectedDayTotalPending = activeDayStat
    ? activeDayStat.totalPendingAmount
    : summary?.totalOutstanding || 0;
  const selectedDayTotalPaid = activeDayStat
    ? activeDayStat.totalPaidAmount
    : Math.max(0, selectedDayTotalClaimed - selectedDayTotalPending);

  // Chart Data Preparation
  const chartData = [
    {
      bucket: '0–30',
      amount: summary?.buckets?.['0-30']?.amount || 0,
      count: summary?.buckets?.['0-30']?.claimCount || 0,
      color: '#10b981'
    },
    {
      bucket: '31–60',
      amount: summary?.buckets?.['31-60']?.amount || 0,
      count: summary?.buckets?.['31-60']?.claimCount || 0,
      color: '#3b82f6'
    },
    {
      bucket: '61–90',
      amount: summary?.buckets?.['61-90']?.amount || 0,
      count: summary?.buckets?.['61-90']?.claimCount || 0,
      color: '#f59e0b'
    },
    {
      bucket: '90+',
      amount: summary?.buckets?.['90+']?.amount || 0,
      count: summary?.buckets?.['90+']?.claimCount || 0,
      color: '#ef4444'
    }
  ];

  // Helper Badge Colors for Aging Buckets
  const getBucketBadgeStyle = (bucket) => {
    switch (bucket) {
      case '90+':
        return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca', label: '90+ DAYS' };
      case '61-90':
        return { bg: '#fffbeb', text: '#92400e', border: '#fde68a', label: '61–90 DAYS' };
      case '31-60':
        return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe', label: '31–60 DAYS' };
      default:
        return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0', label: '0–30 DAYS' };
    }
  };

  return (
    <div className="page-wrapper">
      {/* 1. Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--navy-dark)', letterSpacing: '-0.02em' }}>
              Accounts Receivable Aging
            </h1>
            <span style={{
              background: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              borderRadius: '9999px',
              padding: '0.2rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <span className="live-dot" /> AR ENGINE
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', maxWidth: '720px' }}>
            Track unpaid insurance revenue by outstanding days and identify delayed claims requiring follow-up.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleRefresh}
            className="btn btn-secondary"
            disabled={isRefreshing}
            style={{ fontSize: '0.825rem' }}
          >
            <RefreshCw size={15} className={isRefreshing ? 'spin' : ''} />
            {isRefreshing ? 'Syncing...' : 'Live Sync'}
          </button>
          <Link to="/claims" className="btn btn-primary" style={{ fontSize: '0.825rem' }}>
            <FileText size={15} /> All Claims
          </Link>
        </div>
      </div>

      {/* 2. Dedicated Insurance Payer Selector */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={18} color="#2563eb" />
            <h2 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--navy-dark)', margin: 0 }}>
              Filter by Insurance Payer Name
            </h2>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              (Click any payer to filter AR Aging metrics & claims)
            </span>
          </div>

          {selectedPayer !== 'ALL' && (
            <button
              onClick={() => handlePayerSelect('ALL')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
            >
              <X size={13} /> Reset to All Payers
            </button>
          )}
        </div>

        {/* Payer Selection Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem'
        }}>
          {/* All Payers Pill */}
          <button
            type="button"
            onClick={() => handlePayerSelect('ALL')}
            style={{
              textAlign: 'left',
              background: selectedPayer === 'ALL' ? '#eff6ff' : '#f8fafc',
              border: selectedPayer === 'ALL' ? '2px solid #2563eb' : '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem 0.9rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: selectedPayer === 'ALL' ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
              <span style={{ fontWeight: '800', fontSize: '0.85rem', color: selectedPayer === 'ALL' ? '#1d4ed8' : 'var(--navy-dark)' }}>
                All Insurance Payers
              </span>
              {selectedPayer === 'ALL' && <CheckCircle2 size={15} color="#2563eb" />}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Hospital-wide view
            </div>
          </button>

          {/* Individual Payers */}
          {payersList.map((p) => {
            const isSelected = selectedPayer.toLowerCase() === p.payerName.toLowerCase();
            return (
              <button
                key={p.payerName}
                type="button"
                onClick={() => handlePayerSelect(p.payerName)}
                style={{
                  textAlign: 'left',
                  background: isSelected ? '#eff6ff' : '#ffffff',
                  border: isSelected ? '2px solid #2563eb' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.65rem 0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.85rem', color: isSelected ? '#1d4ed8' : 'var(--navy-dark)' }}>
                    {p.payerName}
                  </span>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '9999px',
                    background: p.payerType === 'COMMERCIAL' ? '#f0fdf4' : '#f8fafc',
                    color: p.payerType === 'COMMERCIAL' ? '#047857' : '#475569',
                    border: `1px solid ${p.payerType === 'COMMERCIAL' ? '#bbf7d0' : '#cbd5e1'}`
                  }}>
                    {p.payerType || 'COMMERCIAL'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <strong style={{ color: '#dc2626' }}>{formatINR(p.totalOutstanding)}</strong>
                  <span style={{ color: 'var(--text-muted)' }}>{p.claimCount} claims</span>
                </div>
              </button>
            );
          })}
        </div>

        {selectedPayer !== 'ALL' && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.45rem 0.75rem',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '6px',
            fontSize: '0.775rem',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>
              Currently viewing AR Aging specifically for <strong>{selectedPayer}</strong>.
            </span>
            <button
              onClick={() => handlePayerSelect('ALL')}
              style={{ background: 'none', border: 'none', color: '#166534', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* 3. Day-by-Day Claim Calendar & Amount Explorer */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.75rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <CalendarDays size={20} color="#2563eb" />
              <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--navy-dark)', margin: 0 }}>
                Day-by-Day Claim Calendar & Amount Explorer
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Click the calendar or pick a day below to check how much amount was claimed and what remains pending.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* Interactive Native Date Picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.775rem', fontWeight: '700', color: '#475569' }}>
                Select Calendar Date:
              </label>
              <input
                type="date"
                value={selectedDate === 'ALL' ? '' : selectedDate}
                onChange={(e) => handleDateSelect(e.target.value || 'ALL')}
                className="form-control"
                style={{ fontSize: '0.825rem', padding: '0.35rem 0.65rem', width: '150px', cursor: 'pointer' }}
              />
            </div>

            {selectedDate !== 'ALL' && (
              <button
                type="button"
                onClick={() => handleDateSelect('ALL')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', gap: '0.3rem', padding: '0.35rem 0.65rem' }}
              >
                <X size={13} /> Clear Date (All Days)
              </button>
            )}
          </div>
        </div>

        {/* Selected Day Amount Inspection Banner */}
        {selectedDate !== 'ALL' && (
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800'
              }}>
                <Calendar size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  DAY INSPECTION REPORT
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.01em' }}>
                  {formatDisplayDate(selectedDate)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>TOTAL CLAIM AMOUNT BILLED</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#60a5fa' }}>
                  {formatINR(selectedDayTotalClaimed)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>AMOUNT PAID</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#34d399' }}>
                  {formatINR(selectedDayTotalPaid)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>AMOUNT PENDING (AR)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f87171' }}>
                  {formatINR(selectedDayTotalPending)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>CLAIMS COUNT</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff' }}>
                  {filteredClaims.length} Claims
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Day-by-Day Quick Date Ribbon */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Active Submission Days (Click any day to inspect claim amount)
          </div>
          <div style={{
            display: 'flex',
            gap: '0.65rem',
            overflowX: 'auto',
            paddingBottom: '0.4rem'
          }}>
            {/* All Dates Chip */}
            <button
              type="button"
              onClick={() => handleDateSelect('ALL')}
              style={{
                flexShrink: 0,
                padding: '0.55rem 0.85rem',
                borderRadius: '8px',
                textAlign: 'left',
                background: selectedDate === 'ALL' ? '#eff6ff' : '#f8fafc',
                border: selectedDate === 'ALL' ? '2px solid #2563eb' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontWeight: '800', fontSize: '0.8rem', color: selectedDate === 'ALL' ? '#1d4ed8' : 'var(--navy-dark)' }}>
                All Dates
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Full AR Portfolio
              </div>
            </button>

            {/* Individual Days */}
            {dailyStats.map((ds) => {
              const isSelected = selectedDate === ds.date;
              return (
                <button
                  key={ds.date}
                  type="button"
                  onClick={() => handleDateSelect(ds.date)}
                  style={{
                    flexShrink: 0,
                    padding: '0.55rem 0.85rem',
                    borderRadius: '8px',
                    textAlign: 'left',
                    background: isSelected ? '#eff6ff' : '#ffffff',
                    border: isSelected ? '2px solid #2563eb' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                    <span style={{ fontWeight: '800', fontSize: '0.8rem', color: isSelected ? '#1d4ed8' : 'var(--navy-dark)' }}>
                      {ds.formattedDate}
                    </span>
                    <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#64748b' }}>
                      {ds.daysPending}d ago
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem', fontSize: '0.725rem' }}>
                    <span style={{ color: '#2563eb', fontWeight: '800' }}>
                      {formatINR(ds.totalClaimAmount)}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {ds.claimCount} claims
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#991b1b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={18} />
            <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{error}</span>
          </div>
          <button onClick={() => fetchData(selectedBucket, selectedPayer, selectedDate)} className="btn btn-danger btn-sm">
            Retry
          </button>
        </div>
      )}

      {/* 4. Top 4 KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* Card 1: Total Outstanding */}
        <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              TOTAL OUTSTANDING
            </span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: '#eff6ff', color: '#2563eb' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e3a8a', letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>
            {loading ? '...' : formatINR(summary?.totalOutstanding || 0)}
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            {selectedDate !== 'ALL'
              ? `Unpaid for ${formatDisplayDate(selectedDate)}`
              : (selectedPayer !== 'ALL' ? `Unpaid by ${selectedPayer}` : 'Total unpaid insurance revenue')}
          </div>
        </div>

        {/* Card 2: Pending Claims */}
        <div className="card" style={{ borderLeft: '4px solid #d97706' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              PENDING CLAIMS
            </span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: '#fffbeb', color: '#d97706' }}>
              <Coins size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#92400e', letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>
            {loading ? '...' : (summary?.totalPendingClaims ?? 0)}
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            Claims with outstanding balance
          </div>
        </div>

        {/* Card 3: Average Days Outstanding */}
        <div className="card" style={{ borderLeft: '4px solid #059669' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              AVERAGE DAYS OUTSTANDING
            </span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: '#ecfdf5', color: '#059669' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#065f46', letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>
            {loading ? '...' : `${summary?.averageDaysOutstanding || 0} Days`}
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            Average settlement latency
          </div>
        </div>

        {/* Card 4: Oldest Pending Claim */}
        <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              OLDEST PENDING CLAIM
            </span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: '#fef2f2', color: '#dc2626' }}>
              <Flame size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#991b1b', letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>
            {loading ? '...' : `${summary?.oldestPendingDays || 0} Days`}
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            Longest unsettled insurance bill
          </div>
        </div>
      </div>

      {/* 5. Four Aging Bucket Cards */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--navy-dark)' }}>
            Aging Categories (Click to filter table)
          </h2>
          {selectedBucket !== 'ALL' && (
            <button
              onClick={() => handleBucketSelect('ALL')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              Reset to All ({claims.length})
            </button>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '1rem'
        }}>
          {/* Bucket 1: 0-30 Days */}
          <div
            onClick={() => handleBucketSelect('0-30')}
            className="card"
            style={{
              cursor: 'pointer',
              borderColor: selectedBucket === '0-30' ? '#10b981' : 'var(--border-color)',
              boxShadow: selectedBucket === '0-30' ? '0 0 0 2px #10b981, 0 8px 16px rgba(16, 185, 129, 0.15)' : undefined,
              transition: 'all 0.2s ease',
              backgroundColor: selectedBucket === '0-30' ? '#f0fdf4' : '#ffffff'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#065f46' }}>
                0–30 DAYS
              </span>
              <span style={{
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                borderRadius: '9999px',
                padding: '0.15rem 0.55rem',
                fontSize: '0.7rem',
                fontWeight: '700'
              }}>
                MONITOR
              </span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#047857', marginBottom: '0.2rem' }}>
              {formatINR(summary?.buckets?.['0-30']?.amount || 0)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {summary?.buckets?.['0-30']?.claimCount || 0} Claims
            </div>
          </div>

          {/* Bucket 2: 31-60 Days */}
          <div
            onClick={() => handleBucketSelect('31-60')}
            className="card"
            style={{
              cursor: 'pointer',
              borderColor: selectedBucket === '31-60' ? '#2563eb' : 'var(--border-color)',
              boxShadow: selectedBucket === '31-60' ? '0 0 0 2px #2563eb, 0 8px 16px rgba(37, 99, 235, 0.15)' : undefined,
              transition: 'all 0.2s ease',
              backgroundColor: selectedBucket === '31-60' ? '#eff6ff' : '#ffffff'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e40af' }}>
                31–60 DAYS
              </span>
              <span style={{
                background: '#eff6ff',
                color: '#1e40af',
                border: '1px solid #bfdbfe',
                borderRadius: '9999px',
                padding: '0.15rem 0.55rem',
                fontSize: '0.7rem',
                fontWeight: '700'
              }}>
                FOLLOW UP
              </span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1d4ed8', marginBottom: '0.2rem' }}>
              {formatINR(summary?.buckets?.['31-60']?.amount || 0)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {summary?.buckets?.['31-60']?.claimCount || 0} Claims
            </div>
          </div>

          {/* Bucket 3: 61-90 Days */}
          <div
            onClick={() => handleBucketSelect('61-90')}
            className="card"
            style={{
              cursor: 'pointer',
              borderColor: selectedBucket === '61-90' ? '#d97706' : 'var(--border-color)',
              boxShadow: selectedBucket === '61-90' ? '0 0 0 2px #d97706, 0 8px 16px rgba(217, 119, 6, 0.15)' : undefined,
              transition: 'all 0.2s ease',
              backgroundColor: selectedBucket === '61-90' ? '#fffbeb' : '#ffffff'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#92400e' }}>
                61–90 DAYS
              </span>
              <span style={{
                background: '#fffbeb',
                color: '#92400e',
                border: '1px solid #fde68a',
                borderRadius: '9999px',
                padding: '0.15rem 0.55rem',
                fontSize: '0.7rem',
                fontWeight: '700'
              }}>
                HIGH ATTENTION
              </span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#b45309', marginBottom: '0.2rem' }}>
              {formatINR(summary?.buckets?.['61-90']?.amount || 0)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {summary?.buckets?.['61-90']?.claimCount || 0} Claims
            </div>
          </div>

          {/* Bucket 4: 90+ Days */}
          <div
            onClick={() => handleBucketSelect('90+')}
            className="card"
            style={{
              cursor: 'pointer',
              borderColor: selectedBucket === '90+' ? '#dc2626' : 'var(--border-color)',
              boxShadow: selectedBucket === '90+' ? '0 0 0 2px #dc2626, 0 8px 16px rgba(220, 38, 38, 0.15)' : undefined,
              transition: 'all 0.2s ease',
              backgroundColor: selectedBucket === '90+' ? '#fef2f2' : '#ffffff'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#991b1b' }}>
                90+ DAYS
              </span>
              <span style={{
                background: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fecaca',
                borderRadius: '9999px',
                padding: '0.15rem 0.55rem',
                fontSize: '0.7rem',
                fontWeight: '700'
              }}>
                CRITICAL
              </span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#b91c1c', marginBottom: '0.2rem' }}>
              {formatINR(summary?.buckets?.['90+']?.amount || 0)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {summary?.buckets?.['90+']?.claimCount || 0} Claims
            </div>
          </div>
        </div>
      </div>

      {/* 6. Aging Bar Chart */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 className="card-title" style={{ marginBottom: '0.25rem' }}>
              <ArrowUpDown size={18} color="#2563eb" /> Outstanding Revenue by Aging Bucket
              {selectedDate !== 'ALL' && <span style={{ color: '#2563eb', fontSize: '0.9rem' }}> — {formatDisplayDate(selectedDate)}</span>}
              {selectedPayer !== 'ALL' && <span style={{ color: '#059669', fontSize: '0.9rem' }}> ({selectedPayer})</span>}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Unpaid rupee value categorized by duration outstanding
            </p>
          </div>
        </div>

        <div style={{ height: '240px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <XAxis dataKey="bucket" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
              <YAxis
                tickFormatter={(val) => formatINR(val)}
                tick={{ fill: '#64748b', fontSize: 11 }}
                width={70}
              />
              <Tooltip
                formatter={(val, name, item) => [
                  `₹${Number(val).toLocaleString()} (${item.payload.count} claims)`,
                  'Outstanding'
                ]}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.85rem'
                }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7. Claims Table */}
      <div className="card">
        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="card-title" style={{ marginBottom: '0.25rem' }}>
              <Clock size={18} color="#2563eb" />
              Aging Claims{' '}
              {selectedBucket !== 'ALL' && <span style={{ color: '#2563eb' }}>({selectedBucket} Bucket)</span>}
              {selectedPayer !== 'ALL' && <span style={{ color: '#059669' }}> • {selectedPayer}</span>}
              {selectedDate !== 'ALL' && <span style={{ color: '#7c3aed' }}> • {formatDisplayDate(selectedDate)}</span>}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Sorted by days pending (oldest first) then unpaid amount
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#64748b" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search claim, payer, patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '2.25rem', width: '200px', fontSize: '0.85rem' }}
              />
            </div>

            {/* Insurance Payer Dropdown Filter */}
            <select
              value={selectedPayer}
              onChange={(e) => handlePayerSelect(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.85rem', width: '190px', borderColor: selectedPayer !== 'ALL' ? '#2563eb' : undefined }}
            >
              <option value="ALL">All Insurance Payers</option>
              {payersList.map((p) => (
                <option key={p.payerName} value={p.payerName}>
                  {p.payerName} ({p.payerType || 'COMMERCIAL'})
                </option>
              ))}
            </select>

            {/* Calendar Date Dropdown Filter */}
            <select
              value={selectedDate}
              onChange={(e) => handleDateSelect(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.85rem', width: '170px', borderColor: selectedDate !== 'ALL' ? '#7c3aed' : undefined }}
            >
              <option value="ALL">All Calendar Dates</option>
              {dailyStats.map((ds) => (
                <option key={ds.date} value={ds.date}>
                  {ds.formattedDate} ({ds.claimCount} claims)
                </option>
              ))}
            </select>

            {/* Aging Bucket Dropdown */}
            <select
              value={selectedBucket}
              onChange={(e) => handleBucketSelect(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.85rem', width: '135px' }}
            >
              <option value="ALL">All Buckets</option>
              <option value="0-30">0–30 Days</option>
              <option value="31-60">31–60 Days</option>
              <option value="61-90">61–90 Days</option>
              <option value="90+">90+ Days</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Aging</th>
                <th>Claim ID & Date</th>
                <th>Payer Organization</th>
                <th>Total Bill</th>
                <th>Paid</th>
                <th>Pending</th>
                <th>Days Pending</th>
                <th>Payment Status</th>
                <th>Last Follow-Up</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <HelpCircle size={32} color="#94a3b8" />
                      <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                        No outstanding claims in this view.
                      </div>
                      <div style={{ fontSize: '0.8rem' }}>
                        No unsettled bills match the selected date ({formatDisplayDate(selectedDate)}), payer ({selectedPayer}), or bucket ({selectedBucket}).
                      </div>
                      {(selectedPayer !== 'ALL' || selectedBucket !== 'ALL' || selectedDate !== 'ALL') && (
                        <button
                          onClick={() => { setSelectedPayer('ALL'); setSelectedBucket('ALL'); setSelectedDate('ALL'); }}
                          className="btn btn-secondary btn-sm"
                          style={{ marginTop: '0.5rem' }}
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => {
                  const bStyle = getBucketBadgeStyle(claim.agingBucket);
                  return (
                    <tr key={claim.id || claim.claimId}>
                      {/* Aging Badge */}
                      <td>
                        <span style={{
                          backgroundColor: bStyle.bg,
                          color: bStyle.text,
                          border: `1px solid ${bStyle.border}`,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.725rem',
                          fontWeight: '800'
                        }}>
                          {bStyle.label}
                        </span>
                      </td>

                      {/* Claim ID & Submission Date */}
                      <td>
                        <Link
                          to={`/claims/${claim.claimId || claim.id}`}
                          style={{ fontWeight: '700', color: '#2563eb', textDecoration: 'none' }}
                        >
                          {claim.claimId}
                        </Link>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {claim.patientName}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.1rem' }}>
                          <Calendar size={11} /> {getClaimDisplayDate(claim)}
                        </div>
                      </td>

                      {/* Clickable Payer Name */}
                      <td>
                        <button
                          type="button"
                          onClick={() => handlePayerSelect(claim.payerName)}
                          title={`Click to filter AR Aging specifically for ${claim.payerName}`}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            fontWeight: '700',
                            color: selectedPayer.toLowerCase() === claim.payerName?.toLowerCase() ? '#2563eb' : 'var(--navy-text)',
                            textAlign: 'left',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            textDecoration: selectedPayer.toLowerCase() === claim.payerName?.toLowerCase() ? 'underline' : 'none'
                          }}
                        >
                          <span>{claim.payerName}</span>
                          {selectedPayer.toLowerCase() === claim.payerName?.toLowerCase() && (
                            <CheckCircle2 size={13} color="#2563eb" />
                          )}
                        </button>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {claim.payerType || 'COMMERCIAL'}
                        </div>
                      </td>

                      {/* Total Bill */}
                      <td style={{ fontWeight: '600' }}>
                        ₹{Number(claim.totalBillAmount || claim.claimAmount || 0).toLocaleString()}
                      </td>

                      {/* Paid */}
                      <td style={{ color: '#059669', fontWeight: '600' }}>
                        ₹{Number(claim.paidAmount || 0).toLocaleString()}
                      </td>

                      {/* Pending Amount */}
                      <td style={{ color: '#dc2626', fontWeight: '800', fontSize: '0.925rem' }}>
                        ₹{Number(claim.pendingAmount || 0).toLocaleString()}
                      </td>

                      {/* Days Pending */}
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontWeight: '700',
                          color: claim.daysPending > 60 ? '#dc2626' : (claim.daysPending > 30 ? '#d97706' : '#1e293b')
                        }}>
                          <Clock size={13} /> {claim.daysPending || 1}d
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td>
                        <span style={{
                          backgroundColor: claim.paymentStatus === 'PARTIALLY_PAID' ? '#eff6ff' : '#fef2f2',
                          color: claim.paymentStatus === 'PARTIALLY_PAID' ? '#1d4ed8' : '#b91c1c',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          fontWeight: '700'
                        }}>
                          {claim.paymentStatus || 'UNPAID'}
                        </span>
                      </td>

                      {/* Last Follow-Up */}
                      <td>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--navy-text)' }}>
                          {claim.followUpStatus || 'NOT_STARTED'}
                        </div>
                        {claim.followUpNotes && (
                          <div style={{ fontSize: '0.7rem', color: '#64748b', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={claim.followUpNotes}>
                            {claim.followUpNotes}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            onClick={() => openFollowUpModal(claim)}
                            className="btn btn-secondary btn-sm"
                            title="Log Payer Follow-Up"
                            style={{ padding: '0.35rem 0.55rem' }}
                          >
                            <PhoneCall size={13} />
                          </button>

                          <button
                            onClick={() => openPartialPayModal(claim)}
                            className="btn btn-secondary btn-sm"
                            title="Record Partial Payment"
                            style={{ padding: '0.35rem 0.65rem', color: '#2563eb' }}
                          >
                            <CreditCard size={13} /> Pay
                          </button>

                          <button
                            onClick={() => openPayFullModal(claim)}
                            className="btn btn-success btn-sm"
                            title="Mark Settle Paid in Full"
                            style={{ padding: '0.35rem 0.65rem' }}
                          >
                            Settle
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

      {/* MODAL 1: Follow-Up Modal */}
      {modalType === 'FOLLOW_UP' && selectedClaim && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '1.75rem', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--navy-dark)' }}>
                Billing Follow-Up: {selectedClaim.claimId}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.25rem' }}>
                ✕
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ color: '#64748b' }}>Payer:</span>
                <strong>{selectedClaim.payerName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ color: '#64748b' }}>Outstanding Balance:</span>
                <strong style={{ color: '#dc2626' }}>₹{Number(selectedClaim.pendingAmount).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Days Pending:</span>
                <strong>{selectedClaim.daysPending} days ({selectedClaim.agingBucket} bucket)</strong>
              </div>
            </div>

            <form onSubmit={submitFollowUp}>
              <div className="form-group">
                <label className="form-label">Follow-Up Operational Status</label>
                <select
                  value={followUpStatus}
                  onChange={(e) => setFollowUpStatus(e.target.value)}
                  className="form-control"
                >
                  <option value="CONTACTED">CONTACTED (Payer reached out)</option>
                  <option value="WAITING_FOR_PAYER">WAITING_FOR_PAYER (Awaiting response)</option>
                  <option value="ESCALATED">ESCALATED (Supervisor escalation)</option>
                  <option value="RESOLVED">RESOLVED (Settlement promised)</option>
                  <option value="NOT_STARTED">NOT_STARTED</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Follow-Up Notes & Discussion</label>
                <textarea
                  rows={3}
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="e.g., Spoke with payer rep. Additional surgical coding notes requested."
                  className="form-control"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Next Scheduled Follow-Up Date</label>
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="form-control"
                />
              </div>

              {feedback && (
                <div style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  marginBottom: '1rem',
                  backgroundColor: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: feedback.type === 'success' ? '#065f46' : '#991b1b',
                  border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`
                }}>
                  {feedback.message}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={closeModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Follow-Up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Partial Payment */}
      {modalType === 'PARTIAL_PAY' && selectedClaim && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '1.75rem', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--navy-dark)' }}>
                Record Payment: {selectedClaim.claimId}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.25rem' }}>
                ✕
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ color: '#64748b' }}>Total Billed:</span>
                <strong>₹{Number(selectedClaim.totalBillAmount || selectedClaim.claimAmount).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ color: '#64748b' }}>Already Paid:</span>
                <span style={{ color: '#059669', fontWeight: '700' }}>₹{Number(selectedClaim.paidAmount).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Current Pending:</span>
                <span style={{ color: '#dc2626', fontWeight: '800' }}>₹{Number(selectedClaim.pendingAmount).toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); submitPayment(false); }}>
              <div className="form-group">
                <label className="form-label">Payment Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  max={selectedClaim.pendingAmount}
                  placeholder={`Max ₹${Number(selectedClaim.pendingAmount).toLocaleString()}`}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="form-control"
                  required
                />
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Partial payment will reduce the pending balance while keeping the age intact.
                </div>
              </div>

              {feedback && (
                <div style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  marginBottom: '1rem',
                  backgroundColor: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: feedback.type === 'success' ? '#065f46' : '#991b1b',
                  border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`
                }}>
                  {feedback.message}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={closeModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Pay Full Settle Confirmation */}
      {modalType === 'PAY_FULL' && selectedClaim && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '1.75rem', boxShadow: 'var(--shadow-xl)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--navy-dark)', marginBottom: '0.5rem' }}>
              Confirm Full Settlement
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Settle the entire outstanding balance of <strong>₹{Number(selectedClaim.pendingAmount).toLocaleString()}</strong> for claim <strong>{selectedClaim.claimId}</strong>?
            </p>

            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.825rem', color: '#065f46' }}>
              ✓ Status will become <strong>PAID</strong>.<br />
              ✓ Claim will automatically disappear from the active AR Aging Dashboard.<br />
              ✓ Hospital Revenue Collected will increase by <strong>₹{Number(selectedClaim.pendingAmount).toLocaleString()}</strong>.
            </div>

            {feedback && (
              <div style={{
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                marginBottom: '1rem',
                backgroundColor: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                color: feedback.type === 'success' ? '#065f46' : '#991b1b'
              }}>
                {feedback.message}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={closeModal} className="btn btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => submitPayment(true)}
                className="btn btn-success"
                disabled={actionLoading}
              >
                {actionLoading ? 'Settling...' : 'Confirm Full Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
