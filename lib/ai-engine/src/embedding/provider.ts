import { embeddingAnalytics } from './analytics.js';
import { type EmbeddingDomain, getDomainModelConfig } from './domain-config.js';

export type EmbeddingProviderType =
  | 'huggingface'
  | 'openai-compatible'
  | 'replit-proxy'
  | 'local-sentence-transformers'
  | 'mock';

export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
  model: string;
  provider: EmbeddingProviderType;
  latencyMs: number;
  cached: boolean;
}

export interface BatchEmbeddingResult {
  results: Array<EmbeddingResult & { text: string; index: number; error?: string }>;
  totalLatencyMs: number;
  successCount: number;
  errorCount: number;
  provider: EmbeddingProviderType;
  model: string;
}

export interface EmbedOptions {
  domain?: EmbeddingDomain;
  model?: string;
  dimensions?: number;
}

export interface BatchEmbedOptions extends EmbedOptions {
  concurrency?: number;
  onProgress?: (completed: number, total: number) => void;
}

export interface ProviderHealth {
  available: boolean;
  latencyMs: number | null;
  errorRate: number;
  lastChecked: number;
  consecutiveFailures: number;
}

interface ProviderConfig {
  baseUrl: string;
  apiKey?: string;
  defaultModel: string;
  maxInputLength: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CACHE_SIZE = 2000;

interface CacheEntry {
  result: EmbeddingResult;
  expiry: number;
}

class EmbeddingCache {
  private cache = new Map<string, CacheEntry>();

  key(text: string, model: string): string {
    const h = text.slice(0, 200) + model;
    let hash = 0;
    for (let i = 0; i < h.length; i++) {
      hash = ((hash << 5) - hash + h.charCodeAt(i)) | 0;
    }
    return `${hash}-${text.length}`;
  }

  get(key: string): EmbeddingResult | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return { ...entry.result, cached: true };
  }

  set(key: string, result: EmbeddingResult): void {
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { result, expiry: Date.now() + CACHE_TTL_MS });
  }

  get size(): number {
    return this.cache.size;
  }
}

const PROVIDER_RECOVERY_COOLDOWN_MS = 60 * 1000;

abstract class BaseEmbeddingProvider {
  abstract readonly type: EmbeddingProviderType;
  protected health: ProviderHealth = {
    available: true,
    latencyMs: null,
    errorRate: 0,
    lastChecked: 0,
    consecutiveFailures: 0,
  };
  private _totalCalls = 0;
  private _errorCalls = 0;

  getHealth(): ProviderHealth {
    if (!this.health.available && this.health.lastChecked > 0) {
      const timeSinceLastCheck = Date.now() - this.health.lastChecked;
      if (timeSinceLastCheck >= PROVIDER_RECOVERY_COOLDOWN_MS) {
        this.health.available = true;
        this.health.consecutiveFailures = 0;
      }
    }
    return { ...this.health };
  }

  protected recordSuccess(latencyMs: number): void {
    this._totalCalls++;
    this.health.available = true;
    this.health.latencyMs = latencyMs;
    this.health.lastChecked = Date.now();
    this.health.consecutiveFailures = 0;
    this.health.errorRate = this._totalCalls > 0 ? this._errorCalls / this._totalCalls : 0;
  }

  protected recordFailure(): void {
    this._totalCalls++;
    this._errorCalls++;
    this.health.consecutiveFailures++;
    this.health.errorRate = this._totalCalls > 0 ? this._errorCalls / this._totalCalls : 0;
    if (this.health.consecutiveFailures >= 3) {
      this.health.available = false;
    }
    this.health.lastChecked = Date.now();
  }

  abstract embed(text: string, model?: string): Promise<number[]>;
}

class HuggingFaceEmbeddingProvider extends BaseEmbeddingProvider {
  readonly type: EmbeddingProviderType = 'huggingface';
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;

  constructor() {
    super();
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.baseUrl = process.env.HF_INFERENCE_URL || 'https://api-inference.huggingface.co/models';
  }

  async embed(text: string, model?: string): Promise<number[]> {
    const targetModel = model || process.env.HF_EMBED_MODEL || 'BAAI/bge-m3';
    const start = Date.now();

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${this.baseUrl}/${targetModel}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ inputs: text.slice(0, 8000) }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as unknown;
      let vector: number[];
      if (Array.isArray(data) && Array.isArray((data as unknown[][])[0])) {
        vector = (data as number[][])[0]!;
      } else if (Array.isArray(data) && typeof (data as unknown[])[0] === 'number') {
        vector = data as number[];
      } else {
        throw new Error('Unexpected HuggingFace embedding response format');
      }

      this.recordSuccess(Date.now() - start);
      return vector;
    } catch (err) {
      this.recordFailure();
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}

