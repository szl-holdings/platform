import { SZLApiError, SZLAuthError, SZLNotFoundError, SZLRateLimitError } from './errors.js';
import type { SZLClientOptions } from './types.js';
import { hashJson } from './util/canonical.js';

const DEFAULT_BASE_URL = 'https://szlholdings.com/api';
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 3;

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'DELETE', 'PUT']);

export interface HttpRequestRecord {
  method: string;
  path: string;
  body: unknown;
  paramsHash: string;
  idempotencyKey: string;
  status: number;
  result: unknown;
}

export type HttpRequestObserver = (record: HttpRequestRecord) => void | Promise<void>;

export interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  /** Caller-supplied idempotency key. If omitted, sha256 of canonical body is used. */
  idempotencyKey?: string;
  /** Extra headers; will not override Authorization/Content-Type. */
  headers?: Record<string, string>;
}

export class HttpClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly userAgent: string;
  private observer?: HttpRequestObserver;

  constructor(options: SZLClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.userAgent = options.userAgent ?? `@szl-holdings/sdk/1.2.0`;
  }

  /** Internal hook used by SZLClient to attach a receipt observer. */
  setObserver(observer: HttpRequestObserver | undefined): void {
    this.observer = observer;
  }

  async request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (options.query) {
      for (const [k, v] of Object.entries(options.query)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }

    const isMutating = MUTATING_METHODS.has(method.toUpperCase());
    const hasBody = options.body !== undefined;
    // The exact value hashed for both the Idempotency-Key and the receipt's
    // paramsHash. Same canonical input → same hash identity end-to-end.
    const canonicalParams: unknown = hasBody
      ? options.body
      : { method, path, query: options.query ?? null };
    const paramsHash = hashJson(canonicalParams);
    const headerIdemFromOptions = options.headers
      ? Object.entries(options.headers).find(([k]) => k.toLowerCase() === 'idempotency-key')?.[1]
      : undefined;
    const callerIdempotencyKey = options.idempotencyKey ?? headerIdemFromOptions;
    const computedIdempotencyKey = isMutating && hasBody ? paramsHash : '';
    const effectiveIdempotencyKey = callerIdempotencyKey ?? computedIdempotencyKey;

    let lastError: unknown;
    let lastStatus = 0;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 10_000);
        await new Promise((r) => setTimeout(r, delay));
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);

      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': this.userAgent,
        Accept: 'application/json',
        ...(options.headers ?? {}),
      };
      const callerProvidedIdem = Object.keys(headers).some(
        (h) => h.toLowerCase() === 'idempotency-key',
      );
      if (!callerProvidedIdem && effectiveIdempotencyKey) {
        headers['Idempotency-Key'] = effectiveIdempotencyKey;
      }

      try {
        const response = await fetch(url.toString(), {
          method,
          headers,
          body: hasBody ? JSON.stringify(options.body) : undefined,
          signal: options.signal ?? controller.signal,
        });

        clearTimeout(timer);
        lastStatus = response.status;

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

        let result: T;
        if (response.status === 204) {
          result = undefined as T;
        } else {
          const data = await response.json();
          result = ((data as { data?: T }).data ?? (data as T));
        }
        if (this.observer) {
          try {
            await this.observer({
              method: method.toUpperCase(),
              path,
              body: canonicalParams,
              paramsHash,
              idempotencyKey: effectiveIdempotencyKey || paramsHash,
              status: lastStatus,
              result,
            });
          } catch {
            // Observer failures must never break the SDK call path.
          }
        }

        return result;
      } catch (err) {
        clearTimeout(timer);
        if (err instanceof SZLApiError) {
          if (this.observer) {
            try {
              await this.observer({
                method: method.toUpperCase(),
                path,
                body: canonicalParams,
                paramsHash,
                idempotencyKey: effectiveIdempotencyKey || paramsHash,
                status: lastStatus || err.status,
                result: { error: err.code, message: err.message },
              });
            } catch {}
          }
          throw err;
        }
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
