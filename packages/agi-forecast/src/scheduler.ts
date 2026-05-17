import { publicVariables, type PublicVariable } from './gauge-registry';
import {
  ingestAisi,
  ingestApollo,
  ingestArc,
  ingestEpoch,
  ingestFsf,
  ingestGpqa,
  ingestHumanEval,
  ingestMath,
  ingestMetr,
  ingestMmlu,
  ingestRsp,
  ingestSweBench,
} from './ingestors';
import type { IngestResult } from './ingestors/_fetch';
import {
  buildDailySummary,
  type ForecastSummary,
  type HistoryEntry,
  type VariableSnapshot,
} from './forecast-summary';

/**
 * Function signature shared by every PUBLIC_ONLY ingestor: takes no required
 * arguments and resolves with a typed `IngestResult<number>` — successful
 * fetches surface a numeric value, failures are returned (never thrown) so
 * one slow or unreachable source can't take the whole batch down.
 */
export type IngestorFn = () => Promise<IngestResult<number>>;

/**
 * Authoritative mapping from gauge id → ingestor function. Keys must match
 * the `id` of every PUBLIC_ONLY entry in `GAUGE_VARIABLES`; the registry
 * coverage assertion in `runAllPublicIngestors` guards against drift.
 */
export const PUBLIC_INGESTORS: Readonly<Record<string, IngestorFn>> = Object.freeze({
  METR: () => ingestMetr(),
  EPOCH: () => ingestEpoch(),
  ARC: () => ingestArc(),
  APOLLO: () => ingestApollo(),
  AISI: () => ingestAisi(),
  RSP: () => ingestRsp(),
  FSF: () => ingestFsf(),
  GPQA: () => ingestGpqa(),
  MMLU: () => ingestMmlu(),
  SWE_BENCH: () => ingestSweBench(),
  HUMANEVAL: () => ingestHumanEval(),
  MATH: () => ingestMath(),
});

/**
 * Per-variable execution status surfaced by the scheduler. Always reflects
 * the most recent attempt — `ok=false` carries the error string from the
 * ingestor's `IngestFailure`, never throws into the caller.
 */
export interface VariableStatus {
  readonly id: string;
  readonly label: string;
  readonly source: string;
  readonly ok: boolean;
  readonly lastFetchedAt: string;
  readonly value: number | null;
  readonly error: string | null;
}

export interface ScheduledRunResult {
  /** ISO date (YYYY-MM-DD) the snapshot was tagged with. */
  readonly date: string;
  /** Wall-clock ISO timestamp of when the run started. */
  readonly startedAt: string;
  /** Wall-clock ISO timestamp of when the run finished. */
  readonly finishedAt: string;
  /** Raw per-variable snapshot suitable for feeding into `buildDailySummary`. */
  readonly snapshot: VariableSnapshot;
  /** Human-readable per-gauge status (for the operator dashboard). */
  readonly statuses: readonly VariableStatus[];
  /** Deterministic daily summary derived from the snapshot (+ optional history). */
  readonly summary: ForecastSummary;
}

export interface RunOptions {
  /**
   * Optional override of the ingestor map — useful for tests that want to
   * stub the network or simulate partial failures. Defaults to
   * `PUBLIC_INGESTORS`.
   */
  readonly ingestors?: Readonly<Record<string, IngestorFn>>;
  /**
   * Optional clock — defaults to `() => new Date()`. Tests pin this to get
   * a deterministic `date` and `startedAt/finishedAt`.
   */
  readonly now?: () => Date;
  /**
   * Optional prior daily snapshots passed through to `buildDailySummary`
   * so derived metrics (horizonVelocity, alignmentDebt, lutarReadiness)
   * reflect multi-day trend, not just today's point sample.
   */
  readonly history?: readonly HistoryEntry[];
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Run every PUBLIC_ONLY gauge ingestor once, in parallel, and build the
 * daily summary from the resulting snapshot.
 *
 * Contract:
 *   - Never throws. Every ingestor already returns `IngestFailure` for
 *     network/parse/HTTP errors; this wrapper additionally guards against
 *     unexpected synchronous throws so a buggy ingestor cannot take the
 *     whole scheduled run down.
 *   - Manual (non-public) variables are skipped — they are surfaced by the
 *     summary as `{ ok: 'manual' }` entries via `buildDailySummary`'s
 *     registry walk, not by this scheduler.
 *   - The returned `statuses` array is ordered to match the registry, so
 *     the UI render is stable across runs.
 */
export async function runAllPublicIngestors(
  opts: RunOptions = {},
): Promise<ScheduledRunResult> {
  const ingestors = opts.ingestors ?? PUBLIC_INGESTORS;
  const now = opts.now ?? (() => new Date());
  const startedAt = now().toISOString();
  const date = toIsoDate(now());

  const vars: readonly PublicVariable[] = publicVariables();
  // Drift guard: every public variable must have an ingestor wired up.
  for (const v of vars) {
    if (!(v.id in ingestors)) {
      throw new Error(
        `runAllPublicIngestors: no ingestor registered for PUBLIC_ONLY variable "${v.id}". ` +
          'Add it to PUBLIC_INGESTORS or change the variable provenance to MANUAL.',
      );
    }
  }

  const results = await Promise.all(
    vars.map(async (v) => {
      const fn = ingestors[v.id];
      let result: IngestResult<number>;
      try {
        result = await fn();
      } catch (err) {
        // Defensive: ingestors are documented to never throw, but a future
        // refactor could regress that. Coerce to IngestFailure so the rest
        // of the batch is unaffected.
        result = {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
          fetchedAt: new Date().toISOString(),
          sourceUrl: v.source,
        };
      }
      const status: VariableStatus = {
        id: v.id,
        label: v.label,
        source: v.source,
        ok: result.ok,
        lastFetchedAt: result.fetchedAt,
        value: result.ok ? result.value : null,
        error: result.ok ? null : result.error,
      };
      return { id: v.id, result, status };
    }),
  );

  const snapshot: VariableSnapshot = {};
  for (const r of results) snapshot[r.id] = r.result;

  const summary = buildDailySummary(date, snapshot, opts.history ?? []);
  const finishedAt = new Date().toISOString();
  return {
    date,
    startedAt,
    finishedAt,
    snapshot,
    statuses: results.map((r) => r.status),
    summary,
  };
}