class OpenAICompatibleEmbeddingProvider extends BaseEmbeddingProvider {
  readonly type: EmbeddingProviderType = 'openai-compatible';
  private readonly config: ProviderConfig;

  constructor() {
    super();
    const _apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    this.config = {
      baseUrl: process.env.OPENAI_EMBED_BASE_URL || process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'https://api.openai.com/v1',
      ...(_apiKey !== undefined ? { apiKey: _apiKey } : {}),
      defaultModel: process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small',
      maxInputLength: 8000,
    };
    if (!this.config.apiKey) {
      this.health.available = false;
    }
  }

  async embed(text: string, model?: string): Promise<number[]> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const targetModel = model || this.config.defaultModel;
    const start = Date.now();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${this.config.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: targetModel,
          input: text.slice(0, this.config.maxInputLength),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as { data?: Array<{ embedding: number[] }> };
      const vector = data.data?.[0]?.embedding;
      if (!vector) throw new Error('No embedding in OpenAI response');

      this.recordSuccess(Date.now() - start);
      return vector;
    } catch (err) {
      this.recordFailure();
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}

class LocalSentenceTransformersEmbeddingProvider extends BaseEmbeddingProvider {
  readonly type: EmbeddingProviderType = 'local-sentence-transformers';
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor() {
    super();
    this.baseUrl = process.env.LOCAL_EMBED_URL || 'http://localhost:8765';
    this.defaultModel =
      process.env.LOCAL_EMBED_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';
    if (!process.env.LOCAL_EMBED_URL) {
      this.health.available = false;
    }
  }

  async embed(text: string, model?: string): Promise<number[]> {
    const targetModel = model || this.defaultModel;
    const start = Date.now();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: targetModel,
          input: text.slice(0, 8000),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Local sentence-transformers error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as
        | { data?: Array<{ embedding: number[] }> }
        | { embedding?: number[] }
        | number[];

      let vector: number[];
      if (Array.isArray(data)) {
        vector = data as number[];
      } else if ('data' in data && Array.isArray(data.data) && data.data[0]?.embedding) {
        vector = data.data[0].embedding;
      } else if ('embedding' in data && Array.isArray(data.embedding)) {
        vector = data.embedding as number[];
      } else {
        throw new Error('Unexpected local sentence-transformers response format');
      }

      this.recordSuccess(Date.now() - start);
      return vector;
    } catch (err) {
      this.recordFailure();
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}

class ReplitAIProxyEmbeddingProvider extends BaseEmbeddingProvider {
  readonly type: EmbeddingProviderType = 'replit-proxy';
  private readonly defaultModel: string;

  constructor() {
    super();
    this.defaultModel = process.env.REPLIT_EMBED_MODEL || 'text-embedding-3-small';
  }

  async embed(text: string, model?: string): Promise<number[]> {
    const targetModel = model || this.defaultModel;
    const start = Date.now();

    try {
      const { openai } = await import('../providers/openai/index.js');
      const response = await openai.embeddings.create({
        model: targetModel,
        input: text.slice(0, 8000),
      });
      const vector = response.data[0]?.embedding;
      if (!vector) throw new Error('No embedding in Replit proxy response');

      this.recordSuccess(Date.now() - start);
      return vector;
    } catch (err) {
      this.recordFailure();
      throw err;
    }
  }
}

class MockEmbeddingProvider extends BaseEmbeddingProvider {
  readonly type: EmbeddingProviderType = 'mock';

  async embed(_text: string, _model?: string): Promise<number[]> {
    const dim = 384;
    const vec = Array.from({ length: dim }, () => (Math.random() - 0.5) * 2);
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    return vec.map((v) => v / norm);
  }
}

export class EmbeddingPipeline {
  private readonly providers: BaseEmbeddingProvider[];
  private readonly cache = new EmbeddingCache();

