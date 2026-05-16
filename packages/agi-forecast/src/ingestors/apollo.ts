import { ingestGithubStargazers } from './_github';
import { fetchWithTimeout, type IngestResult } from './_fetch';

const URL = 'https://api.github.com/repos/ApolloResearch/deception-detection';

/**
 * APOLLO — Apollo Research's deception-detection repo (MIT, no auth).
 * Value: stargazer count as a coarse proxy for community traction with
 * Apollo's scheming-evaluation work.
 */
export function ingestApollo(
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<number>> {
  return ingestGithubStargazers('apollo', URL, fetchImpl);
}
