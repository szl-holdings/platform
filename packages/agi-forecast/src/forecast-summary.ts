import { createHash } from 'node:crypto';
import { GAUGE_VARIABLES, type GaugeVariable } from './gauge-registry';
import { assertAllowedLicense } from './licenses';
import type { IngestResult } from './ingestors/_fetch';

export type VariableSnapshot = Record<string, IngestResult<number> | { ok: 'manual'; lastUpdated: string | null }>;

export interface ForecastSummary {
  readonly id: string;
  readonly date: string;
  readonly ingestionPolicy: 'PUBLIC_ONLY';
  readonly snapshot: VariableSnapshot;
  readonly variables: readonly { id: string; provenance: GaugeVariable['provenance']; source: string; license?: string }[];
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

export function buildDailySummary(date: string, snapshot: VariableSnapshot): ForecastSummary {
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

  // Spec: receiptHash = sha256 of the canonicalized snapshot (JCS-style stable JSON).
  const receiptHash = sha256Hex(canonicalize(snapshot));

  return {
    id: `forecast.summary@${date}`,
    date,
    ingestionPolicy: 'PUBLIC_ONLY',
    snapshot,
    variables,
    receiptHash,
  };
}
