import { type PromotionState, RERANK_IMPLEMENTATION_ID } from '@workspace/aef-contracts';
import { z } from 'zod';
import type {
  RawRerankRequest,
  RawRerankResponse,
  RerankBackend,
  RerankBackendDescriptor,
} from './interface.js';

const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/i);
const UpstreamRerankResponseSchema = z.object({
  results: z.array(
    z.object({
      id: z.string().min(1),
      score: z.number().refine(Number.isFinite),
      rank: z.number().int().positive(),
    }),
  ),
  model: z.literal(RERANK_IMPLEMENTATION_ID),
  model_revision: z.string().min(1).optional(),
  artifact_set_digest: Sha256Schema.optional(),
  promotion_state: z.enum(['DEVELOPMENT', 'EVALUATION_HOLD', 'QUALIFIED', 'REVOKED']).optional(),
});

export interface LexicalHttpRerankBackendConfig {
  baseUrl: string;
  rerankPath?: string;
  healthPath?: string;
  apiKey?: string;
  tenantId?: string;
  modelRevision?: string;
  artifactSetDigest?: string;
  promotionState?: PromotionState;
  requirePromotionStateProof?: boolean;
  timeoutMs?: number;
  maxResponseBytes?: number;
}

type ResolvedConfig = LexicalHttpRerankBackendConfig & {
  rerankPath: string;
  healthPath: string;
  apiKey: string;
  tenantId: string;
  modelRevision: string;
  artifactSetDigest: string;
  promotionState: PromotionState;
  requirePromotionStateProof: boolean;
  timeoutMs: number;
  maxResponseBytes: number;
};

async function readBoundedJson(response: Response, maxBytes: number): Promise<unknown> {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    void response.body?.cancel().catch(() => undefined);
    throw new Error('Rerank backend response exceeded the configured size limit');
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > maxBytes) {
    throw new Error('Rerank backend response exceeded the configured size limit');
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error('Rerank backend returned invalid JSON');
  }
}

/** Strict HTTP adapter for the lexical-overlap implementation contract. */
export class LexicalHttpRerankBackend implements RerankBackend {
  readonly descriptor: RerankBackendDescriptor = {
    backendId: 'lexical-http',
    displayName: 'Lexical overlap reranker via HTTP',
    kind: 'lexical-http',
    supportedModels: [RERANK_IMPLEMENTATION_ID],
    isFallback: false,
  };

  private readonly cfg: ResolvedConfig;

  constructor(config: LexicalHttpRerankBackendConfig) {
    let baseUrl: URL;
    try {
      baseUrl = new URL(config.baseUrl);
    } catch {
      throw new Error('Lexical rerank baseUrl must be a valid HTTP(S) URL');
    }
    if (!['http:', 'https:'].includes(baseUrl.protocol) || baseUrl.username || baseUrl.password) {
      throw new Error('Lexical rerank baseUrl must be HTTP(S) without embedded credentials');
    }
    for (const [name, path] of [
      ['rerankPath', config.rerankPath],
      ['healthPath', config.healthPath],
    ] as const) {
      if (path !== undefined && (!path.startsWith('/') || path.startsWith('//'))) {
        throw new Error(`Lexical rerank ${name} must be an absolute URL path`);
      }
    }

    const timeoutMs = config.timeoutMs ?? 30_000;
    const maxResponseBytes = config.maxResponseBytes ?? 8 * 1024 * 1024;
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
      throw new Error('Lexical rerank timeoutMs must be a positive integer');
    }
    if (!Number.isSafeInteger(maxResponseBytes) || maxResponseBytes <= 0) {
      throw new Error('Lexical rerank maxResponseBytes must be a positive integer');
    }
    if (config.tenantId !== undefined && !config.tenantId.trim()) {
      throw new Error('Lexical rerank tenantId must not be blank when configured');
    }

