import type React from 'react';

export type DataState = 'live' | 'demo' | 'simulated' | 'stub' | 'seeded' | 'pilot';

interface DataStateBadgeProps {
  state: DataState;
  label?: string;
  size?: 'xs' | 'sm';
  pulse?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const STATE_CONFIG: Record<
  DataState,
  { label: string; color: string; bg: string; border: string; dot?: string }
> = {
  live: {
    label: 'Live',
    color: 'hsl(142 70% 58%)',
    bg: 'rgba(34,197,94,0.10)',
    border: 'rgba(34,197,94,0.25)',
    dot: 'hsl(142 70% 52%)',
  },
  demo: {
    label: 'Demo',
    color: 'hsl(215 80% 70%)',
    bg: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.25)',
  },
  simulated: {
    label: 'Simulated',
    color: 'hsl(270 70% 72%)',
    bg: 'rgba(139,92,246,0.10)',
    border: 'rgba(139,92,246,0.25)',
  },
  stub: {
    label: 'Stub',
    color: 'hsl(32 70% 62%)',
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.25)',
  },
  seeded: {
    label: 'Seeded',
    color: 'hsl(172 60% 56%)',
    bg: 'rgba(20,184,166,0.10)',
    border: 'rgba(20,184,166,0.25)',
  },
  pilot: {
    label: 'Pilot',
    color: 'hsl(32 90% 64%)',
    bg: 'rgba(251,146,60,0.10)',
    border: 'rgba(251,146,60,0.25)',
  },
};

export function DataStateBadge({
  state,
  label,
  size = 'xs',
  pulse = false,
  className,
  style,
}: DataStateBadgeProps) {
  const cfg = STATE_CONFIG[state];
  const isXs = size === 'xs';
  const displayLabel = label ?? cfg.label;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isXs ? '4px' : '5px',
        padding: isXs ? '2px 7px' : '3px 9px',
        borderRadius: '5px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        fontSize: isXs ? '10px' : '11px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        fontFamily: 'Inter, system-ui, sans-serif',
        whiteSpace: 'nowrap' as const,
        userSelect: 'none' as const,
        ...style,
      }}
    >
      <span
        style={{
          width: isXs ? '5px' : '6px',
          height: isXs ? '5px' : '6px',
          borderRadius: '50%',
          background: cfg.dot ?? cfg.color,
          flexShrink: 0,
          animation: pulse && state === 'live' ? 'szl-pulse 2s ease-in-out infinite' : undefined,
        }}
      />
      {displayLabel}
      <style>{`
        @keyframes szl-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </span>
  );
}

interface DataStateBannerProps {
  state: DataState;
  message?: string;
  className?: string;
}

export function DataStateBanner({ state, message, className }: DataStateBannerProps) {
  const cfg = STATE_CONFIG[state];
  const defaultMessages: Record<DataState, string> = {
    live: 'Connected to live data feeds',
    demo: 'Showing demo data — not connected to live systems',
    simulated: 'Data is simulated for demonstration purposes',
    stub: 'Backend stub — using local mock data',
    seeded: 'Using seeded sample data',
    pilot: 'Pilot environment — data may not reflect production',
  };

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '7px 14px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: '8px',
        fontSize: '12px',
        color: cfg.color,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 500,
      }}
    >
      <DataStateBadge state={state} size="xs" />
      <span style={{ opacity: 0.7, marginLeft: '2px' }}>{message ?? defaultMessages[state]}</span>
    </div>
  );
}
