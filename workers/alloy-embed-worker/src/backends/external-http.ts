import { z } from 'zod';
import type { PromotionState } from '@workspace/aef-contracts';
import { readBoundedJson, sanitizedTransportMessage, UpstreamProtocolError } from '../http-json.js';
import type {
  EmbeddingBackend,
  EmbeddingBackendDescriptor,
  RawEmbedRequest,
  RawEmbedResponse,
} from './interface.js';

const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/i);
const UpstreamEmbedResponseSchema = z.object({
  vectors: z.array(z.array(z.number().refine(Number.isFinite))),
  model: z.string().min(1),
  dimensions: z.number().int().positive(),
  token_counts: z.array(z.number().int().nonnegative()).optional(),
  model_revision: z.string().min(1).optional(),
  artifact_set_digest: Sha256Schema.optional(),
  processor_revision: z.string().min(1).optional(),
  runtime_id: z.string().min(1).optional(),
  runtime_version: z.string().min(1).optional(),
  normalized: z.boolean().optional(),
  promotion_state: z
    .enum(['DEVELOPMENT', 'EVALUATION_HOLD', 'QUALIFIED', 'REVOKED'])
    .optional(),
});

export interface ExternalHttpBackendConfig {
  backendId: string;
  displayName: string;
  baseUrl: string;
  embedPath?: string;
  healthPath?: string;
  apiKey?: string;
  model: string;
  modelRevision?: string;
  artifactSetDigest?: string;
  promotionState?: PromotionState;
  dimensions: number;
  maxTokens: number;
  timeoutMs?: number;
  maxResponseBytes?: number;
}

type ResolvedConfig = ExternalHttpBackendConfig & {
  embedPath: string;
  healthPath: string;
  apiKey: string;
  modelRevision: string;
  artifactSetDigest: string;
  promotionState: PromotionState;
  timeoutMs: number;
  maxResponseBytes: number;
};

export class ExternalHttpEmbeddingBackend implements EmbeddingBackend {
  readonly descriptor: EmbeddingBackendDescriptor;
  private readonly cfg: ResolvedConfig;

  constructor(config: ExternalHttpBackendConfig) {
    const baseUrl = new URL(config.baseUrl);
    if (!['http:', 'https:'].includes(baseUrl.protocol) || baseUrl.username || baseUrl.password) {
      throw new Error('External embedding baseUrl must be an HTTP(S) origin without credentials');
    }

    this.cfg = {
      embedPath: '/embed',
      healthPath: '/health',
      apiKey: '',
      modelRevision: '',
      artifactSetDigest: '',
      promotionState: 'DEVELOPMENT',
      timeoutMs: 120_000,
      maxResponseBytes: 32 * 1024 * 1024,
      ...config,
      baseUrl: baseUrl.toString().replace(/\/$/, ''),
    };
    this.descriptor = {
      backendId: config.backendId,
      displayName: config.displayName,
      kind: 'external-http',
      supportedModels: [config.model],
      maxTokens: config.maxTokens,
      defaultPooling: 'mean',
      defaultTruncation: 'reject',
      ...(config.modelRevision ? { modelRevision: config.modelRevision } : {}),
      ...(config.artifactSetDigest ? { artifactSetDigest: config.artifactSetDigest } : {}),
      promotionState: config.promotionState ?? 'DEVELOPMENT',
      supportedModalities: ['text'],
    };
  }

