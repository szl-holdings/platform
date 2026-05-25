import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ingestFailure, ingestSuccess, type IngestResult } from './_fetch';

/**
 * Loader contract for a structured leaderboard ingestor. A loader returns the
 * raw JSON text of a pinned leaderboard snapshot. Defaulting to a filesystem
 * read of a checked-in pinned dataset file keeps the ingestor deterministic
 * (no upstream README copy edits can move the gauge), while still letting
 * tests inject synthetic payloads.
 */
export type LeaderboardLoader = () => Promise<string>;

/**
 * Shape of a single leaderboard entry. `resolved` is the fraction of the
 * benchmark's instances solved by the model, in [0, 1]. Values in (1, 100]
 * are interpreted as percentages and normalized.
 */
export interface LeaderboardEntry {
  model: string;
  resolved: number;
}

export interface LeaderboardSnapshot {
  benchmark: string;
  snapshotTakenAt: string;
  upstreamSource: string;
  entries: LeaderboardEntry[];
}

/**
 * Build a loader that reads a JSON file from disk. Path is resolved relative
 * to this module's directory so it works after compilation and under vitest.
 */
export function fileLoader(relativeFromHere: string): LeaderboardLoader {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const abs = path.resolve(here, relativeFromHere);
  return () => readFile(abs, 'utf8');
}

/**
 * Parse a leaderboard snapshot's JSON text and return the maximum `resolved`
 * score as a fraction in [0, 1]. Throws on structural problems so the caller
 * can funnel the error through `ingestFailure`.
 */
export function parseLeaderboardMaxFraction(jsonText: string): number {
  const parsed = JSON.parse(jsonText) as Partial<LeaderboardSnapshot>;
  const entries = parsed?.entries;
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('leaderboard snapshot has no entries');
  }
  let max = -Infinity;
  for (const e of entries) {
    const v = e?.resolved;
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 100) continue;
    const fraction = v > 1 ? v / 100 : v;
    if (fraction > max) max = fraction;
  }
  if (!Number.isFinite(max)) {
    throw new Error('leaderboard snapshot has no usable numeric scores');
  }
  return max;
}

/**
 * Structured leaderboard ingestor — reads a pinned JSON snapshot and reports
 * the best documented score as a [0, 1] fraction. Mirrors the
 * `ingestBenchmarkReadmeFraction` shape (same `IngestResult` contract) but
 * draws from explicitly maintained data instead of regex-scanning README
 * prose, so the gauge cannot drift on upstream copy edits.
 *
 * @param name      gauge id (for error messages)
 * @param sourceUrl human-readable provenance string recorded on the receipt
 * @param loader    returns raw JSON text for the pinned leaderboard
 */
export async function ingestBenchmarkLeaderboardFraction(
  name: string,
  sourceUrl: string,
  loader: LeaderboardLoader,
): Promise<IngestResult<number>> {
  try {
    const text = await loader();
    if (!text || text.length === 0) {
      throw new Error(`${name} leaderboard snapshot empty`);
    }
    const fraction = parseLeaderboardMaxFraction(text);
    return ingestSuccess(sourceUrl, fraction);
  } catch (err) {
    return ingestFailure(sourceUrl, err);
  }
}
