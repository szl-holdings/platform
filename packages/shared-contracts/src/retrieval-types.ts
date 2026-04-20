/**
 * AEEP Retrieval Type Contracts
 *
 * Shared types for retrieval queries, results, strategies,
 * and chunk metadata.
 */

export type RetrievalStrategy = 'semantic' | 'keyword' | 'hybrid' | 'graph' | 'structured';
export type RerankerType = 'cross-encoder' | 'reciprocal-rank-fusion' | 'score-threshold' | 'none';

export interface RetrievalQuery {
  queryId: string;
  text: string;
  strategy: RetrievalStrategy;
  profileId?: string;
  profileVersion?: string;
  namespaces?: string[];
  topK?: number;
  minScore?: number;
  filter?: Record<string, unknown>;
  reranker?: RerankerType;
  traceId?: string;
}

export interface RetrievalChunk {
  chunkId: string;
  sourceId: string;
  sourceUri?: string;
  title?: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
  retrievedAt: string;
}

export interface RetrievalResult {
  queryId: string;
  chunks: RetrievalChunk[];
  strategy: RetrievalStrategy;
  reranker?: RerankerType;
  totalCandidates?: number;
  latencyMs?: number;
  traceId?: string;
  profileId?: string;
  profileVersion?: string;
}

export interface IndexHealthReport {
  profileId: string;
  profileVersion?: string;
  namespaces: Array<{
    namespace: string;
    vectorCount: number;
    lastUpdatedAt?: string;
    coveragePercent?: number;
    staleChunkCount?: number;
  }>;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  generatedAt: string;
}
