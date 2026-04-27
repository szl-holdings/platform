import { useSyncExternalStore } from 'react';

export interface OpsBadgeCounts {
  alerts: number | null;
  slaBreaches: number | null;
  governancePending: number | null;
  costOverBudget: number | null;
}

/**
 * Returns 'loading' while all counts are null (first fetch pending).
 * 'critical' = alerts AND sla breaches both non-zero.
 * 'high'     = at least one of alerts / slaBreaches is non-zero.
 * 'medium'   = governance or cost issues only.
 * 'none'     = everything zero.
 */
export function deriveAlertSeverity(
  counts: OpsBadgeCounts,
): 'critical' | 'high' | 'medium' | 'none' | 'loading' {
  const { alerts, slaBreaches, governancePending, costOverBudget } = counts;
  if (
    alerts === null &&
    slaBreaches === null &&
    governancePending === null &&
    costOverBudget === null
  ) {
    return 'loading';
  }
  if ((alerts ?? 0) > 0 && (slaBreaches ?? 0) > 0) return 'critical';
  if ((alerts ?? 0) > 0 || (slaBreaches ?? 0) > 0) return 'high';
  if ((governancePending ?? 0) > 0 || (costOverBudget ?? 0) > 0) return 'medium';
  return 'none';
}

/** Sum of all non-null badge counts (null treated as 0). */
export function totalBadgeCount(counts: OpsBadgeCounts): number {
  return (
    (counts.alerts ?? 0) +
    (counts.slaBreaches ?? 0) +
    (counts.governancePending ?? 0) +
    (counts.costOverBudget ?? 0)
  );
}

/** True when any count is non-zero. */
export function hasAnyAlert(counts: OpsBadgeCounts): boolean {
  return (
    (counts.alerts ?? 0) > 0 ||
    (counts.slaBreaches ?? 0) > 0 ||
    (counts.governancePending ?? 0) > 0 ||
    (counts.costOverBudget ?? 0) > 0
  );
}

const FALLBACK_POLL_INTERVAL_MS = 30_000;
const SSE_RECONNECT_DELAY_MS = 5_000;

let snapshot: OpsBadgeCounts = {
  alerts: null,
  slaBreaches: null,
  governancePending: null,
  costOverBudget: null,
};
const subscribers = new Set<() => void>();

let es: EventSource | null = null;
let fallbackInterval: ReturnType<typeof setInterval> | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let inFlight = false;

function notify(): void {
  subscribers.forEach((cb) => cb());
}

async function safeFetchCount(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) return null;
    const body = (await res.json()) as { count?: number };
    return typeof body.count === 'number' ? body.count : null;
  } catch {
    return null;
  }
}

async function fetchAggregated(): Promise<OpsBadgeCounts | null> {
  try {
    const res = await fetch('/api/command/badge-counts', { credentials: 'include' });
    if (!res.ok) return null;
    const body = (await res.json()) as Partial<OpsBadgeCounts>;
    return {
      alerts: typeof body.alerts === 'number' ? body.alerts : null,
      slaBreaches: typeof body.slaBreaches === 'number' ? body.slaBreaches : null,
      governancePending:
        typeof body.governancePending === 'number' ? body.governancePending : null,
      costOverBudget: typeof body.costOverBudget === 'number' ? body.costOverBudget : null,
    };
  } catch {
    return null;
  }
}

async function pollOnce(): Promise<void> {
  if (inFlight) return;
  inFlight = true;
  try {
    const aggregated = await fetchAggregated();
    if (aggregated) {
      snapshot = aggregated;
    } else {
      const [alerts, slaBreaches, governancePending, costOverBudget] = await Promise.all([
        safeFetchCount('/api/command/alerts/count'),
        safeFetchCount('/api/command/sla/breaches'),
        safeFetchCount('/api/governance/pending'),
        safeFetchCount('/api/command/costs/over-budget'),
      ]);
      snapshot = { alerts, slaBreaches, governancePending, costOverBudget };
    }
    notify();
  } finally {
    inFlight = false;
  }
}

function startFallbackPolling(): void {
  if (fallbackInterval !== null) return;
  void pollOnce();
  fallbackInterval = setInterval(() => void pollOnce(), FALLBACK_POLL_INTERVAL_MS);
}

function stopFallbackPolling(): void {
  if (fallbackInterval === null) return;
  clearInterval(fallbackInterval);
  fallbackInterval = null;
}

function startSSE(): void {
  if (es !== null) {
    es.close();
    es = null;
  }

  const source = new EventSource('/api/command/badge-counts/stream');
  es = source;

  source.onopen = () => {
    stopFallbackPolling();
    if (reconnectTimeout !== null) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  };

  source.onmessage = (event) => {
    try {
      const body = JSON.parse(event.data) as Partial<OpsBadgeCounts>;
      snapshot = {
        alerts: typeof body.alerts === 'number' ? body.alerts : snapshot.alerts,
        slaBreaches:
          typeof body.slaBreaches === 'number' ? body.slaBreaches : snapshot.slaBreaches,
        governancePending:
          typeof body.governancePending === 'number'
            ? body.governancePending
            : snapshot.governancePending,
        costOverBudget:
          typeof body.costOverBudget === 'number' ? body.costOverBudget : snapshot.costOverBudget,
      };
      notify();
    } catch {}
  };

  source.onerror = () => {
    source.close();
    if (es === source) es = null;
    startFallbackPolling();
    if (reconnectTimeout === null) {
      reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;
        if (subscribers.size > 0) startSSE();
      }, SSE_RECONNECT_DELAY_MS);
    }
  };
}

function stopSSE(): void {
  if (es !== null) {
    es.close();
    es = null;
  }
  if (reconnectTimeout !== null) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
}

function subscribe(cb: () => void): () => void {
  subscribers.add(cb);
  if (subscribers.size === 1) {
    startSSE();
  }
  return () => {
    subscribers.delete(cb);
    if (subscribers.size === 0) {
      stopSSE();
      stopFallbackPolling();
    }
  };
}

function getSnapshot(): OpsBadgeCounts {
  return snapshot;
}

/**
 * Shared, deduplicated SSE-backed hook. Layout + grid + any other consumer
 * share a single EventSource and a single in-memory snapshot. Badge counts
 * update within ~5 seconds of the underlying event firing. Falls back to
 * 30-second polling while the SSE connection is re-establishing. The
 * connection closes when no components are mounted.
 */
export function useOpsBadgeCounts(): OpsBadgeCounts {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
