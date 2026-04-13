import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { logger } from "../lib/logger";
import {
  getModelBenchmarks,
  createABTest,
  listABTests,
  getABTestResults,
  createFineTuneJob,
  listFineTuneJobs,
  getAdaptiveRoutes,
  getBestRouteForDomain,
} from "../lib/ai-gateway-intelligence";
import {
  getUserPreferences,
  learnUserPreference,
  recallEpisodicMemories,
  getRecentEpisodicMemories,
  consolidateOldMemories,
  buildPersonalizedContext,
} from "../lib/mastra/memory-persistence";

const router = Router();

router.use(authMiddleware);

function str(v: unknown): string { return String(v ?? ""); }
function optStr(v: unknown): string | undefined { return v != null ? String(v) : undefined; }
function optInt(v: unknown, fallback: number): number { return v != null ? parseInt(String(v), 10) || fallback : fallback; }

router.get("/benchmarks", async (_req: Request, res: Response): Promise<void> => {
  try {
    const benchmarks = await getModelBenchmarks();
    res.json({ benchmarks, count: benchmarks.length });
  } catch (err: any) {
    logger.error({ err }, "Failed to get model benchmarks");
    res.status(500).json({ error: err.message });
  }
});

router.get("/ab-tests", async (_req: Request, res: Response): Promise<void> => {
  try {
    const tests = await listABTests();
    res.json({ tests, count: tests.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/ab-tests", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, providerA, providerB, metric } = req.body;
    if (!name || !providerA || !providerB) {
      res.status(400).json({ error: "name, providerA, and providerB are required" });
      return;
    }
    const test = await createABTest({ name, providerA, providerB, metric });
    res.status(201).json({ test });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/ab-tests/:testId/results", async (req: Request, res: Response): Promise<void> => {
  try {
    const testId = str(req.params["testId"]);
    const results = await getABTestResults(testId);
    if (!results) {
      res.status(404).json({ error: "No results yet for this test" });
      return;
    }
    res.json({ testId, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/fine-tune-jobs", async (_req: Request, res: Response): Promise<void> => {
  try {
    const jobs = await listFineTuneJobs();
    res.json({ jobs, count: jobs.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/fine-tune-jobs", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, provider, baseModel, trainingDataUrl, trainingExamples, hyperparams } = req.body;
    if (!name || !provider || !baseModel) {
      res.status(400).json({ error: "name, provider, and baseModel are required" });
      return;
    }
    if (!["openai", "anthropic"].includes(provider)) {
      res.status(400).json({ error: "provider must be openai or anthropic" });
      return;
    }
    const job = await createFineTuneJob({ name, provider, baseModel, trainingDataUrl, trainingExamples, hyperparams });
    res.status(201).json({ job });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/adaptive-routes", async (_req: Request, res: Response): Promise<void> => {
  try {
    const routes = await getAdaptiveRoutes();
    res.json({ routes, count: routes.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/adaptive-routes/best", async (req: Request, res: Response): Promise<void> => {
  try {
    const domain = optStr(req.query["domain"]);
    const taskType = optStr(req.query["taskType"]);
    if (!domain || !taskType) {
      res.status(400).json({ error: "domain and taskType are required" });
      return;
    }
    const route = await getBestRouteForDomain(domain, taskType);
    res.json({ route, found: !!route });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/memory/preferences/:userId", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = str(req.params["userId"]);
    const preferences = await getUserPreferences(userId);
    res.json({ userId, preferences, count: preferences.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/memory/preferences/:userId", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = str(req.params["userId"]);
    const { key, value, confidence } = req.body;
    if (!key || !value) {
      res.status(400).json({ error: "key and value are required" });
      return;
    }
    await learnUserPreference(userId, key, value, confidence ?? 0.7);
    res.json({ success: true, userId, key, value });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/memory/episodic/:userId", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = str(req.params["userId"]);
    const topic = optStr(req.query["topic"]);
    const agentId = optStr(req.query["agentId"]);
    const limit = optInt(req.query["limit"], 10);

    const memories = topic
      ? await recallEpisodicMemories(userId, topic, agentId, limit)
      : await getRecentEpisodicMemories(userId, agentId, limit);

    res.json({ userId, memories, count: memories.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/memory/consolidate/:userId/:agentId", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = str(req.params["userId"]);
    const agentId = str(req.params["agentId"]);
    const { thresholdDays } = req.body;
    const result = await consolidateOldMemories(userId, agentId, thresholdDays ?? 30);
    res.json({ userId, agentId, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/memory/context/:userId/:agentId", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = str(req.params["userId"]);
    const agentId = str(req.params["agentId"]);
    const topic = optStr(req.query["topic"]) ?? "general";
    const context = await buildPersonalizedContext(userId, agentId, topic);
    res.json({ userId, agentId, personalizationContext: context, hasContext: context.length > 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
