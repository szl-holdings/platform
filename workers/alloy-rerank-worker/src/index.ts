export {
  CrossEncoderHttpRerankBackend,
  LexicalHttpRerankBackend,
  type LexicalHttpRerankBackendConfig,
} from './backends/cross-encoder-http.js';
export { DeterministicFallbackRerankBackend } from './backends/fallback.js';
export type {
  RawRerankRequest,
  RawRerankResponse,
  RawRerankResult,
  RerankBackend,
  RerankBackendDescriptor,
} from './backends/interface.js';

import { isDevelopmentOrTestRuntime, isProductionRuntime } from '@workspace/aef-contracts';
import { LexicalHttpRerankBackend } from './backends/cross-encoder-http.js';
import { DeterministicFallbackRerankBackend } from './backends/fallback.js';
import type { RawRerankRequest, RawRerankResponse, RerankBackend } from './backends/interface.js';

let _primaryBackend: RerankBackend | undefined;
let _fallbackBackend: RerankBackend | undefined;

function firstNonBlank(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const normalized = value?.trim();
    if (normalized) return normalized;
  }
  return undefined;
}

export interface ExternalRerankBackendBuildOptions {
  timeoutMs?: number;
}

export function buildExternalRerankBackend(
  options: ExternalRerankBackendBuildOptions = {},
): LexicalHttpRerankBackend {
  const production = isProductionRuntime(process.env, ['AEF_ENV', 'SUBSTRATE_PYTHON_WORKER_ENV']);
  const baseUrl = firstNonBlank(process.env.SUBSTRATE_RERANK_URL);
  if (!baseUrl && production) {
    throw new Error('SUBSTRATE_RERANK_URL is required for production reranking');
  }
  const modelRevision = firstNonBlank(process.env.AEF_RERANK_MODEL_REVISION);
  const artifactSetDigest = firstNonBlank(
    process.env.AEF_RERANK_ARTIFACT_SET_DIGEST,
  )?.toLowerCase();
  const apiKey = firstNonBlank(process.env.SUBSTRATE_RERANK_API_KEY);
  const tenantId = firstNonBlank(
    process.env.SUBSTRATE_RERANK_TENANT_ID,
    process.env.SUBSTRATE_PYTHON_WORKER_TENANT_ID,
  );
  const promotionState = firstNonBlank(process.env.AEF_RERANK_PROMOTION_STATE) ?? 'DEVELOPMENT';
  if (!['DEVELOPMENT', 'EVALUATION_HOLD', 'QUALIFIED', 'REVOKED'].includes(promotionState)) {
    throw new Error('AEF_RERANK_PROMOTION_STATE is invalid');
  }
  if (production) {
    if (promotionState !== 'QUALIFIED') {
      throw new Error('AEF_RERANK_PROMOTION_STATE=QUALIFIED is required in production');
    }
    if (!modelRevision || !/^[a-f0-9]{40}$/i.test(modelRevision)) {
      throw new Error('AEF_RERANK_MODEL_REVISION must be an immutable 40-hex commit SHA');
    }
    if (!artifactSetDigest || !/^[a-f0-9]{64}$/i.test(artifactSetDigest)) {
      throw new Error('AEF_RERANK_ARTIFACT_SET_DIGEST must be a SHA-256 digest');
    }
    if (!apiKey) {
      throw new Error('SUBSTRATE_RERANK_API_KEY is required for production reranking');
    }
    if (!tenantId) {
      throw new Error('SUBSTRATE_RERANK_TENANT_ID is required for production reranking');
    }
  }
  return new LexicalHttpRerankBackend({
    baseUrl: baseUrl ?? 'http://localhost:9800',
    rerankPath: firstNonBlank(process.env.SUBSTRATE_RERANK_PATH) ?? '/aef/rerank',
    ...(apiKey ? { apiKey } : {}),
    ...(tenantId ? { tenantId } : {}),
    ...(modelRevision ? { modelRevision } : {}),
    ...(artifactSetDigest ? { artifactSetDigest } : {}),
    promotionState: promotionState as 'DEVELOPMENT' | 'EVALUATION_HOLD' | 'QUALIFIED' | 'REVOKED',
    requirePromotionStateProof: production,
    timeoutMs: options.timeoutMs ?? Number(process.env.AEF_RERANK_TIMEOUT_MS ?? 30_000),
    maxResponseBytes: Number(process.env.AEF_RERANK_MAX_RESPONSE_BYTES ?? 8 * 1024 * 1024),
  });
}

export function getDefaultRerankWorker(): { primary: RerankBackend; fallback: RerankBackend } {
  if (!_primaryBackend || !_fallbackBackend) {
    _primaryBackend = buildExternalRerankBackend();
    _fallbackBackend = new DeterministicFallbackRerankBackend();
  }
  return { primary: _primaryBackend, fallback: _fallbackBackend };
}

export async function rerankCandidates(
  req: RawRerankRequest,
  options: { fallbackPolicy?: RerankFallbackPolicy } = {},
): Promise<RawRerankResponse> {
  const fallbackPolicy = options.fallbackPolicy ?? 'never';
  const developmentMode = isDevelopmentOrTestRuntime(process.env, [
    'AEF_ENV',
    'SUBSTRATE_PYTHON_WORKER_ENV',
  ]);
  if (fallbackPolicy === 'force' && !developmentMode) {
    throw new Error('Forced rerank fallback is permitted only in development or test');
  }

  const { primary, fallback } = getDefaultRerankWorker();
  if (fallbackPolicy === 'force') {
    const forced = await fallback.rerank(req);
    return {
      ...forced,
      execution: { ...forced.execution, fallback: true, fallbackReason: 'forced' },
    };
  }

  try {
    return await primary.rerank(req);
  } catch (err) {
    if (fallbackPolicy !== 'development-only' || !developmentMode) throw err;

    const fallbackResult = await fallback.rerank(req);
    return {
      ...fallbackResult,
      execution: {
        ...fallbackResult.execution,
        fallback: true,
        fallbackReason: 'primary-error',
      },
    };
  }
}

export type RerankFallbackPolicy = 'never' | 'development-only' | 'force';

export function __resetRerankWorkerForTests(): void {
  _primaryBackend = undefined;
  _fallbackBackend = undefined;
}
