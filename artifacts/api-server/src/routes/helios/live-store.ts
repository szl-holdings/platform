/**
 * Frontier Intelligence live store
 *
 * Holds mutable in-memory state for signals + scanners. Seeded from the
 * static `data.ts` arrays on first import so the UI is never blank, then
 * mutated by scheduled scanner runs (see `jobs/helios-scanners.ts`) and
 * operator actions on the Scanner Admin page.
 *
 * Live-sourced signals are prepended to the list so they surface first on
 * the Signal Feed. Seeded signals remain available as a baseline, ensuring
 * graceful degradation when external feeds (arXiv, HuggingFace, …) are
 * unreachable from the api-server.
 */

import { SCANNERS, SIGNALS } from './data';
import type { Scanner, Signal } from './types';

let signals: Signal[] = [...SIGNALS];
let scanners: Scanner[] = SCANNERS.map(s => ({ ...s }));

const MAX_SIGNALS = 500;

export function getSignals(): Signal[] {
  return signals;
}

export function getScanners(): Scanner[] {
  return scanners;
}

export function getScanner(id: string): Scanner | undefined {
  return scanners.find(s => s.id === id);
}

export function setScannerEnabled(id: string, enabled: boolean): Scanner | null {
  const idx = scanners.findIndex(s => s.id === id);
  if (idx === -1) return null;
  scanners[idx] = {
    ...scanners[idx],
    enabled,
    status: enabled ? scanners[idx].status === 'error' ? 'error' : 'healthy' : 'idle',
  };
  return scanners[idx];
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// Scanner.id is namespaced (`scanner-arxiv`) but Signal.scanner uses the
// short tag (`arxiv`) — both in seed data and in newly-ingested live
// signals. Map both directions so countToday() lines up.
const SCANNER_ID_TO_SIGNAL_TAG: Record<string, string> = {
  'scanner-arxiv': 'arxiv',
  'scanner-github': 'github',
  'scanner-conference': 'conference',
  'scanner-vendor': 'vendor',
  'scanner-market': 'market',
  'scanner-mena': 'mena',
  'scanner-cve': 'cve',
};

function signalTagFor(scannerId: string): string {
  return SCANNER_ID_TO_SIGNAL_TAG[scannerId] ?? scannerId.replace(/^scanner-/, '');
}

function countToday(scannerId: string): number {
  const today = todayKey();
  const tag = signalTagFor(scannerId);
  return signals.filter(s => s.scanner === tag && s.createdAt.startsWith(today)).length;
}

/**
 * Merge newly-fetched signals into the live store, dedupe by id, refresh
 * scanner stats (lastRun, signalsToday, totalSignals, status).
 *
 * Called from `scanners-job.ts` after each successful fetch.
 */
export function ingestSignals(scannerId: string, fresh: Signal[]): { added: number; scanner: Scanner | null } {
  const idx = scanners.findIndex(s => s.id === scannerId);
  if (idx === -1) return { added: 0, scanner: null };

  const existingIds = new Set(signals.map(s => s.id));
  const newOnes = fresh.filter(s => !existingIds.has(s.id));

  if (newOnes.length > 0) {
    signals = [...newOnes, ...signals].slice(0, MAX_SIGNALS);
  }

  const now = new Date().toISOString();
  const next = new Date(Date.now() + 86_400_000).toISOString();
  scanners[idx] = {
    ...scanners[idx],
    lastRun: now,
    nextRun: next,
    status: 'healthy',
    errorMessage: undefined,
    signalsToday: countToday(scannerId),
    totalSignals: scanners[idx].totalSignals + newOnes.length,
  };

  return { added: newOnes.length, scanner: scanners[idx] };
}

/**
 * Record a failed scanner run. Keeps `lastRun` updated so operators can
 * see the scanner is being attempted, but flags it `degraded` with the
 * underlying error message.
 */
export function recordScannerError(scannerId: string, message: string): Scanner | null {
  const idx = scanners.findIndex(s => s.id === scannerId);
  if (idx === -1) return null;
  scanners[idx] = {
    ...scanners[idx],
    lastRun: new Date().toISOString(),
    status: 'degraded',
    errorMessage: message,
  };
  return scanners[idx];
}

/**
 * Bump the lastRun timestamp without ingesting anything (used by the
 * manual "Run now" admin button when a fetch is unavailable).
 */
export function touchScannerRun(scannerId: string): Scanner | null {
  const idx = scanners.findIndex(s => s.id === scannerId);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  scanners[idx] = {
    ...scanners[idx],
    lastRun: now,
    nextRun: new Date(Date.now() + 86_400_000).toISOString(),
    status: 'healthy',
    errorMessage: undefined,
  };
  return scanners[idx];
}
