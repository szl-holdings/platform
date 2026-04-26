import {
  clearUser as clearSentryUser,
  identifyAnalyticsUser,
  resetAnalyticsUser,
  setUser as setSentryUser,
} from '@szl-holdings/observability/react';
import { AppModeBanner, AppModeProvider } from '@szl-holdings/shared-ui/app-mode-banner';
import { Toaster } from '@szl-holdings/shared-ui/ui/sonner';
import { useSessionRevocationToast } from '@szl-holdings/shared-ui/use-session-revocation-toast';
import { consumeSessionReturnPath } from '@szl-holdings/shared-ui/session-revocation';
import {
  type CommandItem,
  CommandPalette,
  createBaselineWebActions,
  getEcosystemSwitchCommands,
  useCommandPalette,
} from '@szl-holdings/shared-ui/command-palette';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import Constellation from '@/pages/Constellation';
import ErrorBoundary from './components/ErrorBoundary';
import Shell from './components/Shell';
import BriefingDetail from './pages/BriefingDetail';
import BriefingEngine from './pages/BriefingEngine';
import ConfidenceDashboard from './pages/ConfidenceDashboard';
import CustomBrief from './pages/CustomBrief';
import DissentChannel from './pages/DissentChannel';
import Library from './pages/Library';
import Settings from './pages/Settings';
import SystemHealth from './pages/SystemHealth';
import TodaysBrief from './pages/TodaysBrief';
import Watchlist from './pages/Watchlist';

const DecisionCenterPage = lazy(() => import('@/pages/decision-center'));
const GovernedCockpitPage = lazy(() => import('@/pages/governed-cockpit'));
const AiSummarizePage = lazy(() => import('@/pages/AiSummarize'));
const PulsePricingPage = lazy(() => import('@/pages/pricing'));
const PulseBillingPage = lazy(() => import('@/pages/billing-account'));

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '/pulse';

// Demo token storage key — stores the validated PIN so each demo API call can
// send it in x-demo-token. The PIN is never embedded in the client bundle or URL;
// it is entered via a form modal and sent to the server for validation first.
const DEMO_TOKEN_KEY = 'pulse-demo-token';
// Demo mode is only available in non-production builds (import.meta.env.DEV).
const DEMO_ALLOWED = import.meta.env.DEV || import.meta.env.VITE_DEMO_ALLOWED === 'true';

interface AuthUser {
  id: string | number;
  displayName?: string | null;
  email?: string | null;
}

function isDemoActive(): boolean {
  if (!DEMO_ALLOWED) return false;
  return !!sessionStorage.getItem(DEMO_TOKEN_KEY);
}

function clearDemoSession(): void {
  sessionStorage.removeItem(DEMO_TOKEN_KEY);
}

