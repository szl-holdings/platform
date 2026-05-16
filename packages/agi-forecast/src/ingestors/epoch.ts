import { fetchWithTimeout, ingestFailure, ingestSuccess, type IngestResult } from './_fetch';

const URL = 'https://epoch.ai/data/notable_ai_models.csv';

/**
 * Epoch AI — notable AI models CSV (CC-BY-4.0, no auth).
 * Value: count of rows (= notable models tracked by Epoch).
 */
export async function ingestEpoch(
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<number>> {
  try {
    const res = await fetchImpl(URL);
    if (!res.ok) throw new Error(`epoch HTTP ${res.status}`);
    const text = await res.text();
    if (!text || text.length < 2) throw new Error('epoch returned empty body');
    const lines = text.split(/\r?\n/).filter(l => l.length > 0);
    if (lines.length < 2) throw new Error('epoch CSV missing data rows');
    const rowCount = lines.length - 1;
    return ingestSuccess(URL, rowCount);
  } catch (err) {
    return ingestFailure(URL, err);
  }
}
