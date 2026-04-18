export const ACCENT = "#8b7ac8";

export const DOMAIN_COLORS: Record<string, string> = {
  aegis: "#ef4444",
  vessels: "#0ea5e9",
  terra: "#22c55e",
  prism: "#a855f7",
  pulse: "#f59e0b",
  default: ACCENT,
};

export const DOMAIN_ICONS: Record<string, string> = {
  aegis: "⚔",
  vessels: "⚓",
  terra: "⬢",
  prism: "⚖",
  pulse: "◉",
  default: "◆",
};

export const BASE_URL = import.meta.env.BASE_URL ?? "/command/";

export function apiUrl(path: string) {
  const base = BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export interface OtelSpan {
  name: string;
  attributes: Record<string, unknown>;
  durationMs: number;
  status: "ok" | "error";
  errorMessage?: string;
  traceId?: string;
  timestamp: number;
}

let _spanBuffer: OtelSpan[] = [];
let _flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
  if (_flushTimer) return;
  _flushTimer = setTimeout(() => {
    _flushTimer = null;
    const batch = _spanBuffer.splice(0);
    if (batch.length === 0) return;
    const url = apiUrl("/telemetry/events");
    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app: "command",
        events: batch.map((s) => ({
          name: s.name,
          timestamp: s.timestamp,
          properties: {
            ...s.attributes,
            duration_ms: s.durationMs,
            status: s.status,
            ...(s.errorMessage ? { error: s.errorMessage } : {}),
            ...(s.traceId ? { trace_id: s.traceId } : {}),
          },
        })),
      }),
    }).catch(() => {});
  }, 300);
}

export function emitSpan(span: Omit<OtelSpan, "timestamp">) {
  _spanBuffer.push({ ...span, timestamp: Date.now() });
  scheduleFlush();
}

export async function tracedFetch<T>(
  name: string,
  url: string,
  attributes: Record<string, unknown>,
  init?: RequestInit
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fetchJson<T>(url, init);
    emitSpan({
      name,
      attributes: { ...attributes, "app.api_call.path": url, "app.api_call.method": init?.method ?? "GET", "app.api_call.status": 200 },
      durationMs: performance.now() - start,
      status: "ok",
    });
    return result;
  } catch (err) {
    emitSpan({
      name,
      attributes: { ...attributes, "app.api_call.path": url, "app.api_call.method": init?.method ?? "GET", "app.api_call.status": 0 },
      durationMs: performance.now() - start,
      status: "error",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

export const OUTCOME_COLORS: Record<string, string> = {
  success: "#22c55e",
  pass: "#22c55e",
  allow: "#22c55e",
  partial: "#f59e0b",
  fail: "#ef4444",
  block: "#ef4444",
  error: "#ef4444",
  escalate: "#f59e0b",
};

export const GUARDIAN_TIER_TO_AUTONOMY: Record<string, string> = {
  T0: "read-only",
  T1: "advisory",
  T2: "supervised",
  T3: "autonomous",
  T4: "autonomous",
  autonomous: "autonomous",
  supervised: "supervised",
  advisory: "advisory",
  "read-only": "read-only",
};
