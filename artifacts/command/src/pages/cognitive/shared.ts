import { AGENT_RUN_ATTRS } from '@szl-holdings/telemetry-standards/genai';
import { recordSpan, withSpan } from '../../telemetry';

export { AGENT_RUN_ATTRS };

export const ACCENT = '#8b7ac8';

export const DOMAIN_COLORS: Record<string, string> = {
  aegis: '#ef4444',
  vessels: '#4d8fcc',
  terra: '#22c55e',
  prism: '#a855f7',
  pulse: '#f59e0b',
  default: ACCENT,
};

export const DOMAIN_ICONS: Record<string, string> = {
  aegis: '⚔',
  vessels: '⚓',
  terra: '⬢',
  prism: '⚖',
  pulse: '◉',
  default: '◆',
};

export const BASE_URL = import.meta.env.BASE_URL ?? '/command/';

export function apiUrl(path: string) {
  const base = BASE_URL.replace(/\/$/, '');
  return `${base}/api${path}`;
}

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function readCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(CSRF_COOKIE_NAME.length + 1));
}

async function fetchFreshCsrfToken(apiBase: string): Promise<void> {
  try {
    await fetch(`${apiBase}/csrf-token`, { method: 'GET', credentials: 'include' });
  } catch {
    // best-effort
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const start = performance.now();
  const needsCsrf = CSRF_MUTATING_METHODS.has(method);
  let csrfRetried = false;

  const doFetch = async (): Promise<T> => {
    const csrfToken = needsCsrf ? readCsrfTokenFromCookie() : null;
    try {
      const mergedHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(needsCsrf && csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {}),
        ...(init?.headers as Record<string, string> | undefined),
      };
      const res = await fetch(url, {
        credentials: 'include',
        ...init,
        headers: mergedHeaders,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        if (res.status === 403 && !csrfRetried) {
          let errBody: { code?: string } | null = null;
          try { errBody = JSON.parse(text); } catch { /* ignore */ }
          const code = errBody?.code;
          if (code === 'CSRF_TOKEN_MISSING' || code === 'CSRF_TOKEN_MISMATCH') {
            csrfRetried = true;
            // Derive the CSRF endpoint base from the URL being fetched so
            // this works whether the caller uses apiUrl() → /command/api/...
            // or a direct /api/... path.
            // e.g. "/command/api/agents/runs" → "/command/api"
            // e.g. "/api/vessels/alerts"      → "/api"
            const urlPath = url.startsWith('http')
              ? (() => { try { return new URL(url).pathname; } catch { return url; } })()
              : url;
            const prefixMatch = urlPath.match(/^(.*?\/api)(?:\/|$)/);
            const csrfBase = prefixMatch ? prefixMatch[1] : '/api';
            await fetchFreshCsrfToken(csrfBase);
            return doFetch();
          }
        }
        const err = new Error(`HTTP ${res.status}: ${text || res.statusText}`) as Error & {
          httpStatus?: number;
        };
        err.httpStatus = res.status;
        throw err;
      }
      const result = (await res.json()) as T;
      recordSpan({
        name: 'app.api_call',
        attributes: {
          [AGENT_RUN_ATTRS.API_CALL_PATH]: url,
          [AGENT_RUN_ATTRS.API_CALL_METHOD]: method,
          [AGENT_RUN_ATTRS.API_CALL_STATUS]: res.status,
          [AGENT_RUN_ATTRS.API_CALL_LATENCY_MS]: Math.round(performance.now() - start),
        },
        durationMs: Math.round(performance.now() - start),
        status: 'ok',
      });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status =
        (err as { httpStatus?: number })?.httpStatus ??
        (() => {
          const m = /HTTP\s+(\d+)/i.exec(message);
          return m ? Number(m[1]) : 0;
        })();
      recordSpan({
        name: 'app.api_call',
        attributes: {
          [AGENT_RUN_ATTRS.API_CALL_PATH]: url,
          [AGENT_RUN_ATTRS.API_CALL_METHOD]: method,
          [AGENT_RUN_ATTRS.API_CALL_STATUS]: status,
          [AGENT_RUN_ATTRS.API_CALL_LATENCY_MS]: Math.round(performance.now() - start),
        },
        durationMs: Math.round(performance.now() - start),
        status: 'error',
        errorMessage: message,
      });
      throw err;
    }
  };

  return doFetch();
}

export interface OtelSpan {
  name: string;
  attributes: Record<string, unknown>;
  durationMs: number;
  status: 'ok' | 'error';
  errorMessage?: string;
  traceId?: string;
  timestamp: number;
}

export function emitSpan(span: Omit<OtelSpan, 'timestamp'>) {
  recordSpan({
    name: span.name,
    attributes: span.attributes,
    durationMs: span.durationMs,
    status: span.status,
    errorMessage: span.errorMessage,
  });
}

export async function tracedFetch<T>(
  name: string,
  url: string,
  attributes: Record<string, unknown>,
  init?: RequestInit,
): Promise<T> {
  return withSpan(
    name,
    {
      ...attributes,
      [AGENT_RUN_ATTRS.API_CALL_PATH]: url,
      [AGENT_RUN_ATTRS.API_CALL_METHOD]: init?.method ?? 'GET',
    },
    () => fetchJson<T>(url, init),
  );
}

export function recordPageLoad(
  path: string,
  durationMs: number,
  extra: Record<string, unknown> = {},
) {
  recordSpan({
    name: 'app.page_load',
    attributes: {
      [AGENT_RUN_ATTRS.PAGE_LOAD_PATH]: path,
      [AGENT_RUN_ATTRS.PAGE_LOAD_LATENCY_MS]: Math.round(durationMs),
      ...extra,
    },
    durationMs: Math.round(durationMs),
    status: 'ok',
  });
}

export const OUTCOME_COLORS: Record<string, string> = {
  success: '#22c55e',
  pass: '#22c55e',
  allow: '#22c55e',
  partial: '#f59e0b',
  fail: '#ef4444',
  block: '#ef4444',
  error: '#ef4444',
  escalate: '#f59e0b',
};

export const GUARDIAN_TIER_TO_AUTONOMY: Record<string, string> = {
  T0: 'read-only',
  T1: 'advisory',
  T2: 'supervised',
  T3: 'autonomous',
  T4: 'autonomous',
  autonomous: 'autonomous',
  supervised: 'supervised',
  advisory: 'advisory',
  'read-only': 'read-only',
};
