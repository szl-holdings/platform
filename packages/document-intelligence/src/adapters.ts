/**
 * Document Intelligence — Stage Adapter Interfaces & No-op Defaults
 *
 * Each pipeline stage has a dedicated adapter interface. No-op defaults
 * return structurally correct empty results. Swap real adapters at runtime.
 */

import type {
  ChartExtractionResult,
  CitationPreservingQAResult,
  DocumentIngestionRequest,
  LayoutResult,
  OCRResult,
  TableExtractionResult,
} from './types.js';

export interface OCRAdapter {
  readonly providerId: string;
  run(req: DocumentIngestionRequest): Promise<OCRResult>;
  isAvailable(): boolean;
}

export interface LayoutAdapter {
  readonly providerId: string;
  run(req: DocumentIngestionRequest, ocrResult: OCRResult): Promise<LayoutResult>;
  isAvailable(): boolean;
}

export interface TableExtractionAdapter {
  readonly providerId: string;
  run(req: DocumentIngestionRequest, ocrResult: OCRResult, layoutResult: LayoutResult): Promise<TableExtractionResult>;
  isAvailable(): boolean;
}

export interface ChartExtractionAdapter {
  readonly providerId: string;
  run(req: DocumentIngestionRequest, ocrResult: OCRResult, layoutResult: LayoutResult): Promise<ChartExtractionResult>;
  isAvailable(): boolean;
}

export interface QAAdapter {
  readonly providerId: string;
  run(
    req: DocumentIngestionRequest,
    chunks: import('./types.js').DocumentChunk[],
    questions?: string[],
  ): Promise<CitationPreservingQAResult>;
  isAvailable(): boolean;
}

export class NoOpOCRAdapter implements OCRAdapter {
  readonly providerId = 'noop-ocr';

  run(req: DocumentIngestionRequest): Promise<OCRResult> {
    return Promise.resolve({
      documentId: req.documentId,
      pages: [{ pageNumber: 1, rawText: '', words: [], confidence: 0 }],
      totalPages: 1,
      provider: this.providerId,
      processedAt: new Date().toISOString(),
    });
  }

  isAvailable(): boolean { return true; }
}

export class NoOpLayoutAdapter implements LayoutAdapter {
  readonly providerId = 'noop-layout';

  run(req: DocumentIngestionRequest, _ocr: OCRResult): Promise<LayoutResult> {
    return Promise.resolve({
      documentId: req.documentId,
      blocks: [],
      sections: [],
      provider: this.providerId,
      processedAt: new Date().toISOString(),
    });
  }

  isAvailable(): boolean { return true; }
}

export class NoOpTableExtractionAdapter implements TableExtractionAdapter {
  readonly providerId = 'noop-tables';

  run(req: DocumentIngestionRequest): Promise<TableExtractionResult> {
    return Promise.resolve({
      documentId: req.documentId,
      tables: [],
      provider: this.providerId,
      processedAt: new Date().toISOString(),
    });
  }

  isAvailable(): boolean { return true; }
}

export class NoOpChartExtractionAdapter implements ChartExtractionAdapter {
  readonly providerId = 'noop-charts';

  run(req: DocumentIngestionRequest): Promise<ChartExtractionResult> {
    return Promise.resolve({
      documentId: req.documentId,
      charts: [],
      provider: this.providerId,
      processedAt: new Date().toISOString(),
    });
  }

  isAvailable(): boolean { return true; }
}

export class NoOpQAAdapter implements QAAdapter {
  readonly providerId = 'noop-qa';

  run(req: DocumentIngestionRequest): Promise<CitationPreservingQAResult> {
    return Promise.resolve({
      documentId: req.documentId,
      answers: [],
      provider: this.providerId,
      processedAt: new Date().toISOString(),
    });
  }

  isAvailable(): boolean { return true; }
}
