import {
  fileLoader,
  ingestBenchmarkLeaderboardFraction,
  type LeaderboardLoader,
} from './_leaderboard';
import type { IngestResult } from './_fetch';

const SOURCE_URL =
  'https://github.com/hendrycks/math (pinned snapshot: data/math-leaderboard.json)';

const defaultLoader: LeaderboardLoader = fileLoader(
  '../../data/math-leaderboard.json',
);

/**
 * MATH — best documented accuracy on the Hendrycks MATH benchmark, drawn
 * from a pinned JSON snapshot of the public leaderboard rather than from
 * regex-parsing the upstream repo's README (which drifts on every copy
 * edit). The snapshot lives at `packages/agi-forecast/data/math-leaderboard.json`;
 * refresh it (and bump `snapshotTakenAt`) when the leaderboard moves.
 */
export function ingestMath(
  loader: LeaderboardLoader = defaultLoader,
): Promise<IngestResult<number>> {
  return ingestBenchmarkLeaderboardFraction('math', SOURCE_URL, loader);
}
