import { ingestGithubStargazers } from './_github';
import { fetchWithTimeout, type IngestResult } from './_fetch';

const URL = 'https://api.github.com/repos/google-deepmind/deepmind-research';

/**
 * FSF — Google DeepMind Frontier Safety Framework proxy via the public
 * `deepmind-research` repo (Apache-2.0, no auth). Value: stargazer count
 * as a coarse engagement proxy; replace with parsed FSF version once
 * DeepMind exposes a machine-readable feed.
 */
export function ingestFsf(
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<number>> {
  return ingestGithubStargazers('fsf', URL, fetchImpl);
}
