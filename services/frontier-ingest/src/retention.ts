/**
 * Frontier retention policy — resolves env-configured windows and runs a
 * single prune pass against the shared DB backend.
 *
 * This module is the seam between two callers:
 *  - The Temporal `frontierRetentionWorkflow` activity (production
 *    scheduler) — invoked every `FRONTIER_RETENTION_INTERVAL_MS`.
 *  - The admin endpoint `POST /a11oy/frontier/admin/prune` — invoked
 *    on-demand by an operator when a backlog needs to be drained outside
 *    the normal cadence.
 *
 * Keeping the policy resolution in one place means env knobs documented
 * in the task spec (`FRONTIER_RETENTION_DAYS`) behave identically across
 * scheduled and ad-hoc runs.
 */
import {
  dbPruneFrontierRetention,
  ensureSchema,
  isDbBackendEnabled,
  type FrontierRetentionResult,
} from './db-backend.js';

export interface FrontierRetentionConfig {
  /** Days of `frontier_timeline` to retain. Default: 30. */
  timelineDays: number;
  /** Days of `discarded` inbox items (and their orphan artifacts) to retain. Default: 30. */
  discardedInboxDays: number;
  /** Interval between scheduled prune sweeps (ms). Default: 24h. */
  intervalMs: number;
}

/**
 * Resolve retention windows from env with sensible defaults. Callers may
 * pass partial overrides (e.g. the admin endpoint can shorten the window
 * for a one-off operator-driven cleanup).
 */
export function resolveFrontierRetentionConfig(
  overrides: Partial<FrontierRetentionConfig> = {},
): FrontierRetentionConfig {
  const envNum = (name: string, fallback: number): number => {
    const v = process.env[name];
    if (!v) return fallback;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  const timelineDays = overrides.timelineDays ?? envNum('FRONTIER_RETENTION_DAYS', 30);
  const discardedInboxDays =
    overrides.discardedInboxDays ??
    envNum('FRONTIER_DISCARDED_INBOX_RETENTION_DAYS', timelineDays);
  const intervalMs =
    overrides.intervalMs ??
    envNum('FRONTIER_RETENTION_INTERVAL_MS', 24 * 60 * 60 * 1000);
  return { timelineDays, discardedInboxDays, intervalMs };
}

/**
 * Run a single retention sweep. Returns `undefined` when the DB backend
 * is unavailable (in which case the engine is running purely in-memory
 * and growth is bounded by process lifetime anyway).
 */
export async function pruneFrontierRetention(
  overrides: Partial<FrontierRetentionConfig> = {},
): Promise<FrontierRetentionResult | undefined> {
  await ensureSchema();
  if (!isDbBackendEnabled()) return undefined;
  const cfg = resolveFrontierRetentionConfig(overrides);
  return dbPruneFrontierRetention({
    timelineDays: cfg.timelineDays,
    discardedInboxDays: cfg.discardedInboxDays,
  });
}
