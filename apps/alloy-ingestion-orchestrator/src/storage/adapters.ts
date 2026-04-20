/**
 * AEF Ingestion Orchestrator — Storage Adapter Stubs
 *
 * Stub adapter shells for pgvector, Azure AI Search, and object storage.
 * These satisfy the storage interfaces and will be backed by real
 * implementations in Phase 5+.
 *
 * Each stub throws a clear NOT_IMPLEMENTED error so integration tests can
 * detect misconfiguration early. Dev environments use the in-memory adapters
 * from ./dev.ts instead.
 */

import type {
  RawDocumentStore,
  RawDocument,
  ChunkStore,
  Chunk,
  IndexStore,
  IndexPointer,
} from "./interfaces.js";

function notImplemented(adapterName: string, method: string): never {
  throw new Error(
    `[${adapterName}] ${method} is not implemented. ` +
    "This is a Phase 5+ stub. Use the dev in-memory adapter in development.",
  );
}

// ─── pgvector Chunk Store Stub ────────────────────────────────────────────────

export class PgvectorChunkStoreStub implements ChunkStore {
  async put(_chunk: Chunk): Promise<void> { notImplemented("PgvectorChunkStore", "put"); }
  async get(_chunkId: string): Promise<Chunk | undefined> { notImplemented("PgvectorChunkStore", "get"); }
  async listBySource(_sourceId: string, _tenantId: string): Promise<Chunk[]> { notImplemented("PgvectorChunkStore", "listBySource"); }
  async listByTenant(_tenantId: string, _profileId?: string): Promise<Chunk[]> { notImplemented("PgvectorChunkStore", "listByTenant"); }
  async delete(_chunkId: string): Promise<boolean> { notImplemented("PgvectorChunkStore", "delete"); }
  async deleteBySource(_sourceId: string, _tenantId: string): Promise<number> { notImplemented("PgvectorChunkStore", "deleteBySource"); }
  async count(_tenantId: string, _profileId?: string): Promise<number> { notImplemented("PgvectorChunkStore", "count"); }
}

// ─── Azure AI Search Index Store Stub ─────────────────────────────────────────

export class AzureAiSearchIndexStoreStub implements IndexStore {
  async getPointer(_tenantId: string, _profileId: string): Promise<IndexPointer | undefined> { notImplemented("AzureAiSearchIndexStore", "getPointer"); }
  async upsertPointer(_pointer: IndexPointer): Promise<void> { notImplemented("AzureAiSearchIndexStore", "upsertPointer"); }
  async swapPointer(_tenantId: string, _profileId: string, _newVersion: string): Promise<IndexPointer> { notImplemented("AzureAiSearchIndexStore", "swapPointer"); }
  async snapshot(_tenantId: string, _profileId: string): Promise<string> { notImplemented("AzureAiSearchIndexStore", "snapshot"); }
}

// ─── Object Storage Raw Document Store Stub ───────────────────────────────────

export class ObjectStorageRawDocumentStoreStub implements RawDocumentStore {
  async put(_doc: RawDocument): Promise<void> { notImplemented("ObjectStorageRawDocumentStore", "put"); }
  async get(_sourceId: string, _tenantId: string): Promise<RawDocument | undefined> { notImplemented("ObjectStorageRawDocumentStore", "get"); }
  async list(_tenantId: string, _profileId?: string): Promise<RawDocument[]> { notImplemented("ObjectStorageRawDocumentStore", "list"); }
  async delete(_sourceId: string, _tenantId: string): Promise<boolean> { notImplemented("ObjectStorageRawDocumentStore", "delete"); }
}

// ─── Adapter Kind Registry ────────────────────────────────────────────────────

export type ChunkStoreKind = "dev" | "pgvector";
export type IndexStoreKind = "dev" | "azure-ai-search";
export type RawDocumentStoreKind = "dev" | "object-storage";

export const AVAILABLE_CHUNK_STORE_ADAPTERS: ChunkStoreKind[] = ["dev", "pgvector"];
export const AVAILABLE_INDEX_STORE_ADAPTERS: IndexStoreKind[] = ["dev", "azure-ai-search"];
export const AVAILABLE_RAW_DOC_STORE_ADAPTERS: RawDocumentStoreKind[] = ["dev", "object-storage"];
