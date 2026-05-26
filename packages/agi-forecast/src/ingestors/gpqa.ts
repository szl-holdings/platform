import {
  fileLoader,
  ingestBenchmarkLeaderboardFraction,
  type LeaderboardLoader,
} from './_leaderboard';
import type { IngestResult } from './_fetch';

const SOURCE_URL =
  'https://github.com/idavidrein/gpqa (pinned snapshot: data/gpqa-leaderboard.json)';

const defaultLoader: LeaderboardLoader = fileLoader(
  '../../data/gpqa-leaderboard.json',
);

/**
 * GPQA — best documented accuracy on GPQA Diamond, drawn from a pinned
 * JSON snapshot of the public leaderboard rather than from regex-parsing
 * the upstream repo's README (which drifts on every copy edit). The
 * snapshot lives at `packages/agi-forecast/data/gpqa-leaderboard.json`;
 * refresh it (and bump `snapshotTakenAt`) when the leaderboard moves.
 */
export function ingestGpqa(
  loader: LeaderboardLoader = defaultLoader,
): Promise<IngestResult<number>> {
  return ingestBenchmarkLeaderboardFraction('gpqa', SOURCE_URL, loader);
}
