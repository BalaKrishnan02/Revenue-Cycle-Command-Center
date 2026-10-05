import React, { useState } from 'react';
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
  ArrowRight,
  ArrowUpDown,
  Filter,
  Check,
  Layers
} from 'lucide-react';

/**
 * Resolves standard 5 macro-stages according to RCM best practices:
 * Stage 1: Intake & Registration (CREATED)
 * Stage 2: AI Pre-Audit & Risk Analysis (AI_CHECKED, HIGH_RISK, READY_TO_SUBMIT, CORRECTED)
 * Stage 3: Electronic EDI 837 Submission (SUBMITTED, RESUBMITTED)
 * Stage 4: Payer Adjudication Pipeline (PENDING, UNDER_REVIEW, ACCEPTED, DENIED)
 * Stage 5: Remittance & Settlement (PAID, PARTIALLY_PAID)
 */
export const resolveStageIndex = (status) => {
  const s = (status || '').toUpperCase();
  if (['PAID', 'PARTIALLY_PAID'].includes(s)) return 5;
  if (['ACCEPTED', 'DENIED', 'PENDING', 'UNDER_REVIEW'].includes(s)) return 4;
  if (['SUBMITTED', 'RESUBMITTED'].includes(s)) return 3;
  if (['AI_CHECKED', 'HIGH_RISK', 'READY_TO_SUBMIT', 'CORRECTED'].includes(s)) return 2;
  return 1;
};

export const getStageInfo = (stageIndex) => {
  switch (stageIndex) {
    case 1:
      return {
        number: 1,
        name: 'Intake & Registration',
        shortName: 'Stage 1: Intake',
        color: '#2563eb',
        bg: '#eff6ff',
        border: '#93c5fd'
      };
    case 2:
      return {
        number: 2,
        name: 'AI Pre-Audit & Risk Analysis',
        shortName: 'Stage 2: AI Pre-Audit',
        color: '#7c3aed',
        bg: '#f5f3ff',
        border: '#c4b5fd'
      };
    case 3:
      return {
        number: 3,
        name: 'Electronic EDI 837 Submission',
        shortName: 'Stage 3: EDI Submission',
        color: '#0284c7',
        bg: '#f0f9ff',
        border: '#7dd3fc'
      };
    case 4:
      return {
        number: 4,
        name: 'Payer Adjudication Pipeline',
        shortName: 'Stage 4: Adjudication',
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fde68a'
      };
    case 5:
      return {
        number: 5,
        name: 'Remittance & Settlement',
        shortName: 'Stage 5: Settlement',
        color: '#059669',
        bg: '#ecfdf5',
        border: '#a7f3d0'
      };
    default:
      return {
        number: stageIndex || 1,
        name: `Stage ${stageIndex}`,
        shortName: `Stage ${stageIndex}`,
        color: '#64748b',
        bg: '#f8fafc',
        border: '#cbd5e1'
      };
  }
};