  constructor() {
    this.providers = [
      new ReplitAIProxyEmbeddingProvider(),
      new HuggingFaceEmbeddingProvider(),
      new OpenAICompatibleEmbeddingProvider(),
      new LocalSentenceTransformersEmbeddingProvider(),
      new MockEmbeddingProvider(),
    ];

    const order = (process.env.EMBEDDING_PROVIDER_ORDER || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (order.length > 0) {
      const sorted: BaseEmbeddingProvider[] = [];
      for (const name of order) {
        const p = this.providers.find((p) => p.type === name);
        if (p) sorted.push(p);
      }
      for (const p of this.providers) {
        if (!sorted.includes(p)) sorted.push(p);
      }
      this.providers.splice(0, this.providers.length, ...sorted);
    }
  }

  async embed(text: string, options: EmbedOptions = {}): Promise<EmbeddingResult> {
    const domainConfig = options.domain ? getDomainModelConfig(options.domain) : null;
    const preferredProvider = domainConfig?.preferredProvider;

    const orderedProviders = preferredProvider
      ? [
          ...this.providers.filter((p) => p.type === preferredProvider),
          ...this.providers.filter((p) => p.type !== preferredProvider),
        ]
      : this.providers;

    const canonicalModel = options.model || domainConfig?.model || 'text-embedding-3-small';
    const cacheKey = this.cache.key(text, canonicalModel + (options.domain || ''));
    const cached = this.cache.get(cacheKey);
    if (cached) {
      embeddingAnalytics.recordCacheHit(cached.provider, canonicalModel);
      return cached;
    }

    const expectedDimensions = domainConfig?.dimensions ?? null;

    for (const provider of orderedProviders) {
      if (!provider.getHealth().available && provider.type !== 'mock') continue;

      const start = Date.now();
      try {
        const isHfLike =
          provider.type === 'huggingface' || provider.type === 'local-sentence-transformers';
        const modelForProvider = options.model
          ? options.model
          : isHfLike
            ? domainConfig?.hfModel || process.env.HF_EMBED_MODEL || 'BAAI/bge-m3'
            : domainConfig?.model || 'text-embedding-3-small';

        const vector = await provider.embed(text, modelForProvider);
        const latencyMs = Date.now() - start;

        if (expectedDimensions !== null && vector.length !== expectedDimensions) {
        }

        const result: EmbeddingResult = {
          embedding: vector,
          dimensions: vector.length,
          model: modelForProvider,
          provider: provider.type,
          latencyMs,
          cached: false,
        };

        this.cache.set(cacheKey, result);
        embeddingAnalytics.recordEmbedding(
          provider.type,
          modelForProvider,
          latencyMs,
          true,
          options.domain,
        );
        return result;
      } catch (_err) {
        embeddingAnalytics.recordEmbedding(
          provider.type,
          canonicalModel,
          Date.now() - start,
          false,
          options.domain,
        );
      }
    }

    throw new Error('[embedding-pipeline] All embedding providers failed');
  }

  async embedBatch(
    texts: string[],
    options: BatchEmbedOptions = {},
  ): Promise<BatchEmbeddingResult> {
    const rawConcurrency = options.concurrency ?? 5;
    const concurrency = Math.max(
      1,
      Math.min(
        50,
        Number.isFinite(rawConcurrency) && rawConcurrency > 0 ? Math.floor(rawConcurrency) : 5,
      ),
    );
    const totalStart = Date.now();
    const results: BatchEmbeddingResult['results'] = new Array(texts.length);
    let successCount = 0;
    let errorCount = 0;
    let lastProvider: EmbeddingProviderType = 'mock';
    let lastModel = 'unknown';

    const queue = texts.map((text, index) => ({ text, index }));
    let completed = 0;

    const processBatch = async (items: Array<{ text: string; index: number }>) => {
      await Promise.all(
        items.map(async ({ text, index }) => {
          try {
            const result = await this.embed(text, options);
            results[index] = { ...result, text, index };
            successCount++;
            lastProvider = result.provider;
            lastModel = result.model;
          } catch (err) {
            const mockDim = 384;
            const mockVec = Array.from({ length: mockDim }, () => 0);
            results[index] = {
              embedding: mockVec,
              dimensions: mockDim,
              model: 'error-fallback',
              provider: 'mock',
              latencyMs: 0,
              cached: false,
              text,
              index,
              error: err instanceof Error ? err.message : String(err),
            };
            errorCount++;
          } finally {
            completed++;
            options.onProgress?.(completed, texts.length);
          }
        }),
      );
    };

    for (let i = 0; i < queue.length; i += concurrency) {
      await processBatch(queue.slice(i, i + concurrency));
    }

    return {
      results,
      totalLatencyMs: Date.now() - totalStart,
      successCount,
      errorCount,
      provider: lastProvider,
      model: lastModel,
    };
  }

  getProviderHealth(): Record<EmbeddingProviderType, ProviderHealth> {
    const health: Partial<Record<EmbeddingProviderType, ProviderHealth>> = {};
    for (const provider of this.providers) {
      health[provider.type] = provider.getHealth();
    }
    return health as Record<EmbeddingProviderType, ProviderHealth>;
  }

  getCacheStats() {
    return embeddingAnalytics.getCacheStats();
  }
}

export const embeddingPipeline = new EmbeddingPipeline();

export async function getEmbedding(text: string, options?: EmbedOptions): Promise<number[] | null> {
  try {
    const result = await embeddingPipeline.embed(text, options);
    return result.embedding;
  } catch {
    return null;
  }
}
