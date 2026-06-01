import { SZLApiError, SZLAuthError, SZLNotFoundError, SZLRateLimitError } from './errors.js';
import type { SZLClientOptions } from './types.js';

const DEFAULT_BASE_URL = 'https://szlholdings.com/api';
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 3;

export class HttpClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly userAgent: string;

  constructor(options: SZLClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.userAgent = options.userAgent ?? `@szl-holdings/sdk/1.0.0`;
  }

  async request<T>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      query?: Record<string, string | number | boolean | undefined>;
      signal?: AbortSignal;
    } = {},
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (options.query) {
      for (const [k, v] of Object.entries(options.query)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }

    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 10_000);
        await new Promise((r) => setTimeout(r, delay));
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url.toString(), {
          method,
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': this.userAgent,
            Accept: 'application/json',
          },
          body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
          signal: options.signal ?? controller.signal,
        });

        clearTimeout(timer);

        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') ?? '60', 10);
          if (attempt === this.maxRetries) throw new SZLRateLimitError(retryAfter);
          await new Promise((r) => setTimeout(r, retryAfter * 1000));
          continue;
        }

        if (!response.ok) {
          let errorBody: { error?: string; message?: string } = {};
          try {
            errorBody = (await response.json()) as typeof errorBody;
          } catch {}

          const message = errorBody.message ?? `Request failed with status ${response.status}`;
          const code = errorBody.error ?? 'API_ERROR';

          if (response.status === 401) throw new SZLAuthError(message, code);
          if (response.status === 404) throw new SZLNotFoundError(message);
          throw new SZLApiError(message, response.status, code);
        }

        if (response.status === 204) return undefined as T;

        const data = await response.json();
        return (data as { data?: T }).data ?? (data as T);
      } catch (err) {
        clearTimeout(timer);
        if (err instanceof SZLApiError) throw err;
        if (err instanceof Error && err.name === 'AbortError') {
          throw new SZLApiError('Request timed out', 408, 'TIMEOUT');
        }
        lastError = err;
        if (attempt === this.maxRetries) break;
      }
    }

    throw lastError ?? new SZLApiError('Request failed after retries', 500, 'MAX_RETRIES');
  }

  get<T>(path: string, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>('GET', path, { query });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, { body });
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, { body });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}
