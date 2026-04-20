import { Router } from "express";
import type { Request, Response } from "express";
import { IngestRequestSchema } from "@workspace/aef-contracts";
import { logger } from "../middleware/logger.js";
import { submitIngestDocument, getRun } from "@workspace/alloy-ingestion-orchestrator/client";

export const ingestRouter = Router();

ingestRouter.post("/v1/ingest", async (req: Request, res: Response) => {
  const parseResult = IngestRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Validation failed", detail: parseResult.error.issues });
    return;
  }

  const body = parseResult.data;
  const traceId = req.traceId;

  logger.info(
    { traceId, requestId: body.requestId, documentCount: body.documents.length },
    "ingest payload dispatched to orchestrator",
  );

  const runIds: string[] = [];
  const results = await Promise.all(
    body.documents.map(async (doc) => {
      try {
        const run = await submitIngestDocument({
          tenantId: body.tenantId as string,
          profileId: body.metadata?.["profileId"] as string | undefined,
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
        runIds.push(run.runId);
        const embedStep = run.stepResults.find((r) => r.actor === "EmbedDispatcher");
        const verifyStep = run.stepResults.find((r) => r.actor === "IndexVerifier");
        const embedOutput = embedStep?.output as { embeddedChunks?: unknown[] } | undefined;
        const chunksProduced = Array.isArray(embedOutput?.embeddedChunks)
          ? embedOutput.embeddedChunks.length
          : 0;
        return {
          sourceId: doc.sourceId,
          chunksProduced,
          chunksIndexed: chunksProduced,
          runId: run.runId,
          runStatus: run.status,
          indexHealthStatus: (verifyStep?.output as { healthStatus?: string } | undefined)?.healthStatus,
        };
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        logger.error({ traceId, sourceId: doc.sourceId, error }, "orchestrator ingest failed");
        return {
          sourceId: doc.sourceId,
          chunksProduced: 0,
          chunksIndexed: 0,
          error,
        };
      }
    }),
  );

  const totalChunksIndexed = results.reduce((acc, r) => acc + (r.chunksIndexed ?? 0), 0);
  const hasErrors = results.some((r) => "error" in r && r.error);

  res.status(hasErrors ? 207 : 200).json({
    requestId: body.requestId,
    tenantId: body.tenantId,
    results,
    totalChunksIndexed,
    runIds,
    traceId,
    processedAt: new Date().toISOString(),
  });
});

ingestRouter.get("/v1/ingest/runs/:runId", (req: Request, res: Response) => {
  const { runId } = req.params;
  const run = getRun(runId as string);
  if (!run) {
    res.status(404).json({ error: `Run not found: ${runId}` });
    return;
  }
  res.status(200).json(run);
});
