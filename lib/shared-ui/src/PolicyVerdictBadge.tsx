/**
 * PolicyVerdictBadge — compact badge + detail popover
 * Single source of truth for policy verdict display across every app.
 */
import * as React from 'react';
import type { PolicyVerdict, PolicyVerdictDetail } from './os-layer';
import { POLICY_VERDICT_DESCRIPTIONS, POLICY_VERDICT_LABELS } from './os-layer';
import { cn } from './utils';

const VERDICT_STYLE: Record<
  PolicyVerdict,
  { color: string; bg: string; border: string; dot: string }
> = {
  green: {
    color: '#6b8f71',
    bg: 'rgba(107,143,113,0.10)',
    border: 'rgba(107,143,113,0.28)',
    dot: '#6b8f71',
  },
  yellow: {
    color: '#c8953c',
    bg: 'rgba(200,149,60,0.10)',
    border: 'rgba(200,149,60,0.28)',
    dot: '#c8953c',
  },
  red: {
    color: '#c45a4a',
    bg: 'rgba(196,90,74,0.10)',
    border: 'rgba(196,90,74,0.28)',
    dot: '#c45a4a',
  },
  blocked: {
    color: '#7c85a0',
    bg: 'rgba(124,133,160,0.10)',
    border: 'rgba(124,133,160,0.28)',
    dot: '#7c85a0',
  },
};

export interface PolicyVerdictBadgeProps {
  verdict: PolicyVerdict;
  detail?: PolicyVerdictDetail;
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  showPopover?: boolean;
  className?: string;
}

export function PolicyVerdictBadge({
  verdict,
  detail,
  size = 'sm',
  showLabel = true,
  showPopover = true,
  className,
}: PolicyVerdictBadgeProps) {
  const [open, setOpen] = React.useState(false);
  const style = VERDICT_STYLE[verdict];
  const label = POLICY_VERDICT_LABELS[verdict];

  const sizeClass = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-1',
    sm: 'text-[10px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
  }[size];

  const dotSize = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
  }[size];

  const badge = (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap select-none',
        sizeClass,
        className,
      )}
      style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
    >
      <span className={cn('rounded-full shrink-0', dotSize)} style={{ background: style.dot }} />
      {showLabel && <span>{label}</span>}
    </span>
  );

  if (!showPopover || !detail) return badge;

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex focus:outline-none"
        aria-label={`Policy verdict: ${label}`}
      >
        {badge}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className="absolute bottom-full left-0 mb-2 z-50 w-72 rounded-lg text-xs"
            style={{
              background: '#10141e',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            <div className="p-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    background: style.bg,
                    color: style.color,
                    border: `1px solid ${style.border}`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: style.dot }} />
                  {label}
                </span>
                <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.28)' }}>
                  {detail.policyPack}
                </span>
              </div>
              <p
                className="text-[11px] leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                {POLICY_VERDICT_DESCRIPTIONS[verdict]}
              </p>
            </div>

            <div className="p-3 space-y-2">
              <Row label="Rule" value={detail.ruleLabel} />
              <Row label="Reason" value={detail.reason} />
              {detail.approvalThreshold && (
                <Row label="Approval threshold" value={detail.approvalThreshold} />
              )}
              {detail.requiresJustification && (
                <div
                  className="mt-1 rounded px-2 py-1.5 text-[10px]"
                  style={{
                    background: 'rgba(200,149,60,0.08)',
                    color: '#c8953c',
                    border: '1px solid rgba(200,149,60,0.2)',
                  }}
                >
                  Written justification required and logged to audit.
                </div>
              )}
              <div
                className="text-[9px] font-mono pt-1"
                style={{ color: 'rgba(255,255,255,0.22)' }}
              >
                Evaluated {new Date(detail.evaluatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        className="text-[9px] uppercase tracking-wider mb-0.5 font-mono"
        style={{ color: 'rgba(255,255,255,0.25)' }}
      >
        {label}
      </div>
      <div className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.72)' }}>
        {value}
      </div>
    </div>
  );
}
