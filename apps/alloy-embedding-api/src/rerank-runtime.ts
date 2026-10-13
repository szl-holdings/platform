import {
  isDevelopmentOrTestRuntime,
  isProductionRuntime,
  RERANK_IMPLEMENTATION_ID,
  type RerankExecutionReceipt,
} from '@workspace/aef-contracts';
import {
  buildExternalRerankBackend,
  DeterministicFallbackRerankBackend,
} from '@workspace/alloy-rerank-worker';

const IMMUTABLE_REVISION_PATTERN = /^[a-f0-9]{40}$/i;
const SHA256_DIGEST_PATTERN = /^[a-f0-9]{64}$/i;

export class RerankerConfigurationError extends Error {
  readonly code = 'RERANKER_CONFIGURATION_INVALID';

  constructor(message: string) {
    super(message);
    this.name = 'RerankerConfigurationError';
  }
}

export interface RerankerConfiguration {
  enabled: boolean;
  model: typeof RERANK_IMPLEMENTATION_ID;
  endpoint?: string;
  modelRevision?: string;
  artifactSetDigest?: string;
  promotionState: 'DEVELOPMENT' | 'EVALUATION_HOLD' | 'QUALIFIED' | 'REVOKED';
  timeoutMs?: number;
  maxResponseBytes?: number;
}

type RerankerPromotionState = RerankerConfiguration['promotionState'];

const PROMOTION_STATES = new Set<RerankerPromotionState>([
  'DEVELOPMENT',
  'EVALUATION_HOLD',
  'QUALIFIED',
  'REVOKED',
]);

function firstNonBlank(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const normalized = value?.trim();
    if (normalized) return normalized;
  }
  return undefined;
}

function readEnabled(env: NodeJS.ProcessEnv): boolean {
  const value = env.AEF_RERANK_ENABLED?.trim();
  if (value === undefined || value === '') return !isProductionRuntime(env, ['AEF_ENV']);
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new RerankerConfigurationError('AEF_RERANK_ENABLED must be either "true" or "false"');
}

function readPositiveInteger(
  env: NodeJS.ProcessEnv,
  name: 'AEF_RERANK_TIMEOUT_MS' | 'AEF_RERANK_MAX_RESPONSE_BYTES',
  fallback: number,
): number {
  const raw = firstNonBlank(env[name]);
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RerankerConfigurationError(`${name} must be a positive integer`);
  }
  return value;
}

