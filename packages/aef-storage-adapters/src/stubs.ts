import type {
  ChunkRecord,
  ChunkStore,
  EvalFixtureRecord,
  EvalFixtureStore,
  MetadataIndexRecord,
  MetadataIndexStore,
  RawDocRecord,
  RawDocStore,
  StorageBundle,
  VectorRecord,
  VectorStore,
} from './interfaces.js';

function notImplemented(name: string): never {
  throw new Error(
    `${name}: this is a stub adapter. Implement the production adapter for this backend before use. ` +
      'See docs/aef/architecture.md for connection guidance.',
  );
}

export class PgvectorVectorStoreStub implements VectorStore {
  constructor(private readonly connectionString: string) {}

  async upsert(_record: VectorRecord): Promise<void> {
    notImplemented('PgvectorVectorStoreStub.upsert');
  }
  async get(_chunkId: string): Promise<VectorRecord | undefined> {
    notImplemented('PgvectorVectorStoreStub.get');
  }
  async similaritySearch(
    _opts: Parameters<VectorStore['similaritySearch']>[0],
  ): ReturnType<VectorStore['similaritySearch']> {
    notImplemented('PgvectorVectorStoreStub.similaritySearch');
  }
  async delete(_chunkId: string): Promise<boolean> {
    notImplemented('PgvectorVectorStoreStub.delete');
  }
  async deleteBySource(_sourceId: string, _tenantId: string): Promise<number> {
    notImplemented('PgvectorVectorStoreStub.deleteBySource');
  }
  async count(_tenantId: string): Promise<number> {
    notImplemented('PgvectorVectorStoreStub.count');
  }
}

export class AzureAISearchVectorStoreStub implements VectorStore {
  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string,
    private readonly indexName: string,
  ) {}

  async upsert(_record: VectorRecord): Promise<void> {
    notImplemented('AzureAISearchVectorStoreStub.upsert');
  }
  async get(_chunkId: string): Promise<VectorRecord | undefined> {
    notImplemented('AzureAISearchVectorStoreStub.get');
  }
  async similaritySearch(
    _opts: Parameters<VectorStore['similaritySearch']>[0],
  ): ReturnType<VectorStore['similaritySearch']> {
    notImplemented('AzureAISearchVectorStoreStub.similaritySearch');
  }
  async delete(_chunkId: string): Promise<boolean> {
    notImplemented('AzureAISearchVectorStoreStub.delete');
  }
  async deleteBySource(_sourceId: string, _tenantId: string): Promise<number> {
    notImplemented('AzureAISearchVectorStoreStub.deleteBySource');
  }
  async count(_tenantId: string): Promise<number> {
    notImplemented('AzureAISearchVectorStoreStub.count');
  }
}

export class AzureAISearchMetadataIndexStoreStub implements MetadataIndexStore {
  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string,
    private readonly indexName: string,
  ) {}

  async upsert(_record: MetadataIndexRecord): Promise<void> {
    notImplemented('AzureAISearchMetadataIndexStoreStub.upsert');
  }
  async get(_chunkId: string): Promise<MetadataIndexRecord | undefined> {
    notImplemented('AzureAISearchMetadataIndexStoreStub.get');
  }
  async keywordSearch(
    _opts: Parameters<MetadataIndexStore['keywordSearch']>[0],
  ): ReturnType<MetadataIndexStore['keywordSearch']> {
    notImplemented('AzureAISearchMetadataIndexStoreStub.keywordSearch');
  }
  async delete(_chunkId: string): Promise<boolean> {
    notImplemented('AzureAISearchMetadataIndexStoreStub.delete');
  }
  async deleteBySource(_sourceId: string, _tenantId: string): Promise<number> {
    notImplemented('AzureAISearchMetadataIndexStoreStub.deleteBySource');
  }
  async count(_tenantId: string): Promise<number> {
    notImplemented('AzureAISearchMetadataIndexStoreStub.count');
  }
}

export class ObjectStorageRawDocStoreStub implements RawDocStore {
  constructor(private readonly bucketUrl: string) {}