    this.cfg = {
      rerankPath: '/aef/rerank',
      healthPath: '/health',
      apiKey: '',
      tenantId: config.tenantId?.trim() ?? '',
      modelRevision: '',
      artifactSetDigest: '',
      promotionState: 'DEVELOPMENT',
      requirePromotionStateProof: false,
      timeoutMs,
      maxResponseBytes,
      ...config,
      baseUrl: baseUrl.toString().replace(/\/$/, ''),
    };
  }

  async rerank(req: RawRerankRequest): Promise<RawRerankResponse> {
    if (req.model !== RERANK_IMPLEMENTATION_ID) {
      throw new Error(`Rerank model '${req.model}' is not admitted`);
    }

    const startedAt = Date.now();
    let response: Response;
    try {
      response = await fetch(`${this.cfg.baseUrl}${this.cfg.rerankPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.cfg.apiKey ? { Authorization: `Bearer ${this.cfg.apiKey}` } : {}),
          ...(this.cfg.tenantId ? { 'X-Tenant-ID': this.cfg.tenantId } : {}),
        },
        signal: AbortSignal.timeout(this.cfg.timeoutMs),
        body: JSON.stringify({
          query: req.query,
          candidates: req.candidates,
          top_k: req.topK,
          model: req.model,
        }),
      });
    } catch {
      throw new Error('Lexical rerank backend was unreachable');
    }

    if (!response.ok) {
      void response.body?.cancel().catch(() => undefined);
      throw new Error(`Lexical rerank backend returned HTTP ${response.status}`);
    }

    const parsed = UpstreamRerankResponseSchema.safeParse(
      await readBoundedJson(response, this.cfg.maxResponseBytes),
    );
    if (!parsed.success) throw new Error('Lexical rerank backend returned an invalid response');
    const data = parsed.data;

    if (this.cfg.modelRevision && data.model_revision !== this.cfg.modelRevision) {
      throw new Error('Lexical rerank backend did not prove the admitted model revision');
    }
    if (this.cfg.artifactSetDigest && data.artifact_set_digest !== this.cfg.artifactSetDigest) {
      throw new Error('Lexical rerank backend did not prove the admitted artifact set');
    }
    if (this.cfg.requirePromotionStateProof && data.promotion_state !== this.cfg.promotionState) {
      throw new Error('Lexical rerank backend did not prove the admitted promotion state');
    }

    const candidateIds = new Set(req.candidates.map((candidate) => candidate.id));
    const resultIds = new Set<string>();
    const maximumResults = Math.min(req.topK, req.candidates.length);
    if (
      data.results.length !== maximumResults ||
      data.results.some((result, index) => {
        if (!candidateIds.has(result.id) || resultIds.has(result.id) || result.rank !== index + 1) {
          return true;
        }
        resultIds.add(result.id);
        return false;
      })
    ) {
      throw new Error('Lexical rerank backend returned invalid result identities or ranks');
    }

    const promotionState = data.promotion_state ?? this.cfg.promotionState;
    return {
      results: data.results,
      model: RERANK_IMPLEMENTATION_ID,
      backendLatencyMs: Date.now() - startedAt,
      execution: {
        backendId: this.descriptor.backendId,
        modelId: RERANK_IMPLEMENTATION_ID,
        ...(data.model_revision ? { modelRevision: data.model_revision } : {}),
        ...(data.artifact_set_digest ? { artifactSetDigest: data.artifact_set_digest } : {}),
        promotionState,
        implementationKind: 'lexical-overlap',
        fallback: false,
      },
    };
  }

  async health(): Promise<{ healthy: boolean; latencyMs?: number; detail?: string }> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.cfg.baseUrl}${this.cfg.healthPath}`, {
        headers:
          this.cfg.apiKey || this.cfg.tenantId
            ? {
                ...(this.cfg.apiKey ? { Authorization: `Bearer ${this.cfg.apiKey}` } : {}),
                ...(this.cfg.tenantId ? { 'X-Tenant-ID': this.cfg.tenantId } : {}),
              }
            : undefined,
        signal: AbortSignal.timeout(Math.min(this.cfg.timeoutMs, 3_000)),
      });
      return {
        healthy: response.ok,
        latencyMs: Date.now() - start,
        ...(!response.ok ? { detail: `HTTP_${response.status}` } : {}),
      };
    } catch {
      return { healthy: false, detail: 'unreachable' };
    }
  }
}

/** @deprecated Use LexicalHttpRerankBackend; the implementation is not a cross-encoder. */
export { LexicalHttpRerankBackend as CrossEncoderHttpRerankBackend };
