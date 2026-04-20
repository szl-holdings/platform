import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type DemoMode = 'executive' | 'operator' | 'analyst';

export interface DemoModeState {
  mode: DemoMode;
  setMode: (mode: DemoMode) => void;
  isExecutive: boolean;
  isOperator: boolean;
  isAnalyst: boolean;
}

const DemoModeContext = createContext<DemoModeState>({
  mode: 'operator',
  setMode: () => {},
  isExecutive: false,
  isOperator: true,
  isAnalyst: false,
});

const STORAGE_KEY = 'szl-demo-mode';

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<DemoMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'executive' || stored === 'operator' || stored === 'analyst') {
        return stored;
      }
    } catch {}
    return 'operator';
  });

  const setMode = useCallback((newMode: DemoMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {}
  }, []);

  return (
    <DemoModeContext.Provider
      value={{
        mode,
        setMode,
        isExecutive: mode === 'executive',
        isOperator: mode === 'operator',
        isAnalyst: mode === 'analyst',
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}

const MODE_LABELS: Record<DemoMode, string> = {
  executive: 'Executive',
  operator: 'Operator',
  analyst: 'Analyst',
};

const MODE_DESCRIPTIONS: Record<DemoMode, string> = {
  executive: 'Summary-first, business impact, strategic framing',
  operator: 'Full context, controls, queues, detail drilldowns',
  analyst: 'Traceability, reasoning chains, entity relationships',
};

const MODE_ICONS: Record<DemoMode, string> = {
  executive: '🎯',
  operator: '⚙️',
  analyst: '🔬',
};

const MODE_COLORS: Record<DemoMode, { bg: string; border: string; text: string; dot: string }> = {
  executive: {
    bg: 'rgba(168, 85, 247, 0.12)',
    border: 'rgba(168, 85, 247, 0.35)',
    text: 'hsl(270 70% 72%)',
    dot: 'hsl(270 70% 64%)',
  },
  operator: {
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.35)',
    text: 'hsl(215 80% 72%)',
    dot: 'hsl(215 80% 64%)',
  },
  analyst: {
    bg: 'rgba(20, 184, 166, 0.12)',
    border: 'rgba(20, 184, 166, 0.35)',
    text: 'hsl(172 70% 60%)',
    dot: 'hsl(172 70% 52%)',
  },
};

export interface DemoModeSwitcherProps {
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function DemoModeSwitcher({ compact = false, style }: DemoModeSwitcherProps) {
  const { mode, setMode } = useDemoMode();
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const colors = MODE_COLORS[mode];

  if (compact) {
    return (
      <div ref={ref} style={{ position: 'relative', ...style }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            color: colors.text,
            letterSpacing: '0.03em',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: '12px' }}>{MODE_ICONS[mode]}</span>
          {MODE_LABELS[mode]}
          <span style={{ opacity: 0.6, fontSize: '10px' }}>▾</span>
        </button>
        {open && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              background: 'rgba(10,12,20,0.97)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '6px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
              zIndex: 9999,
              minWidth: '200px',
            }}
          >
            {(['executive', 'operator', 'analyst'] as DemoMode[]).map((m) => {
              const c = MODE_COLORS[m];
              const active = m === mode;
              return (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 10px',
                    background: active ? c.bg : 'transparent',
                    border: active ? `1px solid ${c.border}` : '1px solid transparent',
                    borderRadius: '7px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    marginBottom: '2px',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{MODE_ICONS[m]}</span>
                  <div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: active ? c.text : 'rgba(255,255,255,0.8)',
                        fontFamily: 'Inter, system-ui, sans-serif',
                      }}
                    >
                      {MODE_LABELS[m]}
                    </div>
                    <div
                      style={{
                        fontSize: '10px',
                        color: 'rgba(255,255,255,0.4)',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        lineHeight: 1.3,
                      }}
                    >
                      {MODE_DESCRIPTIONS[m]}
                    </div>
                  </div>
                  {active && (
                    <div
                      style={{
                        marginLeft: 'auto',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: c.dot,
                        flexShrink: 0,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '8px',
        ...style,
      }}
    >
      {(['executive', 'operator', 'analyst'] as DemoMode[]).map((m) => {
        const c = MODE_COLORS[m];
        const active = m === mode;
        return (
          <button
            key={m}
            onClick={() => setMode(m)}
            title={MODE_DESCRIPTIONS[m]}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              background: active ? c.bg : 'transparent',
              border: active ? `1px solid ${c.border}` : '1px solid transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '11px',
              fontWeight: active ? 600 : 500,
              color: active ? c.text : 'rgba(255,255,255,0.5)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: '12px' }}>{MODE_ICONS[m]}</span>
            {MODE_LABELS[m]}
          </button>
        );
      })}
    </div>
  );
}

export { MODE_COLORS, MODE_DESCRIPTIONS, MODE_ICONS, MODE_LABELS };
