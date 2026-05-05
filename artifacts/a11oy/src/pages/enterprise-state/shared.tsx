import { createContext, useContext } from 'react';
import { BORDER, CARD, DOMAINS } from './constants';
import type { DomainKey } from './constants';
import type { LiveEnterpriseState } from './types';

export const LiveCtx = createContext<LiveEnterpriseState | null>(null);

export function useLive() {
  return useContext(LiveCtx);
}

export function DomainBadge({ domain }: { domain: string }) {
  const d = DOMAINS[domain as DomainKey];
  if (!d) return null;
  return (
    <span
      style={{
        fontSize: '9px',
        fontWeight: 600,
        padding: '1px 6px',
        borderRadius: '3px',
        background: `${d.color}20`,
        color: d.color,
        flexShrink: 0,
      }}
    >
      {d.name}
    </span>
  );
}

export function _SeverityIndicator({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#f59e0b',
    low: '#22c55e',
    none: '#22c55e',
  };
  const color = colors[severity] ?? '#6b7280';
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
        marginTop: 2,
      }}
    />
  );
}

export function _SmallCard({
  children,
  accentColor,
}: {
  children: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: '0.75rem',
        padding: '1.125rem',
        borderTop: accentColor ? `2px solid ${accentColor}70` : undefined,
      }}
    >
      {children}
    </div>
  );
}
