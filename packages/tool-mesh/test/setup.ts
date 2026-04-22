import { beforeAll, vi } from 'vitest';

beforeAll(() => {
  process.env.AEF_GATEWAY_URL = process.env.AEF_GATEWAY_URL ?? 'http://aef.test.local';
  process.env.AEF_API_KEY = process.env.AEF_API_KEY ?? 'test-key';
  process.env.AEF_TENANT_ID = process.env.AEF_TENANT_ID ?? 'szl-holdings';
});

vi.mock('@workspace/aef-sdk/client', () => {
  class MockAefClient {
    async hybridSearch(req: { requestId?: string; query: string; profileId?: string }) {
      return {
        requestId: req.requestId ?? 'mock-req',
        tenantId: 'szl-holdings',
        profileId: req.profileId,
        traceId: 'mock-trace',
        retrievalPath: ['mock'],
        hits: [
          {
            documentId: 'mock-doc-1',
            chunkId: 'mock-chunk-1',
            text: `mock retrieval result for ${req.query}`,
            fusedScore: 0.9,
            finalScore: 0.9,
            boostApplied: false,
            metadata: {},
          },
        ],
        totalCandidates: 1,
        processingMs: 1,
      };
    }
  }
  return { AefClient: MockAefClient };
});
