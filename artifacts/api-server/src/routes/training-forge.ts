import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { sendSuccess, sendCreated, sendBadRequest, handleRouteError } from "../lib/api-response";
import {
  createDataset,
  listDatasets,
  getDatasetFormatted,
  launchJob,
  listJobs,
  getJob,
  cancelJob,
  createExperiment,
  listExperiments,
  getEvolutionFeed,
  getProviderModels,
  forgeDashboard,
  type ForgeProvider,
  type DatasetFormat,
} from "../lib/training-forge";

const router = Router();

function getOrgId(req: Request): number {
  return (req as { orgId?: number }).orgId ?? 1;
}

router.get("/training-forge/dashboard", async (req: Request, res: Response) => {
  try {
    const data = await forgeDashboard(getOrgId(req));
    sendSuccess(res, { dashboard: data });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch Training Forge dashboard");
  }
});

router.get("/training-forge/providers", async (_req: Request, res: Response) => {
  try {
    const models = await getProviderModels();
    const providers = Object.entries(models).map(([id, baseModels]) => ({
      id,
      name: { openai: "OpenAI", together: "Together AI", fireworks: "Fireworks AI", vertex: "Google Vertex" }[id] || id,
      description: {
        openai: "GPT-3.5 and GPT-4 fine-tuning via OpenAI API",
        together: "Open-source model fine-tuning at competitive cost",
        fireworks: "Fast inference + fine-tuning for production",
        vertex: "Google Gemini and PaLM fine-tuning on GCP",
      }[id] || "",
      baseModels,
      status: "available",
    }));
    sendSuccess(res, { providers });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch providers");
  }
});

router.get("/training-forge/datasets", async (req: Request, res: Response) => {
  try {
    const datasets = await listDatasets(getOrgId(req));
    sendSuccess(res, { datasets });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch datasets");
  }
});

router.post("/training-forge/datasets", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { name, description, format, rawData } = req.body;
    if (!name || !rawData) {
      return sendBadRequest(res, "name and rawData are required");
    }
    const dataset = await createDataset({
      orgId: getOrgId(req),
      name,
      description,
      format: (format as DatasetFormat) || "jsonl",
      rawData: Array.isArray(rawData) ? rawData : [rawData],
    });
    sendCreated(res, { dataset });
  } catch (err) {
    handleRouteError(res, err, "Failed to create dataset");
  }
});

router.get("/training-forge/datasets/:id/format/:provider", async (req: Request, res: Response) => {
  try {
    const provider = req.params.provider as ForgeProvider;
    if (!["openai", "together", "fireworks", "vertex"].includes(provider)) {
      return sendBadRequest(res, "Invalid provider");
    }
    const formatted = await getDatasetFormatted(parseInt(req.params.id), provider);
    sendSuccess(res, { provider, formatted: formatted.slice(0, 10), total: formatted.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to format dataset");
  }
});

router.get("/training-forge/jobs", async (req: Request, res: Response) => {
  try {
    const { provider, status } = req.query;
    const jobs = await listJobs(getOrgId(req), {
      provider: provider as string | undefined,
      status: status as string | undefined,
    });
    sendSuccess(res, { jobs });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch jobs");
  }
});

router.get("/training-forge/jobs/:id", async (req: Request, res: Response) => {
  try {
    const job = await getJob(parseInt(req.params.id), getOrgId(req));
    if (!job) return sendBadRequest(res, "Job not found");
    sendSuccess(res, { job });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch job");
  }
});

router.post("/training-forge/jobs", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { name, provider, baseModel, datasetId, epochs, batchSize, learningRate } = req.body;
    if (!name || !provider || !baseModel || !datasetId) {
      return sendBadRequest(res, "name, provider, baseModel, and datasetId are required");
    }
    const validProviders: ForgeProvider[] = ["openai", "together", "fireworks", "vertex"];
    if (!validProviders.includes(provider as ForgeProvider)) {
      return sendBadRequest(res, `provider must be one of: ${validProviders.join(", ")}`);
    }
    const job = await launchJob({
      orgId: getOrgId(req),
      name,
      provider: provider as ForgeProvider,
      baseModel,
      datasetId: parseInt(datasetId),
      epochs: epochs ? parseInt(epochs) : undefined,
      batchSize: batchSize ? parseInt(batchSize) : undefined,
      learningRate: learningRate ? parseFloat(learningRate) : undefined,
    });
    sendCreated(res, { job });
  } catch (err) {
    handleRouteError(res, err, "Failed to launch training job");
  }
});

router.post("/training-forge/jobs/:id/cancel", authMiddleware(), async (req: Request, res: Response) => {
  try {
    await cancelJob(parseInt(req.params.id), getOrgId(req));
    sendSuccess(res, { cancelled: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to cancel job");
  }
});

router.get("/training-forge/experiments", async (req: Request, res: Response) => {
  try {
    const experiments = await listExperiments(getOrgId(req));
    sendSuccess(res, { experiments });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch experiments");
  }
});

router.post("/training-forge/experiments", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { name, jobIds, baselineModel, testPrompts } = req.body;
    if (!name || !jobIds?.length || !testPrompts?.length) {
      return sendBadRequest(res, "name, jobIds[], and testPrompts[] are required");
    }
    const experiment = await createExperiment({
      orgId: getOrgId(req),
      name,
      jobIds: Array.isArray(jobIds) ? jobIds.map(Number) : [Number(jobIds)],
      baselineModel: baselineModel || "gpt-4o",
      testPrompts: Array.isArray(testPrompts) ? testPrompts : [testPrompts],
    });
    sendCreated(res, { experiment });
  } catch (err) {
    handleRouteError(res, err, "Failed to create experiment");
  }
});

router.get("/training-forge/evolution-feed", async (req: Request, res: Response) => {
  try {
    const feed = await getEvolutionFeed(getOrgId(req));
    sendSuccess(res, { feed });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch evolution feed");
  }
});

export default router;
