import type {
  EmbedRequest,
  EmbedResponse,
  HybridSearchRequest,
  HybridSearchResponse,
  IngestRequest,
  IngestResponse,
  RerankRequest,
  RerankResponse,
} from '@workspace/aef-contracts';
import {
  ReceiptChain,
  type AuditClosureReceipt,
  type LambdaReceipt,
} from '@szl-holdings/szl-receipts';

import type { AefReceiptsHandle } from '../client.js';
import { generateId } from '../uuid.js';

/**
 * Canned responses for each AEF endpoint. Any omitted handler falls back to
 * a minimal valid default so a flow can run end-to-end and tests can focus
 * on asserting on the emitted receipt chain.
 */
export interface AefMockResponses {
  embed?: (req: EmbedRequest) => EmbedResponse | Promise<EmbedResponse>;
  rerank?: (req: RerankRequest) => RerankResponse | Promise<RerankResponse>;
  hybridSearch?: (req: HybridSearchRequest) => HybridSearchResponse | Promise<HybridSearchResponse>;
  ingest?: (req: IngestRequest) => IngestResponse | Promise<IngestResponse>;
}

export interface AefMockClientOptions {
  tenantId?: string;
  operatorId?: string;
  responses?: AefMockResponses;
}

class MockEnabledReceipts implements AefReceiptsHandle {
  readonly enabled = true;
  constructor(public readonly chain: ReceiptChain) {}
  merkleRoot(): Promise<string> { return this.chain.merkleRoot(); }
  readAll(): Promise<LambdaReceipt[]> { return this.chain.readAll(); }
  close(): Promise<AuditClosureReceipt> { return this.chain.close(); }
}

const DEFAULTS: Required<AefMockResponses> = {
  embed: (req) => ({
    requestId: req.requestId,
    tenantId: req.tenantId,
    model: req.model ?? 'mock-embedder',
    dimensions: 1,
    vectors: req.texts.map((text, index) => ({ index, text, vector: [0] })),
  }),
  rerank: (req) => ({
    requestId: req.requestId,
    tenantId: req.tenantId,
    model: req.model ?? 'mock-reranker',
    results: req.candidates.slice(0, req.topK ?? 10).map((c, rank) => ({
      id: c.id,
      score: 1 - rank * 0.01,
      rank,
      text: c.text,
      metadata: c.metadata ?? {},
    })),
  }),
  hybridSearch: (req) => ({
    requestId: req.requestId,
    tenantId: req.tenantId,
    traceId: req.requestId,
    retrievalPath: [],
    hits: [],
    totalCandidates: 0,
  }),
  ingest: (req) => ({
    requestId: req.requestId,
    tenantId: req.tenantId,
    results: req.documents.map((d) => ({
      sourceId: d.sourceId,
      chunksProduced: 1,
      chunksIndexed: 1,
    })),
    totalChunksIndexed: req.documents.length,
  }),
};

type WithDefaults<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * AefMockClient — drop-in test double for {@link AefClient}.
 *
 * Exposes the same public surface (`embed`, `rerank`, `hybridSearch`,
 * `ingest`, `receipts`) but never touches the network. Every call appends a
 * `LambdaReceipt` to the same {@link ReceiptChain} the real client uses, so
 * tests can assert on the receipt chain — e.g. "exactly 3 receipts on
 * `/v1/embed`, none on `/v1/rerank`" — to verify governance behavior.
 *
 * @example
 * ```ts
 * const client = new AefMockClient({ tenantId: 't1' });
 * await client.embed({ inputs: ['hi'], model: 'm' });
 * const all = await client.receipts.readAll();
 * expect(all).toHaveLength(1);
 * expect(all[0].endpoint).toBe('/v1/embed');
 * ```
 */
export class AefMockClient {
  readonly receipts: AefReceiptsHandle;
  readonly chain: ReceiptChain;
  private readonly tenantId: string;
  private readonly responses: Required<AefMockResponses>;

  constructor(options: AefMockClientOptions = {}) {
    this.tenantId = options.tenantId ?? 'mock-tenant';
    this.chain = new ReceiptChain({ operatorId: options.operatorId ?? 'mock@aef' });
    this.receipts = new MockEnabledReceipts(this.chain);
    this.responses = { ...DEFAULTS, ...(options.responses ?? {}) };
  }

  private async record(endpoint: string, params: unknown, result: unknown): Promise<void> {
    await this.chain.append({
      endpoint,
      method: 'MOCK',
      params,
      result,
      metadata: { tenantId: this.tenantId, mock: true },
    });
  }

  async embed(
    request: WithDefaults<Omit<EmbedRequest, 'requestId' | 'tenantId'>, 'normalize' | 'metadata'> & {
      requestId?: string;
    },
  ): Promise<EmbedResponse> {
    const body: EmbedRequest = {
      normalize: true,
      metadata: {},
      ...request,
      requestId: request.requestId ?? generateId(),
      tenantId: this.tenantId as EmbedRequest['tenantId'],
    };
    const result = await this.responses.embed(body);
    await this.record('/v1/embed', body, result);
    return result;
  }

  async rerank(
    request: WithDefaults<Omit<RerankRequest, 'requestId' | 'tenantId'>, 'topK' | 'metadata'> & {
      requestId?: string;
    },
  ): Promise<RerankResponse> {
    const body: RerankRequest = {
      topK: 10,
      metadata: {},
      ...request,
      requestId: request.requestId ?? generateId(),
      tenantId: this.tenantId as RerankRequest['tenantId'],
    };
    const result = await this.responses.rerank(body);
    await this.record('/v1/rerank', body, result);
    return result;
  }

  async hybridSearch(
    request: WithDefaults<
      Omit<HybridSearchRequest, 'requestId' | 'tenantId'>,
      | 'topK'
      | 'candidatePool'
      | 'denseWeight'
      | 'keywordWeight'
      | 'rerankEnabled'
      | 'includeProvenance'
      | 'metadata'
    > & { requestId?: string },
  ): Promise<HybridSearchResponse> {
    const body: HybridSearchRequest = {
      topK: 10,
      candidatePool: 100,
      denseWeight: 0.6,
      keywordWeight: 0.4,
      rerankEnabled: false,
      includeProvenance: true,
      metadata: {},
      ...request,
      requestId: request.requestId ?? generateId(),
      tenantId: this.tenantId as HybridSearchRequest['tenantId'],
    };
    const result = await this.responses.hybridSearch(body);
    await this.record('/v1/hybrid-search', body, result);
    return result;
  }

  async ingest(
    request: WithDefaults<
      Omit<IngestRequest, 'requestId' | 'tenantId'>,
      'chunkSize' | 'chunkOverlap' | 'metadata'
    > & { requestId?: string },
  ): Promise<IngestResponse> {
    const body: IngestRequest = {
      chunkSize: 512,
      chunkOverlap: 64,
      metadata: {},
      ...request,
      requestId: request.requestId ?? generateId(),
      tenantId: this.tenantId as IngestRequest['tenantId'],
    };
    const result = await this.responses.ingest(body);
    await this.record('/v1/ingest', body, result);
    return result;
  }
}
