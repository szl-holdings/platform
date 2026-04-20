/**
 * Vessels Sanctions List Refresh Job
 *
 * Maintains an in-memory store of sanctions list metadata (entity counts,
 * last-refresh timestamps, freshness state). Runs a simulated refresh cycle
 * that updates stored state on each trigger — ready for wiring to live
 * OFAC API / Dow Jones / WorldCheck feed clients.
 *
 * When live feeds are connected, replace the simulate* helpers with real
 * HTTP calls and write entity records into the vessels_sanctions_entries table.
 */

import { logger } from '../lib/logger';

// ─── Store ───────────────────────────────────────────────────────────────────

export interface SanctionsSource {
  id: string;
  name: string;
  region: string;
  entities: number;
  lastRefreshedAt: string;
  lastRefreshDurationMs: number;
  status: 'ok' | 'stale' | 'error';
  dataLabel: 'live' | 'demo';
  refreshFrequencyMs: number;
}

interface SanctionsStore {
  sources: SanctionsSource[];
  lastFullRefreshAt: string | null;
  totalEntities: number;
  jobRunCount: number;
  jobStartedAt: string;
}

const REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const STALE_THRESHOLD_MS = 25 * 60 * 60 * 1000;

const store: SanctionsStore = {
  sources: [
    {
      id: 'ofac-sdn',
      name: 'OFAC SDN',
      region: 'USA',
      entities: 12_847,
      lastRefreshedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
      lastRefreshDurationMs: 820,
      status: 'ok',
      dataLabel: 'demo',
      refreshFrequencyMs: 24 * 3600_000,
    },
    {
      id: 'eu-consolidated',
      name: 'EU Consolidated',
      region: 'European Union',
      entities: 8_234,
      lastRefreshedAt: new Date(Date.now() - 6 * 3600_000).toISOString(),
      lastRefreshDurationMs: 1_140,
      status: 'ok',
      dataLabel: 'demo',
      refreshFrequencyMs: 24 * 3600_000,
    },
    {
      id: 'uk-ofsi',
      name: 'UK OFSI',
      region: 'United Kingdom',
      entities: 4_521,
      lastRefreshedAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
      lastRefreshDurationMs: 390,
      status: 'ok',
      dataLabel: 'demo',
      refreshFrequencyMs: 7 * 24 * 3600_000,
    },
    {
      id: 'un-security-council',
      name: 'UN Security Council',
      region: 'Global',
      entities: 2_183,
      lastRefreshedAt: new Date(Date.now() - 72 * 3600_000).toISOString(),
      lastRefreshDurationMs: 210,
      status: 'ok',
      dataLabel: 'demo',
      refreshFrequencyMs: 30 * 24 * 3600_000,
    },
  ],
  lastFullRefreshAt: null,
  totalEntities: 12_847 + 8_234 + 4_521 + 2_183,
  jobRunCount: 0,
  jobStartedAt: new Date().toISOString(),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function simulateRefreshSource(source: SanctionsSource): void {
  const startMs = Date.now();
  const entityDelta = Math.floor((Math.random() - 0.3) * 12);
  source.entities = Math.max(100, source.entities + entityDelta);
  source.lastRefreshedAt = new Date().toISOString();
  source.lastRefreshDurationMs = Math.floor(200 + Math.random() * 1400);
  source.status = 'ok';
  logger.debug(
    {
      sourceId: source.id,
      entities: source.entities,
      delta: entityDelta,
      durationMs: Date.now() - startMs,
    },
    '[sanctions-refresh] Source refreshed',
  );
}

function markStale(): void {
  const now = Date.now();
  for (const src of store.sources) {
    const age = now - new Date(src.lastRefreshedAt).getTime();
    if (age > STALE_THRESHOLD_MS) src.status = 'stale';
  }
}

// ─── Job ─────────────────────────────────────────────────────────────────────

export function runSanctionsRefresh(targetId?: string): void {
  const sources = targetId ? store.sources.filter((s) => s.id === targetId) : store.sources;

  for (const src of sources) {
    simulateRefreshSource(src);
  }

  store.totalEntities = store.sources.reduce((acc, s) => acc + s.entities, 0);
  store.lastFullRefreshAt = new Date().toISOString();
  store.jobRunCount += 1;

  logger.info(
    {
      sources: sources.map((s) => s.id),
      totalEntities: store.totalEntities,
      runCount: store.jobRunCount,
    },
    '[sanctions-refresh] Refresh cycle complete',
  );
}

let _timer: ReturnType<typeof setInterval> | null = null;

export function startSanctionsRefreshJob(): void {
  if (_timer) return;
  markStale();
  _timer = setInterval(() => {
    try {
      runSanctionsRefresh();
    } catch (err) {
      logger.error({ err }, '[sanctions-refresh] Job cycle failed');
    }
  }, REFRESH_INTERVAL_MS);
  logger.info(
    { intervalMs: REFRESH_INTERVAL_MS },
    '[sanctions-refresh] Sanctions refresh job started',
  );
}

export function stopSanctionsRefreshJob(): void {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
}

// ─── Store read access ────────────────────────────────────────────────────────

export function getSanctionsSources(): SanctionsSource[] {
  markStale();
  return store.sources;
}

export function getSanctionsStoreSnapshot(): Readonly<SanctionsStore> {
  markStale();
  return { ...store, sources: store.sources.map((s) => ({ ...s })) };
}
