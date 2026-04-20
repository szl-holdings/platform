import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'szl-sandbox-mode';

export interface SandboxModeState {
  sandboxActive: boolean;
  enableSandbox: () => void;
  disableSandbox: () => void;
  toggleSandbox: () => void;
  resetSandboxData: () => void;
  resetKey: number;
}

const SandboxModeContext = createContext<SandboxModeState>({
  sandboxActive: false,
  enableSandbox: () => {},
  disableSandbox: () => {},
  toggleSandbox: () => {},
  resetSandboxData: () => {},
  resetKey: 0,
});

export function SandboxModeProvider({ children }: { children: React.ReactNode }) {
  const [sandboxActive, setSandboxActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [resetKey, setResetKey] = useState(0);

  const enableSandbox = useCallback(() => {
    setSandboxActive(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
  }, []);

  const disableSandbox = useCallback(() => {
    setSandboxActive(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'false');
    } catch {}
  }, []);

  const toggleSandbox = useCallback(() => {
    setSandboxActive((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  const resetSandboxData = useCallback(() => {
    setResetKey((k) => k + 1);
  }, []);

  return (
    <SandboxModeContext.Provider
      value={{
        sandboxActive,
        enableSandbox,
        disableSandbox,
        toggleSandbox,
        resetSandboxData,
        resetKey,
      }}
    >
      {children}
    </SandboxModeContext.Provider>
  );
}

export function useSandboxMode(): SandboxModeState {
  return useContext(SandboxModeContext);
}

export function SandboxModeBanner({ className }: { className?: string }) {
  const { sandboxActive, disableSandbox, resetSandboxData } = useSandboxMode();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (sandboxActive) {
      setExiting(false);
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    } else {
      setExiting(true);
      const t = setTimeout(() => {
        setVisible(false);
        setExiting(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [sandboxActive]);

  if (!visible && !sandboxActive) return null;

  return (
    <div
      className={className}
      style={{
        position: 'sticky',
        top: '48px',
        zIndex: 8900,
        background: 'linear-gradient(90deg, rgba(212,160,84,0.18) 0%, rgba(212,160,84,0.10) 100%)',
        borderBottom: '1px solid rgba(212,160,84,0.35)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '6px 16px',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.85)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontWeight: 600,
          color: '#d4a054',
          fontSize: '11px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <circle cx="6" cy="6" r="5" stroke="#d4a054" strokeWidth="1.5" />
          <path
            d="M4 5.5C4 4.67 4.67 4 5.5 4h1C7.33 4 8 4.67 8 5.5c0 .55-.3 1.04-.74 1.3L6 7.5"
            stroke="#d4a054"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <circle cx="6" cy="9" r="0.6" fill="#d4a054" />
        </svg>
        Demo Mode
      </span>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>·</span>
      <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px' }}>
        Using sample data — no live systems are connected
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
        <button
          onClick={resetSandboxData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 9px',
            background: 'rgba(212,160,84,0.15)',
            border: '1px solid rgba(212,160,84,0.35)',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 500,
            color: '#d4a054',
            fontFamily: 'Inter, system-ui, sans-serif',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(212,160,84,0.25)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(212,160,84,0.15)';
          }}
          title="Reset demo data to initial state"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
            <path
              d="M9 5.5A3.5 3.5 0 1 1 5.5 2"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d="M5.5 2l1.5-1.5L5.5 2 7 3.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Reset
        </button>
        <button
          onClick={disableSandbox}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 9px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.6)',
            fontFamily: 'Inter, system-ui, sans-serif',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)';
            (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
            (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)';
          }}
          title="Exit demo mode"
        >
          Exit Demo
        </button>
      </div>
    </div>
  );
}

interface SandboxToggleProps {
  compact?: boolean;
}

export function SandboxToggle({ compact = false }: SandboxToggleProps) {
  const { sandboxActive, toggleSandbox } = useSandboxMode();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (compact) {
    return (
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen((o) => !o)}
          title={sandboxActive ? 'Demo mode active — click to manage' : 'Enable demo mode'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            background: sandboxActive ? 'rgba(212,160,84,0.18)' : 'rgba(255,255,255,0.05)',
            border: sandboxActive
              ? '1px solid rgba(212,160,84,0.40)'
              : '1px solid rgba(255,255,255,0.09)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            color: sandboxActive ? '#d4a054' : 'rgba(255,255,255,0.45)',
            letterSpacing: '0.03em',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: '12px' }}>{sandboxActive ? '🟡' : '⬜'}</span>
          {sandboxActive ? 'Demo' : 'Demo'}
          {sandboxActive && (
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: '#d4a054',
                boxShadow: '0 0 6px #d4a054',
                flexShrink: 0,
                animation: 'sandbox-pulse 2s ease-in-out infinite',
              }}
            />
          )}
          <span style={{ opacity: 0.5, fontSize: '10px' }}>▾</span>
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
              borderRadius: '12px',
              padding: '14px 16px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
              zIndex: 9999,
              minWidth: '240px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}
            >
              Demo / Sandbox Mode
            </div>
            <p
              style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.5,
                marginBottom: '12px',
              }}
            >
              {sandboxActive
                ? 'Sample data is active. No live systems are connected or modified.'
                : 'Enable to explore the platform with realistic sample data. No live systems are affected.'}
            </p>
            <button
              onClick={() => {
                toggleSandbox();
                setOpen(false);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: sandboxActive ? 'rgba(196,90,74,0.18)' : 'rgba(212,160,84,0.18)',
                border: sandboxActive
                  ? '1px solid rgba(196,90,74,0.40)'
                  : '1px solid rgba(212,160,84,0.40)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                color: sandboxActive ? '#c45a4a' : '#d4a054',
                fontFamily: 'Inter, system-ui, sans-serif',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              {sandboxActive ? '⬜ Exit Demo Mode' : '🟡 Enable Demo Mode'}
            </button>
          </div>
        )}

        <style>{`
          @keyframes sandbox-pulse {
            0%, 100% { opacity: 1; box-shadow: 0 0 6px #d4a054; }
            50% { opacity: 0.6; box-shadow: 0 0 3px #d4a054; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <button
      onClick={toggleSandbox}
      title={sandboxActive ? 'Exit demo mode' : 'Enable demo mode with sample data'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 10px',
        background: sandboxActive ? 'rgba(212,160,84,0.18)' : 'rgba(255,255,255,0.05)',
        border: sandboxActive
          ? '1px solid rgba(212,160,84,0.40)'
          : '1px solid rgba(255,255,255,0.09)',
        borderRadius: '6px',
        cursor: 'pointer',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '11px',
        fontWeight: 600,
        color: sandboxActive ? '#d4a054' : 'rgba(255,255,255,0.45)',
        transition: 'all 0.15s ease',
      }}
    >
      {sandboxActive ? '🟡' : '⬜'}
      Demo
    </button>
  );
}
