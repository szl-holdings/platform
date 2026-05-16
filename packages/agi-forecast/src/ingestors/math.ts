import { ingestGithubStargazers } from './_github';
import { fetchWithTimeout, type IngestResult } from './_fetch';

/**
 * MATH — Hendrycks et al. reference repository for the MATH benchmark
 * (MIT, no auth). Value: stargazer count as a proxy for frontier
 * adoption of MATH as an evaluation target.
 */
const URL = 'https://api.github.com/repos/hendrycks/math';

export function ingestMath(
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<number>> {
  return ingestGithubStargazers('math', URL, fetchImpl);
}
