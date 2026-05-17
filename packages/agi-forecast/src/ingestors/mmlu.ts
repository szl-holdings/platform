import { ingestBenchmarkReadmeFraction } from './_benchmark';
import { fetchWithTimeout, type IngestResult } from './_fetch';

const URL = 'https://api.github.com/repos/hendrycks/test/readme';

/**
 * MMLU — Hendrycks et al. reference repository for the MMLU benchmark
 * (MIT, no auth). Value: maximum reported score (as a [0,1] fraction)
 * parsed from the repo's public README.
 */
export function ingestMmlu(
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<number>> {
  return ingestBenchmarkReadmeFraction('mmlu', URL, fetchImpl);
}
