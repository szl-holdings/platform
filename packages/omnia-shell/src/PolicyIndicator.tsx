/**
 * OMNIA — Policy / Exposure Indicator Component
 * Phase 13 — UX Normalization
 *
 * Shows the current policy posture and exposure level for any governed
 * resource. Used across all SZL domain packs to surface policy enforcement
 * status in a consistent enterprise-minimal pattern.
 *
 * - PolicyIndicator: single policy rule state
 * - ExposureIndicator: risk/exposure level badge
 * - PolicySummaryBar: compact multi-policy summary strip
 */

import React from 'react';

// ---------------------------------------------------------------------------
// Policy Indicator
// ---------------------------------------------------------------------------

export type PolicyStatus = 'enforced' | 'advisory' | 'exempt' | 'violation' | 'pending-review';

export interface PolicyIndicatorProps {
  policyId: string;
  policyName: string;
  status: PolicyStatus;
  tier?: 'tier-0' | 'tier-1' | 'tier-2';
  lastEvaluated?: string;
  reason?: string;
  className?: string;
}

const POLICY_STATUS_CONFIG: Record<PolicyStatus, { color: string; bg: string; label: string; icon: string }> = {
  enforced: { color: '#8b7ac8', bg: 'rgba(139,122,200,0.10)', label: 'Enforced', icon: '■' },
  advisory: { color: '#a855f7', bg: 'rgba(168,85,247,0.08)', label: 'Advisory', icon: '◇' },
  exempt: { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', label: 'Exempt', icon: '○' },
  violation: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)', label: 'Violation', icon: '✕' },
  'pending-review': { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', label: 'Pending Review', icon: '◐' },
};

export function PolicyIndicator({ policyId, policyName, status, tier, lastEvaluated, reason, className }: PolicyIndicatorProps) {
  const cfg = POLICY_STATUS_CONFIG[status] ?? POLICY_STATUS_CONFIG.advisory;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '8px 12px',
        background: cfg.bg,
        borderRadius: 7,
        border: `1px solid ${cfg.color}22`,
      }}
    >
      <span style={{ fontSize: 10, color: cfg.color, flexShrink: 0, marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
        {cfg.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.80)' }}>{policyName}</span>
          {tier && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.25)',
                padding: '1px 5px',
                borderRadius: 3,
                background: 'rgba(255,255,255,0.05)',
              }}
            >
              {tier}
            </span>
          )}
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: cfg.color,
              marginLeft: 'auto',
            }}
          >
            {cfg.label}
          </span>
        </div>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{policyId}</span>
        {reason && (
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', margin: '4px 0 0', lineHeight: 1.4 }}>
            {reason}
          </p>
        )}
        {lastEvaluated && (
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.20)', display: 'block', marginTop: 3 }}>
            Last evaluated: {new Date(lastEvaluated).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exposure Indicator
// ---------------------------------------------------------------------------

export type ExposureLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface ExposureIndicatorProps {
  level: ExposureLevel;
  label?: string;
  detail?: string;
  className?: string;
}

const EXPOSURE_CONFIG: Record<ExposureLevel, { color: string; bg: string; bars: number }> = {
  none: { color: '#4b5563', bg: 'rgba(75,85,99,0.08)', bars: 0 },
  low: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', bars: 1 },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', bars: 2 },
  high: { color: '#f97316', bg: 'rgba(249,115,22,0.10)', bars: 3 },
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', bars: 4 },
};

export function ExposureIndicator({ level, label, detail, className }: ExposureIndicatorProps) {
  const cfg = EXPOSURE_CONFIG[level] ?? EXPOSURE_CONFIG.none;
  const totalBars = 4;

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 10px',
        background: cfg.bg,
        borderRadius: 6,
        border: `1px solid ${cfg.color}22`,
      }}
    >
      {/* Bar chart indicator */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 12 }}>
        {Array.from({ length: totalBars }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 3,
              height: 4 + i * 2,
              borderRadius: 1,
              background: i < cfg.bars ? cfg.color : 'rgba(255,255,255,0.10)',
            }}
          />
        ))}
      </div>
      <div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: cfg.color,
          }}
        >
          {label ?? level} exposure
        </span>
        {detail && (
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', marginLeft: 6 }}>{detail}</span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Policy Summary Bar
// ---------------------------------------------------------------------------

export interface PolicySummaryBarProps {
  enforced: number;
  advisory: number;
  violations: number;
  exempt: number;
  className?: string;
}

export function PolicySummaryBar({ enforced, advisory, violations, exempt, className }: PolicySummaryBarProps) {
  const items = [
    { count: enforced, color: '#8b7ac8', label: 'Enforced' },
    { count: advisory, color: '#a855f7', label: 'Advisory' },
    { count: violations, color: '#ef4444', label: violations === 1 ? 'Violation' : 'Violations' },
    { count: exempt, color: '#6b7280', label: 'Exempt' },
  ].filter((i) => i.count > 0);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '6px 12px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 6,
        border: '1px solid rgba(255,255,255,0.06)',
        flexWrap: 'wrap',
      }}
    >
      {items.map(({ count, color, label }) => (
        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color }}>{count}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{label}</span>
        </span>
      ))}
      {items.length === 0 && (
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>No policies tracked</span>
      )}
    </div>
  );
}
