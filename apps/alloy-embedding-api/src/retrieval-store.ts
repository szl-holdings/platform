/**
 * Retrieval store + embedder selection for the shipping hybrid-search route.
 *
 * Store: pgvector when DATABASE_URL is set; otherwise in-memory for development.
 * Embedder: exact external HTTP backend when configured; dev-hash only outside
 * production. Production without a real embedder fails closed.
 */

import {
  type EmbeddingExecutionReceipt,
  isProductionRuntime,
  type PromotionState,
} from '@workspace/aef-contracts';
import {
  createPgVectorStorageBundle,
  InMemoryStorageBundle,
  type StorageBundle,
} from '@workspace/aef-storage-adapters';
import { buildExternalHttpBackend } from '@workspace/alloy-embed-worker';

export interface EmbedderSelection {
  backendId: string;
  model: string;
  modelRevision?: string;
  artifactSetDigest?: string;
  promotionState: PromotionState;
  isReal: boolean;
}

export class EmbedderConfigurationError extends Error {
  readonly code = 'REAL_EMBEDDER_REQUIRED';

  constructor(message = 'A real embedding endpoint is required in production') {
    super(message);
    this.name = 'EmbedderConfigurationError';
  }
}

export class RetrievalStoreConfigurationError extends Error {
  readonly code = 'DURABLE_RETRIEVAL_STORE_REQUIRED';

  constructor(message: string) {
    super(message);
    this.name = 'RetrievalStoreConfigurationError';
  }
}

const SHA256_DIGEST_PATTERN = /^[a-f0-9]{64}$/i;
const IMMUTABLE_HF_REVISION_PATTERN = /^[a-f0-9]{40}$/i;

function firstNonBlank(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const normalized = value?.trim();
    if (normalized) return normalized;
  }
  return undefined;
}

function resolveExternalEmbeddingUrl(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return firstNonBlank(env.SUBSTRATE_EMBED_URL, env.HF_EMBED_URL);
}

export function assertProductionEmbedderConfiguration(env: NodeJS.ProcessEnv = process.env): void {
  if (!isProductionRuntime(env, ['AEF_ENV'])) return;

  const endpoint = resolveExternalEmbeddingUrl(env);
  if (!endpoint) throw new EmbedderConfigurationError();
  const substrateEndpoint = firstNonBlank(env.SUBSTRATE_EMBED_URL);

  let parsed: URL;
  try {
    parsed = new URL(endpoint);
  } catch {
    throw new EmbedderConfigurationError(
      'SUBSTRATE_EMBED_URL or HF_EMBED_URL must be a valid HTTP(S) origin',
    );
  }
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new EmbedderConfigurationError(
      'SUBSTRATE_EMBED_URL or HF_EMBED_URL must be HTTP(S) without credentials, a query, or a fragment',
    );
  }

  const embedPath = firstNonBlank(env.SUBSTRATE_EMBED_PATH, env.HF_EMBED_PATH) ?? '/embed';
  if (!embedPath.startsWith('/') || embedPath.startsWith('//')) {
    throw new EmbedderConfigurationError(
      'SUBSTRATE_EMBED_PATH or HF_EMBED_PATH must be an absolute URL path',
    );
  }

  if (env.AEF_EMBED_PROMOTION_STATE?.trim() !== 'QUALIFIED') {
    throw new EmbedderConfigurationError(
      'AEF_EMBED_PROMOTION_STATE=QUALIFIED is required in production',
    );
  }

  const modelRevision = env.HF_EMBED_MODEL_REVISION?.trim();
  if (!modelRevision || !IMMUTABLE_HF_REVISION_PATTERN.test(modelRevision)) {
    throw new EmbedderConfigurationError(
      'HF_EMBED_MODEL_REVISION must be an immutable 40-hex commit SHA in production',
    );
  }

  const artifactSetDigest = env.HF_EMBED_ARTIFACT_SET_DIGEST?.trim();
  if (!artifactSetDigest || !SHA256_DIGEST_PATTERN.test(artifactSetDigest)) {
    throw new EmbedderConfigurationError(
      'HF_EMBED_ARTIFACT_SET_DIGEST must be a 64-character SHA-256 digest in production',
    );
  }

  if (substrateEndpoint) {
    if (!firstNonBlank(env.SUBSTRATE_EMBED_API_KEY, env.SUBSTRATE_PYTHON_WORKER_API_KEY)) {
      throw new EmbedderConfigurationError(
        'SUBSTRATE_EMBED_API_KEY is required for the production substrate embedder',
      );
    }
    if (!firstNonBlank(env.SUBSTRATE_EMBED_TENANT_ID, env.SUBSTRATE_PYTHON_WORKER_TENANT_ID)) {
      throw new EmbedderConfigurationError(
        'SUBSTRATE_EMBED_TENANT_ID is required for the production substrate embedder',
      );
    }
  }
}

let store: { bundle: StorageBundle; backend: 'pgvector' | 'in-memory' } | undefined;

