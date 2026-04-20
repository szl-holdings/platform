import { Router } from "express";
import type { Request, Response } from "express";
import { EvalRunRequestSchema } from "@workspace/aef-contracts";
import { logger } from "../middleware/logger.js";

export const evalsRouter = Router();

evalsRouter.post("/v1/evals/run", (req: Request, res: Response) => {
  const parseResult = EvalRunRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Validation failed", detail: parseResult.error.issues });
    return;
  }

  const body = parseResult.data;
  const traceId = req.traceId;

  logger.info({ traceId, requestId: body.requestId, profileId: body.profileId, datasetId: body.datasetId }, "evals/run called");

  res.status(200).json({
    requestId: body.requestId,
    tenantId: body.tenantId,
    profileId: body.profileId,
    datasetId: body.datasetId,
    status: "not_configured",
    queryCount: 0,
    metrics: [],
    completedAt: new Date().toISOString(),
    traceId,
    note: "No eval harness is registered for this AEF instance. Eval harness implementation is scheduled for Phase 5. Register a harness via the evalHarnessRegistry (coming in Phase 5) to activate this endpoint.",
  });
});
