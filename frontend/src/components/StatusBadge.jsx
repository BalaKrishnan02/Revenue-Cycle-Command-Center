import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  FileCheck,
  Send,
  RotateCcw,
  DollarSign,
  AlertCircle,
  Flame,
  AlertTriangle,
  Coins
} from 'lucide-react';

export default function StatusBadge({ status, type = 'status' }) {
  // Billing Priority Queue Badges (CRITICAL, HIGH, MEDIUM, LOW)
  if (type === 'priority' || type === 'billingPriority') {
    const p = (status || 'LOW').toUpperCase();
    if (p === 'CRITICAL') {
      return (
        <span className="badge" style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #f87171', fontWeight: '800' }}>
          <Flame size={12} color="#dc2626" /> CRITICAL
        </span>
      );
    }
    if (p === 'HIGH') {
      return (
        <span className="badge" style={{ backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #fdba74', fontWeight: '700' }}>
          <AlertTriangle size={12} color="#ea580c" /> HIGH
        </span>
      );
    }
    if (p === 'MEDIUM') {
      return (
        <span className="badge" style={{ backgroundColor: '#fefce8', color: '#854d0e', border: '1px solid #fde047', fontWeight: '700' }}>
          <Clock size={12} color="#ca8a04" /> MEDIUM
        </span>
      );
    }
    return (
      <span className="badge" style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #86efac', fontWeight: '600' }}>
        <CheckCircle2 size={12} color="#16a34a" /> LOW
      </span>
    );
  }

  // AI Denial Risk Badges
  if (type === 'risk') {
    const risk = (status || 'LOW').toUpperCase();
    if (risk === 'HIGH') {
      return (
        <span className="badge badge-high">
          <AlertCircle size={12} /> High Risk
        </span>
      );
    }
    if (risk === 'MEDIUM') {
      return (
        <span className="badge badge-medium">
          <Clock size={12} /> Medium Risk
        </span>
      );
    }
    return (
      <span className="badge badge-low">
        <CheckCircle2 size={12} /> Low Risk
      </span>
    );
  }

  // Payment Statuses
  if (type === 'payment' || status === 'PARTIALLY_PAID' || status === 'UNPAID' || status === 'OVERDUE') {
    const ps = (status || 'UNPAID').toUpperCase();
    if (ps === 'PAID') {
      return (
        <span className="badge badge-status-paid">
          <CheckCircle2 size={12} /> PAID
        </span>
      );
    }
    if (ps === 'PARTIALLY_PAID') {
      return (
        <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd', fontWeight: '700' }}>
          <Coins size={12} /> PARTIALLY PAID
        </span>
      );
    }
    if (ps === 'OVERDUE') {
      return (
        <span className="badge badge-status-denied" style={{ fontWeight: '800' }}>
          <AlertCircle size={12} /> OVERDUE
        </span>
      );
    }
    return (
      <span className="badge" style={{ backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' }}>
        UNPAID
      </span>
    );
  }

  const s = (status || 'CREATED').toUpperCase();

  switch (s) {
    case 'CREATED':
      return <span className="badge badge-status-created">Created</span>;
    case 'AI_CHECKED':
      return <span className="badge badge-status-checked"><Sparkles size={12} /> AI Checked</span>;
    case 'HIGH_RISK':
      return <span className="badge badge-high"><AlertCircle size={12} /> High Risk</span>;
    case 'READY_TO_SUBMIT':
      return <span className="badge badge-low"><FileCheck size={12} /> Ready to Submit</span>;
    case 'SUBMITTED':
      return <span className="badge badge-status-submitted"><Send size={12} /> Submitted</span>;
    case 'PENDING':
      return <span className="badge badge-status-pending"><Clock size={12} /> Pending</span>;
    case 'DENIED':
      return <span className="badge badge-status-denied"><XCircle size={12} /> Denied</span>;
    case 'CORRECTED':
      return <span className="badge badge-status-corrected"><RotateCcw size={12} /> Corrected</span>;
    case 'RESUBMITTED':
      return <span className="badge badge-status-submitted"><Send size={12} /> Resubmitted</span>;
    case 'ACCEPTED':
      return <span className="badge badge-status-accepted"><CheckCircle2 size={12} /> Accepted</span>;
    case 'PAID':
      return <span className="badge badge-status-paid"><DollarSign size={12} /> Paid</span>;
    default:
      return <span className="badge badge-status-created">{s}</span>;
  }
}
