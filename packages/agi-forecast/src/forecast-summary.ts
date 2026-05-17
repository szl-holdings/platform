import { createHash } from 'node:crypto';
import { GAUGE_VARIABLES, type GaugeVariable } from './gauge-registry';
import { assertAllowedLicense } from './licenses';
import type { IngestResult } from './ingestors/_fetch';

export type VariableSnapshot = Record<string, IngestResult<number | string> | { ok: 'manual'; lastUpdated: string | null }>;

export interface HistoryEntry {
  readonly date: string;
  readonly snapshot: VariableSnapshot;
}

export interface DerivedMetrics {
  /**
   * horizon-velocity — mean per-day change across capability signals.
   * Unit: signal-units/day (averaged across heterogeneous capability series).
   * Null when no capability signal has ≥2 successful observations in `history`.
   */
  readonly horizonVelocity: number | null;
  /**
   * alignment-debt — horizon-velocity minus the equivalent mean per-day change
   * across safety signals. Positive => capability is outpacing safety.
   * Unit: signal-units/day. Null when either side is null.
   */
  readonly alignmentDebt: number | null;
  /**
   * lutar-readiness — composite go/no-go score in [0,1].
   * Formula: clamp(safetyVel,0) / (clamp(safetyVel,0) + clamp(capVel,0)).
   * 0.5 when both velocities are zero. Null when either velocity is null.
   * Higher = safety keeping pace with capability.
   */
  readonly lutarReadiness: number | null;
}

export interface ForecastSummary {
  readonly id: string;
  readonly date: string;
  readonly ingestionPolicy: 'PUBLIC_ONLY';
  readonly snapshot: VariableSnapshot;
  readonly variables: readonly { id: string; provenance: GaugeVariable['provenance']; source: string; license?: string }[];
  readonly derived: DerivedMetrics;
  readonly receiptHash: string;
}

/**
 * JCS-style stable JSON: sort object keys lexicographically at every depth,
 * preserve array order, no whitespace. Sufficient for deterministic sha256.
 */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`).join(',')}}`;
}

function sha256Hex(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

/**
 * Capability signals — variables that proxy raw model/eval throughput.
 */
export const CAPABILITY_SIGNAL_IDS: readonly string[] = [
  'METR', 'EPOCH', 'ARC', 'GPQA', 'MMLU', 'SWE_BENCH', 'HUMANEVAL', 'MATH',
];

/**
 * Safety / alignment signals — variables that proxy safety-eval reach.
 */
export const SAFETY_SIGNAL_IDS: readonly string[] = [
  'APOLLO', 'AISI', 'RSP', 'FSF',
];

function numericValue(entry: VariableSnapshot[string] | undefined): number | null {
  if (!entry) return null;
  if ((entry as { ok: unknown }).ok === true && typeof (entry as { value?: unknown }).value === 'number') {
    return (entry as { value: number }).value;
  }
  return null;
}

function perDayVelocity(id: string, history: readonly HistoryEntry[]): number | null {
  let first: { date: string; value: number } | null = null;
  let last: { date: string; value: number } | null = null;
  for (const h of history) {
    const v = numericValue(h.snapshot[id]);
    if (v === null) continue;
    if (first === null) first = { date: h.date, value: v };
    last = { date: h.date, value: v };
  }
  if (!first || !last || first === last) return null;
  const days = (Date.parse(last.date) - Date.parse(first.date)) / MS_PER_DAY;
  if (!Number.isFinite(days) || days <= 0) return null;
  return (last.value - first.value) / days;
}

function meanVelocity(ids: readonly string[], history: readonly HistoryEntry[]): number | null {
  const vs: number[] = [];
  for (const id of ids) {
    const v = perDayVelocity(id, history);
    if (v !== null && Number.isFinite(v)) vs.push(v);
  }
  if (vs.length === 0) return null;
  return vs.reduce((s, x) => s + x, 0) / vs.length;
}

/**
 * Compute the three derived metrics from a list of daily snapshots.
 * History is sorted internally by `date` ascending before windowing, so callers
 * may pass entries in any order. History must include the current day's
 * snapshot if today's values should participate in the velocity calculation.
 */
export function deriveMetrics(history: readonly HistoryEntry[]): DerivedMetrics {
  const sorted = [...history].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const horizonVelocity = meanVelocity(CAPABILITY_SIGNAL_IDS, sorted);
  const safetyVelocity = meanVelocity(SAFETY_SIGNAL_IDS, sorted);
  const alignmentDebt = horizonVelocity !== null && safetyVelocity !== null
    ? horizonVelocity - safetyVelocity
    : null;
  let lutarReadiness: number | null = null;
  if (horizonVelocity !== null && safetyVelocity !== null) {
    const cv = Math.max(horizonVelocity, 0);
    const sv = Math.max(safetyVelocity, 0);
    lutarReadiness = cv + sv === 0 ? 0.5 : sv / (cv + sv);
  }
  return { horizonVelocity, alignmentDebt, lutarReadiness };
}

export function buildDailySummary(
  date: string,
  snapshot: VariableSnapshot,
  history: readonly HistoryEntry[] = [],
): ForecastSummary {
  if (!DATE_RE.test(date)) {
    throw new Error(`buildDailySummary: invalid date "${date}" (expected YYYY-MM-DD)`);
  }

  const variables = GAUGE_VARIABLES.map(v => {
    if (v.license !== undefined) assertAllowedLicense(v.license);
    const entry: { id: string; provenance: GaugeVariable['provenance']; source: string; license?: string } = {
      id: v.id,
      provenance: v.provenance,
      source: v.source,
    };
    if (v.license !== undefined) entry.license = v.license;
    return entry;
  });

  // Always include today's snapshot in the derivation window. If the caller
  // already appended it, deduplicate by date (today wins).
  const trimmed = history.filter(h => h.date !== date);
  const effectiveHistory: HistoryEntry[] = [...trimmed, { date, snapshot }];
  const derived = deriveMetrics(effectiveHistory);

  // Receipt hash binds snapshot + derived values so downstream replay
  // verification covers the metrics operators actually read off the gauge.
  const receiptHash = sha256Hex(canonicalize({ snapshot, derived }));

  return {
    id: `forecast.summary@${date}`,
    date,
    ingestionPolicy: 'PUBLIC_ONLY',
    snapshot,
    variables,
    derived,
    receiptHash,
  };
}
