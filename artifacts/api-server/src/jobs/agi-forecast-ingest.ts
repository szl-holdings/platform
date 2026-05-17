/**
 * AGI-forecast scheduled ingestor runner.
 *
 * Drives every PUBLIC_ONLY gauge ingestor declared in
 * `@workspace/agi-forecast` on a recurring cadence so the dashboard always
 * reflects current state rather than the last time someone manually invoked
 * a route. The actual fetching is owned by the package — this job is just
 * the scheduler + persistence layer that the api-server runtime wires into
 * boot.
 *
 * Behaviour:
 *   - First run kicks off ~60s after boot so it doesn't contend with the
 *     rest of the startup sequence.
 *   - Subsequent runs fire every `AGI_FORECAST_INGEST_INTERVAL_MS`
 *     (default: 24 hours).
 *   - Per-ingestor failures are returned as `IngestFailure` by the
 *     package and surfaced in the persisted status — they never throw,
 *     never block sibling ingestors, and never block the next scheduled
 *     run.
 *   - The latest snapshot, summary, and per-variable statuses are
 *     persisted to `.data/agi-forecast-snapshot.json` so the dashboard
 *     (and any operator inspection endpoint) reads off a stable artifact
 *     instead of having to re-run the network sweep on every request.
 *   - Setting `AGI_FORECAST_INGEST_ENABLED=false` disables scheduling
 *     entirely (useful for CI environments without network egress).
 *
 * Operators can poke at the latest snapshot via
 * `GET /api/agi-forecast/status` (wired in `routes/agi-forecast-status.ts`).
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  runAllPublicIngestors,
  type ScheduledRunResult,
  type VariableStatus,
} from '@workspace/agi-forecast';
import { logger } from '../lib/logger';

const DATA_DIR = path.join(process.cwd(), '.data');
const SNAPSHOT_FILE = path.join(DATA_DIR, 'agi-forecast-snapshot.json');

const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000; // daily
const DEFAULT_KICKOFF_MS = 60_000; // 1 minute after boot

export interface PersistedSnapshot {
  /** Wall-clock ISO timestamp the most recent run finished at. */
  readonly lastRunAt: string;
  /** ISO date the snapshot is tagged with (YYYY-MM-DD). */
  readonly date: string;
  /** Per-variable status (one entry per PUBLIC_ONLY gauge). */
  readonly statuses: readonly VariableStatus[];
  /** Deterministic daily summary; safe to re-serve to the dashboard. */
  readonly summary: ScheduledRunResult['summary'];
  /** Cumulative number of scheduled runs since process start. */
  readonly runCount: number;
}

let _intervalHandle: NodeJS.Timeout | null = null;
let _kickoffHandle: NodeJS.Timeout | null = null;
let _latest: PersistedSnapshot | null = null;
let _runCount = 0;
let _inflight: Promise<PersistedSnapshot> | null = null;

/**
 * Latest in-memory snapshot. Returns `null` before the first scheduled
 * run completes; the disk-loaded snapshot from the previous process is
 * hydrated into this slot during `startAgiForecastIngest`.
 */
export function getLatestAgiForecastSnapshot(): PersistedSnapshot | null {
  return _latest;
}

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    logger.warn({ err }, '[agi-forecast-ingest] Failed to ensure .data directory');
  }
}

async function loadPersistedSnapshot(): Promise<PersistedSnapshot | null> {
  try {
    const raw = await fs.readFile(SNAPSHOT_FILE, 'utf8');
    const parsed = JSON.parse(raw) as PersistedSnapshot;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.lastRunAt === 'string' &&
      Array.isArray(parsed.statuses)
    ) {
      return parsed;
    }
    return null;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return null;
    logger.warn({ err }, '[agi-forecast-ingest] Failed to read persisted snapshot');
    return null;
  }
}

async function writePersistedSnapshot(snap: PersistedSnapshot): Promise<void> {
  try {
    await ensureDataDir();
    // Write to a temp file then rename for atomicity — concurrent reads
    // never observe a half-written JSON document.
    const tmp = `${SNAPSHOT_FILE}.tmp`;
    await fs.writeFile(tmp, `${JSON.stringify(snap, null, 2)}\n`, 'utf8');
    await fs.rename(tmp, SNAPSHOT_FILE);
  } catch (err) {
    logger.warn({ err }, '[agi-forecast-ingest] Failed to persist snapshot');
  }
}

