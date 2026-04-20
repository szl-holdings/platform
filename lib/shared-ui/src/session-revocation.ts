export const SESSION_REVOKED_CODE = 'SESSION_REVOKED';
export const REFRESH_TOKEN_REPLAY_CODE = 'REFRESH_TOKEN_REPLAY';

export const SESSION_REVOCATION_CODES: ReadonlySet<string> = new Set([
  SESSION_REVOKED_CODE,
  REFRESH_TOKEN_REPLAY_CODE,
]);

export const SESSION_REVOCATION_FLAG_KEY = 'szl:session-revocation-reason';
export const SESSION_REVOCATION_EVENT = 'szl:session-revoked';

const KNOWN_AUTH_TOKEN_KEYS = [
  'cortex_auth_token',
  'szl_auth_token',
  'auth_token',
  'access_token',
  'refresh_token',
  'refreshToken',
  'szl:refresh-token',
  'pulse-demo-token',
];

export interface SessionRevocationDetail {
  code: string;
  message: string;
}

function defaultMessage(code: string): string {
  if (code === REFRESH_TOKEN_REPLAY_CODE) {
    return 'Your session was ended for security reasons — please sign in again.';
  }
  return 'An administrator updated your access — please sign in again.';
}

export function detectSessionRevocationCode(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  const candidates: unknown[] = [
    record['code'],
    (record['error'] as Record<string, unknown> | undefined)?.['code'],
    (record['data'] as Record<string, unknown> | undefined)?.['code'],
  ];
  for (const value of candidates) {
    if (typeof value === 'string' && SESSION_REVOCATION_CODES.has(value)) {
      return value;
    }
  }
  return null;
}

export function extractServerMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  const error = record['error'];
  if (typeof error === 'string' && error.trim()) return error;
  if (error && typeof error === 'object') {
    const msg = (error as Record<string, unknown>)['message'];
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  const message = record['message'];
  if (typeof message === 'string' && message.trim()) return message;
  return null;
}

let lastNotifiedAt = 0;

function clearKnownAuthTokens(): void {
  if (typeof window === 'undefined') return;
  try {
    for (const key of KNOWN_AUTH_TOKEN_KEYS) {
      window.localStorage?.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

function showFallbackBanner(message: string): void {
  if (typeof document === 'undefined') return;
  const id = 'szl-session-revoked-banner';
  if (document.getElementById(id)) return;
  const el = document.createElement('div');
  el.id = id;
  el.setAttribute('role', 'status');
  el.textContent = message;
  Object.assign(el.style, {
    position: 'fixed',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(20,20,28,0.95)',
    color: '#f5f3e8',
    padding: '12px 20px',
    borderRadius: '10px',
    border: '1px solid rgba(201,168,76,0.35)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    letterSpacing: '0.2px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
    zIndex: '2147483646',
    maxWidth: 'min(540px, 92vw)',
    textAlign: 'center',
  } as Partial<CSSStyleDeclaration>);
  document.body.appendChild(el);
  window.setTimeout(() => {
    el.remove();
  }, 6000);
}

export interface NotifyOptions {
  /** Override the default user-facing message. */
  message?: string;
  /** When false, do not redirect to the login page. Defaults to true. */
  redirect?: boolean;
  /** Path to redirect to. Defaults to current origin /login. */
  loginPath?: string;
  /** Delay before redirect, in ms. Defaults to 1500. */
  redirectDelayMs?: number;
}

/**
 * Mark the session as revoked in the browser: clear known auth tokens,
 * dispatch a custom event so app shells can render a non-blocking toast,
 * persist the reason for the login screen, and (optionally) redirect.
 *
 * Safe to call multiple times — repeat calls within 5s are coalesced.
 */
export function notifySessionRevoked(code: string, options: NotifyOptions = {}): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  if (now - lastNotifiedAt < 5000) return;
  lastNotifiedAt = now;

  const message = options.message ?? defaultMessage(code);
  const detail: SessionRevocationDetail = { code, message };

  clearKnownAuthTokens();

  try {
    window.sessionStorage?.setItem(
      SESSION_REVOCATION_FLAG_KEY,
      JSON.stringify({ ...detail, at: new Date().toISOString() }),
    );
  } catch {
    /* ignore */
  }

  let toastShown = false;
  try {
    window.dispatchEvent(
      new CustomEvent<SessionRevocationDetail>(SESSION_REVOCATION_EVENT, { detail }),
    );
    toastShown = true;
  } catch {
    /* ignore */
  }

  // Fallback banner if no app-level listener mounted (e.g. login redirect happens before React hydrates).
  // We always show it; subscribed app shells can choose to also display their own toast.
  if (!toastShown || !document.querySelector('[data-szl-session-toast]')) {
    showFallbackBanner(message);
  }

  if (options.redirect !== false) {
    const delay = options.redirectDelayMs ?? 1500;
    const target = options.loginPath ?? '/login';
    window.setTimeout(() => {
      try {
        const current = window.location.pathname + window.location.search;
        if (!current.startsWith(target)) {
          window.location.assign(target);
        }
      } catch {
        /* ignore */
      }
    }, delay);
  }
}

/**
 * Read and clear the persisted revocation reason. Useful from the login
 * screen to display the message after the redirect.
 */
export function consumeSessionRevocationReason(): SessionRevocationDetail | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage?.getItem(SESSION_REVOCATION_FLAG_KEY);
    if (!raw) return null;
    window.sessionStorage?.removeItem(SESSION_REVOCATION_FLAG_KEY);
    const parsed = JSON.parse(raw) as Partial<SessionRevocationDetail>;
    if (typeof parsed?.code === 'string' && typeof parsed?.message === 'string') {
      return { code: parsed.code, message: parsed.message };
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Subscribe to the session-revoked event; returns an unsubscribe function.
 */
export function onSessionRevoked(handler: (detail: SessionRevocationDetail) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<SessionRevocationDetail>).detail;
    if (detail) handler(detail);
  };
  window.addEventListener(SESSION_REVOCATION_EVENT, listener);
  return () => window.removeEventListener(SESSION_REVOCATION_EVENT, listener);
}
