import { type EmbedRequest, type EmbedResponse, type HybridSearchRequest, type HybridSearchResponse, type IngestRequest, type IngestResponse, type RerankRequest, type RerankResponse, EmbedResponseSchema, HybridSearchResponseSchema, IngestResponseSchema, RerankResponseSchema } from '@workspace/aef-contracts';
// NOTE: `@szl-holdings/szl-receipts` is a workspace package. Its `exports.import`
// condition resolves directly to `src/index.ts` (see packages/szl-receipts/package.json),
// so consumers in the workspace do NOT need a built `dist/` to load it. If you change
// that package's exports back to `dist/index.js`, every consumer (including this file)
// will fail with a cryptic `ERR_MODULE_NOT_FOUND` until you run `pnpm --filter
// @szl-holdings/szl-receipts build`. Keep it pointed at source.
import {
  ReceiptChain,
  hashJson,
  parseSSE,
  streamWithReceipts,
  type AuditClosureReceipt,
  type LambdaReceipt,
  type ReceiptStorage,
  type ReceiptedStream,
} from '@szl-holdings/szl-receipts';
import { type AefClientConfig, resolveConfig } from './config.js';
import {
  AefAuthError,
  AefError,
  AefPolicyError,
  AefRateLimitError,
  AefTimeoutError,
  AefUnavailableError,
} from './errors.js';
import { generateId } from './uuid.js';

type WithDefaults<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface AefReceiptsConfig {
  enabled: boolean;
  operatorId: string;
  /**
   * Optional persistent storage. Construct file-backed storage from
   * `@workspace/aef-sdk/node-storage` in Node-only entry points.
   */
  storage?: ReceiptStorage;
  /**
   * @deprecated File-backed storage is no longer auto-constructed inside
   * the client (to keep browser bundles free of `node:fs`). Pass a
   * `JsonlFileStorage(path)` via `storage` instead. This field is now
   * ignored.
   */
  storagePath?: string;
  /**
   * Invoked when a receipt append fails. Receipt errors never block the
   * primary API call, but they are surfaced here so operators can detect
   * audit gaps. Defaults to `console.warn`.
   */
  onError?: (err: unknown, context: { endpoint: string }) => void;
}

export interface AefReceiptsHandle {
  readonly enabled: boolean;
  merkleRoot(): Promise<string>;
  readAll(): Promise<LambdaReceipt[]>;
  close(): Promise<AuditClosureReceipt>;
}

// File-backed JSONL storage now lives in `./node-storage.ts` so that
// browser bundles don't pull in `node:fs` / `node:path`. Callers that
// previously used `receipts: { storagePath }` should construct a storage
// instance themselves and pass it via `receipts: { storage }`:
//
//   import { JsonlFileStorage } from '@workspace/aef-sdk/node-storage';
//   new AefClient({ receipts: { enabled: true, operatorId,
//     storage: new JsonlFileStorage('/var/log/aef-receipts.jsonl') } });

class DisabledReceipts implements AefReceiptsHandle {
  readonly enabled = false;
  async merkleRoot(): Promise<string> {
    throw new Error('AefClient: receipts are disabled. Pass { receipts: { enabled: true, operatorId } } to enable.');
  }
  async readAll(): Promise<LambdaReceipt[]> { return []; }
  async close(): Promise<AuditClosureReceipt> {
    throw new Error('AefClient: receipts are disabled. Pass { receipts: { enabled: true, operatorId } } to enable.');
  }
}

class EnabledReceipts implements AefReceiptsHandle {
  readonly enabled = true;
  constructor(public readonly chain: ReceiptChain) {}
  merkleRoot(): Promise<string> { return this.chain.merkleRoot(); }
  readAll(): Promise<LambdaReceipt[]> { return this.chain.readAll(); }
  close(): Promise<AuditClosureReceipt> { return this.chain.close(); }
}

export interface AefClientConfigWithReceipts extends AefClientConfig {
  receipts?: AefReceiptsConfig;
}

/**
 * Callable hybrid-search namespace. `client.hybridSearch(req)` runs a one-
 * shot query; `client.hybridSearch.stream(req)` opens an SSE stream where
 * each chunk is recorded as its own LambdaReceipt and the closure is folded
 * via a StreamClosureReceipt. Same call surface across both modes.
 */