  async upsert(_doc: RawDocRecord): Promise<void> {
    notImplemented('ObjectStorageRawDocStoreStub.upsert');
  }
  async get(_sourceId: string, _tenantId: string): Promise<RawDocRecord | undefined> {
    notImplemented('ObjectStorageRawDocStoreStub.get');
  }
  async list(_tenantId: string, _profileId?: string): Promise<RawDocRecord[]> {
    notImplemented('ObjectStorageRawDocStoreStub.list');
  }
  async delete(_sourceId: string, _tenantId: string): Promise<boolean> {
    notImplemented('ObjectStorageRawDocStoreStub.delete');
  }
  async count(_tenantId: string): Promise<number> {
    notImplemented('ObjectStorageRawDocStoreStub.count');
  }
}

export class ObjectStorageChunkStoreStub implements ChunkStore {
  constructor(private readonly bucketUrl: string) {}

  async upsert(_chunk: ChunkRecord): Promise<void> {
    notImplemented('ObjectStorageChunkStoreStub.upsert');
  }
  async get(_chunkId: string): Promise<ChunkRecord | undefined> {
    notImplemented('ObjectStorageChunkStoreStub.get');
  }
  async listBySource(_sourceId: string, _tenantId: string): Promise<ChunkRecord[]> {
    notImplemented('ObjectStorageChunkStoreStub.listBySource');
  }
  async listByTenant(_tenantId: string, _limit?: number): Promise<ChunkRecord[]> {
    notImplemented('ObjectStorageChunkStoreStub.listByTenant');
  }
  async delete(_chunkId: string): Promise<boolean> {
    notImplemented('ObjectStorageChunkStoreStub.delete');
  }
  async deleteBySource(_sourceId: string, _tenantId: string): Promise<number> {
    notImplemented('ObjectStorageChunkStoreStub.deleteBySource');
  }
  async count(_tenantId: string): Promise<number> {
    notImplemented('ObjectStorageChunkStoreStub.count');
  }
}

export class InMemoryStorageBundle implements StorageBundle {
  rawDocs: RawDocStore;
  chunks: ChunkStore;
  vectors: VectorStore;
  metadataIndex: MetadataIndexStore;
  evalFixtures: EvalFixtureStore;

  constructor() {
    this.rawDocs = new InMemoryRawDocStore();
    this.chunks = new InMemoryChunkStore();
    this.vectors = new InMemoryVectorStore();
    this.metadataIndex = new InMemoryMetadataIndexStore();
    this.evalFixtures = new InMemoryEvalFixtureStore();
  }
}

class InMemoryRawDocStore implements RawDocStore {
  private store = new Map<string, RawDocRecord>();
  private key(s: string, t: string) {
    return `${t}::${s}`;
  }
  async upsert(doc: RawDocRecord) {
    this.store.set(this.key(doc.sourceId, doc.tenantId), { ...doc });
  }
  async get(s: string, t: string) {
    return this.store.get(this.key(s, t));
  }
  async list(t: string, p?: string) {
    return [...this.store.values()].filter((d) => d.tenantId === t && (!p || d.profileId === p));
  }
  async delete(s: string, t: string) {
    return this.store.delete(this.key(s, t));
  }
  async count(t: string) {
    return [...this.store.values()].filter((d) => d.tenantId === t).length;
  }
}

