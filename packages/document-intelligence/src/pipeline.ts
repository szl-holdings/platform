/**
 * Document Intelligence — Pipeline Stages
 *
 * Orchestrates OCR → layout → table → chart → citation-preserving QA.
 * Every stage emits DocumentChunk objects with provenance metadata and
 * chunk-level evidence references consumable by the retrieval layer and
 * the proof-chain viewer (Phase 4).
 */

import {
  type ChartExtractionAdapter,
  type LayoutAdapter,
  type OCRAdapter,
  type QAAdapter,
  type TableExtractionAdapter,
  NoOpChartExtractionAdapter,
  NoOpLayoutAdapter,
  NoOpOCRAdapter,
  NoOpQAAdapter,
  NoOpTableExtractionAdapter,
} from './adapters.js';
import type {
  ChartExtractionResult,
  CitationPreservingQAResult,
  DocumentChunk,
  DocumentIngestionRequest,
  DocumentPipelineResult,
  DocumentProvenance,
  LayoutBlock,
  LayoutResult,
  OCRResult,
  PipelineStage,
  StageProvenanceEntry,
  TableExtractionResult,
} from './types.js';

const PIPELINE_VERSION = '0.1.0';

let _chunkCounter = 0;
function newChunkId(stage: PipelineStage, idx: number): string {
  return `chunk_${stage}_${Date.now()}_${(++_chunkCounter).toString().padStart(5, '0')}_${idx}`;
}

function now(): string {
  return new Date().toISOString();
}

function stageEntry(
  stage: PipelineStage,
  startedAt: string,
  completedAt: string,
  adapterProvider: string,
  chunkCount: number,
  errorCount = 0,
  notes?: string,
): StageProvenanceEntry {
  const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  return {
    stage,
    startedAt,
    completedAt,
    durationMs,
    adapterProvider,
    chunkCount,
    errorCount,
    notes,
  };
}

/**
 * Run OCR stage and emit chunks.
 */
export async function runOCRStage(
  req: DocumentIngestionRequest,
  adapter: OCRAdapter,
): Promise<{ result: OCRResult; chunks: DocumentChunk[]; entry: StageProvenanceEntry }> {
  const startedAt = now();
  const result = await adapter.run(req);
  const completedAt = now();
  const chunks: DocumentChunk[] = [];

  for (const page of result.pages) {
    if (!page.rawText.trim()) continue;
    const chunkId = newChunkId('ocr', page.pageNumber);
    chunks.push({
      chunkId,
      documentId: req.documentId,
      stage: 'ocr',
      page: page.pageNumber,
      text: page.rawText,
      confidence: page.confidence,
      contentType: 'text',
      evidenceRef: {
        documentId: req.documentId,
        chunkId,
        page: page.pageNumber,
        retrievedAt: completedAt,
      },
      provenance: {
        documentId: req.documentId,
        lane: req.lane,
        kind: req.kind,
        stage: 'ocr',
        adapterProvider: adapter.providerId,
        confidence: page.confidence,
        generatedAt: completedAt,
      },
    });
  }

  const entry = stageEntry('ocr', startedAt, completedAt, adapter.providerId, chunks.length);
  return { result, chunks, entry };
}

/**
 * Run layout parsing stage and emit chunks.
 */
export async function runLayoutStage(
  req: DocumentIngestionRequest,
  ocrResult: OCRResult,
  adapter: LayoutAdapter,
): Promise<{ result: LayoutResult; chunks: DocumentChunk[]; entry: StageProvenanceEntry }> {
  const startedAt = now();
  const result = await adapter.run(req, ocrResult);
  const completedAt = now();

  const chunks: DocumentChunk[] = result.blocks.map((block: LayoutBlock, i: number) => {
    const chunkId = newChunkId('layout', i);
    return {
      chunkId,
      documentId: req.documentId,
      stage: 'layout' as PipelineStage,
      page: block.page,
      bbox: block.bbox,
      section: block.section,
      text: block.text,
      confidence: block.confidence,
      contentType:
        block.type === 'heading' ? 'header' : block.type === 'footer' ? 'footer' : 'text',
      evidenceRef: {
        documentId: req.documentId,
        chunkId,
        page: block.page,
        section: block.section,
        bbox: block.bbox,
        retrievedAt: completedAt,
      },
      provenance: {
        documentId: req.documentId,
        lane: req.lane,
        kind: req.kind,
        stage: 'layout' as PipelineStage,
        adapterProvider: adapter.providerId,
        confidence: block.confidence,
        generatedAt: completedAt,
      },
    };
  });

  const entry = stageEntry('layout', startedAt, completedAt, adapter.providerId, chunks.length);
  return { result, chunks, entry };
}

