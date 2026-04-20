export interface RawDocRecord {
  sourceId: string;
  tenantId: string;
  profileId?: string;
  title?: string;
  sourceUri?: string;
  contentType: string;
  content: string;
  metadata: Record<string, unknown>;
  ingestedAt: string;
}

export interface ChunkRecord {
  chunkId: string;
  sourceId: string;
  tenantId: string;
  profileId?: string;
  chunkIndex: number;
  text: string;
  tokenCount?: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface VectorRecord {
  chunkId: string;
  sourceId: string;
  tenantId: string;
  profileId?: string;
  model: string;
  dimensions: number;
  vector: number[];
  metadata: Record<string, unknown>;
  indexedAt: string;
}

export interface MetadataIndexRecord {
  chunkId: string;
  sourceId: string;
  tenantId: string;
  profileId?: string;
  title?: string;
  page?: number;
  section?: string;
  metadata: Record<string, unknown>;
  updatedAt: string;
}

export interface EvalFixtureRecord {
  fixtureId: string;
  profileId: string;
  tenantId: string;
  queryId: string;
  query: string;
  relevantChunkIds: string[];
  metadata: Record<string, unknown>;
}

export interface RawDocStore {
  upsert(doc: RawDocRecord): Promise<void>;
  get(sourceId: string, tenantId: string): Promise<RawDocRecord | undefined>;
  list(tenantId: string, profileId?: string): Promise<RawDocRecord[]>;
  delete(sourceId: string, tenantId: string): Promise<boolean>;
  count(tenantId: string): Promise<number>;
}

export interface ChunkStore {
  upsert(chunk: ChunkRecord): Promise<void>;
  get(chunkId: string): Promise<ChunkRecord | undefined>;
  listBySource(sourceId: string, tenantId: string): Promise<ChunkRecord[]>;
  listByTenant(tenantId: string, limit?: number): Promise<ChunkRecord[]>;
  delete(chunkId: string): Promise<boolean>;
  deleteBySource(sourceId: string, tenantId: string): Promise<number>;
  count(tenantId: string): Promise<number>;
}

export interface VectorStore {
  upsert(record: VectorRecord): Promise<void>;
  get(chunkId: string): Promise<VectorRecord | undefined>;
  similaritySearch(opts: {
    vector: number[];
    topK: number;
    tenantId: string;
    profileId?: string;
    metadataFilter?: Record<string, unknown>;
  }): Promise<
    Array<{ chunkId: string; sourceId: string; score: number; metadata: Record<string, unknown> }>
  >;
  delete(chunkId: string): Promise<boolean>;
  deleteBySource(sourceId: string, tenantId: string): Promise<number>;
  count(tenantId: string): Promise<number>;
}

export interface MetadataIndexStore {
  upsert(record: MetadataIndexRecord): Promise<void>;
  get(chunkId: string): Promise<MetadataIndexRecord | undefined>;
  keywordSearch(opts: {
    terms: string;
    topK: number;
    tenantId: string;
    metadataFilter?: Record<string, unknown>;
  }): Promise<
    Array<{
      chunkId: string;
      sourceId: string;
      score: number;
      highlights: string[];
      metadata: Record<string, unknown>;
    }>
  >;
  delete(chunkId: string): Promise<boolean>;
  deleteBySource(sourceId: string, tenantId: string): Promise<number>;
  count(tenantId: string): Promise<number>;
}

export interface EvalFixtureStore {
  upsert(fixture: EvalFixtureRecord): Promise<void>;
  get(fixtureId: string): Promise<EvalFixtureRecord | undefined>;
  listByProfile(profileId: string): Promise<EvalFixtureRecord[]>;
  delete(fixtureId: string): Promise<boolean>;
  count(profileId: string): Promise<number>;
}

export interface StorageBundle {
  rawDocs: RawDocStore;
  chunks: ChunkStore;
  vectors: VectorStore;
  metadataIndex: MetadataIndexStore;
  evalFixtures: EvalFixtureStore;
}
