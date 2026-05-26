#!/usr/bin/env -S node --import tsx/esm
/**
 * refresh-leaderboards.ts
 *
 * Pulls the latest public leaderboard for each of the five pinned benchmarks
 * (SWE-bench Verified, GPQA Diamond, MMLU, HumanEval, MATH), bumps
 * `snapshotTakenAt`, and rewrites the JSON snapshot under
 * `packages/agi-forecast/data/`. Invoke via:
 *
 *   pnpm --filter @workspace/agi-forecast run refresh:leaderboards
 *
 * Design contract (matches the task spec):
 *   - Per-benchmark failures are isolated: a failure for one leaderboard
 *     never touches the JSON of another, and never overwrites the existing
 *     snapshot with a partial / empty / corrupted one.
 *   - Successful refreshes are written atomically (tmp file + rename) so an
 *     interrupted run can never leave a half-written JSON behind.
 *   - The script's exit code is 0 if at least one snapshot refreshed cleanly
 *     and no benchmark produced a *corrupted* result. It exits non-zero only
 *     if zero snapshots refreshed — that way a scheduled workflow's status
 *     surfaces "everything is stale" but doesn't red-alert on a single
 *     upstream hiccup.
 *
 * Upstream parsing strategy: every benchmark snapshot today cites a public,
 * unauthenticated leaderboard URL. Each refresher below fetches that URL and
 * extracts the top entries. Sites built on Next.js (llm-stats.com,
 * swebench.com) embed their data in a `<script id="__NEXT_DATA__">` JSON
 * blob; we walk that blob looking for arrays of `{model, score}`-shaped
 * records. When a site changes shape, the refresher for that one benchmark
 * fails loudly and the snapshot is left intact — exactly what the task
 * description requires.
 */

