import { isProductionRuntime } from '@workspace/aef-contracts';
import type {
  EmbeddingBackend,
  EmbeddingBackendDescriptor,
  RawEmbedRequest,
  RawEmbedResponse,
} from './interface.js';

const SUBSTRATE_EMBED_URL = process.env.SUBSTRATE_EMBED_URL ?? 'http://localhost:9800';
const TENANT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,127}$/;
const DEVELOPMENT_MODEL = 'aef-dev-hash';
const DEVELOPMENT_DIMENSIONS = 384;
const NORMALIZED_VECTOR_TOLERANCE = 1e-6;

export interface CpuLocalEmbeddingBackendConfig {
  baseUrl?: string;
  apiKey?: string;
  tenantId?: string;
}

function firstConfigured(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    if (value !== undefined && value !== '') return value;
  }
  return undefined;
}

function isProductionEnvironment(): boolean {
  return isProductionRuntime(process.env, ['AEF_ENV', 'SUBSTRATE_PYTHON_WORKER_ENV']);
}

export class CpuLocalEmbeddingBackend implements EmbeddingBackend {
  readonly descriptor: EmbeddingBackendDescriptor = {
    backendId: 'cpu-local',
    displayName: 'CPU Local (substrate-py-workers)',
    kind: 'cpu-local',
    supportedModels: [DEVELOPMENT_MODEL],
    maxTokens: 512,
    defaultPooling: 'mean',
    defaultTruncation: 'truncate',
  };

  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly tenantId?: string;

  constructor(config?: string | CpuLocalEmbeddingBackendConfig) {
    const resolved = typeof config === 'string' ? { baseUrl: config } : (config ?? {});
    const parsedBaseUrl = new URL(resolved.baseUrl ?? SUBSTRATE_EMBED_URL);
    if (
      !['http:', 'https:'].includes(parsedBaseUrl.protocol) ||
      parsedBaseUrl.username ||
      parsedBaseUrl.password
    ) {
      throw new Error(
        'CpuLocalEmbeddingBackend: baseUrl must be an HTTP(S) origin without credentials',
      );
    }
    this.baseUrl = parsedBaseUrl.toString().replace(/\/$/, '');
    this.apiKey = firstConfigured(
      resolved.apiKey,
      process.env.SUBSTRATE_EMBED_API_KEY,
      process.env.SUBSTRATE_PYTHON_WORKER_API_KEY,
    );
    this.tenantId = firstConfigured(
      resolved.tenantId,
      process.env.SUBSTRATE_EMBED_TENANT_ID,
      process.env.SUBSTRATE_PYTHON_WORKER_TENANT_ID,
      isProductionEnvironment() ? undefined : 'local-development',
    );
  }

  async embed(req: RawEmbedRequest): Promise<RawEmbedResponse> {
    const start = Date.now();
    const url = `${this.baseUrl}/aef/embed`;
    if (req.model !== DEVELOPMENT_MODEL || req.pooling !== 'mean' || req.normalize !== true) {
      throw new Error(
        'CpuLocalEmbeddingBackend: only normalized mean-pooled aef-dev-hash requests are supported',
      );
    }
    if (
      !this.tenantId ||
      this.tenantId !== this.tenantId.trim() ||
      !TENANT_ID_PATTERN.test(this.tenantId)
    ) {
      throw new Error(
        'CpuLocalEmbeddingBackend: SUBSTRATE_EMBED_TENANT_ID must contain a valid tenant identity',
      );
    }
    if (this.apiKey !== undefined && this.apiKey !== this.apiKey.trim()) {
      throw new Error(
        'CpuLocalEmbeddingBackend: SUBSTRATE_EMBED_API_KEY must not contain surrounding whitespace',
      );
    }
    if (isProductionEnvironment() && !this.apiKey) {
      throw new Error(
        'CpuLocalEmbeddingBackend: SUBSTRATE_EMBED_API_KEY is required in production',
      );
    }
    if (isProductionEnvironment()) {
      throw new Error(
        'CpuLocalEmbeddingBackend: the development model is not admitted in production',
      );
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': this.tenantId,
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          texts: req.texts,
          model: req.model,
          pooling: req.pooling,
          normalize: req.normalize,
        }),
        redirect: 'error',
        signal: AbortSignal.timeout(120_000),
      });
    } catch (err) {
      throw new Error(`CpuLocalEmbeddingBackend: network error calling ${url}: ${String(err)}`);
    }

    if (!response.ok) {
      void response.body?.cancel().catch(() => undefined);
      throw new Error(`CpuLocalEmbeddingBackend: upstream returned HTTP ${response.status}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    if (
      data.model !== DEVELOPMENT_MODEL ||
      data.dimensions !== DEVELOPMENT_DIMENSIONS ||
      !Array.isArray(data.vectors) ||
      data.vectors.length !== req.texts.length ||
      data.vectors.some(
        (candidate) =>
          !Array.isArray(candidate) ||
          candidate.length !== DEVELOPMENT_DIMENSIONS ||
          candidate.some((value) => typeof value !== 'number' || !Number.isFinite(value)) ||
          Math.abs(
            Math.sqrt(candidate.reduce<number>((sum, value) => sum + Number(value) ** 2, 0)) - 1,
          ) > NORMALIZED_VECTOR_TOLERANCE,
      ) ||
      (data.token_counts !== undefined &&
        (!Array.isArray(data.token_counts) ||
          data.token_counts.length !== req.texts.length ||
          data.token_counts.some(
            (value) => typeof value !== 'number' || !Number.isInteger(value) || value < 0,
          )))
    ) {
      throw new Error('CpuLocalEmbeddingBackend: upstream returned an invalid model response');
    }

    const vectors = data.vectors as number[][];
    const tokenCounts = data.token_counts as number[] | undefined;

    return {
      vectors,
      model: DEVELOPMENT_MODEL,
      dimensions: DEVELOPMENT_DIMENSIONS,
      ...(tokenCounts !== undefined && { tokenCounts }),
      backendLatencyMs: Date.now() - start,
    };
  }

  async health(): Promise<{ healthy: boolean; latencyMs?: number; detail?: string }> {
    if (isProductionEnvironment()) {
      return {
        healthy: false,
        detail: 'development CPU embedding backend is held in production',
      };
    }
    const start = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
      return { healthy: res.ok, latencyMs: Date.now() - start };
    } catch (err) {
      return { healthy: false, detail: String(err) };
    }
  }
}
