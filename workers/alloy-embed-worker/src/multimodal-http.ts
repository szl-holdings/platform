import {
  MultimodalEmbedRequestSchema,
  MultimodalEmbedResponseSchema,
  type MultimodalEmbedRequest,
  type MultimodalEmbedResponse,
} from '@workspace/aef-contracts';
import { readBoundedJson, sanitizedTransportMessage, UpstreamProtocolError } from './http-json.js';

export interface MultimodalHttpEmbeddingClientConfig {
  baseUrl: string;
  embedPath?: string;
  healthPath?: string;
  apiKey?: string;
  timeoutMs?: number;
  maxResponseBytes?: number;
  expectedModelId: string;
  expectedModelRevision: string;
  expectedArtifactSetDigest: string;
  expectedDimensions: number;
}

type ResolvedConfig = MultimodalHttpEmbeddingClientConfig & {
  embedPath: string;
  healthPath: string;
  apiKey: string;
  timeoutMs: number;
  maxResponseBytes: number;
};

/**
 * Strict transport adapter for the separately deployed Ovis evaluation worker.
 * It validates request and response contracts, exact model identity, cardinality,
 * vector width, item identity, and finite values. There is intentionally no
 * fallback to text hashing or another model.
 */
export class MultimodalHttpEmbeddingClient {
  private readonly cfg: ResolvedConfig;

  constructor(config: MultimodalHttpEmbeddingClientConfig) {
    const baseUrl = new URL(config.baseUrl);
    if (!['http:', 'https:'].includes(baseUrl.protocol) || baseUrl.username || baseUrl.password) {
      throw new Error('Multimodal embedding baseUrl must be HTTP(S) without embedded credentials');
    }
    this.cfg = {
      embedPath: '/v1/multimodal/embed',
      healthPath: '/v1/multimodal/health',
      apiKey: '',
      timeoutMs: 300_000,
      maxResponseBytes: 64 * 1024 * 1024,
      ...config,
      baseUrl: baseUrl.toString().replace(/\/$/, ''),
    };
  }

  async embed(input: MultimodalEmbedRequest): Promise<MultimodalEmbedResponse> {
    const request = MultimodalEmbedRequestSchema.parse(input);
    if (
      request.modelId !== this.cfg.expectedModelId ||
      request.modelRevision !== this.cfg.expectedModelRevision ||
      request.dimensions !== this.cfg.expectedDimensions
    ) {
      throw new UpstreamProtocolError(
        'REQUEST_IDENTITY_NOT_ADMITTED',
        'Requested multimodal model identity is not admitted by this client',
      );
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.cfg.apiKey) headers.Authorization = `Bearer ${this.cfg.apiKey}`;

    let response: Response;
    try {
      response = await fetch(`${this.cfg.baseUrl}${this.cfg.embedPath}`, {
        method: 'POST',
        headers,
        signal: AbortSignal.timeout(this.cfg.timeoutMs),
        body: JSON.stringify(request),
      });
    } catch (error) {
      throw new UpstreamProtocolError(
        sanitizedTransportMessage(error),
        'Multimodal embedding runtime was unreachable',
      );
    }

    if (!response.ok) {
      void response.body?.cancel().catch(() => undefined);
      throw new UpstreamProtocolError(
        'UPSTREAM_HTTP_ERROR',
        `Multimodal embedding runtime returned HTTP ${response.status}`,
        response.status,
      );
    }

    const parsed = MultimodalEmbedResponseSchema.safeParse(
      await readBoundedJson(response, this.cfg.maxResponseBytes),
    );
    if (!parsed.success) {
      throw new UpstreamProtocolError(
        'UPSTREAM_SCHEMA_MISMATCH',
        'Multimodal embedding runtime returned an invalid response',
        response.status,
      );
    }

    const result = parsed.data;
    if (
      result.modelId !== this.cfg.expectedModelId ||
      result.modelRevision !== this.cfg.expectedModelRevision ||
      result.execution.modelId !== this.cfg.expectedModelId ||
      result.execution.modelRevision !== this.cfg.expectedModelRevision ||
      result.execution.artifactSetDigest !== this.cfg.expectedArtifactSetDigest ||
      result.dimensions !== this.cfg.expectedDimensions ||
      result.execution.dimensions !== this.cfg.expectedDimensions ||
      result.execution.normalized !== true
    ) {
      throw new UpstreamProtocolError(
        'UPSTREAM_IDENTITY_MISMATCH',
        'Multimodal embedding runtime did not prove the admitted execution identity',
        response.status,
      );
    }

    if (result.vectors.length !== request.items.length) {
      throw new UpstreamProtocolError(
        'UPSTREAM_CARDINALITY_MISMATCH',
        'Multimodal embedding runtime returned the wrong vector count',
        response.status,
      );
    }

    const expectedItemIds = request.items.map((item) => item.itemId);
    const actualItemIds = result.vectors.map((vector) => vector.itemId);
    if (expectedItemIds.some((id, index) => actualItemIds[index] !== id)) {
      throw new UpstreamProtocolError(
        'UPSTREAM_ITEM_ID_MISMATCH',
        'Multimodal embedding runtime reordered or replaced item identities',
        response.status,
      );
    }
    if (
      result.vectors.some(
        (entry) =>
          entry.vector.length !== this.cfg.expectedDimensions ||
          entry.vector.some((value) => !Number.isFinite(value)),
      )
    ) {
      throw new UpstreamProtocolError(
        'UPSTREAM_VECTOR_INVALID',
        'Multimodal embedding runtime returned an invalid vector',
        response.status,
      );
    }

    return result;
  }

  async health(): Promise<{ healthy: boolean; statusCode?: number; detail?: string }> {
    try {
      const response = await fetch(`${this.cfg.baseUrl}${this.cfg.healthPath}`, {
        headers: this.cfg.apiKey ? { Authorization: `Bearer ${this.cfg.apiKey}` } : undefined,
        signal: AbortSignal.timeout(Math.min(this.cfg.timeoutMs, 5_000)),
      });
      return {
        healthy: response.ok,
        statusCode: response.status,
        ...(!response.ok ? { detail: `HTTP_${response.status}` } : {}),
      };
    } catch (error) {
      return { healthy: false, detail: sanitizedTransportMessage(error) };
    }
  }
}
