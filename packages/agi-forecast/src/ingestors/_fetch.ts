const FETCH_TIMEOUT_MS = 15_000;

export async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'User-Agent': 'szl-agi-forecast/0.1 (+https://github.com/szl-holdings/agi-forecast)',
        Accept: 'application/json, text/csv, */*',
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export interface IngestSuccess<T> {
  ok: true;
  value: T;
  fetchedAt: string;
  sourceUrl: string;
}

export interface IngestFailure {
  ok: false;
  error: string;
  fetchedAt: string;
  sourceUrl: string;
}

export type IngestResult<T> = IngestSuccess<T> | IngestFailure;

export function ingestFailure(sourceUrl: string, error: unknown): IngestFailure {
  return {
    ok: false,
    error: error instanceof Error ? error.message : String(error),
    fetchedAt: new Date().toISOString(),
    sourceUrl,
  };
}

export function ingestSuccess<T>(sourceUrl: string, value: T): IngestSuccess<T> {
  return { ok: true, value, fetchedAt: new Date().toISOString(), sourceUrl };
}
