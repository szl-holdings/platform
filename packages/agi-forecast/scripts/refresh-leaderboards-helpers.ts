/**
 * Pure helpers for refresh-leaderboards.ts. Split out so they're trivially
 * unit-testable (no network, no filesystem). The CLI in
 * `refresh-leaderboards.ts` imports from here.
 */

import type { LeaderboardEntry } from '../src/ingestors/_leaderboard';

/**
 * Extract the JSON inside `<script id="__NEXT_DATA__" ...>...</script>` from
 * a Next.js HTML page. Returns `null` if the marker isn't present (or the
 * JSON is malformed) so callers can fall back to other strategies rather
 * than throwing.
 */
export function extractNextData(html: string): unknown | null {
  const match = html.match(
    /<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i,
  );
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

/**
 * Walk an arbitrary JSON value looking for arrays of objects that look like
 * leaderboard rows (have a model-name string field and a numeric score
 * field). Returns the *first* such array we find, mapped to our normalised
 * `LeaderboardEntry` shape (with the score copied to `resolved`).
 *
 * Used as a best-effort scraper for sites whose exact prop path may change
 * between releases.
 */
export function findLeaderboardArray(
  root: unknown,
  modelKeys: string[],
  scoreKeys: string[],
): LeaderboardEntry[] | null {
  const seen = new WeakSet<object>();
  const stack: unknown[] = [root];
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;
    if (seen.has(node as object)) continue;
    seen.add(node as object);
    if (Array.isArray(node)) {
      if (node.length >= 3 && node.every((r) => r && typeof r === 'object' && !Array.isArray(r))) {
        const rows = node as Record<string, unknown>[];
        const modelKey = modelKeys.find((k) =>
          rows.every((r) => typeof r[k] === 'string' && (r[k] as string).length > 0),
        );
        const scoreKey = scoreKeys.find((k) =>
          rows.every((r) => typeof r[k] === 'number' && Number.isFinite(r[k] as number)),
        );
        if (modelKey && scoreKey) {
          return rows.map((r) => ({
            model: r[modelKey] as string,
            resolved: r[scoreKey] as number,
          }));
        }
      }
      for (const child of node) stack.push(child);
    } else {
      for (const v of Object.values(node as Record<string, unknown>)) stack.push(v);
    }
  }
  return null;
}

/**
 * Clean and sort leaderboard entries: drop entries with missing/invalid
 * fields, normalise percent-valued scores (anything > 1 is interpreted as a
 * percent) to fractions in [0,1], sort descending, de-dupe by model name
 * (keeping the highest score), and truncate to topN.
 */
export function normaliseEntries(entries: LeaderboardEntry[], topN = 10): LeaderboardEntry[] {
  const cleaned = entries
    .filter(
      (e) =>
        typeof e.model === 'string' &&
        e.model.trim().length > 0 &&
        typeof e.resolved === 'number' &&
        Number.isFinite(e.resolved) &&
        e.resolved >= 0 &&
        e.resolved <= 100,
    )
    .map((e) => ({
      model: e.model.trim(),
      resolved: Number((e.resolved > 1 ? e.resolved / 100 : e.resolved).toFixed(4)),
    }));
  cleaned.sort((a, b) => b.resolved - a.resolved);
  const dedup = new Map<string, LeaderboardEntry>();
  for (const e of cleaned) if (!dedup.has(e.model)) dedup.set(e.model, e);
  return Array.from(dedup.values()).slice(0, topN);
}

/**
 * Decide whether a refreshed snapshot is identical to what's already on disk
 * AND the existing snapshot's `snapshotTakenAt` is at least today's date.
 * Returns true only if BOTH conditions hold — i.e. it's safe to skip writing
 * without leaving the file stale.
 *
 * The date check matters: if entries happen to be unchanged but the existing
 * snapshot was written days/weeks ago, we still want to rewrite the file so
 * `snapshotTakenAt` bumps. Otherwise a benchmark whose leaderboard sits
 * still would silently look stale forever — exactly the failure mode this
 * refresher exists to prevent.
 */
export function shouldSkipWrite(args: {
  existingEntries: LeaderboardEntry[] | undefined;
  existingDate: string | undefined;
  nextEntries: LeaderboardEntry[];
  today: string; // YYYY-MM-DD
}): boolean {
  const { existingEntries, existingDate, nextEntries, today } = args;
  if (!existingEntries || !existingDate) return false;
  if (existingDate < today) return false; // stale date — must rewrite
  return JSON.stringify(existingEntries) === JSON.stringify(nextEntries);
}

/** Test-only re-export bundle, so the test file has one stable import path. */
export const __testables = {
  extractNextData,
  findLeaderboardArray,
  normaliseEntries,
  shouldSkipWrite,
};
