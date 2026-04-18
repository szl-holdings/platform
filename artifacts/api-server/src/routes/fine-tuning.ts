/**
 * Fine-Tuning Management API
 *
 * Endpoints for:
 * - Listing fine-tuning jobs
 * - Viewing model lineage (base model + dataset version)
 * - Comparing eval results between base and tuned models
 * - Triggering new fine-tuning runs
 * - Tracking cumulative training costs
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@szl-holdings/db";
import { fineTuningJobs, fineTunedModelRegistry, fineTuningDatasets } from "@szl-holdings/db";
import { eq, desc } from "drizzle-orm";
import {
  submitFineTuningJob,
  pollJobStatus,
  listFineTuningJobs,
  cancelFineTuningJob,
  getAllFineTunedModels,
  deprecateFineTunedModel,
  getModelLineage,
  resolveModelForAgent,
  promoteFineTunedModel,
  curateDatasetForAgent,
  getAllSupportedAgents,
  exportTrainingData,
  serializeToJSONL,
  serializeToHuggingFaceJSON,
  type FineTuningProvider,
} from "@szl-holdings/ai-engine";
import { z } from "zod";
import { validateBody } from "../lib/validation";
import { sendNotFound, sendError, sendBadRequest } from "../lib/api-response";

const fineTuningRouter: IRouter = Router();

const submitJobSchema = z.object({
  agentId: z.string().min(1).max(100),
  provider: z.enum(["openai", "huggingface"]).optional(),
  baseModel: z.string().max(200).optional(),
  hyperparameters: z.object({
    nEpochs: z.number().int().min(1).max(50).optional(),
    batchSize: z.number().int().min(1).max(256).optional(),
    learningRateMultiplier: z.number().positive().max(100).optional(),
  }).optional(),
  options: z.object({
    minSamples: z.number().int().min(1).optional(),
  }).optional(),
});

const datasetPreviewSchema = z.object({
  agentId: z.string().min(1).max(100),
  format: z.enum(["openai-jsonl", "huggingface-json"]).optional(),
  curate: z.boolean().optional(),
});

const lifecycleSchema = z.object({
  lifecycle: z.enum(["staging", "canary", "active", "deprecated"]),
});

fineTuningRouter.get("/fine-tuning/jobs", async (req: Request, res: Response) => {
  try {
    const agentId = req.query["agentId"] as string | undefined;
    const jobs = await listFineTuningJobs(agentId);
    res.json({ jobs, total: jobs.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to list fine-tuning jobs";
    sendError(res, msg);
  }
});

fineTuningRouter.get("/fine-tuning/jobs/:jobId", async (req: Request, res: Response) => {
  try {
    const jobId = String(req.params["jobId"]);
    const status = await pollJobStatus(jobId);
    res.json(status);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to get job status";
    const statusCode = msg.includes("not found") ? 404 : 500;
    sendError(res, msg, statusCode, statusCode === 404 ? "NOT_FOUND" : "INTERNAL_ERROR");
  }
});

fineTuningRouter.post("/fine-tuning/jobs", validateBody(submitJobSchema), async (req: Request, res: Response) => {
  try {
    const {
      agentId,
      provider = "openai",
      baseModel,
      hyperparameters,
      options,
    } = req.body as z.infer<typeof submitJobSchema>;

    const supportedAgents = getAllSupportedAgents();
    if (!supportedAgents.includes(agentId)) {
      sendBadRequest(res, `Agent '${agentId}' not supported for fine-tuning`, { supportedAgents });
      return;
    }

    const defaultModels: Record<FineTuningProvider, string> = {
      openai: "gpt-4o-mini-2024-07-18",
      huggingface: "Qwen/Qwen3-8B",
    };

    const job = await submitFineTuningJob({
      agentId,
      provider,
      baseModel: baseModel ?? defaultModels[provider],
      hyperparameters,
      options,
    });

    res.status(202).json({
      message: "Fine-tuning job submitted",
      job,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to submit fine-tuning job";
    const statusCode = msg.includes("Insufficient") ? 422 : 500;
    sendError(res, msg, statusCode, statusCode === 422 ? "UNPROCESSABLE_ENTITY" : "INTERNAL_ERROR");
  }
});

fineTuningRouter.post("/fine-tuning/jobs/:jobId/cancel", async (req: Request, res: Response) => {
  try {
    const jobId = String(req.params["jobId"]);
    await cancelFineTuningJob(jobId);
    res.json({ success: true, message: `Job ${jobId} cancelled` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to cancel job";
    sendError(res, msg);
  }
});

fineTuningRouter.get("/fine-tuning/models", async (_req: Request, res: Response) => {
  try {
    const models = await getAllFineTunedModels();
    res.json({ models, total: models.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to list fine-tuned models";
    sendError(res, msg);
  }
});

fineTuningRouter.get("/fine-tuning/models/:modelId/lineage", async (req: Request, res: Response) => {
  try {
    const modelId = decodeURIComponent(String(req.params["modelId"]));
    const lineage = await getModelLineage(modelId);
    if (!lineage.model) {
      sendNotFound(res, "Model");
      return;
    }
    res.json(lineage);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to get model lineage";
    sendError(res, msg);
  }
});

fineTuningRouter.get("/fine-tuning/models/:modelId/evals", async (req: Request, res: Response) => {
  try {
    const modelId = decodeURIComponent(String(req.params["modelId"]));
    const [model] = await db
      .select()
      .from(fineTunedModelRegistry)
      .where(eq(fineTunedModelRegistry.modelId, modelId))
      .limit(1);

    if (!model) {
      sendNotFound(res, "Model");
      return;
    }

    const [job] = await db
      .select()
      .from(fineTuningJobs)
      .where(eq(fineTuningJobs.jobId, model.jobId))
      .limit(1);

    res.json({
      modelId,
      agentId: model.agentId,
      lifecycle: model.lifecycle,
      evalPassRate: model.evalPassRate,
      fineTunedScores: model.evalScores,
      baseModelScores: model.baseModelEvalScores ?? job?.baseModelEvalScores,
      baseModel: model.baseModel,
      comparison: model.evalScores && model.baseModelEvalScores
        ? buildComparison(model.evalScores as Record<string, unknown>, model.baseModelEvalScores as Record<string, unknown>)
        : null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to get eval scores";
    sendError(res, msg);
  }
});

fineTuningRouter.patch("/fine-tuning/models/:modelId/lifecycle", validateBody(lifecycleSchema), async (req: Request, res: Response) => {
  try {
    const modelId = decodeURIComponent(String(req.params["modelId"]));
    const { lifecycle } = req.body as z.infer<typeof lifecycleSchema>;

    if (lifecycle === "deprecated") {
      await deprecateFineTunedModel(modelId);
    } else {
      await promoteFineTunedModel(modelId, lifecycle as "canary" | "active");
    }

    res.json({ success: true, modelId, lifecycle });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update lifecycle";
    sendError(res, msg);
  }
});

fineTuningRouter.get("/fine-tuning/datasets", async (req: Request, res: Response) => {
  try {
    const agentId = req.query["agentId"] as string | undefined;
    const query = agentId
      ? db.select().from(fineTuningDatasets).where(eq(fineTuningDatasets.agentId, agentId)).orderBy(desc(fineTuningDatasets.createdAt)).limit(50)
      : db.select().from(fineTuningDatasets).orderBy(desc(fineTuningDatasets.createdAt)).limit(100);

    const datasets = await query;
    res.json({ datasets, total: datasets.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to list datasets";
    sendError(res, msg);
  }
});

fineTuningRouter.post("/fine-tuning/datasets/preview", validateBody(datasetPreviewSchema), async (req: Request, res: Response) => {
  try {
    const { agentId, format = "openai-jsonl", curate = true } = req.body as z.infer<typeof datasetPreviewSchema>;

    const result = curate
      ? await curateDatasetForAgent(agentId, format)
      : await exportTrainingData(agentId, format, { maxSamples: 50 });

    const preview = result.samples.slice(0, 5);

    res.json({
      agentId,
      format,
      version: result.version,
      sampleCount: result.sampleCount,
      sourceBreakdown: result.sourceBreakdown,
      preview,
      exportedAt: result.exportedAt,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to generate dataset preview";
    sendError(res, msg);
  }
});

fineTuningRouter.get("/fine-tuning/datasets/:agentId/export", async (req: Request, res: Response) => {
  try {
    const agentId = String(req.params["agentId"]);
    const format = (req.query["format"] as string ?? "openai-jsonl") as "openai-jsonl" | "huggingface-json";

    const result = await curateDatasetForAgent(agentId, format);

    if (format === "openai-jsonl") {
      const content = serializeToJSONL(result.samples as Array<{ messages: Array<{ role: "system" | "user" | "assistant"; content: string }> }>);
      res.setHeader("Content-Type", "application/jsonl");
      res.setHeader("Content-Disposition", `attachment; filename="${agentId}-${result.version}.jsonl"`);
      res.send(content);
    } else {
      const content = serializeToHuggingFaceJSON(result.samples as Array<{ instruction: string; input: string; output: string; domain: string; agentId: string; source: string; quality: number }>);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${agentId}-${result.version}.json"`);
      res.send(content);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to export dataset";
    sendError(res, msg);
  }
});

fineTuningRouter.get("/fine-tuning/costs", async (req: Request, res: Response) => {
  try {
    const agentId = req.query["agentId"] as string | undefined;

    const query = agentId
      ? db.select().from(fineTuningJobs).where(eq(fineTuningJobs.agentId, agentId))
      : db.select().from(fineTuningJobs);

    const jobs = await query;

    const totalCost = jobs.reduce((sum, j) => sum + (j.trainingCostUsd ?? 0), 0);
    const byAgent = new Map<string, { jobs: number; cost: number }>();

    for (const job of jobs) {
      const existing = byAgent.get(job.agentId) ?? { jobs: 0, cost: 0 };
      byAgent.set(job.agentId, {
        jobs: existing.jobs + 1,
        cost: existing.cost + (job.trainingCostUsd ?? 0),
      });
    }

    const byProvider = new Map<string, { jobs: number; cost: number }>();
    for (const job of jobs) {
      const existing = byProvider.get(job.provider) ?? { jobs: 0, cost: 0 };
      byProvider.set(job.provider, {
        jobs: existing.jobs + 1,
        cost: existing.cost + (job.trainingCostUsd ?? 0),
      });
    }

    res.json({
      totalCostUsd: parseFloat(totalCost.toFixed(4)),
      totalJobs: jobs.length,
      succeededJobs: jobs.filter(j => j.status === "succeeded" || j.status === "registered").length,
      byAgent: Object.fromEntries(
        Array.from(byAgent.entries()).map(([id, data]) => [id, { ...data, cost: parseFloat(data.cost.toFixed(4)) }])
      ),
      byProvider: Object.fromEntries(
        Array.from(byProvider.entries()).map(([p, data]) => [p, { ...data, cost: parseFloat(data.cost.toFixed(4)) }])
      ),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to get cost summary";
    sendError(res, msg);
  }
});

fineTuningRouter.get("/fine-tuning/router/:agentId", async (req: Request, res: Response) => {
  try {
    const agentId = String(req.params["agentId"]);
    const baseModel = (req.query["baseModel"] as string) ?? "gpt-5.2";
    const preferFineTuned = req.query["preferFineTuned"] !== "false";
    const minLifecycle = (req.query["minLifecycle"] as "staging" | "canary" | "active") ?? "canary";

    const resolution = await resolveModelForAgent(agentId, baseModel, {
      preferFineTuned,
      minLifecycle,
    });

    res.json({
      agentId,
      resolvedModel: resolution.model,
      provider: resolution.provider,
      isFineTuned: resolution.isFineTuned,
      fineTunedInfo: resolution.fineTunedInfo,
      fallbackModel: resolution.isFineTuned ? baseModel : undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to resolve model";
    sendError(res, msg);
  }
});

fineTuningRouter.get("/fine-tuning/summary", async (_req: Request, res: Response) => {
  try {
    const [jobs, models, datasets] = await Promise.all([
      db.select().from(fineTuningJobs).orderBy(desc(fineTuningJobs.createdAt)).limit(10),
      db.select().from(fineTunedModelRegistry).where(eq(fineTunedModelRegistry.isActive, true)),
      db.select().from(fineTuningDatasets).orderBy(desc(fineTuningDatasets.createdAt)).limit(5),
    ]);

    const totalCost = jobs.reduce((s, j) => s + (j.trainingCostUsd ?? 0), 0);

    res.json({
      overview: {
        totalJobs: jobs.length,
        activeModels: models.length,
        registeredDatasets: datasets.length,
        totalTrainingCostUsd: parseFloat(totalCost.toFixed(4)),
      },
      jobStatusBreakdown: countByField(jobs, "status"),
      modelLifecycleBreakdown: countByField(models, "lifecycle"),
      recentJobs: jobs.slice(0, 5).map(j => ({
        jobId: j.jobId,
        agentId: j.agentId,
        status: j.status,
        provider: j.provider,
        datasetSize: j.datasetSize,
        submittedAt: j.submittedAt,
      })),
      supportedAgents: getAllSupportedAgents(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to get summary";
    sendError(res, msg);
  }
});

function countByField<T extends Record<string, unknown>>(items: T[], field: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const val = String(item[field] ?? "unknown");
    counts[val] = (counts[val] ?? 0) + 1;
  }
  return counts;
}

function buildComparison(
  fineTuned: Record<string, unknown>,
  base: Record<string, unknown>,
): Array<{ metric: string; base: unknown; fineTuned: unknown; delta: string }> {
  const metrics = ["passRate", "passed", "failed", "avgLatencyMs"];
  return metrics.map(metric => {
    const baseVal = base[metric];
    const ftVal = fineTuned[metric];
    let delta = "—";
    if (typeof baseVal === "number" && typeof ftVal === "number") {
      const diff = ftVal - baseVal;
      delta = diff >= 0 ? `+${diff.toFixed(3)}` : diff.toFixed(3);
    }
    return { metric, base: baseVal, fineTuned: ftVal, delta };
  });
}

export default fineTuningRouter;
