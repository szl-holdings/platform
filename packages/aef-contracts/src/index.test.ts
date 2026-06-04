import { describe, expect, it } from 'vitest';
import {
  AefEventSchema,
  AefEvidenceObjectSchema,
  BackendDescriptorSchema,
  EmbedRequestSchema,
  EmbedResponseSchema,
  EvalRunRequestSchema,
  HybridSearchRequestSchema,
  IndexRebuildRequestSchema,
  IndexVerifyRequestSchema,
  IngestRequestSchema,
  OpenAIEmbedRequestSchema,
  OpenAIEmbedResponseSchema,
  ProfileDescriptorSchema,
  RerankRequestSchema,
  TenantIdentitySchema,
  TenantIdSchema,
} from './index.js';

describe('TenantIdSchema', () => {
  it('accepts a non-empty string', () => {
    const result = TenantIdSchema.safeParse('tenant-abc');
    expect(result.success).toBe(true);
  });

  it('rejects an empty string', () => {
    const result = TenantIdSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});

describe('TenantIdentitySchema', () => {
  it('parses a minimal tenant identity', () => {
    const result = TenantIdentitySchema.safeParse({
      tenantId: 't-001',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.retentionDays).toBe(90);
      expect(result.data.provenanceRequired).toBe(false);
    }
  });

  it('rejects missing tenantId', () => {
    const result = TenantIdentitySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('ProfileDescriptorSchema', () => {
  it('parses a valid profile descriptor', () => {
    const result = ProfileDescriptorSchema.safeParse({
      profileId: 'maritime-v1',
      version: '1.0.0',
      domain: 'maritime',
      displayName: 'Maritime Profile',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid semver version', () => {
    const result = ProfileDescriptorSchema.safeParse({
      profileId: 'maritime-v1',
      version: '1.0',
      domain: 'maritime',
      displayName: 'Maritime Profile',
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown domain', () => {
    const result = ProfileDescriptorSchema.safeParse({
      profileId: 'x',
      version: '1.0.0',
      domain: 'unknown-domain',
      displayName: 'X',
    });
    expect(result.success).toBe(false);
  });
});

describe('EmbedRequestSchema', () => {
  it('parses a valid embed request', () => {
    const result = EmbedRequestSchema.safeParse({
      requestId: 'req-1',
      tenantId: 't-001',
      texts: ['hello world'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty texts array', () => {
    const result = EmbedRequestSchema.safeParse({
      requestId: 'req-1',
      tenantId: 't-001',
      texts: [],
    });
    expect(result.success).toBe(false);
  });

  it('defaults normalize to true', () => {
    const result = EmbedRequestSchema.safeParse({
      requestId: 'req-1',
      tenantId: 't-001',
      texts: ['text'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.normalize).toBe(true);
    }
  });
});

describe('EmbedResponseSchema', () => {
  it('parses a valid embed response', () => {
    const result = EmbedResponseSchema.safeParse({
      requestId: 'req-1',
      tenantId: 't-001',
      model: 'aef-embed-v1',
      dimensions: 768,
      vectors: [{ index: 0, text: 'hello world', vector: [0.1, 0.2, 0.3] }],
    });
    expect(result.success).toBe(true);
  });
});

describe('RerankRequestSchema', () => {
  it('parses a valid rerank request', () => {
    const result = RerankRequestSchema.safeParse({
      requestId: 'req-2',
      tenantId: 't-001',
      query: 'vessel sanctions',
      candidates: [
        { id: 'c1', text: 'Ship ABC was sanctioned in 2023' },
        { id: 'c2', text: 'Vessel DEF has clean record' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty candidates array', () => {
    const result = RerankRequestSchema.safeParse({
      requestId: 'req-2',
      tenantId: 't-001',
      query: 'query',
      candidates: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('HybridSearchRequestSchema', () => {
  it('parses with defaults applied', () => {
    const result = HybridSearchRequestSchema.safeParse({
      requestId: 'req-3',
      tenantId: 't-001',
      query: 'Gulf of Mexico fleet',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.topK).toBe(10);
      expect(result.data.denseWeight).toBe(0.6);
      expect(result.data.keywordWeight).toBe(0.4);
      expect(result.data.rerankEnabled).toBe(false);
    }
  });

  it('rejects empty query', () => {
    const result = HybridSearchRequestSchema.safeParse({
      requestId: 'req-3',
      tenantId: 't-001',
      query: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('IngestRequestSchema', () => {
  it('parses a valid ingest request', () => {
    const result = IngestRequestSchema.safeParse({
      requestId: 'req-4',
      tenantId: 't-001',
      documents: [{ sourceId: 'doc-1', content: 'The full text of a document.' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects document with empty content', () => {
    const result = IngestRequestSchema.safeParse({
      requestId: 'req-4',
      tenantId: 't-001',
      documents: [{ sourceId: 'doc-1', content: '' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('IndexRebuildRequestSchema', () => {
  it('parses a valid rebuild request', () => {
    const result = IndexRebuildRequestSchema.safeParse({
      requestId: 'req-5',
      tenantId: 't-001',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullRebuild).toBe(false);
    }
  });
});

describe('IndexVerifyRequestSchema', () => {
  it('parses a verify request with optional sourceIds', () => {
    const result = IndexVerifyRequestSchema.safeParse({
      requestId: 'req-6',
      tenantId: 't-001',
      sourceIds: ['doc-1', 'doc-2'],
    });
    expect(result.success).toBe(true);
  });
});

describe('EvalRunRequestSchema', () => {
  it('parses a valid eval run', () => {
    const result = EvalRunRequestSchema.safeParse({
      requestId: 'req-7',
      tenantId: 't-001',
      profileId: 'maritime-v1',
      datasetId: 'maritime-bench-001',
      queries: [{ queryId: 'q1', query: 'IMO 9123456', relevantChunkIds: ['chunk-a'] }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metrics).toContain('ndcg');
    }
  });

  it('rejects empty queries array', () => {
    const result = EvalRunRequestSchema.safeParse({
      requestId: 'req-7',
      tenantId: 't-001',
      profileId: 'maritime-v1',
      datasetId: 'bench',
      queries: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('OpenAIEmbedRequestSchema', () => {
  it('accepts string input', () => {
    const result = OpenAIEmbedRequestSchema.safeParse({ input: 'hello' });
    expect(result.success).toBe(true);
  });

  it('accepts array input', () => {
    const result = OpenAIEmbedRequestSchema.safeParse({ input: ['hello', 'world'] });
    expect(result.success).toBe(true);
  });

  it('rejects numeric input', () => {
    const result = OpenAIEmbedRequestSchema.safeParse({ input: 42 });
    expect(result.success).toBe(false);
  });
});

describe('OpenAIEmbedResponseSchema', () => {
  it('parses a valid OpenAI-compatible response', () => {
    const result = OpenAIEmbedResponseSchema.safeParse({
      object: 'list',
      data: [{ object: 'embedding', embedding: [0.1, 0.2], index: 0 }],
      model: 'aef-embed-v1',
      usage: { prompt_tokens: 3, total_tokens: 3 },
    });
    expect(result.success).toBe(true);
  });
});

describe('AefEvidenceObjectSchema', () => {
  it('parses a complete evidence object', () => {
    const now = new Date().toISOString();
    const result = AefEvidenceObjectSchema.safeParse({
      evidenceId: 'ev-001',
      requestId: 'req-1',
      tenantId: 't-001',
      chunkId: 'chunk-1',
      sourceId: 'doc-1',
      finalScore: 0.92,
      policyAllow: true,
      requestedAt: now,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing finalScore', () => {
    const now = new Date().toISOString();
    const result = AefEvidenceObjectSchema.safeParse({
      evidenceId: 'ev-001',
      requestId: 'req-1',
      tenantId: 't-001',
      chunkId: 'chunk-1',
      sourceId: 'doc-1',
      policyAllow: true,
      requestedAt: now,
    });
    expect(result.success).toBe(false);
  });
});

describe('AefEventSchema', () => {
  it('parses a valid AEF event', () => {
    const result = AefEventSchema.safeParse({
      eventId: 'evt-001',
      kind: 'aef.search.completed',
      requestId: 'req-1',
      tenantId: 't-001',
      occurredAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown event kind', () => {
    const result = AefEventSchema.safeParse({
      eventId: 'evt-001',
      kind: 'aef.unknown.event',
      requestId: 'req-1',
      tenantId: 't-001',
      occurredAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});

describe('BackendDescriptorSchema', () => {
  it('parses a valid backend descriptor', () => {
    const result = BackendDescriptorSchema.safeParse({
      backendId: 'primary',
      displayName: 'Primary Backend',
      denseKind: 'pgvector',
      keywordKind: 'pg-tsvector',
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown denseKind', () => {
    const result = BackendDescriptorSchema.safeParse({
      backendId: 'primary',
      displayName: 'Primary',
      denseKind: 'milvus',
      keywordKind: 'pg-tsvector',
    });
    expect(result.success).toBe(false);
  });
});
