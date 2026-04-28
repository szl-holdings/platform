import { Router, type IRouter, type RequestHandler, type Request, type Response } from 'express';
import { EvalRunRequestSchema } from "@workspace/cf-contracts";
import { logger } from "../middleware/logger.js";
import { submitRetrievalEval } from "@workspace/alloy-ingestion-orchestrator/client";

export const evalsRouter: IRouter = Router();

evalsRouter.post("/v1/evals/run", (async (req: Request, res: Response) => {
  const parseResult = EvalRunRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Validation failed", detail: parseResult.error.issues });
    return;
  }

  const body = parseResult.data;
  const traceId = req.traceId;

  logger.info(
    { traceId, requestId: body.requestId, profileId: body.profileId, datasetId: body.datasetId },
    "evals/run dispatched to orchestrator",
  );

  try {
    const run = await submitRetrievalEval({
      tenantId: body.tenantId as string,
      profileId: body.profileId,
      datasetId: body.datasetId,
      queries: body.queries.map((q) => ({
        queryId: q.queryId,
        query: q.query,
        relevantChunkIds: q.relevantChunkIds,
      })),
      topK: body.topK,
      metrics: body.metrics as Array<"ndcg" | "recall" | "precision" | "mrr"> | undefined,
    });

    const evalStep = run.stepResults.find((r) => r.actor === "RetrievalEvaluator");
    const output = evalStep?.output as {
      queryCount?: number;
      metrics?: Array<{ metric: string; value: number; atK: number }>;
      completedAt?: string;
      processingMs?: number;
    } | undefined;

    res.status(200).json({
      requestId: body.requestId,
      tenantId: body.tenantId,
      profileId: body.profileId,
      datasetId: body.datasetId,
      status: run.status,
      queryCount: output?.queryCount ?? 0,
      metrics: output?.metrics ?? [],
      completedAt: output?.completedAt ?? new Date().toISOString(),
      processingMs: output?.processingMs,
      runId: run.runId,
      traceId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ traceId, error: message }, "orchestrator evals/run failed");
    res.status(500).json({ error: message, traceId });
  }
}) as unknown as RequestHandler);
