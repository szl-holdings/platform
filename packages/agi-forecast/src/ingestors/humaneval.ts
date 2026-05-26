import {
  fileLoader,
  ingestBenchmarkLeaderboardFraction,
  type LeaderboardLoader,
} from './_leaderboard';
import type { IngestResult } from './_fetch';

const SOURCE_URL =
  'https://github.com/openai/human-eval (pinned snapshot: data/humaneval-leaderboard.json)';

const defaultLoader: LeaderboardLoader = fileLoader(
  '../../data/humaneval-leaderboard.json',
);

/**
 * HUMANEVAL — best documented HumanEval pass@1, drawn from a pinned JSON
 * snapshot of the public leaderboard rather than from regex-parsing the
 * upstream repo's README (which drifts on every copy edit). The snapshot
 * lives at `packages/agi-forecast/data/humaneval-leaderboard.json`;
 * refresh it (and bump `snapshotTakenAt`) when the leaderboard moves.
 */
export function ingestHumanEval(
  loader: LeaderboardLoader = defaultLoader,
): Promise<IngestResult<number>> {
  return ingestBenchmarkLeaderboardFraction('humaneval', SOURCE_URL, loader);
}
