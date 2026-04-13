import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { championRegistry } from "../lib/champion-registry";
import { classifyTaskCategory, shouldUseFusion } from "../lib/category-classifier";
import { runMultiChampionSynthesis } from "../lib/champion-synthesis";
import { generateEvolutionInsights, getCostQualityMap, getChampionshipReviewStatus, computeChampionHealth } from "../lib/champion-evolution";
import { logger } from "../lib/logger";
import type { TaskCategory } from "../lib/champion-registry";

const router = Router();

const synthesisWindowMs = 60 * 1000;
const synthesisMaxPerWindow = 10;
const synthesisCalls = new Map<string, { count: number; resetAt: number }>();

function synthesisRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const key = (req.ip ?? "unknown") + "|" + (req.body?.agentId ?? "anon");
  const now = Date.now();
  const record = synthesisCalls.get(key);
  if (!record || now > record.resetAt) {
    synthesisCalls.set(key, { count: 1, resetAt: now + synthesisWindowMs });
    next();
    return;
  }
  if (record.count >= synthesisMaxPerWindow) {
    res.status(429).json({ error: "Synthesis rate limit exceeded — max 10 requests per minute per agent" });
    return;
  }
  record.count++;
  next();
}

router.get("/champion/registry", (_req, res) => {
  try {
    const champions = championRegistry.getAllChampions();
    const summary = championRegistry.getSummary();
    res.json({ data: { champions, summary } });
  } catch (err) {
    logger.error({ err }, "Failed to get champion registry");
    res.status(500).json({ error: "Failed to load champion registry" });
  }
});

router.get("/champion/categories", (_req, res) => {
  try {
    const categories = championRegistry.getCategoryChampions();
    res.json({ data: categories });
  } catch (err) {
    logger.error({ err }, "Failed to get category champions");
    res.status(500).json({ error: "Failed to load category champions" });
  }
});

router.get("/champion/:id", (req, res) => {
  try {
    const card = championRegistry.getChampionById(req.params.id);
    if (!card) {
      res.status(404).json({ error: "Champion not found" });
      return;
    }
    res.json({ data: card });
  } catch (err) {
    logger.error({ err }, "Failed to get champion card");
    res.status(500).json({ error: "Failed to load champion card" });
  }
});

router.post("/champion/classify", (req, res) => {
  try {
    const { messages, categoryHint } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "messages array required" });
      return;
    }
    const { riskLevel } = req.body;
    const classification = classifyTaskCategory(messages, categoryHint);
    const champion = championRegistry.getChampionForCategory(classification.category);
    const useFusion = shouldUseFusion(classification, riskLevel);
    res.json({ data: { classification, champion, useFusion } });
  } catch (err) {
    logger.error({ err }, "Failed to classify messages");
    res.status(500).json({ error: "Failed to classify messages" });
  }
});

router.post("/champion/synthesize", synthesisRateLimiter, async (req, res) => {
  try {
    const { messages, category, maxModels, timeoutMs, costGuardUsd, agentId, domain } = req.body;
    if (!messages || !Array.isArray(messages) || !category) {
      res.status(400).json({ error: "messages array and category required" });
      return;
    }
    const result = await runMultiChampionSynthesis(messages, {
      category: category as TaskCategory,
      maxModels,
      timeoutMs,
      costGuardUsd,
      agentId,
      domain,
    });
    res.json({ data: result });
  } catch (err) {
    logger.error({ err }, "Champion synthesis failed");
    res.status(500).json({ error: err instanceof Error ? err.message : "Synthesis failed" });
  }
});

router.get("/champion/evolution/insights", (_req, res) => {
  try {
    const insights = generateEvolutionInsights();
    const reviewStatus = getChampionshipReviewStatus();
    const costQualityMap = getCostQualityMap();
    res.json({ data: { insights, reviewStatus, costQualityMap } });
  } catch (err) {
    logger.error({ err }, "Failed to get evolution insights");
    res.status(500).json({ error: "Failed to load evolution insights" });
  }
});

router.get("/champion/evolution/cost-quality", (_req, res) => {
  try {
    const costQualityMap = getCostQualityMap();
    res.json({ data: costQualityMap });
  } catch (err) {
    logger.error({ err }, "Failed to get cost/quality map");
    res.status(500).json({ error: "Failed to load cost/quality data" });
  }
});

router.get("/champion/health/:modelId", (req, res) => {
  try {
    const { modelId } = req.params;
    const { category } = req.query;
    const health = computeChampionHealth(modelId, (category as TaskCategory) ?? "analysis");
    res.json({ data: health });
  } catch (err) {
    logger.error({ err }, "Failed to compute champion health");
    res.status(500).json({ error: "Failed to compute health signal" });
  }
});

export default router;
