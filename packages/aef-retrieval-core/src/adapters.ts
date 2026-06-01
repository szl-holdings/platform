export interface DenseHit {
  chunkId: string;
  sourceId: string;
  score: number;
  vector?: number[];
  metadata: Record<string, unknown>;
}

export interface KeywordHit {
  chunkId: string;
  sourceId: string;
  score: number;
  highlights?: string[];
  metadata: Record<string, unknown>;
}

export interface RerankInput {
  id: string;
  text: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface RerankOutput {
  id: string;
  score: number;
  rank: number;
}

export interface DenseQueryOptions {
  vector: number[];
  topK: number;
  metadataFilter?: Record<string, unknown>;
  tenantId: string;
}

export interface KeywordQueryOptions {
  terms: string;
  topK: number;
  metadataFilter?: Record<string, unknown>;
  tenantId: string;
}

export interface RerankOptions {
  query: string;
  candidates: RerankInput[];
  topK: number;
  tenantId: string;
}

export interface DenseAdapter {
  query(options: DenseQueryOptions): Promise<DenseHit[]>;
}

export interface KeywordAdapter {
  query(options: KeywordQueryOptions): Promise<KeywordHit[]>;
}

export interface RerankAdapter {
  rerank(options: RerankOptions): Promise<RerankOutput[]>;
}
