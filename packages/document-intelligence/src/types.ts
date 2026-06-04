/**
 * Document Intelligence — Type Definitions
 *
 * Shared types for the OCR → layout → table → chart → QA pipeline.
 * Every stage emits provenance metadata and chunk-level evidence
 * references consumable by downstream retrieval and proof-chain views.
 */

export type DocumentKind = 'contract' | 'filing' | 'memo' | 'report' | 'certificate' | 'unknown';

export type DocumentLane = 'counsel' | 'vessels' | 'terra' | 'aegis' | 'lyte' | 'command' | (string & {});

export interface DocumentIngestionRequest {
  documentId: string;
  kind: DocumentKind;
  lane: DocumentLane;
  fileName: string;
  mimeType: string;
  /** Raw bytes of the document (PDF, DOCX, image, etc.) */
  content: Uint8Array;
  /** Tenant / operator context */
  tenantId?: string;
  /** Additional metadata passed through to provenance */
  metadata?: Record<string, unknown>;
}

export interface DocumentProvenance {
  documentId: string;
  kind: DocumentKind;
  lane: DocumentLane;
  fileName: string;
  mimeType: string;
  tenantId?: string;
  ingestedAt: string;
  pipelineVersion: string;
  stages: StageProvenanceEntry[];
  metadata?: Record<string, unknown>;
}

export interface StageProvenanceEntry {
  stage: PipelineStage;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  adapterProvider: string;
  chunkCount: number;
  errorCount: number;
  notes?: string;
}

export type PipelineStage = 'ocr' | 'layout' | 'tables' | 'charts' | 'qa';

/**
 * Chunk-level evidence reference emitted by every pipeline stage.
 * Downstream retrieval and proof-chain consumers read this shape.
 */
export interface DocumentChunk {
  chunkId: string;
  documentId: string;
  stage: PipelineStage;
  /** Page number (1-indexed) or null for multi-page spans */
  page: number | null;
  /** Bounding region as [x0, y0, x1, y1] normalised 0–1, if available */
  bbox?: [number, number, number, number];
  /** Logical section heading at this position */
  section?: string;
  /** Chunk text content */
  text: string;
  /** Confidence from the upstream adapter (0–1) */
  confidence: number;
  /** Type of content captured in this chunk */
  contentType: 'text' | 'header' | 'footer' | 'table-cell' | 'table-row' | 'chart-caption' | 'figure-caption' | 'qa-answer';
  /** Evidence reference linking to the source document */
  evidenceRef: ChunkEvidenceRef;
  /** Provenance chain for the retrieval layer */
  provenance: ChunkProvenance;
}

export interface ChunkEvidenceRef {
  documentId: string;
  chunkId: string;
  page: number | null;
  section?: string;
  bbox?: [number, number, number, number];
  sourceUri?: string;
  retrievedAt: string;
}

export interface ChunkProvenance {
  documentId: string;
  lane: DocumentLane;
  kind: DocumentKind;
  stage: PipelineStage;
  adapterProvider: string;
  confidence: number;
  generatedAt: string;
}

export interface OCRResult {
  documentId: string;
  pages: OCRPage[];
  totalPages: number;
  provider: string;
  processedAt: string;
}

export interface OCRPage {
  pageNumber: number;
  rawText: string;
  words: OCRWord[];
  confidence: number;
}

export interface OCRWord {
  text: string;
  bbox: [number, number, number, number];
  confidence: number;
  page: number;
}

export interface LayoutBlock {
  blockId: string;
  page: number;
  type: 'paragraph' | 'heading' | 'list' | 'footer' | 'header' | 'sidebar' | 'caption';
  text: string;
  bbox: [number, number, number, number];
  section?: string;
  level?: number;
  confidence: number;
}

export interface LayoutResult {
  documentId: string;
  blocks: LayoutBlock[];
  sections: string[];
  provider: string;
  processedAt: string;
}

export interface TableCell {
  row: number;
  col: number;
  text: string;
  isHeader: boolean;
  colSpan?: number;
  rowSpan?: number;
}

export interface ExtractedTable {
  tableId: string;
  page: number;
  bbox: [number, number, number, number];
  caption?: string;
  headers: string[];
  rows: TableCell[][];
  confidence: number;
}

export interface TableExtractionResult {
  documentId: string;
  tables: ExtractedTable[];
  provider: string;
  processedAt: string;
}

export interface ExtractedChart {
  chartId: string;
  page: number;
  bbox: [number, number, number, number];
  caption?: string;
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap' | 'unknown';
  dataPoints?: Array<{ label: string; value: number | string }>;
  summary: string;
  confidence: number;
}

export interface ChartExtractionResult {
  documentId: string;
  charts: ExtractedChart[];
  provider: string;
  processedAt: string;
}

export interface QAEvidence {
  chunkId: string;
  text: string;
  page: number | null;
  section?: string;
  confidence: number;
  evidenceRef: ChunkEvidenceRef;
}

export interface QAAnswer {
  questionId: string;
  question: string;
  answer: string;
  confidence: number;
  supportingEvidence: QAEvidence[];
  /** Citation IDs for the proof-chain consumer */
  citationIds: string[];
}

export interface CitationPreservingQAResult {
  documentId: string;
  answers: QAAnswer[];
  provider: string;
  processedAt: string;
}

export interface DocumentPipelineResult {
  documentId: string;
  kind: DocumentKind;
  lane: DocumentLane;
  ocr: OCRResult;
  layout: LayoutResult;
  tables: TableExtractionResult;
  charts: ChartExtractionResult;
  qa: CitationPreservingQAResult;
  /** All chunks emitted by all pipeline stages */
  chunks: DocumentChunk[];
  /** Full provenance record for this document */
  provenance: DocumentProvenance;
  completedAt: string;
}
