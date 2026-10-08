import { IngestRequestSchema } from '@workspace/aef-contracts';
import { embedTextsWithReceipt } from '@workspace/alloy-embed-worker';
import { getRun, submitIngestDocument } from '@workspace/alloy-ingestion-orchestrator/client';
import { type IRouter, type Request, type RequestHandler, type Response, Router } from 'express';
import { logger } from '../middleware/logger.js';
import { enforceTenantRequestConsistency } from '../middleware/tenant.js';
import { getEmbedderSelection, getRetrievalStore } from '../retrieval-store.js';

export const ingestRouter: IRouter = Router();
ingestRouter.use(enforceTenantRequestConsistency as RequestHandler);

interface OrchestratedEmbeddedChunk {
  chunkId: string;
  sourceId: string;
  content: string;
  chunkIndex: number;
  totalChunks: number;
  metadata: Record<string, unknown>;
}

async function indexForHybridRetrieval(input: {
  chunks: OrchestratedEmbeddedChunk[];
  tenantId: string;
  profileId: string;
}): Promise<number> {
  if (input.chunks.length === 0) return 0;

  const embedder = getEmbedderSelection();
  // The orchestrator's current EmbedDispatcher output is a 128-dimensional
  // control-plane stub without an execution receipt. Hybrid search must use
  // the same admitted embedding backend/model as query embedding, so index the
  // approved chunks again here instead of mislabelling the stub vectors.
  const embedded = await embedTextsWithReceipt(
    input.chunks.map((chunk) => chunk.content),
    {
      backendId: embedder.backendId,
      model: embedder.model,
      pooling: 'mean',
      normalize: true,
    },
  );
  if (embedded.vectors.length !== input.chunks.length) {
    throw new Error(
      `Embedding backend returned ${embedded.vectors.length} vectors for ${input.chunks.length} chunks`,
    );
  }

  const { bundle } = getRetrievalStore();
  const indexedAt = new Date().toISOString();
  const touchedChunkIds: string[] = [];
  try {
    for (let index = 0; index < input.chunks.length; index++) {
      const chunk = input.chunks[index];
      const vector = embedded.vectors[index];
      if (!chunk || !vector) throw new Error(`Missing chunk or vector at index ${index}`);

      const metadata: Record<string, unknown> = {
        ...chunk.metadata,
        text: chunk.content,
        chunkIndex: chunk.chunkIndex,
        totalChunks: chunk.totalChunks,
      };
      const title = typeof metadata.title === 'string' ? metadata.title : undefined;
      const page = typeof metadata.page === 'number' ? metadata.page : undefined;
      const section = typeof metadata.section === 'string' ? metadata.section : undefined;

      // Both writes target the same logical chunk. The vector write goes first
      // because the pgvector metadata adapter updates an existing row whose
      // model/vector columns are required by the schema.
      await bundle.vectors.upsert({
        chunkId: chunk.chunkId,
        sourceId: chunk.sourceId,
        tenantId: input.tenantId,
        profileId: input.profileId,
        model: embedded.model,
        dimensions: embedded.dimensions,
        vector,
        metadata,
        indexedAt,
      });
      touchedChunkIds.push(chunk.chunkId);
      await bundle.metadataIndex.upsert({
        chunkId: chunk.chunkId,
        sourceId: chunk.sourceId,
        tenantId: input.tenantId,
        profileId: input.profileId,
        ...(title !== undefined ? { title } : {}),
        ...(page !== undefined ? { page } : {}),
        ...(section !== undefined ? { section } : {}),
        metadata,
        updatedAt: indexedAt,
      });
    }
  } catch (error) {
    // The storage interface has no cross-adapter transaction. Compensate all
    // writes for this document so a reported ingest failure does not leave a
    // vector-only or metadata-only chunk visible to retrieval.
    const rollback = await Promise.allSettled(
      touchedChunkIds.flatMap((chunkId) => [
        bundle.metadataIndex.delete(chunkId),
        bundle.vectors.delete(chunkId),
      ]),
    );
    const rollbackFailures = rollback.filter((result) => result.status === 'rejected');
    if (rollbackFailures.length > 0) {
      throw new AggregateError(
        [error, ...rollbackFailures.map((result) => result.reason)],
        `Retrieval indexing failed and ${rollbackFailures.length} rollback operation(s) failed`,
      );
    }
    throw error;
  }

  return input.chunks.length;
}

