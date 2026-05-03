/**
 * OMNIA — Status Chip Component
 * Phase 13 — UX Normalization
 *
 * Compact status badge used across all SZL domain packs.
 * Encodes operational status, policy posture, and deployment state
 * in a consistent enterprise-minimal visual language.
 */

import React from 'react';

export type StatusVariant =
  | 'healthy'
  | 'degraded'
  | 'critical'
  | 'warning'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'enforced'
  | 'advisory'
  | 'unknown';

export interface StatusChipProps {
  status: StatusVariant;
  label?: string;
  size?: 'sm' | 'md';
  pulsing?: boolean;
  className?: string;
}

const VARIANT_CONFIG: Record<
  StatusVariant,
  { color: string; bg: string; border: string; defaultLabel: string }
> = {
  healthy: { color: '#22c55e', bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.25)', defaultLabel: 'Healthy' },
  degraded: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)', defaultLabel: 'Degraded' },
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.25)', defaultLabel: 'Critical' },
  warning: { color: '#f97316', bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.25)', defaultLabel: 'Warning' },
  pending: { color: '#3b82f6', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.25)', defaultLabel: 'Pending' },
  approved: { color: '#22c55e', bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.20)', defaultLabel: 'Approved' },
  rejected: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.20)', defaultLabel: 'Rejected' },
  expired: { color: '#6b7280', bg: 'rgba(107,114,128,0.10)', border: 'rgba(107,114,128,0.20)', defaultLabel: 'Expired' },
  enforced: { color: '#8b7ac8', bg: 'rgba(139,122,200,0.10)', border: 'rgba(139,122,200,0.25)', defaultLabel: 'Enforced' },
  advisory: { color: '#a855f7', bg: 'rgba(168,85,247,0.10)', border: 'rgba(168,85,247,0.20)', defaultLabel: 'Advisory' },
  unknown: { color: '#4b5563', bg: 'rgba(75,85,99,0.08)', border: 'rgba(75,85,99,0.15)', defaultLabel: 'Unknown' },
};

export function StatusChip({ status, label, size = 'md', pulsing = false, className }: StatusChipProps) {
  const cfg = VARIANT_CONFIG[status] ?? VARIANT_CONFIG.unknown;
  const displayLabel = label ?? cfg.defaultLabel;

  const height = size === 'sm' ? 18 : 22;
  const fontSize = size === 'sm' ? 9 : 10;
  const dotSize = size === 'sm' ? 4 : 5;
  const px = size === 'sm' ? 6 : 8;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: dotSize + 2,
        height,
        padding: `0 ${px}px`,
        borderRadius: height / 2,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color: cfg.color,
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: cfg.color,
          flexShrink: 0,
          animation: pulsing ? 'omnia-pulse 1.8s ease-in-out infinite' : undefined,
        }}
      />
      {displayLabel}
    </span>
  );
}

/**
 * Group multiple status chips with consistent spacing.
 */
export function StatusChipGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {children}
    </div>
  );
}