export interface HybridSearchNamespace {
  (
    request: WithDefaults<
      Omit<HybridSearchRequest, 'requestId' | 'tenantId'>,
      | 'topK'
      | 'candidatePool'
      | 'denseWeight'
      | 'keywordWeight'
      | 'rerankEnabled'
      | 'includeProvenance'
      | 'metadata'
    > & { requestId?: string },
  ): Promise<HybridSearchResponse>;
  stream(
    request: WithDefaults<
      Omit<HybridSearchRequest, 'requestId' | 'tenantId'>,
      | 'topK'
      | 'candidatePool'
      | 'denseWeight'
      | 'keywordWeight'
      | 'rerankEnabled'
      | 'includeProvenance'
      | 'metadata'
    > & { requestId?: string; streamId?: string; signal?: AbortSignal },
  ): ReceiptedStream<unknown>;
}

export class AefClient {
  private readonly config: Required<AefClientConfig>;
  readonly receipts: AefReceiptsHandle;
  private readonly chain?: ReceiptChain;
  private readonly receiptsOperatorId?: string;
  private readonly onReceiptError: (err: unknown, ctx: { endpoint: string }) => void;
  /**
   * Hybrid-search entry point — callable for one-shot queries and exposes
   * `.stream(...)` for SSE streaming with per-chunk verifiable receipts.
   */
  readonly hybridSearch: HybridSearchNamespace;

  constructor(configOverrides: Partial<AefClientConfigWithReceipts> = {}) {
    const { receipts, ...rest } = configOverrides;
    this.config = resolveConfig(rest) as Required<AefClientConfig>;
    if (receipts?.enabled) {
      if (!receipts.operatorId) {
        throw new Error('AefClient: receipts.operatorId is required when receipts.enabled is true');
      }
      if (receipts.storagePath && !receipts.storage) {
        console.warn(
          '[aef-sdk] receipts.storagePath is deprecated and ignored — pass a '
            + "`storage` instance from '@workspace/aef-sdk/node-storage' instead.",
        );
      }
      this.chain = new ReceiptChain({
        operatorId: receipts.operatorId,
        ...(receipts.storage ? { storage: receipts.storage } : {}),
      });
      this.receiptsOperatorId = receipts.operatorId;
      this.receipts = new EnabledReceipts(this.chain);
      this.onReceiptError =
        receipts.onError ??
        ((err, ctx) => {
          console.warn(`[aef-sdk] receipt append failed for ${ctx.endpoint}:`, err);
        });
    } else {
      this.receipts = new DisabledReceipts();
      this.onReceiptError = () => {};
    }
    // Build the callable namespace once, so `client.hybridSearch(req)` and
    // `client.hybridSearch.stream(req)` share `this` and the same chain.
    const call = (req: Parameters<HybridSearchNamespace>[0]) => this.hybridSearchCall(req);
    this.hybridSearch = Object.assign(call, {
      stream: (req: Parameters<HybridSearchNamespace['stream']>[0]) => this.hybridSearchStream(req),
    }) as HybridSearchNamespace;
  }

  private buildHeaders(traceId: string | undefined, idempotencyKey: string): Record<string, string> {
    return {
      'content-type': 'application/json',
      authorization: `Bearer ${this.config.apiKey}`,
      'x-tenant-id': this.config.tenantId,
      'idempotency-key': idempotencyKey,
      [this.config.traceHeaderName]: traceId ?? generateId(),
    };
  }

  private async fetchAef<T>(endpoint: string, body: unknown, traceId?: string): Promise<T> {
    const url = `${this.config.gatewayUrl}${endpoint}`;
    const paramsHash = hashJson(body);
    const headers = this.buildHeaders(traceId, paramsHash);
    const timeoutMs = this.config.timeoutMs;

    let lastError: unknown;
    let lastStatus = 0;
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      if (attempt > 0) {
        await sleep(this.config.retryDelayMs * 2 ** (attempt - 1));
      }

      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await globalThis.fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        lastStatus = response.status;

        if (response.status === 401) {
          throw new AefAuthError();
        }
        if (response.status === 403) {
          const text = await response.text().catch(() => '');
          throw new AefPolicyError(text || 'access denied');
        }
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          throw new AefRateLimitError(retryAfter ? Number(retryAfter) * 1000 : undefined);
        }
        if (!response.ok) {
          const text = await response.text().catch(() => 'unknown error');
          const retryable = response.status >= 500;
          lastError = new AefError(
            `AEF gateway returned HTTP ${response.status}: ${text}`,
            'AEF_HTTP_ERROR',
            response.status,
            retryable,
          );
          if (retryable && attempt < this.config.maxRetries) continue;
          throw lastError;
        }

