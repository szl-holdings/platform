/**
 * AEF Ingestion Orchestrator — Storage Abstraction Interfaces
 *
 * Pluggable interfaces for raw document storage, chunk storage, and index
 * storage. Dev implementations use in-memory structures. Adapters for
 * pgvector, Azure AI Search, and object storage are stubbed for Phase 5+.
 */

// ─── Raw Document Store ───────────────────────────────────────────────────────

export interface RawDocument {
  sourceId: string;
  tenantId: string;
  profileId: string;
  content: string;
  contentType: string;
  title?: string;
  sourceUri?: string;
  metadata: Record<string, unknown>;
  storedAt: string;
}

export interface RawDocumentStore {
  put(doc: RawDocument): Promise<void>;
  get(sourceId: string, tenantId: string): Promise<RawDocument | undefined>;
  list(tenantId: string, profileId?: string): Promise<RawDocument[]>;
  delete(sourceId: string, tenantId: string): Promise<boolean>;
}

// ─── Chunk Store ──────────────────────────────────────────────────────────────

export interface Chunk {
  chunkId: string;
  sourceId: string;
  tenantId: string;
  profileId: string;
  content: string;
  chunkIndex: number;
  totalChunks: number;
  embedding?: number[];
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ChunkStore {
  put(chunk: Chunk): Promise<void>;
  get(chunkId: string): Promise<Chunk | undefined>;
  listBySource(sourceId: string, tenantId: string): Promise<Chunk[]>;
  listByTenant(tenantId: string, profileId?: string): Promise<Chunk[]>;
  delete(chunkId: string): Promise<boolean>;
  deleteBySource(sourceId: string, tenantId: string): Promise<number>;
  count(tenantId: string, profileId?: string): Promise<number>;
}

// ─── Index Store ──────────────────────────────────────────────────────────────

export interface IndexPointer {
  pointerId: string;
  tenantId: string;
  profileId: string;
  activeVersion: string;
  pendingVersion?: string;
  lastRebuiltAt?: string;
  chunkCount: number;
  metadata: Record<string, unknown>;
}

export interface IndexStore {
  getPointer(tenantId: string, profileId: string): Promise<IndexPointer | undefined>;
  upsertPointer(pointer: IndexPointer): Promise<void>;
  swapPointer(tenantId: string, profileId: string, newVersion: string): Promise<IndexPointer>;
  snapshot(tenantId: string, profileId: string): Promise<string>;
}

// ─── Storage Registry ─────────────────────────────────────────────────────────

export interface StorageAdapters {
  rawDocumentStore: RawDocumentStore;
  chunkStore: ChunkStore;
  indexStore: IndexStore;
}
