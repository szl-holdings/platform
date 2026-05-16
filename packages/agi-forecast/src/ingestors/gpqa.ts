import { ingestGithubStargazers } from './_github';
import { fetchWithTimeout, type IngestResult } from './_fetch';

const URL = 'https://api.github.com/repos/idavidrein/gpqa';

/**
 * GPQA — reference repository for the GPQA Diamond benchmark
 * (MIT, no auth). Value: stargazer count as a proxy for frontier
 * uptake of GPQA as an evaluation target.
 */
export function ingestGpqa(
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<number>> {
  return ingestGithubStargazers('gpqa', URL, fetchImpl);
}
