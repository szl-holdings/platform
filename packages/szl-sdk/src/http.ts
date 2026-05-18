import {
  parseSSE,
  streamWithReceipts,
  type ReceiptedStream,
  type ReceiptChain,
} from '@szl-holdings/szl-receipts';
import { SZLApiError, SZLAuthError, SZLNotFoundError, SZLRateLimitError } from './errors.js';
import type { GateDecision } from './lambda-gate.js';
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
  gateDecision?: GateDecision;
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
  /** Λ-gate decision to record on the receipt for this call. */
  gateDecision?: GateDecision;
}

export interface StreamRequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /** Caller-supplied stream id. If omitted, a random one is generated. */
  streamId?: string;
}

export class HttpClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly userAgent: string;
  private observer?: HttpRequestObserver;
  private chain?: ReceiptChain;
  private operatorId?: string;

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

  /**
   * Internal hook used by SZLClient to attach a receipt chain for streaming
   * requests (`stream<T>()`). Per-chunk receipts are appended directly to the
   * chain so they share `seq`/`prevHash` with non-streaming calls.
   */
  setStreamChain(chain: ReceiptChain | undefined, operatorId: string | undefined): void {
    this.chain = chain;
    this.operatorId = operatorId;
  }

  /**
   * Stream a server-sent-events response and emit one `LambdaReceipt` per
   * chunk (`paramsHash` = sha256 of the chunk's raw bytes). When the
   * iterator finishes — either normally or because the caller broke out —
   * a `StreamClosureReceipt` is folded over the per-chunk receipts and
   * resolved via the returned `closure` promise.
   *
   * Expected wire format: `event: chunk\ndata: <json>\n\n` per chunk and
   * an optional `event: end\ndata: ...\n\n` terminator. Non-chunk frames
   * are ignored for receipt purposes.
   */
  stream<T>(method: string, path: string, options: StreamRequestOptions = {}): ReceiptedStream<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (options.query) {
      for (const [k, v] of Object.entries(options.query)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }
    const streamId = options.streamId ?? `sdk-stream-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'User-Agent': this.userAgent,
      Accept: 'text/event-stream',
      ...(options.headers ?? {}),
    };

    const chain = this.chain;
    const operatorId = this.operatorId ?? 'anonymous';

    async function* source(): AsyncGenerator<{ event: string; data: string; rawBytes: Uint8Array }, void, void> {
      const response = await fetch(url.toString(), {
        method,
        headers,
        ...(options.signal ? { signal: options.signal } : {}),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new SZLApiError(`Stream request failed (${response.status}): ${text}`, response.status, 'STREAM_ERROR');
      }
      if (!response.body) {
        throw new SZLApiError('Stream response had no body', 500, 'STREAM_NO_BODY');
      }
      yield* parseSSE(response.body, options.signal);
    }

    if (!chain) {
      // Receipts disabled — return a degenerate stream whose closure is a
      // stub. Still yields chunks so callers don't lose data.
      const iter = (async function* () {
        for await (const frame of source()) {
          if (frame.event === 'chunk') yield JSON.parse(frame.data) as T;
        }
      })();
      const closure = Promise.resolve({
        closureTs: new Date().toISOString(),
        operatorId,
        chainLength: 0,
        firstReceiptHash: '0'.repeat(64),
        lastReceiptHash: '0'.repeat(64),
        merkleRoot: '0'.repeat(64),
        selfHash: '0'.repeat(64),
        streamId,
        firstSeq: -1,
        lastSeq: -1,
        reason: 'end' as const,
      });
      return Object.assign(iter, { closure });
    }

    return streamWithReceipts<T>({
      chain,
      operatorId,
      streamId,
      endpoint: path,
      method: method.toUpperCase(),
      params: { method, path, query: options.query ?? null },
      source: source(),
      parseChunk: (d) => JSON.parse(d) as T,
    });
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
              ...(options.gateDecision ? { gateDecision: options.gateDecision } : {}),
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
                ...(options.gateDecision ? { gateDecision: options.gateDecision } : {}),
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
