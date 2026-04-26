/**
 * Document Intelligence — Ingestion Entrypoint
 *
 * Single entry point for contracts, filings, and memos across all lanes.
 * Accepts the raw document and routes it through the configurable pipeline.
 * Also exposes lane-specific ingestors used as reference integrations:
 *
 *   - ingestCounselFiling   — PRISM Counsel contract/filing
 *   - ingestVesselsInsuranceException — Vessels insurance exception document
 *   - ingestTerraDistressFiling      — Terra distress filing
 */

import type { DocumentPipelineAdapters } from './pipeline.js';
import { runDocumentPipeline } from './pipeline.js';
import type { DocumentIngestionRequest, DocumentKind, DocumentLane, DocumentPipelineResult } from './types.js';

export interface IngestDocumentOptions {
  adapters?: DocumentPipelineAdapters;
  /** Pre-defined questions for the QA stage */
  questions?: string[];
}

let _docCounter = 0;
export function generateDocumentId(prefix = 'doc'): string {
  return `${prefix}_${Date.now()}_${(++_docCounter).toString().padStart(6, '0')}`;
}

/**
 * Ingest any document kind through the full pipeline.
 */
export async function ingestDocument(
  req: DocumentIngestionRequest,
  options: IngestDocumentOptions = {},
): Promise<DocumentPipelineResult> {
  return runDocumentPipeline(req, options.adapters ?? {}, options.questions);
}

/**
 * Helper to build an ingestion request from minimal parameters.
 */
export function buildIngestionRequest(
  params: {
    documentId?: string;
    kind: DocumentKind;
    lane: DocumentLane;
    fileName: string;
    mimeType?: string;
    content?: Uint8Array;
    tenantId?: string;
    metadata?: Record<string, unknown>;
  },
): DocumentIngestionRequest {
  return {
    documentId: params.documentId ?? generateDocumentId(params.kind),
    kind: params.kind,
    lane: params.lane,
    fileName: params.fileName,
    mimeType: params.mimeType ?? 'application/pdf',
    content: params.content ?? new Uint8Array(),
    tenantId: params.tenantId,
    metadata: params.metadata,
  };
}

/**
 * Reference integration: PRISM Counsel — contract or court filing ingestion.
 * Used by the Counsel lane (PRISM) as the canonical document intake path.
 */
export async function ingestCounselFiling(
  params: {
    documentId?: string;
    fileName: string;
    content?: Uint8Array;
    mimeType?: string;
    tenantId?: string;
    matterRef?: string;
    filingType?: 'complaint' | 'brief' | 'motion' | 'contract' | 'order' | 'other';
    metadata?: Record<string, unknown>;
  },
  options: IngestDocumentOptions = {},
): Promise<DocumentPipelineResult> {
  const req = buildIngestionRequest({
    documentId: params.documentId,
    kind: params.filingType === 'contract' ? 'contract' : 'filing',
    lane: 'counsel',
    fileName: params.fileName,
    mimeType: params.mimeType,
    content: params.content,
    tenantId: params.tenantId,
    metadata: {
      matterRef: params.matterRef,
      filingType: params.filingType ?? 'other',
      ...params.metadata,
    },
  });
  const questions = options.questions ?? [
    'What are the key obligations of each party?',
    'What are the governing law and jurisdiction clauses?',
    'What are the termination conditions?',
    'What indemnities or liability caps are specified?',
    'Are there any material breach conditions?',
  ];
  return ingestDocument(req, { ...options, questions });
}

/**
 * Reference integration: Vessels Vessels — insurance exception document ingestion.
 * Used by the Vessels lane for marine insurance claim and exception processing.
 */
export async function ingestVesselsInsuranceException(
  params: {
    documentId?: string;
    fileName: string;
    content?: Uint8Array;
    mimeType?: string;
    tenantId?: string;
    vesselId?: string;
    claimRef?: string;
    exceptionType?: 'h_and_m' | 'p_and_i' | 'war_risk' | 'cargo' | 'other';
    metadata?: Record<string, unknown>;
  },
  options: IngestDocumentOptions = {},
): Promise<DocumentPipelineResult> {
  const req = buildIngestionRequest({
    documentId: params.documentId,
    kind: 'filing',
    lane: 'vessels',
    fileName: params.fileName,
    mimeType: params.mimeType,
    content: params.content,
    tenantId: params.tenantId,
    metadata: {
      vesselId: params.vesselId,
      claimRef: params.claimRef,
      exceptionType: params.exceptionType ?? 'other',
      ...params.metadata,
    },
  });
  const questions = options.questions ?? [
    'What is the claim amount and currency?',
    'What vessel and IMO number does this claim relate to?',
    'What is the incident date and location?',
    'What are the coverage exclusions referenced?',
    'What documentation is required for settlement?',
  ];
  return ingestDocument(req, { ...options, questions });
}

/**
 * Reference integration: Terra Terra — distress filing ingestion.
 * Used by the Terra lane for distressed asset or legal filing processing.
 */
export async function ingestTerraDistressFiling(
  params: {
    documentId?: string;
    fileName: string;
    content?: Uint8Array;
    mimeType?: string;
    tenantId?: string;
    propertyRef?: string;
    filingType?: 'foreclosure' | 'lis-pendens' | 'deed-in-lieu' | 'bankruptcy' | 'other';
    metadata?: Record<string, unknown>;
  },
  options: IngestDocumentOptions = {},
): Promise<DocumentPipelineResult> {
  const req = buildIngestionRequest({
    documentId: params.documentId,
    kind: 'filing',
    lane: 'terra',
    fileName: params.fileName,
    mimeType: params.mimeType,
    content: params.content,
    tenantId: params.tenantId,
    metadata: {
      propertyRef: params.propertyRef,
      filingType: params.filingType ?? 'other',
      ...params.metadata,
    },
  });
  const questions = options.questions ?? [
    'What is the distressed property address and parcel ID?',
    'What is the outstanding loan balance and lender?',
    'What is the filing date and court or jurisdiction?',
    'What are the cure or redemption deadlines?',
    'What is the estimated market value or appraised value?',
  ];
  return ingestDocument(req, { ...options, questions });
}
