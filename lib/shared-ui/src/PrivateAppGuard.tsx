import { useAuth } from '@szl-holdings/replit-auth-web';
import { type ReactNode, useEffect, useState } from 'react';

export interface PrivateAppGuardProps {
  children: ReactNode;
  appName?: string;
  accentColor?: string;
  loadingColor?: string;
}

// Shared sessionStorage key for the validated demo PIN. Once a user passes
// the PIN modal in any app (Pulse, Aegis, Terra, Vessels...), the validated
// PIN is stored here so subsequent route navigations within the SPA stay in
// demo mode without prompting again. The PIN is never embedded in the URL or
// the client bundle — it is entered via the modal and validated server-side.
const DEMO_TOKEN_KEY = 'szl-demo-token';
const DEMO_ALLOWED = import.meta.env.DEV || import.meta.env.VITE_DEMO_ALLOWED === 'true';

function isDemoActive(): boolean {
  if (!DEMO_ALLOWED) return false;
  try {
    return !!sessionStorage.getItem(DEMO_TOKEN_KEY);
  } catch {
    return false;
  }
}

async function verifyAndStorePin(pin: string): Promise<boolean> {
  try {
    const res = await fetch('/api/pulse/demo/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = (await res.json()) as { valid?: boolean };
    if (data.valid) {
      try {
        sessionStorage.setItem(DEMO_TOKEN_KEY, pin);
      } catch {
        // ignore storage errors — caller will treat as failure
      }
      return true;
    }
  } catch {
    // network failure — treat as invalid
  }
  return false;
}

function PinModal({
  appName,
  accentColor,
  onSuccess,
}: {
  appName: string;
  accentColor: string;
  onSuccess: () => void;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const ok = await verifyAndStorePin(pin);
    setSubmitting(false);
    if (ok) {
      // Strip ?demo from the URL so the trigger doesn't reopen on refresh.
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('demo');
        url.searchParams.delete('view');
        window.history.replaceState({}, '', url.toString());
      } catch {
        // ignore URL manipulation errors
      }
      onSuccess();
    } else {
      setError('Invalid access code. Please try again.');
      setPin('');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#080c14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <form onSubmit={handleSubmit} style={{ textAlign: 'center', maxWidth: 360, padding: '2rem' }}>
        <div
          style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: accentColor,
            marginBottom: 12,
          }}
        >
          {appName.toUpperCase()} · DEMO ACCESS
        </div>
        <h2
          style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: '1.3rem',
            fontWeight: 500,
            marginBottom: '0.5rem',
          }}
        >
          Enter Access Code
        </h2>
        <p
          style={{
            color: 'rgba(255,255,255,0.4)',
            marginBottom: '1.5rem',
            fontSize: '0.825rem',
            lineHeight: 1.6,
          }}
        >
          Enter your demo access code to preview {appName}.
        </p>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Access code"
          autoFocus
          style={{
            width: '100%',
            padding: '0.625rem 0.875rem',
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '6px',
            fontSize: '0.875rem',
            marginBottom: '0.75rem',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
        {error && (
          <p
            style={{
              color: '#ef4444',
              fontSize: '0.8rem',
              marginBottom: '0.75rem',
            }}
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || !pin}
          style={{
            width: '100%',
            padding: '0.625rem 1.75rem',
            background: `${accentColor}1f`,
            color: accentColor,
            border: `1px solid ${accentColor}59`,
            borderRadius: '6px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          {submitting ? 'Verifying…' : 'Enter Demo'}
        </button>
      </form>
    </div>
  );
}

/**
 * Wraps an entire private app with authentication enforcement.
 * Unauthenticated users see a styled sign-in prompt instead of the app.
 * Used in /app/* surfaces: Alloy, Lyte, Terra, Vessels dashboard, Aegis, etc.
 *
 * Demo bypass:
 *   - `?demo=<anything>` or `?view=app` query params trigger a PIN modal.
 *   - Once the server validates the PIN (POST /api/pulse/demo/verify), the
 *     PIN is persisted in sessionStorage so subsequent route navigations
 *     remain in demo mode without re-prompting.
 *   - Authenticated users are never asked for a PIN; their real session takes
 *     precedence.
 */
export function PrivateAppGuard({
  children,
  appName = 'this application',
  accentColor = '#4B8BDB',
  loadingColor,
}: PrivateAppGuardProps) {
  const { isLoading, isAuthenticated, login } = useAuth();
  const [demoActive, setDemoActive] = useState(() => isDemoActive());
  const [showPinModal, setShowPinModal] = useState(() => {
    if (!DEMO_ALLOWED) return false;
    if (isDemoActive()) return false;
    try {
      const params = new URLSearchParams(window.location.search);
      return params.has('demo') || params.get('view') === 'app';
    } catch {
      return false;
    }
  });

  // If the real session resolves to authenticated, drop demo entirely so
  // live endpoints are always used by signed-in users.
  useEffect(() => {
    if (isAuthenticated && demoActive) {
      try {
        sessionStorage.removeItem(DEMO_TOKEN_KEY);
      } catch {
        // ignore
      }
      setDemoActive(false);
      setShowPinModal(false);
    }
  }, [isAuthenticated, demoActive]);

  const color = loadingColor ?? accentColor;

  if (isAuthenticated || demoActive) {
    return <>{children}</>;
  }

  if (showPinModal) {
    return (
      <PinModal
        appName={appName}
        accentColor={accentColor}
        onSuccess={() => {
          setShowPinModal(false);
          setDemoActive(true);
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#080c14',
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            border: `2px solid ${color}40`,
            borderTopColor: color,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#080c14',
        gap: 24,
        padding: '0 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: `${accentColor}20`,
          border: `1px solid ${accentColor}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke={accentColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <div>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: '#e2e8f0',
            margin: '0 0 8px 0',
            fontFamily: 'inherit',
          }}
        >
          Authentication required
        </h2>
        <p
          style={{
            fontSize: 14,
            color: '#94a3b8',
            margin: 0,
            maxWidth: 360,
          }}
        >
          Sign in to access {appName}.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={login}
          style={{
            padding: '10px 28px',
            background: `${accentColor}20`,
            border: `1px solid ${accentColor}60`,
            borderRadius: 8,
            color: accentColor,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = `${accentColor}35`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = `${accentColor}20`;
          }}
        >
          Sign in
        </button>
        {DEMO_ALLOWED && (
          <button
            onClick={() => setShowPinModal(true)}
            style={{
              padding: '10px 28px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 8,
              color: 'rgba(255,255,255,0.7)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Enter demo code
          </button>
        )}
      </div>
    </div>
  );
}
