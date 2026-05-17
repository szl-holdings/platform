import { ingestBenchmarkReadmeFraction } from './_benchmark';
import { fetchWithTimeout, type IngestResult } from './_fetch';

const URL = 'https://api.github.com/repos/idavidrein/gpqa/readme';

/**
 * GPQA — reference repository for the GPQA Diamond benchmark
 * (MIT, no auth). Value: maximum reported score (as a [0,1] fraction)
 * parsed from the repo's public README, which lists baseline and SOTA
 * leaderboard percentages.
 */
export function ingestGpqa(
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<number>> {
  return ingestBenchmarkReadmeFraction('gpqa', URL, fetchImpl);
}
