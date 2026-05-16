import { ingestGithubStargazers } from './_github';
import { fetchWithTimeout, type IngestResult } from './_fetch';

const URL = 'https://api.github.com/repos/princeton-nlp/SWE-bench';

/**
 * SWE_BENCH — reference repository for SWE-bench Verified
 * (MIT, no auth). Value: stargazer count as a proxy for frontier
 * adoption of SWE-bench as a coding-agent evaluation target.
 */
export function ingestSweBench(
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<number>> {
  return ingestGithubStargazers('swe_bench', URL, fetchImpl);
}
