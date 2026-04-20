import { beforeEach, describe, expect, it } from 'vitest';
import type { ChunkRecord, MetadataIndexRecord, RawDocRecord, VectorRecord } from './interfaces.js';
import { InMemoryStorageBundle } from './stubs.js';

let bundle: InMemoryStorageBundle;

beforeEach(() => {
  bundle = new InMemoryStorageBundle();
});

describe('InMemoryRawDocStore', () => {
  it('upserts and retrieves a document', async () => {
    const doc: RawDocRecord = {
      sourceId: 'doc-001',
      tenantId: 'tenant-a',
      contentType: 'text/plain',
      content: 'Full document content here.',
      metadata: { author: 'test' },
      ingestedAt: new Date().toISOString(),
    };
    await bundle.rawDocs.upsert(doc);
    const retrieved = await bundle.rawDocs.get('doc-001', 'tenant-a');
    expect(retrieved).toBeDefined();
    expect(retrieved?.content).toBe('Full document content here.');
  });

  it('returns undefined for missing document', async () => {
    const result = await bundle.rawDocs.get('missing', 'tenant-a');
    expect(result).toBeUndefined();
  });

  it('deletes a document', async () => {
    const doc: RawDocRecord = {
      sourceId: 'del-001',
      tenantId: 'tenant-a',
      contentType: 'text/plain',
      content: 'content',
      metadata: {},
      ingestedAt: new Date().toISOString(),
    };
    await bundle.rawDocs.upsert(doc);
    const deleted = await bundle.rawDocs.delete('del-001', 'tenant-a');
    expect(deleted).toBe(true);
    expect(await bundle.rawDocs.get('del-001', 'tenant-a')).toBeUndefined();
  });

  it('counts by tenant', async () => {
    await bundle.rawDocs.upsert({
      sourceId: 'd1',
      tenantId: 't1',
      contentType: 'text/plain',
      content: 'c',
      metadata: {},
      ingestedAt: new Date().toISOString(),
    });
    await bundle.rawDocs.upsert({
      sourceId: 'd2',
      tenantId: 't1',
      contentType: 'text/plain',
      content: 'c',
      metadata: {},
      ingestedAt: new Date().toISOString(),
    });
    await bundle.rawDocs.upsert({
      sourceId: 'd3',
      tenantId: 't2',
      contentType: 'text/plain',
      content: 'c',
      metadata: {},
      ingestedAt: new Date().toISOString(),
    });
    expect(await bundle.rawDocs.count('t1')).toBe(2);
    expect(await bundle.rawDocs.count('t2')).toBe(1);
  });
});

describe('InMemoryChunkStore', () => {
  it('upserts and retrieves a chunk', async () => {
    const chunk: ChunkRecord = {
      chunkId: 'chunk-001',
      sourceId: 'doc-001',
      tenantId: 'tenant-a',
      chunkIndex: 0,
      text: 'First chunk text.',
      metadata: {},
      createdAt: new Date().toISOString(),
    };
    await bundle.chunks.upsert(chunk);
    const retrieved = await bundle.chunks.get('chunk-001');
    expect(retrieved?.text).toBe('First chunk text.');
  });

  it('lists chunks by source in order', async () => {
    for (let i = 0; i < 3; i++) {
      await bundle.chunks.upsert({
        chunkId: `chunk-00${i}`,
        sourceId: 'doc-001',
        tenantId: 'tenant-a',
        chunkIndex: i,
        text: `Chunk ${i}`,
        metadata: {},
        createdAt: new Date().toISOString(),
      });
    }
    const chunks = await bundle.chunks.listBySource('doc-001', 'tenant-a');
    expect(chunks).toHaveLength(3);
    expect(chunks[0]?.chunkIndex).toBe(0);
    expect(chunks[2]?.chunkIndex).toBe(2);
  });

  it('deletes chunks by source', async () => {
    await bundle.chunks.upsert({
      chunkId: 'c1',
      sourceId: 'doc-del',
      tenantId: 't1',
      chunkIndex: 0,
      text: 'text',
      metadata: {},
      createdAt: new Date().toISOString(),
    });
    await bundle.chunks.upsert({
      chunkId: 'c2',
      sourceId: 'doc-del',
      tenantId: 't1',
      chunkIndex: 1,
      text: 'text',
      metadata: {},
      createdAt: new Date().toISOString(),
    });
    const deleted = await bundle.chunks.deleteBySource('doc-del', 't1');
    expect(deleted).toBe(2);
  });
});

