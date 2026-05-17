import { fetchWithTimeout, ingestFailure, ingestSuccess, type IngestResult } from './_fetch';

/**
 * Parse the maximum numeric percentage found in a markdown/text body and
 * return it as a fraction in [0, 1]. Benchmark reference repositories
 * conventionally publish leaderboard / baseline scores as "XX.X%" entries
 * inside their README — the maximum across those entries is the best
 * publicly documented score, which is the semantically meaningful signal.
 *
 * Throws when no plausible percentage (0..100) is found.
 */
export function parseMaxPercentFraction(text: string): number {
  const re = /(\d{1,3}(?:\.\d+)?)\s*%/g;
  let max = -Infinity;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const n = Number.parseFloat(m[1]!);
    if (Number.isFinite(n) && n >= 0 && n <= 100 && n > max) max = n;
  }
  if (!Number.isFinite(max)) {
    throw new Error('no benchmark percentage found in README');
  }
  return max / 100;
}

/**
 * Shared benchmark ingestor — fetches a public GitHub repository README via
 * the no-auth `/readme` endpoint (raw markdown), then extracts the maximum
 * reported percentage as a [0,1] fraction. Mirrors the metr.ts/arc.ts
 * error-funnel pattern.
 *
 * @param name      gauge id (for error messages)
 * @param readmeUrl `https://api.github.com/repos/<owner>/<repo>/readme`
 */
export async function ingestBenchmarkReadmeFraction(
  name: string,
  readmeUrl: string,
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<number>> {
  try {
    const res = await fetchImpl(readmeUrl, {
      headers: { Accept: 'application/vnd.github.raw' },
    });
    if (!res.ok) throw new Error(`${name} HTTP ${res.status}`);
    const text = await res.text();
    if (!text || text.length === 0) {
      throw new Error(`${name} README empty`);
    }
    const fraction = parseMaxPercentFraction(text);
    return ingestSuccess(readmeUrl, fraction);
  } catch (err) {
    return ingestFailure(readmeUrl, err);
  }
}
