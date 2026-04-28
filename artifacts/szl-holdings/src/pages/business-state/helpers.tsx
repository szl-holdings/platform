import { createContext, useContext } from 'react';
import { ACCENT, BG_CARD, BORDER } from './constants';
import type { DomainId, LiveBusinessState } from './types';
import { DOMAINS } from './data';

export const LiveCtx = createContext<LiveBusinessState | null>(null);

export function useLive() {
  return useContext(LiveCtx);
}

export function DomainTag({ domain }: { domain: DomainId }) {
  const d = DOMAINS[domain];
  return (
    <span
      style={{
        fontSize: '9px',
        fontWeight: 600,
        padding: '1px 6px',
        borderRadius: '3px',
        background: `${d.color}20`,
        color: d.color,
      }}
    >
      {d.name}
    </span>
  );
}

export function SeverityDot({ level }: { level: string }) {
  const color =
    level === 'critical'
      ? '#ef4444'
      : level === 'high'
        ? '#f97316'
        : level === 'medium'
          ? '#f59e0b'
          : '#22c55e';
  return (
    <span
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 5px ${color}80`,
        flexShrink: 0,
      }}
    />
  );
}

export function SectionCard({
  title,
  icon: Icon,
  accent = ACCENT,
  children,
}: {
  title: string;
  icon: React.ElementType;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: BG_CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: '0.875rem',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '0.875rem 1.25rem',
          borderBottom: `1px solid ${BORDER}`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '6px',
            background: `${accent}15`,
            border: `1px solid ${accent}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon style={{ width: 13, height: 13, color: accent }} />
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ padding: '1.25rem' }}>{children}</div>
    </div>
  );
}
