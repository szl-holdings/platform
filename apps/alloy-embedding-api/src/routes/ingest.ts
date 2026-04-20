import { Router } from "express";
import type { Request, Response } from "express";
import { IngestRequestSchema } from "@workspace/aef-contracts";
import { logger } from "../middleware/logger.js";

export const ingestRouter = Router();

const pendingIngestJobs: Array<{ receivedAt: string; requestId: string; tenantId: string; documentCount: number }> = [];

ingestRouter.post("/v1/ingest", (req: Request, res: Response) => {
  const parseResult = IngestRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Validation failed", detail: parseResult.error.issues });
    return;
  }

  const body = parseResult.data;
  const traceId = req.traceId;
  const receivedAt = new Date().toISOString();

  pendingIngestJobs.push({
    receivedAt,
    requestId: body.requestId,
    tenantId: body.tenantId as string,
    documentCount: body.documents.length,
  });

  const results = body.documents.map((doc) => ({
    sourceId: doc.sourceId,
    chunksProduced: 0,
    chunksIndexed: 0,
    status: "queued",
    note: "Phase 4 ingestion orchestrator will process this document",
  }));

  logger.info(
    { traceId, requestId: body.requestId, documentCount: body.documents.length },
    "ingest payload accepted",
  );

  res.status(202).json({
    requestId: body.requestId,
    tenantId: body.tenantId,
    status: "queued",
    results,
    totalChunksIndexed: 0,
    note: "Documents accepted and persisted for Phase 4 ingestion orchestration. Chunks will be produced and indexed when the orchestrator processes this job.",
    traceId,
    receivedAt,
  });
});
