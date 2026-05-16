import { fetchWithTimeout, ingestFailure, ingestSuccess, type IngestResult } from './_fetch';

const URL = 'https://api.github.com/repos/METR/public-tasks';

/**
 * METR — public-tasks repo metadata (no auth required).
 * Value: count of repository stargazers as a coarse proxy for METR
 * autonomy-eval reach. Replace with a finer-grained signal in a follow-up.
 */
export async function ingestMetr(
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<number>> {
  try {
    const res = await fetchImpl(URL);
    if (!res.ok) throw new Error(`metr HTTP ${res.status}`);
    const data: unknown = await res.json();
    if (typeof data !== 'object' || data === null || !('stargazers_count' in data)) {
      throw new Error('metr response missing stargazers_count');
    }
    const stars = (data as { stargazers_count: unknown }).stargazers_count;
    if (typeof stars !== 'number' || !Number.isFinite(stars)) {
      throw new Error('metr stargazers_count not a finite number');
    }
    return ingestSuccess(URL, stars);
  } catch (err) {
    return ingestFailure(URL, err);
  }
}