  async embed(req: RawEmbedRequest): Promise<RawEmbedResponse> {
    const start = Date.now();
    if (req.model !== this.cfg.model) {
      throw new UpstreamProtocolError(
        'MODEL_ID_MISMATCH',
        `Requested model '${req.model}' is not admitted by backend '${this.cfg.backendId}'`,
      );
    }

    const url = `${this.cfg.baseUrl}${this.cfg.embedPath}`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.cfg.apiKey) headers.Authorization = `Bearer ${this.cfg.apiKey}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        signal: AbortSignal.timeout(this.cfg.timeoutMs),
        body: JSON.stringify({
          texts: req.texts,
          model: req.model,
          pooling: req.pooling,
          normalize: req.normalize,
        }),
      });
    } catch (error) {
      throw new UpstreamProtocolError(
        sanitizedTransportMessage(error),
        `Embedding backend '${this.cfg.backendId}' was unreachable`,
      );
    }

    if (!response.ok) {
      void response.body?.cancel().catch(() => undefined);
      throw new UpstreamProtocolError(
        'UPSTREAM_HTTP_ERROR',
        `Embedding backend '${this.cfg.backendId}' returned HTTP ${response.status}`,
        response.status,
      );
    }

    const parsed = UpstreamEmbedResponseSchema.safeParse(
      await readBoundedJson(response, this.cfg.maxResponseBytes),
    );
    if (!parsed.success) {
      throw new UpstreamProtocolError(
        'UPSTREAM_SCHEMA_MISMATCH',
        `Embedding backend '${this.cfg.backendId}' returned an invalid response`,
        response.status,
      );
    }

    const data = parsed.data;
    if (data.model !== this.cfg.model || data.dimensions !== this.cfg.dimensions) {
      throw new UpstreamProtocolError(
        'UPSTREAM_IDENTITY_MISMATCH',
        `Embedding backend '${this.cfg.backendId}' returned unexpected model identity`,
        response.status,
      );
    }
    if (this.cfg.modelRevision && data.model_revision !== this.cfg.modelRevision) {
      throw new UpstreamProtocolError(
        'UPSTREAM_REVISION_MISMATCH',
        `Embedding backend '${this.cfg.backendId}' did not prove the admitted model revision`,
        response.status,
      );
    }
    if (this.cfg.artifactSetDigest && data.artifact_set_digest !== this.cfg.artifactSetDigest) {
      throw new UpstreamProtocolError(
        'UPSTREAM_ARTIFACT_MISMATCH',
        `Embedding backend '${this.cfg.backendId}' did not prove the admitted artifact set`,
        response.status,
      );
    }
    if (data.vectors.length !== req.texts.length) {
      throw new UpstreamProtocolError(
        'UPSTREAM_CARDINALITY_MISMATCH',
        `Embedding backend '${this.cfg.backendId}' returned the wrong vector count`,
        response.status,
      );
    }
    if (data.vectors.some((vector) => vector.length !== this.cfg.dimensions)) {
      throw new UpstreamProtocolError(
        'UPSTREAM_DIMENSION_MISMATCH',
        `Embedding backend '${this.cfg.backendId}' returned an invalid vector width`,
        response.status,
      );
    }
    if (data.token_counts && data.token_counts.length !== req.texts.length) {
      throw new UpstreamProtocolError(
        'UPSTREAM_TOKEN_COUNT_MISMATCH',
        `Embedding backend '${this.cfg.backendId}' returned invalid token counts`,
        response.status,
      );
    }
    if (req.normalize && data.normalized === false) {
      throw new UpstreamProtocolError(
        'UPSTREAM_NORMALIZATION_MISMATCH',
        `Embedding backend '${this.cfg.backendId}' returned unnormalized vectors`,
        response.status,
      );
    }

    const promotionState = data.promotion_state ?? this.cfg.promotionState;
    return {
      vectors: data.vectors,
      model: data.model,
      dimensions: data.dimensions,
      ...(data.token_counts !== undefined && { tokenCounts: data.token_counts }),
      backendLatencyMs: Date.now() - start,
      execution: {
        backendId: this.cfg.backendId,
        modelId: data.model,
        ...(data.model_revision ? { modelRevision: data.model_revision } : {}),
        ...(data.artifact_set_digest ? { artifactSetDigest: data.artifact_set_digest } : {}),
        ...(data.processor_revision ? { processorRevision: data.processor_revision } : {}),
        ...(data.runtime_id ? { runtimeId: data.runtime_id } : {}),
        ...(data.runtime_version ? { runtimeVersion: data.runtime_version } : {}),
        dimensions: data.dimensions,
        normalized: data.normalized ?? req.normalize,
        promotionState,
        supportedModalities: ['text'],
      },
    };
  }

  async health(): Promise<{ healthy: boolean; latencyMs?: number; detail?: string }> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.cfg.baseUrl}${this.cfg.healthPath}`, {
        headers: this.cfg.apiKey ? { Authorization: `Bearer ${this.cfg.apiKey}` } : undefined,
        signal: AbortSignal.timeout(Math.min(this.cfg.timeoutMs, 3_000)),
      });
      return {
        healthy: response.ok,
        latencyMs: Date.now() - start,
        ...(!response.ok ? { detail: `HTTP_${response.status}` } : {}),
      };
    } catch (error) {
      return { healthy: false, detail: sanitizedTransportMessage(error) };
    }
  }
}
