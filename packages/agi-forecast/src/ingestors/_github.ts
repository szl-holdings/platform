import { fetchWithTimeout, ingestFailure, ingestSuccess, type IngestResult } from './_fetch';

/**
 * Shared helper for GitHub repo stargazer-count proxies.
 * Mirrors the metr.ts / arc.ts pattern: 15s AbortController via fetchWithTimeout,
 * HTTP-error / shape-error / network-error all funnel into IngestFailure.
 */
export async function ingestGithubStargazers(
  name: string,
  url: string,
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<number>> {
  try {
    const res = await fetchImpl(url);
    if (!res.ok) throw new Error(`${name} HTTP ${res.status}`);
    const data: unknown = await res.json();
    if (typeof data !== 'object' || data === null || !('stargazers_count' in data)) {
      throw new Error(`${name} response missing stargazers_count`);
    }
    const stars = (data as { stargazers_count: unknown }).stargazers_count;
    if (typeof stars !== 'number' || !Number.isFinite(stars)) {
      throw new Error(`${name} stargazers_count not a finite number`);
    }
    return ingestSuccess(url, stars);
  } catch (err) {
    return ingestFailure(url, err);
  }
}
