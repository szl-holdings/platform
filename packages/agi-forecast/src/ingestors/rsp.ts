import { fetchWithTimeout, ingestFailure, ingestSuccess, type IngestResult } from './_fetch';

const URL = 'https://api.github.com/repos/anthropics/anthropic-cookbook/tags?per_page=1';

/**
 * RSP — Anthropic Responsible Scaling Policy proxy. We fetch the latest
 * git tag on the public `anthropic-cookbook` repo (MIT, no auth) and return
 * the tag name as a semver-shaped string. The cookbook's tags track
 * Anthropic's public release cadence — a closer proxy for "current RSP era"
 * than raw stargazer counts, and machine-readable without auth.
 */
export async function ingestRsp(
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<string>> {
  try {
    const res = await fetchImpl(URL);
    if (!res.ok) throw new Error(`rsp HTTP ${res.status}`);
    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('rsp tags response empty');
    }
    const first = data[0] as { name?: unknown };
    if (typeof first?.name !== 'string' || first.name.length === 0) {
      throw new Error('rsp latest tag missing name');
    }
    return ingestSuccess(URL, first.name);
  } catch (err) {
    return ingestFailure(URL, err);
  }
}
