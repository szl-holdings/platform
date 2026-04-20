import { useSyncExternalStore } from 'react';

export interface OpsBadgeCounts {
  alerts: number | null;
  slaBreaches: number | null;
  governancePending: number | null;
  costOverBudget: number | null;
}

const POLL_INTERVAL_MS = 30_000;

let snapshot: OpsBadgeCounts = {
  alerts: null,
  slaBreaches: null,
  governancePending: null,
  costOverBudget: null,
};
const subscribers = new Set<() => void>();
let interval: ReturnType<typeof setInterval> | null = null;
let inFlight = false;

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

async function refresh(): Promise<void> {
  if (inFlight) return;
  inFlight = true;
  try {
    const [alerts, slaBreaches, governancePending, costOverBudget] = await Promise.all([
      safeFetchCount('/api/command/alerts/count'),
      safeFetchCount('/api/command/sla/breaches'),
      safeFetchCount('/api/governance/pending'),
      safeFetchCount('/api/command/costs/over-budget'),
    ]);
    snapshot = { alerts, slaBreaches, governancePending, costOverBudget };
    subscribers.forEach((cb) => cb());
  } finally {
    inFlight = false;
  }
}

function ensurePolling(): void {
  if (interval !== null) return;
  void refresh();
  interval = setInterval(() => {
    void refresh();
  }, POLL_INTERVAL_MS);
}

function stopPolling(): void {
  if (interval === null) return;
  clearInterval(interval);
  interval = null;
}

function subscribe(cb: () => void): () => void {
  subscribers.add(cb);
  ensurePolling();
  return () => {
    subscribers.delete(cb);
    if (subscribers.size === 0) stopPolling();
  };
}

function getSnapshot(): OpsBadgeCounts {
  return snapshot;
}

/**
 * Shared, deduplicated polling hook. Layout + grid + any other consumer
 * share a single 30s polling loop and a single in-memory snapshot. The
 * loop stops when no components are mounted.
 */
export function useOpsBadgeCounts(): OpsBadgeCounts {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
