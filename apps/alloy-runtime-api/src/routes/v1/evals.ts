/**
 * AEEP v1 Eval Routes
 *
 * POST /v1/evals/run — run an evaluation suite against a model/pipeline
 *
 * In production, this delegates to the alloy-eval-runner service which
 * executes LLM judge evaluations, RAGAS metrics, and policy compliance checks.
 * Stubs return the correct response envelope so consumers can code against the
 * contract before the eval service is wired.
 */
import { Router, type IRouter } from "express";
import type { Request, Response } from "express";
import { z } from "zod";

const router: IRouter = Router();

const EvalRunSchema = z.object({
  suiteId: z.string().min(1),
  datasetId: z.string().optional(),
  modelId: z.string().optional(),
  pipelineId: z.string().optional(),
  metrics: z.array(z.enum([
    "faithfulness",
    "context_precision",
    "context_recall",
    "answer_relevancy",
    "hallucination_rate",
    "policy_compliance",
    "citation_coverage",
  ])).min(1),
  maxSamples: z.number().int().positive().max(10000).optional(),
  async: z.boolean().default(true),
});

router.post("/run", (req: Request, res: Response): void => {
  const parse = EvalRunSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Validation failed", issues: parse.error.issues });
    return;
  }

  const { suiteId, datasetId, modelId, pipelineId, metrics, maxSamples, async: isAsync } = parse.data;
  const tenantId = req.tenantCtx?.tenantId ?? "default";
  const evalRunId = `eval_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const response = {
    evalRunId,
    tenantId,
    suiteId,
    datasetId: datasetId ?? null,
    modelId: modelId ?? null,
    pipelineId: pipelineId ?? null,
    metrics,
    maxSamples: maxSamples ?? null,
    status: isAsync ? "queued" : "completed",
    queuedAt: new Date().toISOString(),
    results: isAsync ? null : {
      scores: Object.fromEntries(metrics.map((m) => [m, null])),
      sampleCount: 0,
      completedAt: new Date().toISOString(),
    },
    statusUrl: `/v1/evals/${evalRunId}`,
    note: "Eval runner not yet wired — returns accepted envelope. Connect alloy-eval-runner service.",
  };

  res.status(isAsync ? 202 : 200).json(response);
});

export default router;