/**
 * Run table extraction stage and emit row-level chunks.
 */
export async function runTableStage(
  req: DocumentIngestionRequest,
  ocrResult: OCRResult,
  layoutResult: LayoutResult,
  adapter: TableExtractionAdapter,
): Promise<{
  result: TableExtractionResult;
  chunks: DocumentChunk[];
  entry: StageProvenanceEntry;
}> {
  const startedAt = now();
  const result = await adapter.run(req, ocrResult, layoutResult);
  const completedAt = now();
  const chunks: DocumentChunk[] = [];

  for (const table of result.tables) {
    for (const row of table.rows) {
      const rowText = row.map((c) => c.text).join(' | ');
      if (!rowText.trim()) continue;
      const chunkId = newChunkId('tables', chunks.length);
      chunks.push({
        chunkId,
        documentId: req.documentId,
        stage: 'tables',
        page: table.page,
        bbox: table.bbox,
        section: table.caption,
        text: rowText,
        confidence: table.confidence,
        contentType: 'table-row',
        evidenceRef: {
          documentId: req.documentId,
          chunkId,
          page: table.page,
          section: table.caption,
          bbox: table.bbox,
          retrievedAt: completedAt,
        },
        provenance: {
          documentId: req.documentId,
          lane: req.lane,
          kind: req.kind,
          stage: 'tables',
          adapterProvider: adapter.providerId,
          confidence: table.confidence,
          generatedAt: completedAt,
        },
      });
    }
  }

  const entry = stageEntry('tables', startedAt, completedAt, adapter.providerId, chunks.length);
  return { result, chunks, entry };
}

/**
 * Run chart extraction stage and emit caption/summary chunks.
 */
export async function runChartStage(
  req: DocumentIngestionRequest,
  ocrResult: OCRResult,
  layoutResult: LayoutResult,
  adapter: ChartExtractionAdapter,
): Promise<{
  result: ChartExtractionResult;
  chunks: DocumentChunk[];
  entry: StageProvenanceEntry;
}> {
  const startedAt = now();
  const result = await adapter.run(req, ocrResult, layoutResult);
  const completedAt = now();

  const chunks: DocumentChunk[] = result.charts.map((chart, i) => {
    const chunkId = newChunkId('charts', i);
    const text = [chart.caption, chart.summary].filter(Boolean).join(' — ');
    return {
      chunkId,
      documentId: req.documentId,
      stage: 'charts' as PipelineStage,
      page: chart.page,
      bbox: chart.bbox,
      section: chart.caption,
      text,
      confidence: chart.confidence,
      contentType: 'chart-caption',
      evidenceRef: {
        documentId: req.documentId,
        chunkId,
        page: chart.page,
        bbox: chart.bbox,
        retrievedAt: completedAt,
      },
      provenance: {
        documentId: req.documentId,
        lane: req.lane,
        kind: req.kind,
        stage: 'charts' as PipelineStage,
        adapterProvider: adapter.providerId,
        confidence: chart.confidence,
        generatedAt: completedAt,
      },
    };
  });

  const entry = stageEntry('charts', startedAt, completedAt, adapter.providerId, chunks.length);
  return { result, chunks, entry };
}

/**
 * Run citation-preserving QA stage.
 * Takes all prior chunks as the retrieval context.
 */
