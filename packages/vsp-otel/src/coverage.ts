/**
 * VSP Coverage Counter — in-process metrics for span emission health.
 *
 * Tracks emit successes / failures so observability surfaces (A11oy,
 * Sentra, Grafana) can report real coverage and OTLP-export health
 * instead of static placeholders.
 *
 * The counter is module-level by design: a single proof-chain process
 * has one emitter and one counter snapshot is the right granularity
 * for "spans emitted in last hour". Callers can query the snapshot
 * via `getVspCoverageSnapshot()`.
 *
 * Coverage % is computed by the consumer as `emitted / (emitted + failed)`
 * to avoid baking a window heuristic into the library — UIs commonly
 * want both the 1h rolling and lifetime number.
 */

export interface VspCoverageSnapshot {
  /** Total spans successfully emitted since process start. */
  spansEmitted: number;
  /** Total emit() calls that threw or were rejected. */
  spansFailed: number;
  /** Rolling 1-hour emitted count. */
  spansEmittedLastHour: number;
  /** Rolling 1-hour failed count. */
  spansFailedLastHour: number;
  /** Coverage % over the rolling 1h window, or null if no traffic. */
  coveragePercentLastHour: number | null;
  /** ISO-8601 of the most recent successful emission. */
  lastEmittedAt: string | null;
  /** ISO-8601 of the most recent failed emission. */
  lastFailedAt: string | null;
  /** Last error message recorded (truncated to 200 chars). */
  lastError: string | null;
  /** Reported OTLP exporter health (set externally via `recordOtlpHealth`). */
  otlpExportHealth: 'healthy' | 'degraded' | 'failed' | 'unknown';
}

interface RingBucket {
  ts: number;
  emitted: number;
  failed: number;
}

const HOUR_MS = 60 * 60 * 1000;

let spansEmitted = 0;
let spansFailed = 0;
let lastEmittedAt: number | null = null;
let lastFailedAt: number | null = null;
let lastError: string | null = null;
let otlpExportHealth: VspCoverageSnapshot['otlpExportHealth'] = 'unknown';
const ring: RingBucket[] = [];

function pruneRing(now: number): void {
  const cutoff = now - HOUR_MS;
  while (ring.length > 0 && ring[0]!.ts < cutoff) ring.shift();
}

function pushRing(now: number, kind: 'emitted' | 'failed'): void {
  pruneRing(now);
  const bucketTs = Math.floor(now / 60_000) * 60_000;
  const last = ring[ring.length - 1];
  if (last && last.ts === bucketTs) {
    if (kind === 'emitted') last.emitted++;
    else last.failed++;
    return;
  }
  ring.push({ ts: bucketTs, emitted: kind === 'emitted' ? 1 : 0, failed: kind === 'failed' ? 1 : 0 });
}

export function recordVspEmissionSuccess(): void {
  const now = Date.now();
  spansEmitted++;
  lastEmittedAt = now;
  pushRing(now, 'emitted');
}

export function recordVspEmissionFailure(err: unknown): void {
  const now = Date.now();
  spansFailed++;
  lastFailedAt = now;
  lastError = (err instanceof Error ? err.message : String(err)).slice(0, 200);
  pushRing(now, 'failed');
}

export function recordOtlpExportHealth(state: VspCoverageSnapshot['otlpExportHealth']): void {
  otlpExportHealth = state;
}

export function getVspCoverageSnapshot(): VspCoverageSnapshot {
  const now = Date.now();
  pruneRing(now);
  let emittedHour = 0;
  let failedHour = 0;
  for (const b of ring) {
    emittedHour += b.emitted;
    failedHour += b.failed;
  }
  const totalHour = emittedHour + failedHour;
  return {
    spansEmitted,
    spansFailed,
    spansEmittedLastHour: emittedHour,
    spansFailedLastHour: failedHour,
    coveragePercentLastHour: totalHour === 0 ? null : Math.round((emittedHour / totalHour) * 10000) / 100,
    lastEmittedAt: lastEmittedAt ? new Date(lastEmittedAt).toISOString() : null,
    lastFailedAt: lastFailedAt ? new Date(lastFailedAt).toISOString() : null,
    lastError,
    otlpExportHealth,
  };
}

/** Test-only reset. Not exported from the package barrel. */
export function _resetVspCoverageForTests(): void {
  spansEmitted = 0;
  spansFailed = 0;
  lastEmittedAt = null;
  lastFailedAt = null;
  lastError = null;
  otlpExportHealth = 'unknown';
  ring.length = 0;
}