export function resolveRetrievalStoreBackend(
  env: NodeJS.ProcessEnv = process.env,
): 'pgvector' | 'in-memory' {
  const configured = env.AEF_STORE_BACKEND?.trim();
  if (configured && configured !== 'pgvector' && configured !== 'in-memory') {
    throw new RetrievalStoreConfigurationError(
      'AEF_STORE_BACKEND must be either pgvector or in-memory',
    );
  }

  const hasDatabase = Boolean(env.DATABASE_URL?.trim());
  if (configured === 'pgvector' && !hasDatabase) {
    throw new RetrievalStoreConfigurationError(
      'DATABASE_URL is required when AEF_STORE_BACKEND=pgvector',
    );
  }
  if (isProductionRuntime(env, ['AEF_ENV'])) {
    if (configured === 'in-memory' || !hasDatabase) {
      throw new RetrievalStoreConfigurationError(
        'Production hybrid retrieval requires DATABASE_URL and does not admit the in-memory store',
      );
    }
    return 'pgvector';
  }

  if (configured === 'pgvector' || (hasDatabase && configured !== 'in-memory')) return 'pgvector';
  return 'in-memory';
}

export interface RetrievalStoreAdmissionReport {
  admitted: boolean;
  backend: 'pgvector' | 'in-memory' | 'unconfigured';
  admissionState: 'DEVELOPMENT' | 'CONFIGURED' | 'EVALUATION_HOLD';
  detail: string;
}

export function buildRetrievalStoreAdmissionReport(
  env: NodeJS.ProcessEnv = process.env,
): RetrievalStoreAdmissionReport {
  try {
    const backend = resolveRetrievalStoreBackend(env);
    return {
      admitted: true,
      backend,
      admissionState: backend === 'pgvector' ? 'CONFIGURED' : 'DEVELOPMENT',
      detail:
        backend === 'pgvector'
          ? 'durable retrieval adapter configured; live database reachability is verified by requests'
          : 'development-only in-memory retrieval store',
    };
  } catch (error) {
    return {
      admitted: false,
      backend: 'unconfigured',
      admissionState: 'EVALUATION_HOLD',
      detail: error instanceof Error ? error.message : 'Retrieval storage configuration is invalid',
    };
  }
}

export function getRetrievalStore(): {
  bundle: StorageBundle;
  backend: 'pgvector' | 'in-memory';
} {
  const backend = resolveRetrievalStoreBackend();
  if (!store || store.backend !== backend) {
    store =
      backend === 'pgvector'
        ? { bundle: createPgVectorStorageBundle(), backend: 'pgvector' }
        : { bundle: new InMemoryStorageBundle(), backend: 'in-memory' };
  }
  return store;
}

export function getEmbedderSelection(env: NodeJS.ProcessEnv = process.env): EmbedderSelection {
  if (isProductionRuntime(env, ['AEF_ENV'])) assertProductionEmbedderConfiguration(env);

  if (resolveExternalEmbeddingUrl(env)) {
    const modelRevision = firstNonBlank(env.HF_EMBED_MODEL_REVISION);
    const artifactSetDigest = firstNonBlank(env.HF_EMBED_ARTIFACT_SET_DIGEST)?.toLowerCase();
    return {
      backendId: 'external-http',
      model: firstNonBlank(env.HF_EMBED_MODEL) ?? 'BAAI/bge-m3',
      ...(modelRevision ? { modelRevision } : {}),
      ...(artifactSetDigest ? { artifactSetDigest } : {}),
      promotionState:
        (firstNonBlank(env.AEF_EMBED_PROMOTION_STATE) as PromotionState | undefined) ??
        'DEVELOPMENT',
      isReal: true,
    };
  }

  if (isProductionRuntime(env, ['AEF_ENV'])) throw new EmbedderConfigurationError();

  return {
    backendId: 'dev-hash',
    model: 'aef-dev-hash',
    modelRevision: 'sha256-v1',
    promotionState: 'DEVELOPMENT',
    isReal: false,
  };
}

export interface EmbeddingReadinessReport {
  ready: boolean;
  backendId: string;
  model: string;
  detail: string;
  latencyMs?: number;
  execution?: EmbeddingExecutionReceipt;
}

/**
 * Probe the backend the protected embedding routes actually use. Development's
 * explicit hash backend is in-process; a configured external backend must
 * complete a bounded inference probe on every readiness request. This proves
 * the admitted model identity and vector contract, rather than only proving
 * that an unrelated health endpoint is alive.
 */
export async function buildEmbeddingReadinessReport(): Promise<EmbeddingReadinessReport> {
  let selection: EmbedderSelection;
  try {
    selection = getEmbedderSelection();
  } catch (error) {
    return {
      ready: false,
      backendId: 'unconfigured',
      model: 'unconfigured',
      detail: error instanceof Error ? error.message : 'Embedding backend is not configured',
    };
  }

  if (!selection.isReal) {
    return {
      ready: true,
      backendId: selection.backendId,
      model: selection.model,
      detail: 'development backend ready',
    };
  }

  try {
    const backend = buildExternalHttpBackend({ timeoutMs: 3_000 });
    if (!backend) {
      return {
        ready: false,
        backendId: selection.backendId,
        model: selection.model,
        detail: 'External embedding backend is not configured',
      };
    }
    const result = await backend.embed({
      texts: ['readiness'],
      model: selection.model,
      pooling: 'mean',
      normalize: true,
    });
    return {
      ready: true,
      backendId: selection.backendId,
      model: result.model,
      detail: 'inference contract verified',
      ...(result.backendLatencyMs !== undefined ? { latencyMs: result.backendLatencyMs } : {}),
      ...(result.execution ? { execution: result.execution } : {}),
    };
  } catch (error) {
    return {
      ready: false,
      backendId: selection.backendId,
      model: selection.model,
      detail: error instanceof Error ? error.message : 'Embedding backend inference probe failed',
    };
  }
}

export function __resetRetrievalStoreForTests(): void {
  store = undefined;
}
