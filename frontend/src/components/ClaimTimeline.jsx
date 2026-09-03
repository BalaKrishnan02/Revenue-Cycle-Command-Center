import React from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Sparkles,
  DollarSign,
  RotateCcw,
  FileText,
  FileCheck,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export default function ClaimTimeline({ history = [], currentStatus = 'CREATED', createdAt = null }) {
  // Configuration for each lifecycle stage's colors and styling
  const getStageConfig = (status) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'ACCEPTED':
        return {
          color: '#059669',
          bg: '#ecfdf5',
          border: '#10b981',
          lightBorder: '#a7f3d0',
          text: '#065f46',
          label: 'Claim Accepted',
          icon: CheckCircle2,
          glow: 'rgba(16, 185, 129, 0.25)'
        };
      case 'PAID':
        return {
          color: '#047857',
          bg: '#ecfdf5',
          border: '#059669',
          lightBorder: '#6ee7b7',
          text: '#064e3b',
          label: 'Payment Settled',
          icon: DollarSign,
          glow: 'rgba(5, 150, 105, 0.3)'
        };
      case 'DENIED':
        return {
          color: '#dc2626',
          bg: '#fef2f2',
          border: '#ef4444',
          lightBorder: '#fca5a5',
          text: '#991b1b',
          label: 'Claim Denied',
          icon: XCircle,
          glow: 'rgba(239, 68, 68, 0.25)'
        };
      case 'HIGH_RISK':
        return {
          color: '#e11d48',
          bg: '#fff1f2',
          border: '#f43f5e',
          lightBorder: '#fecdd3',
          text: '#9f1239',
          label: 'High Denial Risk Flag',
          icon: AlertTriangle,
          glow: 'rgba(244, 63, 94, 0.25)'
        };
      case 'READY_TO_SUBMIT':
        return {
          color: '#0891b2',
          bg: '#ecfeff',
          border: '#06b6d4',
          lightBorder: '#a5f3fc',
          text: '#155e75',
          label: 'Ready to Submit',
          icon: FileCheck,
          glow: 'rgba(6, 182, 212, 0.2)'
        };
      case 'AI_CHECKED':
        return {
          color: '#7c3aed',
          bg: '#f5f3ff',
          border: '#8b5cf6',
          lightBorder: '#ddd6fe',
          text: '#5b21b6',
          label: 'AI Audit Complete',
          icon: Sparkles,
          glow: 'rgba(139, 92, 246, 0.25)'
        };
      case 'CORRECTED':
        return {
          color: '#4f46e5',
          bg: '#eef2ff',
          border: '#6366f1',
          lightBorder: '#c7d2fe',
          text: '#3730a3',
          label: 'Claim Corrected',
          icon: RotateCcw,
          glow: 'rgba(99, 102, 241, 0.2)'
        };
      case 'SUBMITTED':
        return {
          color: '#0284c7',
          bg: '#f0f9ff',
          border: '#0ea5e9',
          lightBorder: '#bae6fd',
          text: '#0369a1',
          label: 'Submitted to Payer',
          icon: Send,
          glow: 'rgba(14, 165, 233, 0.2)'
        };
      case 'RESUBMITTED':
        return {
          color: '#0369a1',
          bg: '#f0f9ff',
          border: '#0284c7',
          lightBorder: '#7dd3fc',
          text: '#075985',
          label: 'Resubmitted to Payer',
          icon: Send,
          glow: 'rgba(2, 132, 199, 0.25)'
        };
      case 'PENDING':
        return {
          color: '#d97706',
          bg: '#fffbeb',
          border: '#f59e0b',
          lightBorder: '#fde68a',
          text: '#92400e',
          label: 'Payer Adjudication Pending',
          icon: Clock,
          glow: 'rgba(245, 158, 11, 0.25)'
        };
      case 'CREATED':
      default:
        return {
          color: '#2563eb',
          bg: '#eff6ff',
          border: '#3b82f6',
          lightBorder: '#bfdbfe',
          text: '#1e40af',
          label: 'Claim Created',
          icon: FileText,
          glow: 'rgba(37, 99, 235, 0.2)'
        };
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

  // If history is empty, generate an initial timeline entry so it's never empty
  const events = (history && history.length > 0)
    ? history
    : [
        {
          id: 'initial',
          newStatus: currentStatus || 'CREATED',
          oldStatus: null,
          description: `Claim entered into billing system with status ${currentStatus || 'CREATED'}.`,
          timestamp: createdAt || new Date().toISOString()
        }
      ];

  // 5 Macro-Stages for the Visual Stepper
  const macroStages = [
    {
      id: 'DRAFT',
      title: '1. Creation',
      sub: 'Draft Generated',
      isCompleted: true,
      isActive: currentStatus === 'CREATED',
      color: '#2563eb'
    },
    {
      id: 'AUDIT',
      title: '2. AI Pre-Audit',
      sub: currentStatus === 'HIGH_RISK' ? 'High Risk' : (currentStatus === 'CORRECTED' ? 'Corrected' : 'Quality Checked'),
      isCompleted: ['AI_CHECKED', 'HIGH_RISK', 'READY_TO_SUBMIT', 'CORRECTED', 'SUBMITTED', 'RESUBMITTED', 'PENDING', 'ACCEPTED', 'DENIED', 'PAID'].includes(currentStatus),
      isActive: ['AI_CHECKED', 'HIGH_RISK', 'READY_TO_SUBMIT', 'CORRECTED'].includes(currentStatus),
      isAlert: currentStatus === 'HIGH_RISK',
      color: currentStatus === 'HIGH_RISK' ? '#e11d48' : '#7c3aed'
    },
    {
      id: 'SUBMIT',
      title: '3. Submission',
      sub: currentStatus === 'RESUBMITTED' ? 'Resubmitted' : 'EDI 837 Sent',
      isCompleted: ['SUBMITTED', 'RESUBMITTED', 'PENDING', 'ACCEPTED', 'DENIED', 'PAID'].includes(currentStatus),
      isActive: ['SUBMITTED', 'RESUBMITTED'].includes(currentStatus),
      color: '#0284c7'
    },
    {
      id: 'ADJUDICATE',
      title: '4. Adjudication',
      sub: currentStatus === 'DENIED' ? 'Denied' : (currentStatus === 'ACCEPTED' ? 'Accepted' : (currentStatus === 'PENDING' ? 'Pending' : 'Payer Review')),
      isCompleted: ['ACCEPTED', 'DENIED', 'PAID'].includes(currentStatus),
      isActive: ['PENDING', 'DENIED', 'ACCEPTED'].includes(currentStatus) && currentStatus !== 'PAID',
      isAlert: currentStatus === 'DENIED',
      color: currentStatus === 'DENIED' ? '#dc2626' : (currentStatus === 'ACCEPTED' ? '#059669' : '#d97706')
    },
    {
      id: 'SETTLE',
      title: '5. Settlement',
      sub: currentStatus === 'PAID' ? 'Fully Paid' : 'Reimbursement',
      isCompleted: currentStatus === 'PAID',
      isActive: currentStatus === 'PAID',
      color: '#047857'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* ========================================================================= */}
      {/* 1. VISUAL PROCESS STAGE STEPPER (Shows color-coded stage progress)        */}
      {/* ========================================================================= */}
      <div style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.25rem 1rem',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569' }}>
            Process Lifecycle Stage Progress
          </span>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: '700',
            padding: '0.15rem 0.6rem',
            borderRadius: '9999px',
            backgroundColor: getStageConfig(currentStatus).bg,
            color: getStageConfig(currentStatus).color,
            border: `1px solid ${getStageConfig(currentStatus).border}`
          }}>
            CURRENT: {currentStatus.replace('_', ' ')}
          </span>
        </div>

        {/* Stepper track */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '0.5rem',
          position: 'relative'
        }}>
          {macroStages.map((stage, idx) => {
            const isFinished = stage.isCompleted && !stage.isActive;
            const isCurrent = stage.isActive;
            const isAlert = stage.isAlert;

            return (
              <div
                key={stage.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                {/* Step Circle */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '0.8rem',
                    transition: 'all 0.25s ease',
                    backgroundColor: isCurrent ? stage.color : (isFinished ? '#10b981' : '#ffffff'),
                    color: (isCurrent || isFinished) ? '#ffffff' : '#94a3b8',
                    border: `2px solid ${isCurrent ? stage.color : (isFinished ? '#10b981' : '#cbd5e1')}`,
                    boxShadow: isCurrent ? `0 0 0 4px ${isAlert ? 'rgba(239, 68, 68, 0.25)' : 'rgba(37, 99, 235, 0.2)'}` : 'none',
                    marginBottom: '0.4rem',
                    zIndex: 2
                  }}
                >
                  {isFinished ? (
                    '✓'
                  ) : isAlert ? (
                    '!'
                  ) : (
                    idx + 1
                  )}
                </div>

                {/* Step Titles */}
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: isCurrent ? '800' : (isFinished ? '700' : '600'),
                  color: isCurrent ? stage.color : (isFinished ? '#0f172a' : '#94a3b8'),
                  lineHeight: '1.2'
                }}>
                  {stage.title}
                </div>
                <div style={{
                  fontSize: '0.65rem',
                  color: isCurrent ? stage.color : '#64748b',
                  fontWeight: '500',
                  marginTop: '0.15rem'
                }}>
                  {stage.sub}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STAGE COLOR LEGEND STRIP                                              */}
      {/* ========================================================================= */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '0.7rem'
      }}>
        <span style={{ fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Stage Colors:</span>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#1d4ed8' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
            Created / Submitted
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#6d28d9' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#7c3aed' }} />
            AI Checked / Corrected
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#b91c1c' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
            Denied / High Risk
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#b45309' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            Pending
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#047857' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }} />
            Accepted / Paid
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. COLOR-CODED AUDIT TIMELINE STREAM                                     */}
      {/* ========================================================================= */}
      <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
        {/* Vertical Connecting Line */}
        <div style={{
          position: 'absolute',
          top: '16px',
          bottom: '16px',
          left: '32px',
          width: '3px',
          background: 'linear-gradient(to bottom, #3b82f6, #8b5cf6, #10b981)',
          borderRadius: '2px',
          zIndex: 1
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {events.map((item, index) => {
            const isLatest = index === events.length - 1;
            const stageStatus = item.newStatus || item.oldStatus || 'CREATED';
            const cfg = getStageConfig(stageStatus);
            const IconComponent = cfg.icon;

            return (
              <div
                key={item.id || index}
                style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start'
                }}
              >
                {/* Colored Stage Node Icon Circle */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: cfg.bg,
                    border: `2px solid ${cfg.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: isLatest ? `0 0 0 4px ${cfg.glow}` : '0 2px 5px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <IconComponent size={18} color={cfg.color} />
                </div>

                {/* Colored Timeline Event Card */}
                <div
                  style={{
                    flex: 1,
                    backgroundColor: isLatest ? '#ffffff' : '#fafafa',
                    border: isLatest ? `1.5px solid ${cfg.border}` : '1px solid #e2e8f0',
                    borderLeft: `5px solid ${cfg.color}`,
                    borderRadius: '10px',
                    padding: '0.85rem 1.15rem',
                    boxShadow: isLatest ? `0 4px 12px ${cfg.glow}` : '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {/* Colored Stage Pill Badge */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          backgroundColor: cfg.bg,
                          color: cfg.color,
                          border: `1px solid ${cfg.lightBorder}`,
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        {cfg.label}
                      </span>

                      {isLatest && (
                        <span
                          style={{
                            backgroundColor: cfg.color,
                            color: '#ffffff',
                            fontSize: '0.65rem',
                            fontWeight: '800',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            letterSpacing: '0.05em'
                          }}
                        >
                          LATEST STAGE
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '500' }}>
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>

                  <p style={{
                    fontSize: '0.83rem',
                    color: '#1e293b',
                    margin: 0,
                    lineHeight: '1.45',
                    fontWeight: isLatest ? '500' : '400'
                  }}>
                    {item.description || 'Status update logged.'}
                  </p>

                  {item.oldStatus && item.newStatus && item.oldStatus !== item.newStatus && (
                    <div style={{
                      marginTop: '0.4rem',
                      fontSize: '0.7rem',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}>
                      <span>Transition:</span>
                      <span style={{ fontWeight: '700', color: '#475569' }}>{item.oldStatus}</span>
                      <ArrowRight size={11} />
                      <span style={{ fontWeight: '800', color: cfg.color }}>{item.newStatus}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
