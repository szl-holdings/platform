import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'szl:mesh-state:v1';
const STORAGE_EVENT = 'szl:mesh-state:changed';

export interface MeshSnapshot {
  index: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  trend: number;
  openExposures: number;
  pendingApprovals: number;
  topExposure: string;
  computedAt: string;
}

const DEFAULT_SNAPSHOT: MeshSnapshot = {
  index: 38,
  grade: 'D',
  trend: -4,
  openExposures: 4,
  pendingApprovals: 3,
  topExposure: 'GITHUB_TOKEN reachable by 4 agents — blast radius critical',
  computedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
};

interface RawState {
  exposureStatuses?: Record<string, 'open' | 'fix-pending' | 'resolved'>;
  fixRequests?: Array<{ status: string; domain?: string }>;
  resilienceOverall?: number;
  resilienceTrend?: number;
  lastComputedAt?: string;
}

function gradeFor(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function readSnapshot(): MeshSnapshot {
  if (typeof window === 'undefined') return DEFAULT_SNAPSHOT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SNAPSHOT;
    const parsed = JSON.parse(raw) as RawState;
    const statuses = parsed.exposureStatuses ?? {};
    const openExposures = Object.values(statuses).filter((s) => s === 'open').length;
    const pendingApprovals = (parsed.fixRequests ?? []).filter(
      (r) => r.status === 'pending',
    ).length;
    const index = parsed.resilienceOverall ?? DEFAULT_SNAPSHOT.index;
    const allResolved =
      Object.keys(statuses).length > 0 && openExposures === 0 && pendingApprovals === 0;
    return {
      index,
      grade: gradeFor(index),
      trend: parsed.resilienceTrend ?? DEFAULT_SNAPSHOT.trend,
      openExposures,
      pendingApprovals,
      topExposure: allResolved
        ? 'All critical mesh exposures resolved — Guardian executors completed remediation'
        : openExposures > 0
          ? 'GITHUB_TOKEN reachable by 4 agents — blast radius critical'
          : 'Critical exposures resolved; supply-chain fixes in flight',
      computedAt: parsed.lastComputedAt ?? DEFAULT_SNAPSHOT.computedAt,
    };
  } catch {
    return DEFAULT_SNAPSHOT;
  }
}

function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  const onCustom = () => cb();
  window.addEventListener('storage', onStorage);
  window.addEventListener(STORAGE_EVENT, onCustom);
  const interval = window.setInterval(cb, 4000);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(STORAGE_EVENT, onCustom);
    window.clearInterval(interval);
  };
}

let lastSnapshot = readSnapshot();
let lastSerialized = JSON.stringify(lastSnapshot);

function getSnapshotMemoised(): MeshSnapshot {
  const next = readSnapshot();
  const serialized = JSON.stringify(next);
  if (serialized !== lastSerialized) {
    lastSerialized = serialized;
    lastSnapshot = next;
  }
  return lastSnapshot;
}

export function useMeshSnapshot(): MeshSnapshot {
  return useSyncExternalStore(subscribe, getSnapshotMemoised, () => DEFAULT_SNAPSHOT);
}
