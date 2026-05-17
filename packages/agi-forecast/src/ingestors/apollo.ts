import { fetchWithTimeout, ingestFailure, ingestSuccess, type IngestResult } from './_fetch';

const URL = 'https://api.github.com/repos/ApolloResearch/deception-detection';

/**
 * APOLLO — Apollo Research's deception-detection repo (MIT, no auth).
 * Value: `open_issues_count` from the repo metadata as a scheming-eval
 * activity index. Open issues track in-flight evaluation work and observed
 * deception findings, so the count is a domain-meaningful proxy for the
 * current state of Apollo's scheming-evaluation backlog.
 */
export async function ingestApollo(
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<number>> {
  try {
    const res = await fetchImpl(URL);
    if (!res.ok) throw new Error(`apollo HTTP ${res.status}`);
    const data: unknown = await res.json();
    if (typeof data !== 'object' || data === null || !('open_issues_count' in data)) {
      throw new Error('apollo response missing open_issues_count');
    }
    const issues = (data as { open_issues_count: unknown }).open_issues_count;
    if (typeof issues !== 'number' || !Number.isFinite(issues) || issues < 0) {
      throw new Error('apollo open_issues_count not a non-negative finite number');
    }
    return ingestSuccess(URL, issues);
  } catch (err) {
    return ingestFailure(URL, err);
  }
}
