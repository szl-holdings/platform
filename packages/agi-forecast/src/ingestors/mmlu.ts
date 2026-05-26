import {
  fileLoader,
  ingestBenchmarkLeaderboardFraction,
  type LeaderboardLoader,
} from './_leaderboard';
import type { IngestResult } from './_fetch';

const SOURCE_URL =
  'https://github.com/hendrycks/test (pinned snapshot: data/mmlu-leaderboard.json)';

const defaultLoader: LeaderboardLoader = fileLoader(
  '../../data/mmlu-leaderboard.json',
);

/**
 * MMLU — best documented accuracy on MMLU (5-shot), drawn from a pinned
 * JSON snapshot of the public leaderboard rather than from regex-parsing
 * the upstream repo's README (which drifts on every copy edit). The
 * snapshot lives at `packages/agi-forecast/data/mmlu-leaderboard.json`;
 * refresh it (and bump `snapshotTakenAt`) when the leaderboard moves.
 */
export function ingestMmlu(
  loader: LeaderboardLoader = defaultLoader,
): Promise<IngestResult<number>> {
  return ingestBenchmarkLeaderboardFraction('mmlu', SOURCE_URL, loader);
}
