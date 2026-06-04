export interface GoldenQuery {
  queryId: string;
  query: string;
  relevantChunkIds: string[];
  notes?: string;
}

export interface CorpusChunk {
  chunkId: string;
  text: string;
}

export interface GoldenFixtureSet {
  fixtureSetId: string;
  profileId: string;
  domain: string;
  description: string;
  queries: GoldenQuery[];
  /**
   * Optional in-memory corpus of {chunkId, text} pairs that adapters can embed
   * and search to validate retrieval quality with real vectors. Each
   * relevantChunkId from `queries` should appear here for end-to-end eval.
   */
  corpus?: CorpusChunk[];
}

export interface RetrievalResult {
  queryId: string;
  retrievedChunkIds: string[];
  latencyMs: number;
}

export interface MetricResult {
  metric: string;
  atK: number;
  value: number;
}

export interface EvidenceCompletenessResult {
  queryId: string;
  hasSourceId: boolean;
  hasChunkId: boolean;
  hasDenseScore: boolean;
  hasFusedScore: boolean;
  hasPolicyDecision: boolean;
  hasTraceId: boolean;
  complete: boolean;
}

export interface EvalRunResult {
  evalId: string;
  profileId: string;
  datasetId: string;
  queryCount: number;
  metrics: MetricResult[];
  evidenceCompleteness: EvidenceCompletenessResult[];
  latencyP50Ms: number;
  latencyP95Ms: number;
  latencyP99Ms: number;
  throughputQps?: number;
  completedAt: string;
}

export interface RetrievalAdapter {
  search(query: string, topK: number): Promise<RetrievalResult>;
}
