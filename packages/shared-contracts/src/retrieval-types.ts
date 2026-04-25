/**
 * AEEP Retrieval Type Contracts
 *
 * Shared types for retrieval queries, results, strategies,
 * chunk metadata, and multimodal retrieval.
 */

export type RetrievalStrategy = 'semantic' | 'keyword' | 'hybrid' | 'graph' | 'structured';
export type RerankerType = 'cross-encoder' | 'reciprocal-rank-fusion' | 'score-threshold' | 'none';

/**
 * First-class retrieval modalities.
 *
 * - `text`            — Plain text chunks (default).
 * - `screenshot`      — UI / web screenshots with caption and bounding context.
 * - `diagram`         — Architecture / flow diagrams with structured annotation.
 * - `audio_transcript`— Transcribed speech with speaker and time metadata.
 */
export type RetrievalModality = 'text' | 'screenshot' | 'diagram' | 'audio_transcript';

export interface TextModalityMeta {
  modality: 'text';
  language?: string;
  pageNumber?: number;
  section?: string;
}

export interface ScreenshotModalityMeta {
  modality: 'screenshot';
  capturedAt?: string;
  url?: string;
  caption?: string;
  ocrText?: string;
  width?: number;
  height?: number;
}

export interface DiagramModalityMeta {
  modality: 'diagram';
  diagramType?: 'architecture' | 'flow' | 'erd' | 'sequence' | 'other';
  annotation?: string;
  nodes?: string[];
  edges?: Array<{ from: string; to: string; label?: string }>;
}

export interface AudioTranscriptModalityMeta {
  modality: 'audio_transcript';
  speaker?: string;
  startMs?: number;
  endMs?: number;
  language?: string;
  confidence?: number;
}

export type ModalityMeta =
  | TextModalityMeta
  | ScreenshotModalityMeta
  | DiagramModalityMeta
  | AudioTranscriptModalityMeta;

export interface RetrievalQuery {
  queryId: string;
  text: string;
  strategy: RetrievalStrategy;
  modalities?: RetrievalModality[];
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
  modality?: RetrievalModality;
  modalityMeta?: ModalityMeta;
  metadata?: Record<string, unknown>;
  retrievedAt: string;
}

export interface RetrievalResult {
  queryId: string;
  chunks: RetrievalChunk[];
  strategy: RetrievalStrategy;
  reranker?: RerankerType;
  modalities?: RetrievalModality[];
  totalCandidates?: number;
  latencyMs?: number;
  traceId?: string;
  profileId?: string;
  profileVersion?: string;
  embeddingModel?: string;
  embeddingProvider?: string;
  rerankerModel?: string;
  rerankerProvider?: string;
}

/**
 * A single item in the ranked evidence list surfaced by the proof-chain viewer.
 * Captures the before/after confidence at each retrieval stage so operators can
 * see exactly how the evidence was promoted or demoted.
 */
export interface RankedEvidenceItem {
  rank: number;
  chunkId: string;
  sourceId: string;
  sourceUri?: string;
  title?: string;
  content: string;
  modality: RetrievalModality;
  embeddingScore: number;
  rerankerScore: number;
  finalScore: number;
  confidenceDelta: number;
  retrievedAt: string;
  embeddingModel?: string;
  rerankerModel?: string;
}

/**
 * The full proof-chain payload assembled by the retrieval specialist.
 * This is what the ProofChainViewer renders.
 */
export interface RetrievalProofChain {
  queryId: string;
  traceId?: string;
  query: string;
  strategy: RetrievalStrategy;
  modalities: RetrievalModality[];
  embeddingModel: string;
  embeddingProvider: string;
  rerankerModel: string;
  rerankerProvider: string;
  rankedEvidence: RankedEvidenceItem[];
  totalCandidatesBeforeRerank: number;
  totalCandidatesAfterRerank: number;
  overallConfidence: number;
  latencyMs: number;
  generatedAt: string;
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
