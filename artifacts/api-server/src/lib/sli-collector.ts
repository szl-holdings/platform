/**
 * SLI Collector — captures per-request latency and error signals by route group,
 * maintaining rolling in-memory windows (1h, 6h, 24h) for SLO compliance computation.
 *
 * Route group mapping follows the 6 critical API groups defined in the SLO seed data:
 *   auth | decisions | billing | ai_engine | document_pipeline | platform
 */

export type ServiceGroup =
  | 'auth'
  | 'decisions'
  | 'billing'
  | 'ai_engine'
  | 'document_pipeline'
  | 'platform';

interface RequestSample {
  ts: number;
  latencyMs: number;
  isError: boolean;
}

export interface WindowStats {
  requestCount: number;
  errorCount: number;
  sortedLatencies: number[];
  p50Ms: number | null;
  p95Ms: number | null;
  p99Ms: number | null;
  availabilityPct: number;
  errorRatePct: number;
}

const WINDOW_1H_MS = 60 * 60 * 1000;
const WINDOW_6H_MS = 6 * WINDOW_1H_MS;
const WINDOW_24H_MS = 24 * WINDOW_1H_MS;
const MAX_SAMPLES_PER_GROUP = 50_000;

const samples = new Map<ServiceGroup, RequestSample[]>();

const SERVICE_GROUP_PREFIXES: Array<[string[], ServiceGroup]> = [
  [['/auth', '/session', '/login', '/logout', '/signup', '/sso', '/oauth', '/api/auth', '/api/session'], 'auth'],
  [['/decisions', '/lyte', '/api/decisions', '/api/lyte', '/api/signal-chains', '/api/signal-fusion'], 'decisions'],
  [['/billing', '/stripe', '/invoices', '/subscriptions', '/api/billing', '/api/stripe', '/api/metering', '/api/usage'], 'billing'],
  [['/ai', '/agents', '/alloy', '/api/ai', '/api/agents', '/api/alloy', '/api/ai-engine', '/api/intelligence'], 'ai_engine'],
  [['/documents', '/prism', '/files', '/api/documents', '/api/prism', '/api/files', '/api/pipeline'], 'document_pipeline'],
];

export function classifyRouteGroup(path: string): ServiceGroup {
  const lowerPath = path.toLowerCase();
  for (const [prefixes, group] of SERVICE_GROUP_PREFIXES) {
    for (const prefix of prefixes) {
      if (lowerPath.startsWith(prefix)) return group;
    }
  }
  return 'platform';
}

export function recordRequest(path: string, latencyMs: number, statusCode: number): void {
  const group = classifyRouteGroup(path);
  const isError = statusCode >= 500;
  const ts = Date.now();

  let groupSamples = samples.get(group);
  if (!groupSamples) {
    groupSamples = [];
    samples.set(group, groupSamples);
  }

  groupSamples.push({ ts, latencyMs, isError });

  if (groupSamples.length > MAX_SAMPLES_PER_GROUP) {
    const cutoff = ts - WINDOW_24H_MS;
    const firstValid = groupSamples.findIndex((s) => s.ts >= cutoff);
    if (firstValid > 0) {
      groupSamples.splice(0, firstValid);
    } else if (groupSamples.length > MAX_SAMPLES_PER_GROUP) {
      groupSamples.splice(0, groupSamples.length - MAX_SAMPLES_PER_GROUP);
    }
  }
}

function computePercentile(sorted: number[], pct: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.ceil((pct / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

export function getWindowStats(group: ServiceGroup, windowMs: number): WindowStats {
  const groupSamples = samples.get(group) ?? [];
  const cutoff = Date.now() - windowMs;
  const windowed = groupSamples.filter((s) => s.ts >= cutoff);

  if (windowed.length === 0) {
    return {
      requestCount: 0,
      errorCount: 0,
      sortedLatencies: [],
      p50Ms: null,
      p95Ms: null,
      p99Ms: null,
      availabilityPct: 100,
      errorRatePct: 0,
    };
  }

  const errorCount = windowed.filter((s) => s.isError).length;
  const sortedLatencies = windowed.map((s) => s.latencyMs).sort((a, b) => a - b);
  const availabilityPct = ((windowed.length - errorCount) / windowed.length) * 100;

  return {
    requestCount: windowed.length,
    errorCount,
    sortedLatencies,
    p50Ms: computePercentile(sortedLatencies, 50),
    p95Ms: computePercentile(sortedLatencies, 95),
    p99Ms: computePercentile(sortedLatencies, 99),
    availabilityPct,
    errorRatePct: (errorCount / windowed.length) * 100,
  };
}

export function getStats1h(group: ServiceGroup): WindowStats {
  return getWindowStats(group, WINDOW_1H_MS);
}

export function getStats6h(group: ServiceGroup): WindowStats {
  return getWindowStats(group, WINDOW_6H_MS);
}

export function getStats24h(group: ServiceGroup): WindowStats {
  return getWindowStats(group, WINDOW_24H_MS);
}

export function getAllGroupStats(): Record<ServiceGroup, { h1: WindowStats; h6: WindowStats; h24: WindowStats }> {
  const groups: ServiceGroup[] = ['auth', 'decisions', 'billing', 'ai_engine', 'document_pipeline', 'platform'];
  const result = {} as Record<ServiceGroup, { h1: WindowStats; h6: WindowStats; h24: WindowStats }>;
  for (const g of groups) {
    result[g] = {
      h1: getStats1h(g),
      h6: getStats6h(g),
      h24: getStats24h(g),
    };
  }
  return result;
}

export function pruneOldSamples(): void {
  const cutoff = Date.now() - WINDOW_24H_MS;
  for (const [group, groupSamples] of Array.from(samples.entries())) {
    const firstValid = groupSamples.findIndex((s) => s.ts >= cutoff);
    if (firstValid > 0) {
      groupSamples.splice(0, firstValid);
    } else if (firstValid === -1) {
      samples.set(group, []);
    }
  }
}
