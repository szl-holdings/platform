import { ingestBenchmarkReadmeFraction } from './_benchmark';
import { fetchWithTimeout, type IngestResult } from './_fetch';

const URL = 'https://api.github.com/repos/hendrycks/math/readme';

/**
 * MATH — Hendrycks et al. reference repository for the MATH benchmark
 * (MIT, no auth). Value: maximum reported score (as a [0,1] fraction)
 * parsed from the repo's public README.
 */
export function ingestMath(
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<number>> {
  return ingestBenchmarkReadmeFraction('math', URL, fetchImpl);
}