class InMemoryChunkStore implements ChunkStore {
  private store = new Map<string, ChunkRecord>();
  async upsert(c: ChunkRecord) {
    this.store.set(c.chunkId, { ...c });
  }
  async get(id: string) {
    return this.store.get(id);
  }
  async listBySource(s: string, t: string) {
    return [...this.store.values()]
      .filter((c) => c.sourceId === s && c.tenantId === t)
      .sort((a, b) => a.chunkIndex - b.chunkIndex);
  }
  async listByTenant(t: string, limit = 100) {
    return [...this.store.values()].filter((c) => c.tenantId === t).slice(0, limit);
  }
  async delete(id: string) {
    return this.store.delete(id);
  }
  async deleteBySource(s: string, t: string) {
    let n = 0;
    for (const [k, v] of this.store) {
      if (v.sourceId === s && v.tenantId === t) {
        this.store.delete(k);
        n++;
      }
    }
    return n;
  }
  async count(t: string) {
    return [...this.store.values()].filter((c) => c.tenantId === t).length;
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
    normA += (a[i] ?? 0) ** 2;
    normB += (b[i] ?? 0) ** 2;
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

class InMemoryVectorStore implements VectorStore {
  private store = new Map<string, VectorRecord>();
  async upsert(r: VectorRecord) {
    this.store.set(r.chunkId, { ...r, vector: [...r.vector] });
  }
  async get(id: string) {
    const r = this.store.get(id);
    return r ? { ...r, vector: [...r.vector] } : undefined;
  }
  async similaritySearch(opts: Parameters<VectorStore['similaritySearch']>[0]) {
    const results = [...this.store.values()]
      .filter(
        (r) => r.tenantId === opts.tenantId && (!opts.profileId || r.profileId === opts.profileId),
      )
      .filter((r) => {
        if (!opts.metadataFilter) return true;
        return Object.entries(opts.metadataFilter).every(([k, v]) => r.metadata[k] === v);
      })
      .map((r) => ({
        chunkId: r.chunkId,
        sourceId: r.sourceId,
        score: cosineSimilarity(opts.vector, r.vector),
        metadata: r.metadata,
      }))
      .sort((a, b) => b.score - a.score);
    return results.slice(0, opts.topK);
  }
  async delete(id: string) {
    return this.store.delete(id);
  }
  async deleteBySource(s: string, t: string) {
    let n = 0;
    for (const [k, v] of this.store) {
      if (v.sourceId === s && v.tenantId === t) {
        this.store.delete(k);
        n++;
      }
    }
    return n;
  }
  async count(t: string) {
    return [...this.store.values()].filter((r) => r.tenantId === t).length;
  }
}

class InMemoryMetadataIndexStore implements MetadataIndexStore {
  private store = new Map<string, MetadataIndexRecord>();
  async upsert(r: MetadataIndexRecord) {
    this.store.set(r.chunkId, { ...r });
  }
  async get(id: string) {
    return this.store.get(id);
  }
  async keywordSearch(opts: Parameters<MetadataIndexStore['keywordSearch']>[0]) {
    const words = opts.terms.toLowerCase().split(/\s+/).filter(Boolean);
    return [...this.store.values()]
      .filter((r) => r.tenantId === opts.tenantId)
      .filter((r) => {
        if (!opts.metadataFilter) return true;
        return Object.entries(opts.metadataFilter).every(([k, v]) => r.metadata[k] === v);
      })
      .map((r) => {
        const text = [r.title, r.section, ...Object.values(r.metadata).map(String)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        const hits = words.filter((w) => text.includes(w));
        const score = words.length > 0 ? hits.length / words.length : 0;
        return score > 0
          ? {
              chunkId: r.chunkId,
              sourceId: r.sourceId,
              score,
              highlights: hits,
              metadata: r.metadata,
            }
          : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, opts.topK);
  }
  async delete(id: string) {
    return this.store.delete(id);
  }
  async deleteBySource(s: string, t: string) {
    let n = 0;
    for (const [k, v] of this.store) {
      if (v.sourceId === s && v.tenantId === t) {
        this.store.delete(k);
        n++;
      }
    }
    return n;
  }
  async count(t: string) {
    return [...this.store.values()].filter((r) => r.tenantId === t).length;
  }
}

class InMemoryEvalFixtureStore implements EvalFixtureStore {
  private store = new Map<string, EvalFixtureRecord>();
  async upsert(f: EvalFixtureRecord) {
    this.store.set(f.fixtureId, { ...f });
  }
  async get(id: string) {
    return this.store.get(id);
  }
  async listByProfile(p: string) {
    return [...this.store.values()].filter((f) => f.profileId === p);
  }
  async delete(id: string) {
    return this.store.delete(id);
  }
  async count(p: string) {
    return [...this.store.values()].filter((f) => f.profileId === p).length;
  }
}
