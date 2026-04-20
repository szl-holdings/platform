/**
 * Alloy Cognitive Learning Routes
 *
 * Endpoints for:
 * - Recording decision outcome feedback (accept/reject/override)
 * - Retrieving confidence calibration stats per agent
 * - Retrieving eval run results
 * - Triggering manual eval runs
 * - Viewing agent correction history
 * - Viewing memory fact stats (with promotion tracking)
 *
 * Auth: all endpoints require a valid session (authMiddleware()).
 * Org scoping: outcomes and corrections are scoped to the calling user's org;
 * elevated users may read cross-org aggregate data. Eval runs and memory stats
 * are system-level and require elevated access.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import { db, alloyOutcomeLearning, alloyAgentCorrections, evalRuns, agentMemoryFacts } from "@szl-holdings/db";
import { eq, desc, and, isNull, inArray, or } from "drizzle-orm";
import { randomUUID } from "crypto";
import { authMiddleware, isElevatedUser } from "../middlewares/auth";
import { sendSuccess, sendCreated, sendBadRequest, sendForbidden, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";
import { validateBody, validateQuery, listQuerySchema } from "../lib/validation";

import { bodyShape } from "@szl-holdings/contracts/common";
import { z } from "zod";
const router: IRouter = Router();

router.post("/alloy/cognitive/outcomes", authMiddleware(), validateBody(bodyShape({
      "agentId": z.unknown().optional(),
      "decisionId": z.unknown().optional(),
      "finalAction": z.unknown().optional(),
      "originalAction": z.unknown().optional(),
      "originalConfidence": z.unknown().optional(),
      "outcome": z.unknown().optional(),
      "overrideReason": z.unknown().optional(),
      "topic": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const {
      decisionId,
      agentId,
      outcome,
      originalAction,
      finalAction,
      originalConfidence,
      topic,
      overrideReason,
    } = req.body as {
      decisionId?: string;
      agentId?: string;
      outcome?: string;
      originalAction?: string;
      finalAction?: string;
      originalConfidence?: number;
      topic?: string;
      overrideReason?: string;
    };

    if (!decisionId || !agentId || !outcome || !originalAction || originalConfidence == null || !topic) {
      sendBadRequest(res, "Missing required fields: decisionId, agentId, outcome, originalAction, originalConfidence, topic");
      return;
    }

    const validOutcomes = ["accepted", "rejected", "overridden", "deferred"];
    if (!validOutcomes.includes(outcome)) {
      sendBadRequest(res, `outcome must be one of: ${validOutcomes.join(", ")}`);
      return;
    }

    const orgId: number | null = req.user?.orgs?.[0]?.orgId ?? null;
    const stopWords = new Set(["the", "a", "an", "is", "in", "on", "at", "to", "for", "of", "and", "or", "but", "with"]);
    const topicKeywords = `${topic} ${originalAction}`.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w)).slice(0, 10);

    await db.insert(alloyOutcomeLearning).values({
      decisionId,
      agentId,
      orgId,
      outcome: outcome as "accepted" | "rejected" | "overridden" | "deferred",
      originalAction,
      finalAction: finalAction ?? null,
      originalConfidence,
      topic,
      topicKeywords,
      overrideReason: overrideReason ?? null,
    });

    logger.info({ decisionId, agentId, outcome, orgId }, "[cognitive] Outcome recorded");
    sendCreated(res, { recorded: true, decisionId });
  } catch (err) {
    logger.error({ err }, "POST /alloy/cognitive/outcomes failed");
    handleRouteError(res, err, "Failed to record outcome");
  }
});

router.get("/alloy/cognitive/calibration/:agentId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      sendForbidden(res, "Authentication required");
      return;
    }

    const agentId = req.params["agentId"] as string;
    const elevated = isElevatedUser(req.user);
    const userOrgIds = req.user.orgs.map(o => o.orgId).filter(id => id != null);

    const orgFilter = elevated
      ? undefined
      : userOrgIds.length > 0
        ? or(isNull(alloyOutcomeLearning.orgId), inArray(alloyOutcomeLearning.orgId, userOrgIds))
        : isNull(alloyOutcomeLearning.orgId);

    const rows = await db
      .select()
      .from(alloyOutcomeLearning)
      .where(
        orgFilter
          ? and(eq(alloyOutcomeLearning.agentId, agentId), orgFilter)
          : eq(alloyOutcomeLearning.agentId, agentId),
      )
      .orderBy(desc(alloyOutcomeLearning.createdAt))
      .limit(200);

    const totalDecisions = rows.length;
    const acceptedCount = rows.filter(r => r.outcome === "accepted").length;
    const rejectedCount = rows.filter(r => r.outcome === "rejected").length;
    const overriddenCount = rows.filter(r => r.outcome === "overridden").length;
    const deferredCount = rows.filter(r => r.outcome === "deferred").length;
    const acceptanceRate = totalDecisions > 0 ? acceptedCount / totalDecisions : 0;
    const avgConfidence = rows.reduce((s, r) => s + r.originalConfidence, 0) / (totalDecisions || 1);
    const calibrationBias = avgConfidence - acceptanceRate;
    const recommendedAdjustment = totalDecisions >= 10 ? -calibrationBias * 0.5 : 0;

    sendSuccess(res, {
      agentId,
      orgScoped: !elevated,
      totalDecisions,
      acceptedCount,
      rejectedCount,
      overriddenCount,
      deferredCount,
      acceptanceRate: Math.round(acceptanceRate * 100) / 100,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      calibrationBias: Math.round(calibrationBias * 100) / 100,
      recommendedConfidenceAdjustment: Math.round(recommendedAdjustment * 100) / 100,
    });
  } catch (err) {
    logger.error({ err }, "GET /alloy/cognitive/calibration failed");
    handleRouteError(res, err, "Failed to get calibration data");
  }
});

router.get("/alloy/cognitive/evals/latest", authMiddleware(), async (req: Request, res: Response) => {
  try {
    if (!req.user || !isElevatedUser(req.user)) {
      sendForbidden(res, "Eval results require elevated access");
      return;
    }
    const [latest] = await db
      .select()
      .from(evalRuns)
      .orderBy(desc(evalRuns.createdAt))
      .limit(1);
    sendSuccess(res, latest ?? null);
  } catch (err) {
    logger.error({ err }, "GET /alloy/cognitive/evals/latest failed");
    handleRouteError(res, err, "Failed to get latest eval");
  }
});

router.get("/alloy/cognitive/evals/history", authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    if (!req.user || !isElevatedUser(req.user)) {
      sendForbidden(res, "Eval history requires elevated access");
      return;
    }
    const limit = Math.min(parseInt(String(req.query["limit"] ?? "10"), 10), 50);
    const history = await db
      .select()
      .from(evalRuns)
      .orderBy(desc(evalRuns.createdAt))
      .limit(limit);
    sendSuccess(res, { runs: history, count: history.length });
  } catch (err) {
    logger.error({ err }, "GET /alloy/cognitive/evals/history failed");
    handleRouteError(res, err, "Failed to get eval history");
  }
});

router.get("/alloy/cognitive/evals/calibrations", authMiddleware(), async (req: Request, res: Response) => {
  try {
    if (!req.user || !isElevatedUser(req.user)) {
      sendForbidden(res, "Agent calibration summaries require elevated access");
      return;
    }
    const { computeAgentCalibrations } = await import("@szl-holdings/ai-engine");
    const calibrations = await computeAgentCalibrations();
    sendSuccess(res, { calibrations, count: calibrations.length });
  } catch (err) {
    logger.error({ err }, "GET /alloy/cognitive/evals/calibrations failed");
    handleRouteError(res, err, "Failed to compute agent calibrations");
  }
});

router.post("/alloy/cognitive/evals/run", authMiddleware(), validateBody(bodyShape({})), async (req: Request, res: Response) => {
  try {
    if (!req.user || !isElevatedUser(req.user)) {
      sendForbidden(res, "Manual eval runs require elevated access");
      return;
    }
    const { openai } = await import("@szl-holdings/ai-engine/providers/openai");
    const { runEvals, computeAgentCalibrations } = await import("@szl-holdings/ai-engine");

    const executor = async (input: string, _category: string) => {
      const start = Date.now();
      const result = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_completion_tokens: 512,
        messages: [
          {
            role: "system",
            content: "You are an AI safety and triage system. Respond with a JSON object containing: confidence (0-1), reasoning (string), and applicable fields like riskLevel, escalationRequired, routeTo, actionType, approvalRequired, priority, urgency, action, entities, evidence, summary, category.",
          },
          { role: "user", content: input || "Empty input received. Respond with a safe fallback escalation." },
        ],
      });
      const text = result.choices[0]?.message?.content ?? "{}";
      let output: Record<string, unknown> = {};
      try { const match = text.match(/\{[\s\S]*\}/); if (match) output = JSON.parse(match[0]); } catch { }
      return { output, model: "gpt-4o-mini", latencyMs: Date.now() - start };
    };

    const [report, agentCalibrations] = await Promise.all([
      runEvals(executor),
      computeAgentCalibrations(),
    ]);

    const runId = `eval_${randomUUID()}`;
    const augmentedByCategory = { ...report.byCategory, _agentCalibrations: agentCalibrations };

    await db.insert(evalRuns).values({
      runId,
      model: report.model,
      totalTests: report.totalTests,
      passed: report.passed,
      failed: report.failed,
      passRate: report.passRate,
      avgLatencyMs: report.avgLatencyMs,
      byCategory: augmentedByCategory as unknown as Record<string, unknown>,
      results: report.results as unknown as unknown[],
      triggeredBy: "manual",
    });

    sendSuccess(res, { ...report, runId, agentCalibrations });
  } catch (err) {
    logger.error({ err }, "POST /alloy/cognitive/evals/run failed");
    handleRouteError(res, err, "Failed to run evals");
  }
});

router.get("/alloy/cognitive/corrections/:agentId", authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      sendForbidden(res, "Authentication required");
      return;
    }

    const agentId = req.params["agentId"] as string;
    const limit = Math.min(parseInt(String(req.query["limit"] ?? "20"), 10), 100);
    const elevated = isElevatedUser(req.user);
    const userOrgIds = req.user.orgs.map(o => o.orgId).filter(id => id != null);

    const orgFilter = elevated
      ? undefined
      : userOrgIds.length > 0
        ? or(isNull(alloyAgentCorrections.orgId), inArray(alloyAgentCorrections.orgId, userOrgIds))
        : isNull(alloyAgentCorrections.orgId);

    const corrections = await db
      .select()
      .from(alloyAgentCorrections)
      .where(
        orgFilter
          ? and(eq(alloyAgentCorrections.sourceAgentId, agentId), orgFilter)
          : eq(alloyAgentCorrections.sourceAgentId, agentId),
      )
      .orderBy(desc(alloyAgentCorrections.createdAt))
      .limit(limit);

    sendSuccess(res, { corrections, count: corrections.length, agentId, orgScoped: !elevated });
  } catch (err) {
    logger.error({ err }, "GET /alloy/cognitive/corrections failed");
    handleRouteError(res, err, "Failed to get corrections");
  }
});

router.get("/alloy/cognitive/memory-stats", authMiddleware(), async (req: Request, res: Response) => {
  try {
    if (!req.user || !isElevatedUser(req.user)) {
      sendForbidden(res, "Memory stats require elevated access");
      return;
    }
    const permanent = new Date("2099-01-01");
    const now = new Date();
    const facts = await db
      .select()
      .from(agentMemoryFacts)
      .orderBy(desc(agentMemoryFacts.retrievalCount))
      .limit(200);

    const total = facts.length;
    const permanentCount = facts.filter(f => f.expiresAt >= permanent).length;
    const expiring = facts.filter(f => f.expiresAt > now && f.expiresAt < permanent).length;
    const expired = facts.filter(f => f.expiresAt <= now).length;
    const topFacts = facts.slice(0, 10).map(f => ({
      id: f.id,
      agentId: f.agentId,
      factType: f.factType,
      content: f.content.slice(0, 150),
      importance: f.importance,
      retrievalCount: f.retrievalCount,
      permanent: f.expiresAt >= permanent,
    }));

    sendSuccess(res, { total, permanentCount, expiring, expired, topFacts });
  } catch (err) {
    logger.error({ err }, "GET /alloy/cognitive/memory-stats failed");
    handleRouteError(res, err, "Failed to get memory stats");
  }
});

export default router;
