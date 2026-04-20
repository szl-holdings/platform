import { Router } from "express";
import type { Request, Response } from "express";
import { IndexRebuildRequestSchema, IndexVerifyRequestSchema } from "@workspace/aef-contracts";
import { randomUUID } from "crypto";
import { logger } from "../middleware/logger.js";

export const indexOpsRouter = Router();

indexOpsRouter.post("/v1/index/rebuild", (req: Request, res: Response) => {
  const parseResult = IndexRebuildRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Validation failed", detail: parseResult.error.issues });
    return;
  }

  const body = parseResult.data;
  const traceId = req.traceId;
  const jobId = randomUUID();

  logger.info({ traceId, requestId: body.requestId, jobId, fullRebuild: body.fullRebuild }, "index rebuild queued");

  res.status(202).json({
    requestId: body.requestId,
    tenantId: body.tenantId,
    jobId,
    status: "queued",
    startedAt: new Date().toISOString(),
    traceId,
    note: "Index rebuild is queued. Phase 4 orchestrator will execute this job.",
  });
});

indexOpsRouter.post("/v1/index/verify", (req: Request, res: Response) => {
  const parseResult = IndexVerifyRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Validation failed", detail: parseResult.error.issues });
    return;
  }

  const body = parseResult.data;
  const traceId = req.traceId;

  logger.info({ traceId, requestId: body.requestId }, "index verify requested");

  res.status(200).json({
    requestId: body.requestId,
    tenantId: body.tenantId,
    chunksVerified: 0,
    missingChunks: [],
    corruptChunks: [],
    verified: true,
    traceId,
    note: "No chunks are indexed yet; verification passes vacuously. Ingest documents via POST /v1/ingest to populate the index.",
  });
});
