/**
 * Retrieval store + embedder selection for the shipping hybrid-search route.
 *
 * Store: pgvector when DATABASE_URL is set; otherwise in-memory for development.
 * Embedder: exact external HTTP backend when configured; dev-hash only outside
 * production. Production without a real embedder fails closed.
 */

import {
  InMemoryStorageBundle,
  createPgVectorStorageBundle,
  type StorageBundle,
} from '@workspace/aef-storage-adapters';
import { hasRealEmbedderConfigured } from '@workspace/alloy-embed-worker';
import type { PromotionState } from '@workspace/aef-contracts';

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

let store: { bundle: StorageBundle; backend: 'pgvector' | 'in-memory' } | undefined;

export function getRetrievalStore(): {
  bundle: StorageBundle;
  backend: 'pgvector' | 'in-memory';
} {
  if (!store) {
    const usePg = Boolean(process.env.DATABASE_URL) && process.env.AEF_STORE_BACKEND !== 'in-memory';
    store = usePg
      ? { bundle: createPgVectorStorageBundle(), backend: 'pgvector' }
      : { bundle: new InMemoryStorageBundle(), backend: 'in-memory' };
  }
  return store;
}

export function getEmbedderSelection(): EmbedderSelection {
  if (hasRealEmbedderConfigured()) {
    return {
      backendId: 'external-http',
      model: process.env.HF_EMBED_MODEL ?? 'BAAI/bge-m3',
      ...(process.env.HF_EMBED_MODEL_REVISION
        ? { modelRevision: process.env.HF_EMBED_MODEL_REVISION }
        : {}),
      ...(process.env.HF_EMBED_ARTIFACT_SET_DIGEST
        ? { artifactSetDigest: process.env.HF_EMBED_ARTIFACT_SET_DIGEST }
        : {}),
      promotionState:
        (process.env.AEF_EMBED_PROMOTION_STATE as PromotionState | undefined) ?? 'DEVELOPMENT',
      isReal: true,
    };
  }

  if (process.env.NODE_ENV === 'production') throw new EmbedderConfigurationError();

  return {
    backendId: 'dev-hash',
    model: 'aef-dev-hash',
    modelRevision: 'sha256-v1',
    promotionState: 'DEVELOPMENT',
    isReal: false,
  };
}

export function __resetRetrievalStoreForTests(): void {
  store = undefined;
}