export default function ClaimTimeline({
  history = [],
  currentStatus = 'CREATED',
  createdAt = null
}) {
  // 'single' = Each stage appears strictly ONE TIME (no repeating stages)
  // 'all' = Detailed raw log of every event
  const [viewMode, setViewMode] = useState('single');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' = Chronological (Stage 1 -> 5), 'desc' = Reverse

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
      case 'PARTIALLY_PAID':
        return {
          color: '#0284c7',
          bg: '#f0f9ff',
          border: '#0284c7',
          lightBorder: '#7dd3fc',
          text: '#075985',
          label: 'Partially Paid',
          icon: DollarSign,
          glow: 'rgba(2, 132, 199, 0.25)'
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
      case 'UNDER_REVIEW':
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
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return ts;
    }
  };

  const rawEvents = (history && history.length > 0)
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

  const currentStageIndex = resolveStageIndex(currentStatus);

  // 1. EXTRACT STRICTLY UNIQUE STAGES (Only ONE entry per stage: Stage 1, Stage 2, Stage 3, Stage 4, Stage 5)
  const getUniqueStageEvents = () => {
    const stageMap = {};

    // Group events by stage index (1 to 5)
    rawEvents.forEach((ev) => {
      const s = resolveStageIndex(ev.newStatus || ev.oldStatus);
      if (!stageMap[s]) {
        stageMap[s] = [];
      }
      stageMap[s].push(ev);
    });

    const maxStage = Math.max(currentStageIndex, ...Object.keys(stageMap).map(Number));
    const uniqueList = [];

    for (let s = 1; s <= maxStage; s++) {
      const eventsInStage = stageMap[s] || [];
      const info = getStageInfo(s);

      if (eventsInStage.length > 0) {
        // Pick the most recent event in this stage
        const latestInStage = [...eventsInStage].sort(
          (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
        )[0];

        uniqueList.push({
          ...latestInStage,
          stageIndex: s,
          isSingleStage: true,
          totalOccurrences: eventsInStage.length
        });
      } else if (s <= currentStageIndex) {
        // Stage was reached or bypassed, synthesize milestone for this unique stage
        uniqueList.push({
          id: `stage-synth-${s}`,
          stageIndex: s,
          newStatus: s === 1 ? 'CREATED' : (s === 2 ? 'AI_CHECKED' : (s === 3 ? 'SUBMITTED' : currentStatus)),
          oldStatus: null,
          description: `${info.name} stage completed.`,
          timestamp: createdAt || new Date().toISOString(),
          isSingleStage: true,
          totalOccurrences: 1
        });
      }
    }

    // Sort strictly by stage number (Stage 1 -> 5 or 5 -> 1)
    return sortOrder === 'asc'
      ? uniqueList.sort((a, b) => a.stageIndex - b.stageIndex)
      : uniqueList.sort((a, b) => b.stageIndex - a.stageIndex);
  };

  // 2. DETAILED RAW EVENTS (if user wants to see every historical log)
  const sortedRawEvents = [...rawEvents].sort((a, b) => {
    const timeA = new Date(a.timestamp || 0).getTime();
    const timeB = new Date(b.timestamp || 0).getTime();
    return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });

  const displayedEvents = viewMode === 'single' ? getUniqueStageEvents() : sortedRawEvents;
  const latestEventTime = Math.max(...rawEvents.map(e => new Date(e.timestamp || 0).getTime()));

  // 5 Canonical Macro-Stages for the Visual Stepper
  const macroStages = [
    {
      id: 'DRAFT',
      stageIndex: 1,
      title: '1. Creation',
      sub: currentStageIndex > 1 ? 'Intake Complete' : 'Draft Active',
      isCompleted: currentStageIndex > 1,
      isActive: currentStageIndex === 1,
      color: '#2563eb'
    },
    {
      id: 'AUDIT',
      stageIndex: 2,
      title: '2. AI Pre-Audit',
      sub: currentStatus === 'HIGH_RISK'
        ? 'High Denial Risk'
        : (currentStatus === 'CORRECTED'
          ? 'Claim Corrected'
          : (currentStageIndex > 2
            ? 'Audit Passed'
            : (currentStatus === 'READY_TO_SUBMIT' ? 'Ready to Submit' : 'Risk Analysis'))),
      isCompleted: currentStageIndex > 2,
      isActive: currentStageIndex === 2,
      isAlert: currentStatus === 'HIGH_RISK',
      color: currentStatus === 'HIGH_RISK' ? '#e11d48' : '#7c3aed'
    },
    {
      id: 'SUBMIT',
      stageIndex: 3,
      title: '3. Submission',
      sub: currentStatus === 'RESUBMITTED'
        ? 'Resubmitted'
        : (currentStageIndex > 3
          ? 'EDI 837 Sent'
          : (currentStageIndex === 3 ? 'Transmitted' : 'EDI 837 Pending')),
      isCompleted: currentStageIndex > 3,
      isActive: currentStageIndex === 3,
      color: '#0284c7'
    },
    {
      id: 'ADJUDICATE',
      stageIndex: 4,
      title: '4. Adjudication',
      sub: currentStatus === 'DENIED'
        ? 'Claim Denied'
        : (currentStatus === 'ACCEPTED'
          ? 'Claim Approved'
          : (currentStatus === 'PENDING' || currentStatus === 'UNDER_REVIEW'
            ? 'Payer Review'
            : (currentStageIndex > 4 ? 'Adjudicated' : 'Payer Pipeline'))),
      isCompleted: currentStageIndex > 4 || currentStatus === 'ACCEPTED',
      isActive: currentStageIndex === 4 && currentStatus !== 'ACCEPTED',
      isAlert: currentStatus === 'DENIED',
      color: currentStatus === 'DENIED' ? '#dc2626' : (currentStatus === 'ACCEPTED' ? '#059669' : '#d97706')
    },
    {
      id: 'SETTLE',
      stageIndex: 5,
      title: '5. Settlement',
      sub: currentStatus === 'PAID'
        ? 'Fully Paid'
        : (currentStatus === 'PARTIALLY_PAID' ? 'Partial Payment' : 'Reimbursement'),
      isCompleted: currentStatus === 'PAID',
      isActive: currentStageIndex === 5,
      color: '#047857'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. VISUAL PROCESS STAGE STEPPER */}
      <div style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.25rem 1rem',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569' }}>
              Process Lifecycle Stage Progress
            </span>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: '700',
              padding: '0.1rem 0.45rem',
              borderRadius: '6px',
              backgroundColor: '#e2e8f0',
              color: '#334155'
            }}>
              Stage {currentStageIndex} of 5
            </span>
          </div>

          <span style={{
            fontSize: '0.7rem',
            fontWeight: '700',
            padding: '0.2rem 0.65rem',
            borderRadius: '9999px',
            backgroundColor: getStageConfig(currentStatus).bg,
            color: getStageConfig(currentStatus).color,
            border: `1px solid ${getStageConfig(currentStatus).border}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <span>CURRENT STATUS:</span>
            <strong>{currentStatus.replace('_', ' ')}</strong>
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
                    width: '34px',
                    height: '34px',
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

      {/* 2. TIMELINE CONTROLS BAR */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 0.25rem',
        borderBottom: '1px solid #e2e8f0',
        flexWrap: 'wrap',
        gap: '0.6rem'
      }}>
        {/* Toggle between Single Stage (Only 1 time each) vs Full History */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f1f5f9',
          padding: '0.2rem',
          borderRadius: '8px',
          gap: '0.25rem'
        }}>
          <button
            onClick={() => setViewMode('single')}
            style={{
              padding: '0.28rem 0.65rem',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.72rem',
              fontWeight: viewMode === 'single' ? '700' : '500',
              backgroundColor: viewMode === 'single' ? '#ffffff' : 'transparent',
              color: viewMode === 'single' ? '#1e40af' : '#64748b',
              boxShadow: viewMode === 'single' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            title="Show each lifecycle stage strictly once (no repeating stages)"
          >
            <Check size={12} />
            <span>Single Stage (1x per Stage)</span>
          </button>

          <button
            onClick={() => setViewMode('all')}
            style={{
              padding: '0.28rem 0.65rem',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.72rem',
              fontWeight: viewMode === 'all' ? '700' : '500',
              backgroundColor: viewMode === 'all' ? '#ffffff' : 'transparent',
              color: viewMode === 'all' ? '#1e40af' : '#64748b',
              boxShadow: viewMode === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            title="Show all raw history transaction events"
          >
            <Layers size={12} />
            <span>All History Logs ({rawEvents.length})</span>
          </button>
        </div>

        {/* Sort Order Button */}
        <button
          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          className="btn btn-secondary btn-sm"
          style={{
            fontSize: '0.72rem',
            padding: '0.28rem 0.65rem',
            gap: '0.35rem',
            color: '#475569',
            background: '#ffffff',
            border: '1px solid #cbd5e1'
          }}
          title="Toggle chronological sorting order"
        >
          <ArrowUpDown size={12} />
          <span>{sortOrder === 'asc' ? 'Order: Stage 1 → 5 (Chronological)' : 'Order: Latest Stage First'}</span>
        </button>
      </div>

      {/* 3. AUDIT TIMELINE STREAM */}
      <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
        {/* Vertical Connecting Line */}
        <div style={{
          position: 'absolute',
          top: '16px',
          bottom: '16px',
          left: '32px',
          width: '3px',
          background: 'linear-gradient(to bottom, #3b82f6, #8b5cf6, #0284c7, #f59e0b, #10b981)',
          borderRadius: '2px',
          zIndex: 1
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {displayedEvents.map((item, index) => {
            const isLatest = new Date(item.timestamp || 0).getTime() === latestEventTime;
            const stageStatus = item.newStatus || item.oldStatus || 'CREATED';
            const cfg = getStageConfig(stageStatus);
            const IconComponent = cfg.icon;

            const itemStageIdx = item.stageIndex || resolveStageIndex(stageStatus);
            const itemStageInfo = getStageInfo(itemStageIdx);

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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      {/* Macro-Stage Indicator */}
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: itemStageInfo.bg,
                          color: itemStageInfo.color,
                          border: `1px solid ${itemStageInfo.border}`,
                          letterSpacing: '0.03em'
                        }}
                      >
                        {itemStageInfo.shortName}
                      </span>

                      {/* Status Badge */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.18rem 0.5rem',
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

                      {/* Occurrences consolidation pill */}
                      {item.isSingleStage && item.totalOccurrences > 1 && (
                        <span
                          style={{
                            fontSize: '0.63rem',
                            color: '#475569',
                            backgroundColor: '#f1f5f9',
                            padding: '0.12rem 0.45rem',
                            borderRadius: '4px',
                            fontWeight: '600'
                          }}
                        >
                          {item.totalOccurrences} updates in this stage
                        </span>
                      )}

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
                          CURRENT STAGE
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
                      marginTop: '0.45rem',
                      fontSize: '0.7rem',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      flexWrap: 'wrap'
                    }}>
                      <span>Transition:</span>
                      <span style={{ fontWeight: '700', color: '#475569' }}>
                        {item.oldStatus}
                      </span>
                      <ArrowRight size={11} />
                      <span style={{ fontWeight: '800', color: cfg.color }}>
                        {item.newStatus}
                      </span>
                      <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
                        (Stage {resolveStageIndex(item.oldStatus)} → Stage {resolveStageIndex(item.newStatus)})
                      </span>
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