describe('InMemoryVectorStore', () => {
  it('upserts and retrieves a vector record', async () => {
    const rec: VectorRecord = {
      chunkId: 'chunk-vec-001',
      sourceId: 'doc-001',
      tenantId: 'tenant-a',
      model: 'aef-embed-v1',
      dimensions: 3,
      vector: [0.1, 0.5, 0.3],
      metadata: {},
      indexedAt: new Date().toISOString(),
    };
    await bundle.vectors.upsert(rec);
    const retrieved = await bundle.vectors.get('chunk-vec-001');
    expect(retrieved?.dimensions).toBe(3);
    expect(retrieved?.vector).toHaveLength(3);
  });

  it('performs similarity search returning ranked results', async () => {
    await bundle.vectors.upsert({
      chunkId: 'v1',
      sourceId: 'doc-001',
      tenantId: 't1',
      model: 'm',
      dimensions: 3,
      vector: [1, 0, 0],
      metadata: {},
      indexedAt: new Date().toISOString(),
    });
    await bundle.vectors.upsert({
      chunkId: 'v2',
      sourceId: 'doc-002',
      tenantId: 't1',
      model: 'm',
      dimensions: 3,
      vector: [0, 1, 0],
      metadata: {},
      indexedAt: new Date().toISOString(),
    });
    await bundle.vectors.upsert({
      chunkId: 'v3',
      sourceId: 'doc-003',
      tenantId: 't2',
      model: 'm',
      dimensions: 3,
      vector: [1, 0, 0],
      metadata: {},
      indexedAt: new Date().toISOString(),
    });

    const results = await bundle.vectors.similaritySearch({
      vector: [1, 0, 0],
      topK: 5,
      tenantId: 't1',
    });
    expect(results).toHaveLength(2);
    expect(results[0]?.chunkId).toBe('v1');
    expect(results[0]?.score).toBeCloseTo(1.0);
  });

  it('excludes cross-tenant results', async () => {
    await bundle.vectors.upsert({
      chunkId: 'cross-v',
      sourceId: 'doc-x',
      tenantId: 'other-tenant',
      model: 'm',
      dimensions: 3,
      vector: [1, 0, 0],
      metadata: {},
      indexedAt: new Date().toISOString(),
    });
    const results = await bundle.vectors.similaritySearch({
      vector: [1, 0, 0],
      topK: 5,
      tenantId: 'tenant-a',
    });
    expect(results).toHaveLength(0);
  });
});

describe('InMemoryMetadataIndexStore', () => {
  it('performs keyword search', async () => {
    const rec: MetadataIndexRecord = {
      chunkId: 'm1',
      sourceId: 'doc-001',
      tenantId: 't1',
      title: 'Maritime Sanctions Report',
      metadata: { vessel: 'MV Test' },
      updatedAt: new Date().toISOString(),
    };
    await bundle.metadataIndex.upsert(rec);
    const results = await bundle.metadataIndex.keywordSearch({
      terms: 'sanctions maritime',
      topK: 5,
      tenantId: 't1',
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.chunkId).toBe('m1');
  });

  it('returns empty when no keyword match', async () => {
    const rec: MetadataIndexRecord = {
      chunkId: 'm2',
      sourceId: 'doc-002',
      tenantId: 't1',
      title: 'Unrelated Content',
      metadata: {},
      updatedAt: new Date().toISOString(),
    };
    await bundle.metadataIndex.upsert(rec);
    const results = await bundle.metadataIndex.keywordSearch({
      terms: 'sanctions maritime',
      topK: 5,
      tenantId: 't1',
    });
    const found = results.find((r) => r.chunkId === 'm2');
    expect(found).toBeUndefined();
  });
});

describe('InMemoryEvalFixtureStore', () => {
  it('upserts and retrieves fixture records', async () => {
    await bundle.evalFixtures.upsert({
      fixtureId: 'fix-001',
      profileId: 'vessels_maritime_risk',
      tenantId: 't1',
      queryId: 'q1',
      query: 'IMO 9123456 vessel',
      relevantChunkIds: ['chunk-a', 'chunk-b'],
      metadata: {},
    });
    const all = await bundle.evalFixtures.listByProfile('vessels_maritime_risk');
    expect(all).toHaveLength(1);
    expect(all[0]?.relevantChunkIds).toHaveLength(2);
  });
});
