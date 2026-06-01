/**
 * @szl-holdings/document-intelligence
 *
 * Citation-preserving document intelligence pipeline for the agent backbone.
 * Stages: OCR → layout parsing → table extraction → chart extraction → QA.
 * Every stage emits DocumentChunk objects with provenance metadata and
 * chunk-level evidence references for downstream retrieval and proof-chain.
 *
 * Usage:
 *   import { ingestDocument, ingestCounselFiling } from '@szl-holdings/document-intelligence';
 *
 *   // Generic ingestion
 *   const result = await ingestDocument({ kind: 'contract', lane: 'counsel', ... });
 *
 *   // Lane-specific ingestion (reference integrations)
 *   const counselResult = await ingestCounselFiling({ fileName: 'engagement.pdf', ... });
 *   const vesselResult  = await ingestVesselsInsuranceException({ ... });
 *   const terraResult   = await ingestTerraDistressFiling({ ... });
 */

export * from './types.js';
export * from './adapters.js';
export * from './pipeline.js';
export * from './ingestion.js';

export const DOCUMENT_INTELLIGENCE_VERSION = '0.1.0' as const;
