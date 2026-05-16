import { ingestGithubStargazers } from './_github';
import { fetchWithTimeout, type IngestResult } from './_fetch';

const URL = 'https://api.github.com/repos/hendrycks/test';

/**
 * MMLU — reference repository (Hendrycks et al.) for the MMLU benchmark
 * (MIT, no auth). Value: stargazer count as a proxy for frontier
 * adoption of MMLU as an evaluation target.
 */
export function ingestMmlu(
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<number>> {
  return ingestGithubStargazers('mmlu', URL, fetchImpl);
}