export async function runQAStage(
  req: DocumentIngestionRequest,
  allPriorChunks: DocumentChunk[],
  adapter: QAAdapter,
  questions?: string[],
): Promise<{
  result: CitationPreservingQAResult;
  chunks: DocumentChunk[];
  entry: StageProvenanceEntry;
}> {
  const startedAt = now();
  const result = await adapter.run(req, allPriorChunks, questions);
  const completedAt = now();

  const chunks: DocumentChunk[] = result.answers.map((answer, i) => {
    const chunkId = newChunkId('qa', i);
    return {
      chunkId,
      documentId: req.documentId,
      stage: 'qa' as PipelineStage,
      page: answer.supportingEvidence[0]?.page ?? null,
      section: answer.question,
      text: answer.answer,
      confidence: answer.confidence,
      contentType: 'qa-answer',
      evidenceRef: {
        documentId: req.documentId,
        chunkId,
        page: answer.supportingEvidence[0]?.page ?? null,
        section: answer.question,
        retrievedAt: completedAt,
      },
      provenance: {
        documentId: req.documentId,
        lane: req.lane,
        kind: req.kind,
        stage: 'qa' as PipelineStage,
        adapterProvider: adapter.providerId,
        confidence: answer.confidence,
        generatedAt: completedAt,
      },
    };
  });

  const entry = stageEntry('qa', startedAt, completedAt, adapter.providerId, chunks.length);
  return { result, chunks, entry };
}

export interface DocumentPipelineAdapters {
  ocr?: OCRAdapter;
  layout?: LayoutAdapter;
  tables?: TableExtractionAdapter;
  charts?: ChartExtractionAdapter;
  qa?: QAAdapter;
}

/**
 * Run the full document intelligence pipeline.
 * Stages run sequentially; each stage's chunks feed into the next.
 */
export async function runDocumentPipeline(
  req: DocumentIngestionRequest,
  adapters: DocumentPipelineAdapters = {},
  questions?: string[],
): Promise<DocumentPipelineResult> {
  const ocrAdapter = adapters.ocr ?? new NoOpOCRAdapter();
  const layoutAdapter = adapters.layout ?? new NoOpLayoutAdapter();
  const tableAdapter = adapters.tables ?? new NoOpTableExtractionAdapter();
  const chartAdapter = adapters.charts ?? new NoOpChartExtractionAdapter();
  const qaAdapter = adapters.qa ?? new NoOpQAAdapter();

  const allChunks: DocumentChunk[] = [];
  const stageEntries: StageProvenanceEntry[] = [];

  const ocrOut = await runOCRStage(req, ocrAdapter);
  allChunks.push(...ocrOut.chunks);
  stageEntries.push(ocrOut.entry);

  const layoutOut = await runLayoutStage(req, ocrOut.result, layoutAdapter);
  allChunks.push(...layoutOut.chunks);
  stageEntries.push(layoutOut.entry);

  const tableOut = await runTableStage(req, ocrOut.result, layoutOut.result, tableAdapter);
  allChunks.push(...tableOut.chunks);
  stageEntries.push(tableOut.entry);

  const chartOut = await runChartStage(req, ocrOut.result, layoutOut.result, chartAdapter);
  allChunks.push(...chartOut.chunks);
  stageEntries.push(chartOut.entry);

  const qaOut = await runQAStage(req, allChunks, qaAdapter, questions);
  allChunks.push(...qaOut.chunks);
  stageEntries.push(qaOut.entry);

  const completedAt = now();

  const provenance: DocumentProvenance = {
    documentId: req.documentId,
    kind: req.kind,
    lane: req.lane,
    fileName: req.fileName,
    mimeType: req.mimeType,
    tenantId: req.tenantId,
    ingestedAt: stageEntries[0]?.startedAt ?? completedAt,
    pipelineVersion: PIPELINE_VERSION,
    stages: stageEntries,
    metadata: req.metadata,
  };

  return {
    documentId: req.documentId,
    kind: req.kind,
    lane: req.lane,
    ocr: ocrOut.result,
    layout: layoutOut.result,
    tables: tableOut.result,
    charts: chartOut.result,
    qa: qaOut.result,
    chunks: allChunks,
    provenance,
    completedAt,
  };
}
