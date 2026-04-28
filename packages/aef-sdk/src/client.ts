import { type EmbedRequest, type EmbedResponse, type HybridSearchRequest, type HybridSearchResponse, type IngestRequest, type IngestResponse, type RerankRequest, type RerankResponse, EmbedResponseSchema, HybridSearchResponseSchema, IngestResponseSchema, RerankResponseSchema } from '@workspace/cf-contracts';
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

export class AefClient {
  private readonly config: Required<AefClientConfig>;

  constructor(configOverrides: Partial<AefClientConfig> = {}) {
    this.config = resolveConfig(configOverrides) as Required<AefClientConfig>;
  }

  private buildHeaders(traceId?: string): Record<string, string> {
    return {
      'content-type': 'application/json',
      authorization: `Bearer ${this.config.apiKey}`,
      'x-tenant-id': this.config.tenantId,
      [this.config.traceHeaderName]: traceId ?? generateId(),
    };
  }

  private async fetchAef<T>(endpoint: string, body: unknown, traceId?: string): Promise<T> {
    const url = `${this.config.gatewayUrl}${endpoint}`;
    const headers = this.buildHeaders(traceId);
    const timeoutMs = this.config.timeoutMs;

    let lastError: unknown;
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

        return (await response.json()) as T;
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

  async hybridSearch(
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

export function createAefClient(config: Partial<AefClientConfig>): AefClient {
  return new AefClient(config);
}
