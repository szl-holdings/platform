import type { CSSProperties } from 'react';

type DataState = 'DEMO DATA' | 'LIVE' | 'PILOT';

interface DataStateBadgeProps {
  state?: DataState;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  style?: CSSProperties;
}

const STATE_CONFIG: Record<DataState, { bg: string; border: string; dot: string; text: string }> = {
  'DEMO DATA': {
    bg: 'hsla(38,80%,50%,0.10)',
    border: 'hsla(38,80%,50%,0.30)',
    dot: 'hsl(38,80%,55%)',
    text: 'hsl(38,70%,70%)',
  },
  LIVE: {
    bg: 'hsla(142,62%,46%,0.10)',
    border: 'hsla(142,62%,46%,0.28)',
    dot: 'hsl(142,62%,50%)',
    text: 'hsl(142,55%,62%)',
  },
  PILOT: {
    bg: 'hsla(210,80%,55%,0.10)',
    border: 'hsla(210,80%,55%,0.28)',
    dot: 'hsl(210,80%,60%)',
    text: 'hsl(210,72%,68%)',
  },
};

const POSITION_STYLES: Record<NonNullable<DataStateBadgeProps['position']>, CSSProperties> = {
  'top-left': { top: '10px', left: '10px' },
  'top-right': { top: '10px', right: '10px' },
  'bottom-left': { bottom: '10px', left: '10px' },
  'bottom-right': { bottom: '10px', right: '10px' },
};

export function DataStateBadge({
  state = 'DEMO DATA',
  position = 'top-right',
  style,
}: DataStateBadgeProps) {
  const cfg = STATE_CONFIG[state];
  const posStyle = POSITION_STYLES[position];

  return (
    <div
      style={{
        position: 'absolute',
        ...posStyle,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 8px',
        borderRadius: '4px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        backdropFilter: 'blur(4px)',
        zIndex: 10,
        pointerEvents: 'none',
        ...style,
      }}
      title={`Data state: ${state}`}
      role="status"
      aria-label={`Data state: ${state}`}
    >
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          background: cfg.dot,
          boxShadow: `0 0 4px ${cfg.dot}90`,
          flexShrink: 0,
          ...(state === 'LIVE' ? { animation: 'pulse 2s infinite' } : {}),
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: cfg.text,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {state}
      </span>
    </div>
  );
}

export type { DataState };
