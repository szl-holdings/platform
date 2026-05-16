import { ingestGithubStargazers } from './_github';
import { fetchWithTimeout, type IngestResult } from './_fetch';

const URL = 'https://api.github.com/repos/anthropics/anthropic-cookbook';

/**
 * RSP — Anthropic Responsible Scaling Policy proxy via the public
 * `anthropic-cookbook` repo (MIT, no auth). Value: stargazer count as a
 * coarse engagement proxy; replace with a parsed RSP version string in a
 * follow-up once Anthropic exposes a stable machine-readable feed.
 */
export function ingestRsp(
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<number>> {
  return ingestGithubStargazers('rsp', URL, fetchImpl);
}