/**
 * Run all PUBLIC_ONLY ingestors once, update the in-memory and on-disk
 * snapshot, and return the persisted record. Concurrent callers share
 * the same in-flight run so a manual trigger during a scheduled run
 * doesn't double-fetch every source.
 */
export function runAgiForecastIngestOnce(): Promise<PersistedSnapshot> {
  if (_inflight) return _inflight;
  _inflight = (async () => {
    const startedAtMs = Date.now();
    try {
      const result = await runAllPublicIngestors();
      _runCount += 1;
      const ok = result.statuses.filter((s) => s.ok).length;
      const failed = result.statuses.length - ok;
      const snap: PersistedSnapshot = {
        lastRunAt: result.finishedAt,
        date: result.date,
        statuses: result.statuses,
        summary: result.summary,
        runCount: _runCount,
      };
      _latest = snap;
      await writePersistedSnapshot(snap);
      logger.info(
        { ok, failed, durationMs: Date.now() - startedAtMs, runCount: _runCount },
        '[agi-forecast-ingest] scheduled run complete',
      );
      return snap;
    } catch (err) {
      // runAllPublicIngestors is documented to never throw, but be defensive
      // so a regression here cannot poison the interval.
      logger.error({ err }, '[agi-forecast-ingest] scheduled run threw unexpectedly');
      throw err;
    } finally {
      _inflight = null;
    }
  })();
  return _inflight;
}

export interface AgiForecastIngestOptions {
  /** Override the cadence — default reads AGI_FORECAST_INGEST_INTERVAL_MS or 24h. */
  readonly intervalMs?: number;
  /** Override the boot-delay before the first run — default 60s. */
  readonly kickoffMs?: number;
}

/**
 * Start the recurring AGI-forecast ingestion loop. Safe to call multiple
 * times — additional calls are no-ops while a schedule is already active.
 * Honors `AGI_FORECAST_INGEST_ENABLED=false` to short-circuit, which is
 * the recommended switch for CI / sandbox environments.
 */
export function startAgiForecastIngest(opts: AgiForecastIngestOptions = {}): void {
  if (process.env.AGI_FORECAST_INGEST_ENABLED === 'false') {
    logger.info('[agi-forecast-ingest] disabled via AGI_FORECAST_INGEST_ENABLED=false');
    return;
  }
  if (_intervalHandle) return;

  const envInterval = Number(process.env.AGI_FORECAST_INGEST_INTERVAL_MS);
  const intervalMs =
    opts.intervalMs ??
    (Number.isFinite(envInterval) && envInterval > 0 ? envInterval : DEFAULT_INTERVAL_MS);
  const kickoffMs = opts.kickoffMs ?? DEFAULT_KICKOFF_MS;

  // Hydrate the in-memory slot from the previous process's persisted
  // snapshot so the status endpoint serves something useful before the
  // first scheduled run completes.
  void loadPersistedSnapshot().then((snap) => {
    if (snap && !_latest) {
      _latest = snap;
      logger.info(
        { lastRunAt: snap.lastRunAt, date: snap.date },
        '[agi-forecast-ingest] hydrated last snapshot from disk',
      );
    }
  });

  _kickoffHandle = setTimeout(() => {
    void runAgiForecastIngestOnce().catch((err) => {
      logger.warn({ err }, '[agi-forecast-ingest] initial run failed');
    });
  }, kickoffMs);
  _kickoffHandle.unref();

  _intervalHandle = setInterval(() => {
    void runAgiForecastIngestOnce().catch((err) => {
      logger.warn({ err }, '[agi-forecast-ingest] scheduled run failed');
    });
  }, intervalMs);
  _intervalHandle.unref();

  logger.info(
    { intervalMs, kickoffMs },
    '[agi-forecast-ingest] scheduled (all PUBLIC_ONLY ingestors)',
  );
}

export function stopAgiForecastIngest(): void {
  if (_kickoffHandle) {
    clearTimeout(_kickoffHandle);
    _kickoffHandle = null;
  }
  if (_intervalHandle) {
    clearInterval(_intervalHandle);
    _intervalHandle = null;
  }
}

/** Test-only — reset module state between vitest cases. */
export function __resetAgiForecastIngestForTests(): void {
  stopAgiForecastIngest();
  _latest = null;
  _runCount = 0;
  _inflight = null;
}
