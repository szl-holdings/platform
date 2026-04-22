import { ChevronRight, CircleDot, DollarSign, User } from 'lucide-react';

export type CommandModeSignalLevel = 'critical' | 'high' | 'medium' | 'low';
export type CommandModeStatus =
  | 'Live'
  | 'Pilot Ready'
  | 'In Build'
  | 'Strategic'
  | 'Internal'
  | 'Private Demo';

export interface CommandModeSignal {
  id: string;
  level: CommandModeSignalLevel;
  what: string;
  why: string;
  owner?: string;
  next: string;
  valueAtRisk?: string;
  timestamp?: Date;
  category?: string;
  accentColor?: string;
}

export interface CommandModeSurfaceProps {
  signals: CommandModeSignal[];
  title?: string;
  emptyMessage?: string;
  accentColor?: string;
  compact?: boolean;
}

const LEVEL_CONFIG: Record<
  CommandModeSignalLevel,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    dot: string;
  }
> = {
  critical: {
    label: 'Critical',
    color: '#c45a4a',
    bg: 'rgba(239,68,68,0.06)',
    border: 'rgba(239,68,68,0.18)',
    dot: '#c45a4a',
  },
  high: {
    label: 'High',
    color: '#c8953c',
    bg: 'rgba(249,115,22,0.06)',
    border: 'rgba(249,115,22,0.18)',
    dot: '#c8953c',
  },
  medium: {
    label: 'Medium',
    color: '#d4a054',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.18)',
    dot: '#d4a054',
  },
  low: {
    label: 'Low',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.06)',
    border: 'rgba(107,114,128,0.14)',
    dot: '#6b7280',
  },
};

export function CommandModeSignalCard({
  signal,
  compact = false,
}: {
  signal: CommandModeSignal;
  compact?: boolean;
}) {
  const cfg = LEVEL_CONFIG[signal.level];
  const accent = signal.accentColor || cfg.color;

  return (
    <div
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: '6px',
        padding: compact ? '10px 14px' : '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? '8px' : '12px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '3px',
          height: '100%',
          background: cfg.color,
          borderRadius: '6px 0 0 6px',
        }}
        aria-hidden="true"
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
          paddingLeft: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: cfg.color,
              fontFamily: "'JetBrains Mono', monospace",
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: cfg.dot,
                flexShrink: 0,
              }}
            />
            {cfg.label}
          </span>
          {signal.category && (
            <span
              style={{
                fontSize: '9px',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.35)',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              · {signal.category}
            </span>
          )}
        </div>
        {signal.valueAtRisk && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.65)',
              fontFamily: "'JetBrains Mono', monospace",
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <DollarSign size={10} />
            {signal.valueAtRisk} at risk
          </div>
        )}
      </div>

      <div style={{ paddingLeft: '8px' }}>
        <p
          style={{
            fontSize: compact ? '12px' : '13px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.90)',
            lineHeight: 1.4,
            marginBottom: '4px',
            letterSpacing: '-0.01em',
          }}
        >
          {signal.what}
        </p>
        <p
          style={{
            fontSize: '11.5px',
            color: 'rgba(255,255,255,0.50)',
            lineHeight: 1.55,
            marginBottom: compact ? '0' : '10px',
          }}
        >
          {signal.why}
        </p>

        {!compact && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
            {signal.owner && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.45)',
                }}
              >
                <User size={10} />
                <span>{signal.owner}</span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                color: accent,
                fontWeight: 500,
              }}
            >
              <ChevronRight size={10} />
              <span>{signal.next}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CommandModeSurface({
  signals,
  title,
  emptyMessage = 'No active signals.',
  accentColor = '#22d3ee',
  compact = false,
}: CommandModeSurfaceProps) {
  const sorted = [...signals].sort((a, b) => {
    const order: Record<CommandModeSignalLevel, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    return order[a.level] - order[b.level];
  });

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {title && (
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CircleDot size={12} style={{ color: accentColor }} />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.70)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {title}
            </span>
          </div>
          {signals.length > 0 && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.30)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {signals.filter((s) => s.level === 'critical').length} critical ·{' '}
              {signals.filter((s) => s.level === 'high').length} high
            </span>
          )}
        </div>
      )}

      <div
        style={{
          padding: compact ? '8px' : '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {sorted.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.25)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {emptyMessage}
          </div>
        ) : (
          sorted.map((signal) => (
            <CommandModeSignalCard key={signal.id} signal={signal} compact={compact} />
          ))
        )}
      </div>
    </div>
  );
}

export interface StatusBadgeProps {
  status: CommandModeStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<CommandModeStatus, { color: string; bg: string; border: string }> = {
  Live: {
    color: 'hsl(142,64%,52%)',
    bg: 'hsla(142,64%,42%,0.10)',
    border: 'hsla(142,64%,42%,0.20)',
  },
  'Pilot Ready': {
    color: 'hsl(192,84%,50%)',
    bg: 'hsla(192,84%,46%,0.10)',
    border: 'hsla(192,84%,46%,0.20)',
  },
  'In Build': {
    color: 'hsl(38,85%,58%)',
    bg: 'hsla(38,85%,52%,0.10)',
    border: 'hsla(38,85%,52%,0.20)',
  },
  Strategic: {
    color: 'hsl(270,60%,62%)',
    bg: 'hsla(270,60%,58%,0.10)',
    border: 'hsla(270,60%,58%,0.20)',
  },
  Internal: {
    color: 'hsl(220,10%,52%)',
    bg: 'hsla(220,10%,50%,0.10)',
    border: 'hsla(220,10%,50%,0.20)',
  },
  'Private Demo': {
    color: 'hsl(32,60%,58%)',
    bg: 'hsla(32,60%,52%,0.10)',
    border: 'hsla(32,60%,52%,0.20)',
  },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Internal;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: size === 'sm' ? '9px' : '10px',
        fontWeight: 500,
        padding: size === 'sm' ? '1px 6px' : '2px 8px',
        borderRadius: '2px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}

export type ApprovedCTA =
  | 'Explore the Ecosystem'
  | 'Request a Demo'
  | 'Start a Conversation'
  | 'Explore the Platform'
  | 'Connect with Stephen'
  | 'View Architecture'
  | 'View Case Studies'
  | 'Read the Insights'
  | 'Start a Private Inquiry'
  | 'Explore Alloy'
  | 'Explore Lyte'
  | 'Explore Vessels'
  | 'Explore Terra'
  | 'Explore Carlota Jo'
  | 'Meet the Founder';

export const APPROVED_CTAS: ApprovedCTA[] = [
  'Explore the Ecosystem',
  'Request a Demo',
  'Start a Conversation',
  'Explore the Platform',
  'Connect with Stephen',
  'View Architecture',
  'View Case Studies',
  'Read the Insights',
  'Start a Private Inquiry',
  'Explore Alloy',
  'Explore Lyte',
  'Explore Vessels',
  'Explore Terra',
  'Explore Carlota Jo',
  'Meet the Founder',
];

export const APPROVED_STATUSES: CommandModeStatus[] = [
  'Live',
  'Pilot Ready',
  'In Build',
  'Strategic',
  'Internal',
  'Private Demo',
];