        const json = (await response.json()) as T;
        await this.recordReceipt(endpoint, body, paramsHash, lastStatus, json);
        return json;
      } catch (err) {
        if (
          err instanceof AefAuthError ||
          err instanceof AefPolicyError ||
          err instanceof AefRateLimitError
        ) {
          throw err;
        }
        if (err instanceof AefError && !err.retryable) {
          throw err;
        }
        if ((err as Error).name === 'AbortError') {
          throw new AefTimeoutError(endpoint, timeoutMs);
        }
        if (attempt < this.config.maxRetries) {
          lastError = err;
          continue;
        }
        if (this.isNetworkError(err)) {
          throw new AefUnavailableError(this.config.gatewayUrl, err);
        }
        throw err;
      } finally {
        clearTimeout(timeoutHandle);
      }
    }

    if (this.isNetworkError(lastError)) {
      throw new AefUnavailableError(this.config.gatewayUrl, lastError);
    }
    throw lastError;
  }

  private async recordReceipt(
    endpoint: string,
    body: unknown,
    paramsHash: string,
    status: number,
    result: unknown,
  ): Promise<void> {
    if (!this.chain) return;
    try {
      await this.chain.append({
        endpoint,
        method: 'POST',
        params: body,
        result,
        metadata: { status, idempotencyKey: paramsHash, tenantId: this.config.tenantId },
      });
    } catch (err) {
      // Audit gap is surfaced via onReceiptError; never breaks the call path.
      this.onReceiptError(err, { endpoint });
    }
  }

  private isNetworkError(err: unknown): boolean {
    if (!(err instanceof Error)) return false;
    return (
      err.name === 'TypeError' ||
      err.message.includes('ECONNREFUSED') ||
      err.message.includes('ENOTFOUND') ||
      err.message.includes('fetch failed') ||
      err.message.toLowerCase().includes('network')
    );
  }

  async embed(
    request: WithDefaults<
      Omit<EmbedRequest, 'requestId' | 'tenantId'>,
      'normalize' | 'metadata'
    > & { requestId?: string },
  ): Promise<EmbedResponse> {
    const body: EmbedRequest = {
      normalize: true,
      metadata: {},
      ...request,
      requestId: request.requestId ?? generateId(),
      tenantId: this.config.tenantId as EmbedRequest['tenantId'],
    };
    const raw = await this.fetchAef<unknown>('/v1/embed', body, body.requestId);
    return EmbedResponseSchema.parse(raw);
  }

  async rerank(
    request: WithDefaults<Omit<RerankRequest, 'requestId' | 'tenantId'>, 'topK' | 'metadata'> & {
      requestId?: string;
    },
  ): Promise<RerankResponse> {
    const body: RerankRequest = {
      topK: 10,
      metadata: {},
      ...request,
      requestId: request.requestId ?? generateId(),
      tenantId: this.config.tenantId as RerankRequest['tenantId'],
    };
    const raw = await this.fetchAef<unknown>('/v1/rerank', body, body.requestId);
    return RerankResponseSchema.parse(raw);
  }

  /**
   * Stream a hybrid-search query as it scores candidates. Each chunk is
   * recorded as its own `LambdaReceipt` (paramsHash = sha256 of the chunk's
   * raw bytes); the returned `closure` promise resolves with a folded
   * `StreamClosureReceipt`.
   *
   * Expected wire format: `event: chunk\ndata: <json>\n\n` per result with
   * an optional `event: end` terminator. Mid-stream abort (consumer break)
   * yields a closure with `reason: 'abort'`. Receipts are appended through
   * the same chain as non-streaming calls, so `client.receipts.readAll()`
   * returns both kinds in seq order.
   */
  private hybridSearchStream(
    request: WithDefaults<
      Omit<HybridSearchRequest, 'requestId' | 'tenantId'>,
      | 'topK'
      | 'candidatePool'
      | 'denseWeight'
      | 'keywordWeight'
      | 'rerankEnabled'
      | 'includeProvenance'
      | 'metadata'
    > & { requestId?: string; streamId?: string; signal?: AbortSignal },
  ): ReceiptedStream<unknown> {
    const body: HybridSearchRequest = {
      topK: 10,
      candidatePool: 100,
      denseWeight: 0.6,
      keywordWeight: 0.4,
      rerankEnabled: false,
      includeProvenance: true,
      metadata: {},
      ...request,
      requestId: request.requestId ?? generateId(),
      tenantId: this.config.tenantId as HybridSearchRequest['tenantId'],
    };
    return this.streamAef('/v1/hybrid-search/stream', body, {
      streamId: request.streamId,
      signal: request.signal,
    });
  }

  /**
   * Internal: open an SSE connection to `endpoint` with the given body and
   * wire it through the shared per-chunk receipt primitive. Returns the
   * streaming iterable plus a `closure` promise. Falls back to a stub
   * closure when receipts are disabled, so callers can use the same code
   * path in both modes.
   */
  private streamAef<T>(
    endpoint: string,
    body: unknown,
    options: { streamId?: string; signal?: AbortSignal } = {},
  ): ReceiptedStream<T> {
    const url = `${this.config.gatewayUrl}${endpoint}`;
    const paramsHash = hashJson(body);
    const streamId = options.streamId ?? `aef-stream-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const headers: Record<string, string> = {
      ...this.buildHeaders(undefined, paramsHash),
      accept: 'text/event-stream',
    };
    const chain = this.chain;
    const operatorIdLocal = this.receiptsOperatorId ?? 'anonymous';

    async function* source(): AsyncGenerator<{ event: string; data: string; rawBytes: Uint8Array }, void, void> {
      const response = await globalThis.fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        ...(options.signal ? { signal: options.signal } : {}),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new AefError(
          `AEF gateway stream returned HTTP ${response.status}: ${text}`,
          'AEF_STREAM_ERROR',
          response.status,
          false,
        );
      }
      if (!response.body) {
        throw new AefError('AEF gateway stream had no body', 'AEF_STREAM_NO_BODY', 500, false);
      }
      yield* parseSSE(response.body, options.signal);
    }

    if (!chain) {
      const iter = (async function* () {
        for await (const frame of source()) {
          if (frame.event === 'chunk') yield JSON.parse(frame.data) as T;
        }
      })();
      const closure = Promise.resolve({
        closureTs: new Date().toISOString(),
        operatorId: operatorIdLocal,
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
      operatorId: operatorIdLocal,
      streamId,
      endpoint,
      method: 'POST',
      params: body,
      source: source(),
      parseChunk: (d) => JSON.parse(d) as T,
    });
  }

  private async hybridSearchCall(
    request: WithDefaults<
      Omit<HybridSearchRequest, 'requestId' | 'tenantId'>,
      | 'topK'
      | 'candidatePool'
      | 'denseWeight'
      | 'keywordWeight'
      | 'rerankEnabled'
      | 'includeProvenance'
      | 'metadata'
    > & { requestId?: string },
  ): Promise<HybridSearchResponse> {
    const body: HybridSearchRequest = {
      topK: 10,
      candidatePool: 100,
      denseWeight: 0.6,
      keywordWeight: 0.4,
      rerankEnabled: false,
      includeProvenance: true,
      metadata: {},
      ...request,
      requestId: request.requestId ?? generateId(),
      tenantId: this.config.tenantId as HybridSearchRequest['tenantId'],
    };
    const raw = await this.fetchAef<unknown>('/v1/hybrid-search', body, body.requestId);
    return HybridSearchResponseSchema.parse(raw);
  }

  async ingest(
    request: WithDefaults<
      Omit<IngestRequest, 'requestId' | 'tenantId'>,
      'chunkSize' | 'chunkOverlap' | 'metadata'
    > & { requestId?: string },
  ): Promise<IngestResponse> {
    const body: IngestRequest = {
      chunkSize: 512,
      chunkOverlap: 64,
      metadata: {},
      ...request,
      requestId: request.requestId ?? generateId(),
      tenantId: this.config.tenantId as IngestRequest['tenantId'],
    };
    const raw = await this.fetchAef<unknown>('/v1/ingest', body, body.requestId);
    return IngestResponseSchema.parse(raw);
  }
}

let _defaultClient: AefClient | null = null;

export function getDefaultClient(): AefClient {
  if (!_defaultClient) {
    _defaultClient = new AefClient();
  }
  return _defaultClient;
}

export function createAefClient(config: Partial<AefClientConfigWithReceipts>): AefClient {
  return new AefClient(config);
}