import { mkdtemp, readFile, rename, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { LeaderboardEntry, LeaderboardSnapshot } from '../src/ingestors/_leaderboard';
import {
  extractNextData,
  findLeaderboardArray,
  normaliseEntries,
  shouldSkipWrite,
} from './refresh-leaderboards-helpers';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(HERE, '../data');
const FETCH_TIMEOUT_MS = 20_000;
const USER_AGENT =
  'szl-agi-forecast-leaderboard-refresher/0.1 (+https://github.com/szl-holdings/agi-forecast)';

interface RefresherSpec {
  /** id used in logs and exit summary */
  id: string;
  /** filename under data/ */
  file: string;
  /** human-readable benchmark name (matches the JSON's "benchmark" field) */
  benchmark: string;
  /** upstream URL we fetch from */
  upstream: string;
  /**
   * Parse upstream HTML/JSON text into a list of leaderboard entries.
   * Throw on any structural problem; the refresher will record the failure
   * and leave the existing snapshot intact.
   */
  parse: (body: string) => LeaderboardEntry[];
  /** value to record as `upstreamSource` in the refreshed snapshot */
  upstreamSource: string;
  /** preserved verbatim in the refreshed snapshot */
  note: string;
}

interface RefreshOutcome {
  id: string;
  status: 'refreshed' | 'unchanged' | 'failed';
  message: string;
  before?: { snapshotTakenAt: string; topModel?: string; topScore?: number };
  after?: { snapshotTakenAt: string; topModel?: string; topScore?: number };
}

// ──────────────────────────────────────────────────────────────────────────
// Generic helpers
// ──────────────────────────────────────────────────────────────────────────

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
      },
    });
    if (!res.ok) {
      throw new Error(`upstream returned HTTP ${res.status} ${res.statusText}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Per-benchmark upstream parsers
// ──────────────────────────────────────────────────────────────────────────

/**
 * Parser for the llm-stats.com benchmark pages, which power four of our five
 * snapshots. The site is a Next.js app and embeds its leaderboard data in
 * `__NEXT_DATA__`. We probe a few plausible (model, score) key combinations
 * because the exact field name varies by benchmark page.
 */
function parseLlmStatsHtml(html: string): LeaderboardEntry[] {
  const data = extractNextData(html);
  if (!data) throw new Error('no __NEXT_DATA__ blob in upstream HTML');
  const found = findLeaderboardArray(
    data,
    ['model', 'name', 'model_name', 'modelName'],
    ['score', 'value', 'accuracy', 'pass_at_1', 'resolved', 'pct'],
  );
  if (!found || found.length === 0) {
    throw new Error('no leaderboard-shaped array in __NEXT_DATA__');
  }
  const out = normaliseEntries(found);
  if (out.length === 0) throw new Error('upstream entries failed normalisation');
  return out;
}

/**
 * SWE-bench's own leaderboard at swebench.com is also Next.js. The Verified
 * split lives in the same __NEXT_DATA__ blob.
 */
function parseSweBenchHtml(html: string): LeaderboardEntry[] {
  const data = extractNextData(html);
  if (!data) throw new Error('no __NEXT_DATA__ blob in swebench.com HTML');
  const found = findLeaderboardArray(
    data,
    ['model', 'name', 'system'],
    ['resolved', 'score', 'pct_resolved', 'percentResolved'],
  );
  if (!found || found.length === 0) {
    throw new Error('no leaderboard-shaped array in swebench.com __NEXT_DATA__');
  }
  const out = normaliseEntries(found);
  if (out.length === 0) throw new Error('swebench entries failed normalisation');
  return out;
}

// ──────────────────────────────────────────────────────────────────────────
// Refresher registry
// ──────────────────────────────────────────────────────────────────────────

const REFRESHERS: RefresherSpec[] = [
  {
    id: 'swe_bench',
    file: 'swe-bench-verified-leaderboard.json',
    benchmark: 'SWE-bench Verified',
    upstream: 'https://www.swebench.com/',
    upstreamSource:
      'https://www.swebench.com/#verified (top entries, auto-refreshed snapshot)',
    note:
      'Pinned dataset file. Auto-refreshed by packages/agi-forecast/scripts/refresh-leaderboards.ts. Each `resolved` value is the fraction of resolved instances in [0,1].',
    parse: parseSweBenchHtml,
  },
  {
    id: 'gpqa',
    file: 'gpqa-leaderboard.json',
    benchmark: 'GPQA Diamond',
    upstream: 'https://llm-stats.com/benchmarks/gpqa',
    upstreamSource:
      'https://llm-stats.com/benchmarks/gpqa (top entries, auto-refreshed snapshot)',
    note:
      'Pinned dataset file. Auto-refreshed by packages/agi-forecast/scripts/refresh-leaderboards.ts. Each `resolved` value is the best reported GPQA Diamond accuracy as a fraction in [0,1]. PhD expert in-domain baseline ≈ 0.65.',
    parse: parseLlmStatsHtml,
  },
  {
    id: 'mmlu',
    file: 'mmlu-leaderboard.json',
    benchmark: 'MMLU',
    upstream: 'https://llm-stats.com/benchmarks/mmlu',
    upstreamSource:
      'https://llm-stats.com/benchmarks/mmlu (top entries, auto-refreshed snapshot)',
    note:
      'Pinned dataset file. Auto-refreshed by packages/agi-forecast/scripts/refresh-leaderboards.ts. Each `resolved` value is the best reported MMLU accuracy as a fraction in [0,1].',
    parse: parseLlmStatsHtml,
  },
  {
    id: 'humaneval',
    file: 'humaneval-leaderboard.json',
    benchmark: 'HumanEval (pass@1)',
    upstream: 'https://llm-stats.com/benchmarks/humaneval',
    upstreamSource:
      'https://llm-stats.com/benchmarks/humaneval (top entries, auto-refreshed snapshot)',
    note:
      'Pinned dataset file. Auto-refreshed by packages/agi-forecast/scripts/refresh-leaderboards.ts. Each `resolved` value is the best reported HumanEval pass@1 as a fraction in [0,1].',
    parse: parseLlmStatsHtml,
  },
  {
    id: 'math',
    file: 'math-leaderboard.json',
    benchmark: 'MATH (Hendrycks et al.)',
    upstream: 'https://llm-stats.com/benchmarks/math',
    upstreamSource:
      'https://llm-stats.com/benchmarks/math (top entries, auto-refreshed snapshot)',
    note:
      'Pinned dataset file. Auto-refreshed by packages/agi-forecast/scripts/refresh-leaderboards.ts. Each `resolved` value is the best reported MATH accuracy as a fraction in [0,1].',
    parse: parseLlmStatsHtml,
  },
];

// ──────────────────────────────────────────────────────────────────────────
// Refresh loop
// ──────────────────────────────────────────────────────────────────────────

async function readSnapshot(absPath: string): Promise<LeaderboardSnapshot | null> {
  try {
    const raw = await readFile(absPath, 'utf8');
    return JSON.parse(raw) as LeaderboardSnapshot;
  } catch {
    return null;
  }
}

async function writeSnapshotAtomic(absPath: string, snapshot: LeaderboardSnapshot): Promise<void> {
  // Temp file lives in the *destination* directory so rename(2) stays
  // within one filesystem — cross-device renames (e.g. /tmp on tmpfs vs.
  // the workspace on overlayfs) would otherwise fall back to a copy and
  // break atomicity.
  const dir = path.dirname(absPath);
  const tmpPath = path.join(dir, `.${path.basename(absPath)}.${process.pid}.tmp`);
  const body = `${JSON.stringify(snapshot, null, 2)}\n`;
  await writeFile(tmpPath, body, 'utf8');
  await rename(tmpPath, absPath);
}

function snapshotSummary(s: LeaderboardSnapshot | null) {
  if (!s || !Array.isArray(s.entries) || s.entries.length === 0) return undefined;
  const top = s.entries.reduce((a, b) => (a.resolved >= b.resolved ? a : b));
  return { snapshotTakenAt: s.snapshotTakenAt, topModel: top.model, topScore: top.resolved };
}

async function refreshOne(spec: RefresherSpec, dryRun: boolean): Promise<RefreshOutcome> {
  const absPath = path.join(DATA_DIR, spec.file);
  const existing = await readSnapshot(absPath);
  const before = snapshotSummary(existing);
  try {
    const body = await fetchText(spec.upstream);
    const entries = spec.parse(body);
    if (!entries || entries.length === 0) {
      throw new Error('parser returned no entries');
    }
    const today = new Date().toISOString().slice(0, 10);
    const next: LeaderboardSnapshot & { note?: string } = {
      benchmark: spec.benchmark,
      snapshotTakenAt: today,
      upstreamSource: spec.upstreamSource,
      note: spec.note,
      entries,
    };
    const after = snapshotSummary(next);

    if (
      shouldSkipWrite({
        existingEntries: existing?.entries,
        existingDate: existing?.snapshotTakenAt,
        nextEntries: entries,
        today,
      })
    ) {
      return {
        id: spec.id,
        status: 'unchanged',
        message: 'upstream matches pinned snapshot (already dated today)',
        before,
        after,
      };
    }

    if (!dryRun) await writeSnapshotAtomic(absPath, next);
    return {
      id: spec.id,
      status: 'refreshed',
      message: dryRun ? 'would refresh (dry-run)' : 'refreshed',
      before,
      after,
    };
  } catch (err) {
    return {
      id: spec.id,
      status: 'failed',
      message: err instanceof Error ? err.message : String(err),
      before,
    };
  }
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',')) : null;

  const selected = only ? REFRESHERS.filter((r) => only.has(r.id)) : REFRESHERS;
  if (selected.length === 0) {
    console.error(`no refreshers matched --only=${onlyArg}`);
    process.exit(2);
  }

  console.log(
    `refresh-leaderboards: ${selected.length} benchmark(s)${dryRun ? ' [dry-run]' : ''}`,
  );

  const outcomes: RefreshOutcome[] = [];
  for (const spec of selected) {
    const t0 = Date.now();
    const out = await refreshOne(spec, dryRun);
    const ms = Date.now() - t0;
    outcomes.push(out);
    const tag =
      out.status === 'refreshed' ? '✓ refreshed' : out.status === 'unchanged' ? '· unchanged' : '✗ failed';
    const detail =
      out.status === 'failed'
        ? out.message
        : `top=${out.after?.topModel ?? '?'} @ ${out.after?.topScore ?? '?'}`;
    console.log(`  ${tag.padEnd(13)} ${spec.id.padEnd(12)} (${ms}ms) — ${detail}`);
  }

  const refreshed = outcomes.filter((o) => o.status === 'refreshed').length;
  const unchanged = outcomes.filter((o) => o.status === 'unchanged').length;
  const failed = outcomes.filter((o) => o.status === 'failed').length;
  console.log(
    `\nsummary: ${refreshed} refreshed, ${unchanged} unchanged, ${failed} failed`,
  );

  // Emit a JSON summary for the GH workflow to surface in the job log /
  // PR body. Written to stdout under a recognisable banner so it's easy to
  // grep out of the build log.
  console.log('\n--- refresh-leaderboards summary (JSON) ---');
  console.log(JSON.stringify({ refreshed, unchanged, failed, outcomes }, null, 2));

  // Exit non-zero only if *every* refresh failed — a single upstream blip
  // shouldn't red-alert the workflow when four others succeeded.
  if (refreshed === 0 && unchanged === 0 && failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('refresh-leaderboards: fatal', err);
  process.exit(1);
});
