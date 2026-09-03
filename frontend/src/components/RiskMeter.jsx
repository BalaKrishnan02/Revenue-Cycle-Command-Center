import React from 'react';
import { AlertCircle, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';

export default function RiskMeter({ score = 0, level = 'LOW', size = 'normal' }) {
  const normalizedScore = Math.min(100, Math.max(0, score || 0));

  let color = '#10b981'; // Green
  let bgColor = '#ecfdf5';
  let borderColor = '#a7f3d0';
  let textColor = '#065f46';
  let label = 'Low Denial Risk';
  let description = 'Claim parameters look clean. Probability of approval is high.';

  if (normalizedScore >= 70 || level === 'HIGH') {
    color = '#ef4444'; // Red
    bgColor = '#fef2f2';
    borderColor = '#fecaca';
    textColor = '#991b1b';
    label = 'High Denial Risk';
    description = 'High risk of payer denial. Correct detected deficiencies before submitting.';
  } else if (normalizedScore >= 40 || level === 'MEDIUM') {
    color = '#f59e0b'; // Amber
    bgColor = '#fffbeb';
    borderColor = '#fde68a';
    textColor = '#92400e';
    label = 'Medium Denial Risk';
    description = 'Moderate risk detected. Review suggested optimizations.';
  }

  if (size === 'compact') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: `3px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '800',
          fontSize: '0.85rem',
          color: color,
          backgroundColor: bgColor
        }}>
          {normalizedScore}%
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: textColor }}>
            {level || 'LOW'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: '14px',
      padding: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem'
    }}>
      {/* Circle Meter */}
      <div style={{
        position: 'relative',
        width: '90px',
        height: '90px',
        borderRadius: '50%',
        background: `conic-gradient(${color} ${normalizedScore * 3.6}deg, #e2e8f0 0deg)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <div style={{
          width: '74px',
          height: '74px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: '1.4rem', fontWeight: '800', color: color, lineHeight: '1' }}>
            {normalizedScore}%
          </span>
          <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
            Risk
          </span>
        </div>
      </div>

      {/* Info Block */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span style={{
            fontSize: '1.1rem',
            fontWeight: '800',
            color: textColor,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            {normalizedScore >= 70 ? <ShieldAlert size={20} /> : <Sparkles size={20} />}
            {label}
          </span>
          <span style={{
            backgroundColor: '#ffffff',
            color: textColor,
            border: `1px solid ${borderColor}`,
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontWeight: '800',
            padding: '0.15rem 0.5rem',
            textTransform: 'uppercase'
          }}>
            {level}
          </span>
        </div>
        <p style={{ fontSize: '0.85rem', color: textColor, margin: 0, opacity: 0.9 }}>
          {description}
        </p>
      </div>
    </div>
  );
}
