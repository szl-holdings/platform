import {
  fileLoader,
  ingestBenchmarkLeaderboardFraction,
  type LeaderboardLoader,
} from './_leaderboard';
import type { IngestResult } from './_fetch';

const SOURCE_URL =
  'https://www.swebench.com/#verified (pinned snapshot: data/swe-bench-verified-leaderboard.json)';

const defaultLoader: LeaderboardLoader = fileLoader(
  '../../data/swe-bench-verified-leaderboard.json',
);

/**
 * SWE_BENCH — best documented resolution rate on SWE-bench Verified, drawn
 * from a pinned JSON snapshot of the public swebench.com leaderboard rather
 * than from regex-parsing the SWE-bench repo README. The snapshot lives at
 * `packages/agi-forecast/data/swe-bench-verified-leaderboard.json`; refresh
 * it (and bump `snapshotTakenAt`) when the leaderboard moves materially.
 *
 * GPQA / MMLU / HUMANEVAL / MATH follow the same pinned-snapshot pattern —
 * see their respective `data/*-leaderboard.json` files.
 */
export function ingestSweBench(
  loader: LeaderboardLoader = defaultLoader,
): Promise<IngestResult<number>> {
  return ingestBenchmarkLeaderboardFraction(
    'swe_bench',
    SOURCE_URL,
    loader,
  );
}
