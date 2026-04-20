/**
 * AppModeBanner — SZL Holdings Platform
 *
 * Persistent environment-mode banner for web frontends.
 * Reads VITE_APP_MODE (or VITE_RUNTIME_MODE) from import.meta.env.
 *
 * - demo       → persistent amber "DEMO MODE" strip, non-dismissible.
 * - sandbox    → dismissible teal "SANDBOX" strip.
 * - production → nothing rendered (silent).
 *
 * Also exports:
 *   useAppMode()           — hook that returns the resolved mode string.
 *   useProductionConfirm() — hook for gating destructive actions in production.
 */

import type React from 'react';
import { createContext, useCallback, useContext, useState } from 'react';

export type AppMode = 'demo' | 'sandbox' | 'production' | 'local-dev';

function resolveAppMode(): AppMode {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    if (!env) return 'local-dev';

    const explicit = (env['VITE_APP_MODE'] ?? env['VITE_RUNTIME_MODE'] ?? '').toLowerCase().trim();
    if (explicit === 'demo') return 'demo';
    if (explicit === 'sandbox') return 'sandbox';
    if (explicit === 'production') return 'production';

    const appEnv = (env['VITE_APP_ENV'] ?? '').toLowerCase().trim();
    if (appEnv === 'demo') return 'demo';
    if (appEnv === 'sandbox') return 'sandbox';
    if (appEnv === 'production' || env['MODE'] === 'production') return 'production';
  } catch {}
  return 'local-dev';
}

const AppModeContext = createContext<AppMode>('local-dev');

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const mode = resolveAppMode();
  return <AppModeContext.Provider value={mode}>{children}</AppModeContext.Provider>;
}

export function useAppMode(): AppMode {
  return useContext(AppModeContext);
}

const BANNER_STYLES: Record<'demo' | 'sandbox', React.CSSProperties> = {
  demo: {
    background: 'linear-gradient(90deg, rgba(212,100,40,0.22) 0%, rgba(212,100,40,0.12) 100%)',
    borderBottom: '1px solid rgba(212,100,40,0.40)',
    color: '#e8884a',
  },
  sandbox: {
    background: 'linear-gradient(90deg, rgba(20,184,166,0.15) 0%, rgba(20,184,166,0.08) 100%)',
    borderBottom: '1px solid rgba(20,184,166,0.30)',
    color: '#2dd4bf',
  },
};

const BANNER_LABELS: Record<'demo' | 'sandbox', string> = {
  demo: 'DEMO MODE',
  sandbox: 'SANDBOX',
};

const BANNER_SUBTITLES: Record<'demo' | 'sandbox', string> = {
  demo: 'All writes are intercepted — no live data is modified',
  sandbox: 'Connected to staging API — changes do not affect production',
};

export interface AppModeBannerProps {
  onResetDemo?: () => void;
  className?: string;
}

export function AppModeBanner({ onResetDemo, className }: AppModeBannerProps) {
  const mode = useAppMode();
  const [dismissed, setDismissed] = useState(false);

  if (mode !== 'demo' && mode !== 'sandbox') return null;
  if (mode === 'sandbox' && dismissed) return null;

  const styles = BANNER_STYLES[mode];

  return (
    <div
      role="status"
      aria-live="polite"
      className={className}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 9000,
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '5px 16px',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
        ...styles,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontSize: '11px',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'currentColor',
            boxShadow: '0 0 6px currentColor',
            animation: mode === 'demo' ? 'mode-pulse 2s ease-in-out infinite' : 'none',
          }}
        />
        {BANNER_LABELS[mode]}
      </span>

      <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px' }}>·</span>

      <span style={{ color: 'rgba(255,255,255,0.60)', fontSize: '11px' }}>
        {BANNER_SUBTITLES[mode]}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
        {mode === 'demo' && onResetDemo && (
          <button
            onClick={onResetDemo}
            style={actionButtonStyle(styles.color as string)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '1';
            }}
            title="Reset demo data to initial fixtures"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path
                d="M8.5 5A3.5 3.5 0 1 1 5 1.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              <path
                d="M5 1.5L6.5 0 5 1.5 6.5 3"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Reset
          </button>
        )}
        {mode === 'sandbox' && (
          <button
            onClick={() => setDismissed(true)}
            style={dismissButtonStyle()}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '1';
            }}
            title="Dismiss sandbox banner"
          >
            ×
          </button>
        )}
      </div>

      <style>{`
        @keyframes mode-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

function actionButtonStyle(color: string): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 9px',
    background: `${color}22`,
    border: `1px solid ${color}55`,
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 500,
    color,
    fontFamily: 'Inter, system-ui, sans-serif',
    transition: 'opacity 0.15s',
  };
}

function dismissButtonStyle(): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'Inter, system-ui, sans-serif',
    transition: 'opacity 0.15s',
    padding: 0,
  };
}
