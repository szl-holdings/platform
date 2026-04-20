import { Router } from "express";
import type { Request, Response } from "express";
import { IndexRebuildRequestSchema, IndexVerifyRequestSchema } from "@workspace/aef-contracts";
import { logger } from "../middleware/logger.js";
import { submitRebuildIndex, submitVerifyIndexHealth, getRun } from "@workspace/alloy-ingestion-orchestrator/client";

export const indexOpsRouter = Router();

indexOpsRouter.post("/v1/index/rebuild", async (req: Request, res: Response) => {
  const parseResult = IndexRebuildRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Validation failed", detail: parseResult.error.issues });
    return;
  }

  const body = parseResult.data;
  const traceId = req.traceId;

  logger.info(
    { traceId, requestId: body.requestId, fullRebuild: body.fullRebuild },
    "index rebuild dispatched to orchestrator",
  );

  try {
    const run = await submitRebuildIndex({
      tenantId: body.tenantId as string,
      profileId: body.profileId,
      fullRebuild: body.fullRebuild,
      sourceIds: body.sourceIds,
    });

    res.status(202).json({
      requestId: body.requestId,
      tenantId: body.tenantId,
      jobId: run.runId,
      status: run.status,
      startedAt: run.startedAt,
      traceId,
      approvalRequestId: run.approvalRequestId,
      note: run.status === "pending-approval"
        ? "Index rebuild is pending operator approval for pointer swap. Approve via POST /orchestrator/v1/runs/:runId/approve"
        : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ traceId, error: message }, "orchestrator rebuild failed");
    res.status(500).json({ error: message, traceId });
  }
});

indexOpsRouter.post("/v1/index/verify", async (req: Request, res: Response) => {
  const parseResult = IndexVerifyRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Validation failed", detail: parseResult.error.issues });
    return;
  }

  const body = parseResult.data;
  const traceId = req.traceId;

  logger.info({ traceId, requestId: body.requestId }, "index verify dispatched to orchestrator");

  try {
    const run = await submitVerifyIndexHealth({
      tenantId: body.tenantId as string,
      profileId: body.profileId,
    });

    const verifyStep = run.stepResults.find((r) => r.actor === "IndexVerifier");
    const output = verifyStep?.output as {
      chunksVerified?: number;
      driftScore?: number;
      healthStatus?: string;
    } | undefined;

    res.status(200).json({
      requestId: body.requestId,
      tenantId: body.tenantId,
      chunksVerified: output?.chunksVerified ?? 0,
      missingChunks: [],
      corruptChunks: [],
      verified: output?.healthStatus !== "critical",
      driftScore: output?.driftScore,
      healthStatus: output?.healthStatus,
      runId: run.runId,
      traceId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ traceId, error: message }, "orchestrator verify failed");
    res.status(500).json({ error: message, traceId });
  }
});

indexOpsRouter.get("/v1/index/runs/:runId", (req: Request, res: Response) => {
  const { runId } = req.params;
  const run = getRun(runId as string);
  if (!run) {
    res.status(404).json({ error: `Run not found: ${runId}` });
    return;
  }
  res.status(200).json(run);
});