export function resolveRerankerConfiguration(
  env: NodeJS.ProcessEnv = process.env,
): RerankerConfiguration {
  const enabled = readEnabled(env);
  if (!enabled) {
    return {
      enabled: false,
      model: RERANK_IMPLEMENTATION_ID,
      promotionState: 'DEVELOPMENT',
    };
  }

  const configuredModel = firstNonBlank(env.AEF_RERANK_MODEL) ?? RERANK_IMPLEMENTATION_ID;
  if (configuredModel !== RERANK_IMPLEMENTATION_ID) {
    throw new RerankerConfigurationError(
      `AEF_RERANK_MODEL must be ${RERANK_IMPLEMENTATION_ID}; no other implementation is admitted`,
    );
  }

  const endpoint = firstNonBlank(env.SUBSTRATE_RERANK_URL);
  const resolvedEndpoint =
    endpoint ?? (isProductionRuntime(env, ['AEF_ENV']) ? undefined : 'http://localhost:9800');
  if (!resolvedEndpoint) {
    throw new RerankerConfigurationError(
      'SUBSTRATE_RERANK_URL is required when production reranking is enabled',
    );
  }
  let parsed: URL;
  try {
    parsed = new URL(resolvedEndpoint);
  } catch {
    throw new RerankerConfigurationError('SUBSTRATE_RERANK_URL must be a valid HTTP(S) URL');
  }
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new RerankerConfigurationError(
      'SUBSTRATE_RERANK_URL must be HTTP(S) without embedded credentials, a query, or a fragment',
    );
  }

  const rerankPath = firstNonBlank(env.SUBSTRATE_RERANK_PATH) ?? '/aef/rerank';
  if (!rerankPath.startsWith('/') || rerankPath.startsWith('//')) {
    throw new RerankerConfigurationError('SUBSTRATE_RERANK_PATH must be an absolute URL path');
  }

  const configuredPromotionState = firstNonBlank(env.AEF_RERANK_PROMOTION_STATE);
  if (
    configuredPromotionState &&
    !PROMOTION_STATES.has(configuredPromotionState as RerankerPromotionState)
  ) {
    throw new RerankerConfigurationError(
      'AEF_RERANK_PROMOTION_STATE must be DEVELOPMENT, EVALUATION_HOLD, QUALIFIED, or REVOKED',
    );
  }
  const promotionState =
    (configuredPromotionState as RerankerConfiguration['promotionState'] | undefined) ??
    'DEVELOPMENT';
  const modelRevision = firstNonBlank(env.AEF_RERANK_MODEL_REVISION);
  const artifactSetDigest = firstNonBlank(env.AEF_RERANK_ARTIFACT_SET_DIGEST)?.toLowerCase();
  const backendApiKey = firstNonBlank(env.SUBSTRATE_RERANK_API_KEY);
  const backendTenantId = firstNonBlank(
    env.SUBSTRATE_RERANK_TENANT_ID,
    env.SUBSTRATE_PYTHON_WORKER_TENANT_ID,
  );
  const timeoutMs = readPositiveInteger(env, 'AEF_RERANK_TIMEOUT_MS', 30_000);
  const maxResponseBytes = readPositiveInteger(
    env,
    'AEF_RERANK_MAX_RESPONSE_BYTES',
    8 * 1024 * 1024,
  );

  if (isProductionRuntime(env, ['AEF_ENV'])) {
    if (promotionState !== 'QUALIFIED') {
      throw new RerankerConfigurationError(
        'AEF_RERANK_PROMOTION_STATE=QUALIFIED is required when production reranking is enabled',
      );
    }
    if (!modelRevision || !IMMUTABLE_REVISION_PATTERN.test(modelRevision)) {
      throw new RerankerConfigurationError(
        'AEF_RERANK_MODEL_REVISION must be an immutable 40-hex commit SHA in production',
      );
    }
    if (!artifactSetDigest || !SHA256_DIGEST_PATTERN.test(artifactSetDigest)) {
      throw new RerankerConfigurationError(
        'AEF_RERANK_ARTIFACT_SET_DIGEST must be a 64-character SHA-256 digest in production',
      );
    }
    if (!backendApiKey) {
      throw new RerankerConfigurationError(
        'SUBSTRATE_RERANK_API_KEY is required when production reranking is enabled',
      );
    }
    if (!backendTenantId) {
      throw new RerankerConfigurationError(
        'SUBSTRATE_RERANK_TENANT_ID is required when production reranking is enabled',
      );
    }
  }

  return {
    enabled: true,
    model: RERANK_IMPLEMENTATION_ID,
    endpoint: resolvedEndpoint,
    ...(modelRevision ? { modelRevision } : {}),
    ...(artifactSetDigest ? { artifactSetDigest } : {}),
    promotionState,
    timeoutMs,
    maxResponseBytes,
  };
}

export function assertProductionRerankerConfiguration(env: NodeJS.ProcessEnv = process.env): void {
  resolveRerankerConfiguration(env);
}

export interface RerankerReadinessReport {
  ready: boolean;
  enabled: boolean;
  model: typeof RERANK_IMPLEMENTATION_ID;
  detail: string;
  execution?: RerankExecutionReceipt;
  latencyMs?: number;
}

export async function buildRerankerReadinessReport(): Promise<RerankerReadinessReport> {
  let config: RerankerConfiguration;
  try {
    config = resolveRerankerConfiguration();
  } catch (error) {
    return {
      ready: false,
      enabled: true,
      model: RERANK_IMPLEMENTATION_ID,
      detail: error instanceof Error ? error.message : 'Reranker configuration is invalid',
    };
  }

  if (!config.enabled) {
    return {
      ready: true,
      enabled: false,
      model: config.model,
      detail: 'reranking explicitly disabled',
    };
  }

  const probe = {
    query: 'readiness',
    candidates: [{ id: 'readiness', text: 'readiness' }],
    topK: 1,
    model: config.model,
  };
  const startedAt = Date.now();
  try {
    const result = await buildExternalRerankBackend({ timeoutMs: 3_000 }).rerank(probe);
    return {
      ready: true,
      enabled: true,
      model: config.model,
      detail: 'rerank inference contract verified',
      execution: result.execution,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    if (isDevelopmentOrTestRuntime(process.env, ['AEF_ENV'])) {
      const fallback = await new DeterministicFallbackRerankBackend().rerank(probe);
      return {
        ready: true,
        enabled: true,
        model: config.model,
        detail: 'development fallback ready',
        execution: {
          ...fallback.execution,
          fallback: true,
          fallbackReason: 'primary-error',
        },
        latencyMs: Date.now() - startedAt,
      };
    }
    return {
      ready: false,
      enabled: true,
      model: config.model,
      detail: error instanceof Error ? error.message : 'Rerank inference probe failed',
      latencyMs: Date.now() - startedAt,
    };
  }
}