ingestRouter.post('/v1/ingest', (async (req: Request, res: Response) => {
  const parseResult = IngestRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Validation failed', detail: parseResult.error.issues });
    return;
  }

  const body = parseResult.data;
  const tenantId: string = body.tenantId;
  const traceId = req.traceId;

  logger.info(
    { traceId, requestId: body.requestId, documentCount: body.documents.length },
    'ingest payload dispatched to orchestrator',
  );

  const results = await Promise.all(
    body.documents.map(async (doc) => {
      let runId: string | undefined;
      let chunksProduced = 0;
      try {
        const requestProfileId =
          typeof body.metadata.profileId === 'string' ? body.metadata.profileId : undefined;
        const profileId = doc.profileId ?? requestProfileId ?? 'default';
        const run = await submitIngestDocument({
          tenantId,
          profileId,
          sourceId: doc.sourceId,
          content: doc.content,
          contentType: doc.contentType,
          title: doc.title,
          sourceUri: doc.sourceUri,
          chunkSize: body.chunkSize,
          chunkOverlap: body.chunkOverlap,
          model: body.model,
          metadata: doc.metadata,
        });
        runId = run.runId;
        if (run.status !== 'completed') {
          throw new Error(`Ingest workflow ${run.runId} ended with status ${run.status}`);
        }
        const embedStep = run.stepResults.find((r) => r.actor === 'EmbedDispatcher');
        const verifyStep = run.stepResults.find((r) => r.actor === 'IndexVerifier');
        const embedOutput = embedStep?.output as
          | { embeddedChunks?: OrchestratedEmbeddedChunk[] }
          | undefined;
        chunksProduced = Array.isArray(embedOutput?.embeddedChunks)
          ? embedOutput.embeddedChunks.length
          : 0;
        if (chunksProduced === 0) {
          throw new Error(`Ingest workflow ${run.runId} produced no policy-approved chunks`);
        }
        const chunksIndexed = await indexForHybridRetrieval({
          chunks: embedOutput?.embeddedChunks ?? [],
          tenantId,
          profileId,
        });
        return {
          sourceId: doc.sourceId,
          chunksProduced,
          chunksIndexed,
          runId: run.runId,
          runStatus: run.status,
          indexHealthStatus: (verifyStep?.output as { healthStatus?: string } | undefined)
            ?.healthStatus,
        };
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        logger.error(
          { traceId, sourceId: doc.sourceId, error },
          'ingest workflow or retrieval indexing failed',
        );
        return {
          sourceId: doc.sourceId,
          chunksProduced,
          chunksIndexed: 0,
          ...(runId !== undefined ? { runId } : {}),
          error,
        };
      }
    }),
  );

  const totalChunksIndexed = results.reduce((acc, r) => acc + (r.chunksIndexed ?? 0), 0);
  const hasErrors = results.some((r) => 'error' in r && r.error);
  const runIds = results.flatMap((result) =>
    'runId' in result && typeof result.runId === 'string' ? [result.runId] : [],
  );

  res.status(hasErrors ? 207 : 200).json({
    requestId: body.requestId,
    tenantId: body.tenantId,
    results,
    totalChunksIndexed,
    runIds,
    traceId,
    processedAt: new Date().toISOString(),
  });
}) as unknown as RequestHandler);

ingestRouter.get('/v1/ingest/runs/:runId', ((req: Request, res: Response) => {
  const { runId } = req.params;
  const run = getRun(runId as string, req.tenantId);
  if (!run) {
    res.status(404).json({ error: 'Run not found', code: 'RUN_NOT_FOUND' });
    return;
  }
  res.status(200).json(run);
}) as unknown as RequestHandler);
