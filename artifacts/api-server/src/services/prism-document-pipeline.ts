import { db, pcAuditEventsTable, pcDocumentsTable, pcExtractionJobsTable } from '@szl-holdings/db';
import crypto from 'crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { logger } from '../lib/logger';
import { enqueuePrismJob, PRISM_JOB_TYPES } from './prism-queue';

interface IngestOptions {
  matterId?: number;
  documentType?: string;
  uploadedBy?: number;
  sourceSystem?: string;
  sourceRecordId?: string;
  privilegeFlag?: boolean;
}

interface ExtractionResult {
  text: string;
  tables?: unknown[];
  metadata?: Record<string, unknown>;
  layoutData?: unknown;
  confidence: number;
}

export async function ingestDocument(
  orgId: number,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string,
  options: IngestOptions = {},
): Promise<number> {
  const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  const existing = await db
    .select({ id: pcDocumentsTable.id })
    .from(pcDocumentsTable)
    .where(and(eq(pcDocumentsTable.orgId, orgId), eq(pcDocumentsTable.checksum, checksum)))
    .limit(1);

  if (existing.length > 0) {
    logger.info(
      { documentId: existing[0].id, checksum },
      '[doc-pipeline] Duplicate document detected',
    );
    return existing[0].id;
  }

  const storageContainer = 'raw-ingest' as const;
  const storageUri = `${storageContainer}/${orgId}/${Date.now()}-${fileName}`;

  const [doc] = await db
    .insert(pcDocumentsTable)
    .values({
      orgId,
      matterId: options.matterId ?? null,
      title: fileName,
      fileName,
      fileSize: fileBuffer.length,
      mimeType,
      checksum,
      storageUri,
      storageContainer,
      documentType: (options.documentType as 'medical_record') ?? 'other',
      sourceSystem: options.sourceSystem ?? 'upload',
      sourceRecordId: options.sourceRecordId ?? null,
      privilegeFlag: options.privilegeFlag ?? false,
      reviewState: 'unreviewed',
      uploadedBy: options.uploadedBy ?? null,
    })
    .returning({ id: pcDocumentsTable.id });

  await db.insert(pcAuditEventsTable).values({
    orgId,
    matterId: options.matterId ?? null,
    actorId: options.uploadedBy ?? null,
    action: 'document_ingested',
    entityType: 'document',
    entityId: doc.id,
    details: { fileName, mimeType, fileSize: fileBuffer.length, checksum, storageUri },
  });

  await enqueuePrismJob(
    orgId,
    PRISM_JOB_TYPES.DOCUMENT_EXTRACT,
    {
      documentId: doc.id,
      mimeType,
      storageUri,
    },
    {
      matterId: options.matterId,
      actorId: options.uploadedBy,
      idempotencyKey: `extract-${checksum}`,
    },
  );

  logger.info(
    {
      documentId: doc.id,
      fileName,
      checksum,
      orgId,
      matterId: options.matterId,
    },
    '[doc-pipeline] Document ingested, extraction queued',
  );

  return doc.id;
}

export async function createExtractionJob(
  orgId: number,
  documentId: number,
  provider: 'azure_doc_intel' | 'manual' | 'ocr_fallback' = 'azure_doc_intel',
): Promise<number> {
  const [job] = await db
    .insert(pcExtractionJobsTable)
    .values({
      orgId,
      documentId,
      extractionProvider: provider,
      status: 'pending',
    })
    .returning({ id: pcExtractionJobsTable.id });

  logger.info(
    { extractionJobId: job.id, documentId, provider },
    '[doc-pipeline] Extraction job created',
  );
  return job.id;
}

export async function completeExtraction(
  extractionJobId: number,
  result: ExtractionResult,
  processingTimeMs: number,
  costCents?: number,
): Promise<void> {
  const status = result.confidence >= 0.7 ? 'completed' : 'review_required';

  await db
    .update(pcExtractionJobsTable)
    .set({
      status,
      confidence: String(result.confidence),
      extractedText: result.text,
      extractedTables: result.tables ?? null,
      extractedMetadata: result.metadata ?? null,
      layoutData: result.layoutData ?? null,
      processingTimeMs,
      costCents: costCents ?? null,
      completedAt: new Date(),
    })
    .where(eq(pcExtractionJobsTable.id, extractionJobId));

  if (status === 'review_required') {
    const [job] = await db
      .select()
      .from(pcExtractionJobsTable)
      .where(eq(pcExtractionJobsTable.id, extractionJobId));

    if (job) {
      await enqueuePrismJob(job.orgId, PRISM_JOB_TYPES.MANUAL_REVIEW, {
        extractionJobId,
        documentId: job.documentId,
        confidence: result.confidence,
        reason: 'Low extraction confidence',
      });
    }

    logger.warn(
      {
        extractionJobId,
        confidence: result.confidence,
      },
      '[doc-pipeline] Low confidence extraction, routed to manual review',
    );
  } else {
    logger.info(
      {
        extractionJobId,
        confidence: result.confidence,
        processingTimeMs,
      },
      '[doc-pipeline] Extraction completed',
    );
  }
}

export async function failExtraction(extractionJobId: number, error: string): Promise<void> {
  await db
    .update(pcExtractionJobsTable)
    .set({
      status: 'failed',
      error,
      completedAt: new Date(),
    })
    .where(eq(pcExtractionJobsTable.id, extractionJobId));

  logger.error({ extractionJobId, error }, '[doc-pipeline] Extraction failed');
}

export async function getDocumentPipelineStats(orgId: number) {
  const stats = await db.execute(sql`
    SELECT 
      d.review_state,
      COUNT(d.id)::int as doc_count,
      COALESCE(SUM(d.file_size), 0)::bigint as total_bytes
    FROM pc_documents d
    WHERE d.org_id = ${orgId}
    GROUP BY d.review_state
  `);

  const extractionStats = await db.execute(sql`
    SELECT 
      e.status,
      e.extraction_provider,
      COUNT(e.id)::int as count,
      AVG(e.confidence::numeric)::numeric(5,2) as avg_confidence,
      AVG(e.processing_time_ms)::int as avg_processing_ms,
      SUM(COALESCE(e.cost_cents, 0))::int as total_cost_cents
    FROM pc_extraction_jobs e
    WHERE e.org_id = ${orgId}
    GROUP BY e.status, e.extraction_provider
  `);

  return {
    documents: stats.rows,
    extractions: extractionStats.rows,
  };
}

export async function getDocumentsForMatter(matterId: number, orgId: number) {
  return db
    .select()
    .from(pcDocumentsTable)
    .where(and(eq(pcDocumentsTable.matterId, matterId), eq(pcDocumentsTable.orgId, orgId)))
    .orderBy(desc(pcDocumentsTable.createdAt));
}

export async function getExtractionJobsForDocument(documentId: number) {
  return db
    .select()
    .from(pcExtractionJobsTable)
    .where(eq(pcExtractionJobsTable.documentId, documentId))
    .orderBy(desc(pcExtractionJobsTable.createdAt));
}
