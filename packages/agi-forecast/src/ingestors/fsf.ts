import { fetchWithTimeout, ingestFailure, ingestSuccess, type IngestResult } from './_fetch';

const URL = 'https://api.github.com/repos/google-deepmind/deepmind-research/tags?per_page=1';

/**
 * FSF — Google DeepMind Frontier Safety Framework proxy. We fetch the latest
 * git tag on the public `deepmind-research` repo (Apache-2.0, no auth) and
 * return the tag name as a semver-shaped string — a machine-readable proxy
 * for DeepMind's most recent versioned public release.
 */
export async function ingestFsf(
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<string>> {
  try {
    const res = await fetchImpl(URL);
    if (!res.ok) throw new Error(`fsf HTTP ${res.status}`);
    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('fsf tags response empty');
    }
    const first = data[0] as { name?: unknown };
    if (typeof first?.name !== 'string' || first.name.length === 0) {
      throw new Error('fsf latest tag missing name');
    }
    return ingestSuccess(URL, first.name);
  } catch (err) {
    return ingestFailure(URL, err);
  }
}
