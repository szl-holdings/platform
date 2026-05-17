import { ingestBenchmarkReadmeFraction } from './_benchmark';
import { fetchWithTimeout, type IngestResult } from './_fetch';

const URL = 'https://api.github.com/repos/princeton-nlp/SWE-bench/readme';

/**
 * SWE_BENCH — reference repository for SWE-bench Verified (MIT, no auth).
 * Value: maximum reported leaderboard score (as a [0,1] fraction) parsed
 * from the repo's public README.
 */
export function ingestSweBench(
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<number>> {
  return ingestBenchmarkReadmeFraction('swe_bench', URL, fetchImpl);
}
