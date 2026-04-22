import { AGENT_RUN_ATTRS } from '@szl-holdings/telemetry-standards/genai';
import { recordSpan, withSpan } from '../../telemetry';

export { AGENT_RUN_ATTRS };

export const ACCENT = '#8b7ac8';

export const DOMAIN_COLORS: Record<string, string> = {
  aegis: '#ef4444',
  vessels: '#0ea5e9',
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

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? 'GET';
  const start = performance.now();
  try {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
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