async function verifyAndStoreDemoPin(pin: string): Promise<boolean> {
  try {
    const res = await fetch('/api/pulse/demo/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = (await res.json()) as { valid?: boolean };
    if (data.valid) {
      sessionStorage.setItem(DEMO_TOKEN_KEY, pin);
      return true;
    }
  } catch {
    // network failure — treat as invalid
  }
  return false;
}

const DEMO_USER: AuthUser = {
  id: 'demo',
  displayName: 'Demo Viewer',
  email: 'demo@szlholdings.com',
};

function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activateDemo = useCallback(() => {
    setUser(DEMO_USER);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    // Always check real auth first. If the server confirms a real session,
    // clear any lingering demo token so live endpoints are always used.
    fetch('/api/auth/user', { credentials: 'include', signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ user: AuthUser | null }>;
      })
      .then((data) => {
        if (!cancelled) {
          if (data.user) {
            // Real authenticated user — kill demo fallback unconditionally.
            clearDemoSession();
            setUser(data.user);
          } else if (isDemoActive()) {
            setUser(DEMO_USER);
          } else {
            setUser(null);
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Network or server error (including timeout) — we cannot confirm auth
          // status. If a stored demo session exists, honour it; otherwise show the
          // auth gate so they can sign in explicitly.
          setUser(isDemoActive() ? DEMO_USER : null);
          setIsLoading(false);
        }
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  const login = useCallback(() => {
    const base = import.meta.env.BASE_URL?.replace(/\/+$/, '') || '/pulse';
    // If a previous force-revoke stashed the page the user was on,
    // deep-link them back to it instead of dumping them at /pulse/.
    const savedPath = consumeSessionReturnPath();
    const returnTo =
      savedPath?.startsWith(`${base}/`) ? savedPath : `${base}/`;
    window.location.href = `/api/login?returnTo=${encodeURIComponent(returnTo)}`;
  }, []);

  return { user, isLoading, isAuthenticated: !!user, login, activateDemo };
}

function PinModal({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const ok = await verifyAndStoreDemoPin(pin);
    setSubmitting(false);
    if (ok) {
      // Remove ?demo from the URL so the PIN never appears in history
      const url = new URL(window.location.href);
      url.searchParams.delete('demo');
      window.history.replaceState({}, '', url.toString());
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
        background: '#0a0b0d',
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
            color: '#c8a84b',
            marginBottom: 12,
          }}
        >
          Pulse · DEMO ACCESS
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
          Enter your demo access code to view the investor briefing.
        </p>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Access code"
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
          <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting || !pin}
          style={{
            width: '100%',
            padding: '0.625rem 1.75rem',
            background: 'rgba(200,168,75,0.12)',
            color: '#c8a84b',
            border: '1px solid rgba(200,168,75,0.35)',
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

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, login, activateDemo } = useAuth();

  useEffect(() => {
    if (user) {
      const userId = String(user.id);
      const email = user.email ?? undefined;
      const name = user.displayName ?? undefined;
      identifyAnalyticsUser({ id: userId, email, name });
      setSentryUser({ id: userId, email, username: name });
    } else {
      resetAnalyticsUser();
      clearSentryUser();
    }
  }, [user?.id]);
  const [showPinModal, setShowPinModal] = useState(() => {
    if (!DEMO_ALLOWED) return false;
    const params = new URLSearchParams(window.location.search);
    return params.has('demo') && !isDemoActive();
  });

  // Always resolve auth before deciding demo eligibility.
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0a0b0d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '0.875rem',
        }}
      >
        Authenticating…
      </div>
    );
  }

  // PIN modal is only offered to users the server confirms are NOT authenticated.
  // Authenticated users are never eligible for demo mode regardless of URL params.
  if (!isAuthenticated && showPinModal) {
    return (
      <PinModal
        onSuccess={() => {
          setShowPinModal(false);
          activateDemo();
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0a0b0d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 400, padding: '2rem' }}>
          <div
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#c8a84b',
              marginBottom: 12,
            }}
          >
            Pulse · AI EXECUTIVE BRIEFING
          </div>
          <h2
            style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: '1.4rem',
              fontWeight: 500,
              marginBottom: '0.5rem',
            }}
          >
            Authentication Required
          </h2>
          <p
            style={{
              color: 'rgba(255,255,255,0.45)',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              lineHeight: 1.6,
            }}
          >
            Sign in to access today's executive brief and intelligence dashboard.
          </p>
          <button
            onClick={login}
            style={{
              padding: '0.625rem 1.75rem',
              background: 'rgba(200,168,75,0.12)',
              color: '#c8a84b',
              border: '1px solid rgba(200,168,75,0.35)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function PulsePalette() {
  const [, navigate] = useLocation();
  const commands: CommandItem[] = [
    ...createBaselineWebActions(navigate),
    ...getEcosystemSwitchCommands('pulse'),
    {
      id: 'nav-today',
      label: "Today's Brief",
      group: 'Navigate',
      action: () => navigate(`${BASE}/`),
    },
    {
      id: 'nav-watchlist',
      label: 'My Watchlist',
      group: 'Navigate',
      action: () => navigate(`${BASE}/watchlist`),
    },
    {
      id: 'nav-library',
      label: 'Briefing Library',
      group: 'Navigate',
      action: () => navigate(`${BASE}/library`),
    },
    {
      id: 'nav-engine',
      label: 'Brief Engine',
      group: 'Navigate',
      action: () => navigate(`${BASE}/engine`),
    },
    {
      id: 'nav-confidence',
      label: 'Confidence Dashboard',
      group: 'Navigate',
      action: () => navigate(`${BASE}/confidence`),
    },
    {
      id: 'nav-custom',
      label: 'Custom Brief',
      group: 'Navigate',
      action: () => navigate(`${BASE}/custom`),
    },
    {
      id: 'nav-dissent',
      label: 'Dissent Channel',
      group: 'Navigate',
      action: () => navigate(`${BASE}/dissent`),
    },
    {
      id: 'nav-constellation',
      label: 'Constellation',
      group: 'Navigate',
      action: () => navigate(`${BASE}/constellation`),
    },
    {
      id: 'nav-governed',
      label: 'Governed Intelligence',
      group: 'Navigate',
      action: () => navigate(`${BASE}/governed-cockpit`),
    },
    {
      id: 'nav-decisions',
      label: 'Decision Center',
      group: 'Navigate',
      action: () => navigate(`${BASE}/decisions`),
    },
    {
      id: 'nav-summarize',
      label: 'AI Summarization',
      group: 'Navigate',
      action: () => navigate(`${BASE}/summarize`),
    },
    {
      id: 'nav-system',
      label: 'System Health',
      group: 'Navigate',
      action: () => navigate(`${BASE}/system`),
    },
    {
      id: 'nav-settings',
      label: 'Settings',
      group: 'Navigate',
      action: () => navigate(`${BASE}/settings`),
    },
  ];
  const { open, setOpen } = useCommandPalette(commands);
  return (
    <CommandPalette
      open={open}
      onClose={() => setOpen(false)}
      commands={commands}
      appName="Pulse"
      accentColor="#c8a84b"
      placeholder="Search Pulse — briefs, library, actions..."
    />
  );
}

export default function App() {
  useSessionRevocationToast();
  return (
    <AppModeProvider>
      <AppModeBanner />
      <RequireAuth>
        <PulsePalette />
        <Shell>
          <Toaster position="bottom-right" theme="dark" />
          <ErrorBoundary>
            <Switch>
              <Route path={`${BASE}/`} component={TodaysBrief} />
              <Route path={`${BASE}`} component={TodaysBrief} />
              <Route path={`${BASE}/watchlist`} component={Watchlist} />
              <Route path={`${BASE}/library`} component={Library} />
              <Route path={`${BASE}/library/:id`} component={BriefingDetail} />
              <Route path={`${BASE}/confidence`} component={ConfidenceDashboard} />
              <Route path={`${BASE}/custom`} component={CustomBrief} />
              <Route path={`${BASE}/dissent`} component={DissentChannel} />
              <Route path={`${BASE}/system`} component={SystemHealth} />
              <Route path={`${BASE}/settings`} component={Settings} />
              <Route path={`${BASE}/constellation`} component={Constellation} />
              <Route path={`${BASE}/constellation/entities/:id`} component={Constellation} />
              <Route path={`${BASE}/engine`} component={BriefingEngine} />
              <Route path={`${BASE}/summarize`}>
                {() => (
                  <Suspense fallback={null}>
                    <AiSummarizePage />
                  </Suspense>
                )}
              </Route>
              <Route path={`${BASE}/decisions`}>
                {() => (
                  <Suspense fallback={null}>
                    <DecisionCenterPage />
                  </Suspense>
                )}
              </Route>
              <Route path={`${BASE}/governed-cockpit`}>
                {() => (
                  <Suspense fallback={null}>
                    <GovernedCockpitPage />
                  </Suspense>
                )}
              </Route>
              <Route path={`${BASE}/pricing`}>
                {() => (
                  <Suspense fallback={null}>
                    <PulsePricingPage />
                  </Suspense>
                )}
              </Route>
              <Route path={`${BASE}/account/billing`}>
                {() => (
                  <Suspense fallback={null}>
                    <PulseBillingPage />
                  </Suspense>
                )}
              </Route>
              <Route component={TodaysBrief} />
            </Switch>
          </ErrorBoundary>
        </Shell>
      </RequireAuth>
    </AppModeProvider>
  );
}
