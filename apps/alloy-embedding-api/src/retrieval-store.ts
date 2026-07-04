/**
 * Retrieval store + embedder selection for the shipping hybrid-search route.
 *
 * Two real arms, selected by environment — no synthetic fabrication on either:
 *
 *   - Store:    pgvector (cosine ANN + Postgres FTS) when DATABASE_URL is set,
 *               otherwise an in-memory StorageBundle for local development.
 *   - Embedder: the real external-http model backend (bge-m3, 1024-dim) when
 *               SUBSTRATE_EMBED_URL is set, otherwise the dev-hash backend.
 *
 * The route always queries the chosen store for real hits; it never invents
 * `synthetic-chunk-*` rows. When the store is empty the route returns zero hits
 * (honest empty result), which is the correct behavior before ingestion runs.
 */

import {
  InMemoryStorageBundle,
  createPgVectorStorageBundle,
  type StorageBundle,
} from "@workspace/aef-storage-adapters";
import { hasRealEmbedderConfigured } from "@workspace/alloy-embed-worker";

export interface EmbedderSelection {
  /** Backend id passed to embedTexts (and the MicroBatchQueue). */
  backendId: string;
  /** Model id recorded on evidence entries. */
  model: string;
  /** Whether this is the real model backend (vs the dev-hash fallback). */
  isReal: boolean;
}

let _store: { bundle: StorageBundle; backend: "pgvector" | "in-memory" } | undefined;

/**
 * Resolve the active storage bundle. pgvector in production (DATABASE_URL set),
 * in-memory for local dev. Memoized so the pg.Pool is created once.
 */
export function getRetrievalStore(): { bundle: StorageBundle; backend: "pgvector" | "in-memory" } {
  if (!_store) {
    const usePg =
      Boolean(process.env.DATABASE_URL) && process.env.AEF_STORE_BACKEND !== "in-memory";
    _store = usePg
      ? { bundle: createPgVectorStorageBundle(), backend: "pgvector" }
      : { bundle: new InMemoryStorageBundle(), backend: "in-memory" };
  }
  return _store;
}

/**
 * Resolve which embedder the route should call. Prefers the real model backend
 * when a substrate embed endpoint is configured; falls back to dev-hash only
 * when no real endpoint exists and we are not in production.
 */
export function getEmbedderSelection(): EmbedderSelection {
  if (hasRealEmbedderConfigured()) {
    return {
      backendId: "external-http",
      model: process.env.HF_EMBED_MODEL ?? "BAAI/bge-m3",
      isReal: true,
    };
  }
  return { backendId: "dev-hash", model: "aef-dev-hash", isReal: false };
}

/** Test seam: reset memoized state so tests can swap env between cases. */
export function __resetRetrievalStoreForTests(): void {
  _store = undefined;
}
