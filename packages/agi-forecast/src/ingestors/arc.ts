import { fetchWithTimeout, ingestFailure, ingestSuccess, type IngestResult } from './_fetch';

const URL = 'https://api.github.com/repos/fchollet/ARC-AGI';

/**
 * ARC — François Chollet's ARC-AGI reference repository (Apache-2.0, no auth).
 * Value: stargazer count as a proxy for community engagement with the
 * canonical ARC-AGI corpus.
 */
export async function ingestArc(
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<number>> {
  try {
    const res = await fetchImpl(URL);
    if (!res.ok) throw new Error(`arc HTTP ${res.status}`);
    const data: unknown = await res.json();
    if (typeof data !== 'object' || data === null || !('stargazers_count' in data)) {
      throw new Error('arc response missing stargazers_count');
    }
    const stars = (data as { stargazers_count: unknown }).stargazers_count;
    if (typeof stars !== 'number' || !Number.isFinite(stars)) {
      throw new Error('arc stargazers_count not a finite number');
    }
    return ingestSuccess(URL, stars);
  } catch (err) {
    return ingestFailure(URL, err);
  }
}
