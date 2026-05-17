import { fetchWithTimeout, ingestFailure, ingestSuccess, type IngestResult } from './_fetch';

const URL = 'https://api.github.com/repos/UKGovernmentBEIS/inspect_ai/releases?per_page=100';

/**
 * AISI — UK AI Safety Institute's `inspect_ai` evaluation framework
 * (MIT, no auth). Value: count of published GitHub releases as a proxy
 * for the cadence of AISI evaluation-tooling reports/cuts. Each release
 * corresponds to a versioned set of evaluation capabilities AISI ships
 * publicly.
 */
export async function ingestAisi(
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<number>> {
  try {
    const res = await fetchImpl(URL);
    if (!res.ok) throw new Error(`aisi HTTP ${res.status}`);
    const data: unknown = await res.json();
    if (!Array.isArray(data)) {
      throw new Error('aisi releases response not an array');
    }
    return ingestSuccess(URL, data.length);
  } catch (err) {
    return ingestFailure(URL, err);
  }
}
