import { ingestGithubStargazers } from './_github';
import { fetchWithTimeout, type IngestResult } from './_fetch';

const URL = 'https://api.github.com/repos/UKGovernmentBEIS/inspect_ai';

/**
 * AISI — UK AI Safety Institute's `inspect_ai` evaluation framework
 * (MIT, no auth). Value: stargazer count as a proxy for reach of
 * AISI-published evaluation tooling.
 */
export function ingestAisi(
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<number>> {
  return ingestGithubStargazers('aisi', URL, fetchImpl);
}
