import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import {
  recordRecommendation,
  recordDecision,
  recordOutcome,
  listOutcomes,
  getOutcomeById,
  getOutcomeStats,
  triggerLearningJob,
  runLearningCalibration,
  listLearningJobs,
} from "@szl-holdings/outcome-graph";
import { authMiddleware, requireRole } from "../middlewares/auth";
import type { Request, Response } from "express";
import { z } from "zod";

const outcomeGraphRouter: IRouter = Router();

outcomeGraphRouter.use("/outcome-graph", authMiddleware({ required: true }));

const domainEnum = z.enum([
  "maritime", "security", "real_estate", "aiops", "research",
  "creative", "analytics", "infrastructure", "readiness", "general",
]);

const recordRecommendationSchema = z.object({
  domain: domainEnum.default("general"),
  entityType: z.string().min(1),
  entityId: z.string().optional(),
  recommendationId: z.string().optional(),
  recommendationText: z.string().min(1),
  recommendationAction: z.string().optional(),
  agentId: z.string().optional(),
  modelId: z.string().optional(),
  modelProvider: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  correlationId: z.string().optional(),
  domainConditions: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const recordDecisionSchema = z.object({
  userDecision: z.enum(["accepted", "rejected", "overridden", "deferred"]),
  overrideReason: z.string().optional(),
  correctionReason: z.string().optional(),
  actionExecuted: z.string().optional(),
});

const recordOutcomeSchema = z.object({
  outcomeResult: z.enum(["achieved", "partial", "not_achieved", "unknown", "too_early"]),
  outcomeNotes: z.string().optional(),
  laterImpact: z.record(z.unknown()).optional(),
});

outcomeGraphRouter.post("/outcome-graph/recommendations", async (req: Request, res: Response) => {
  try {
    const parsed = recordRecommendationSchema.safeParse(req.body);
    if (!parsed.success) {
      return void res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    }

    const user = (req as any).user;

    const row = await recordRecommendation({
      orgId: user?.orgId ?? null,
      domain: parsed.data.domain,
      entityType: parsed.data.entityType,
      entityId: parsed.data.entityId,
      recommendationId: parsed.data.recommendationId,
      recommendationText: parsed.data.recommendationText,
      recommendationAction: parsed.data.recommendationAction,
      agentId: parsed.data.agentId,
      modelId: parsed.data.modelId,
      modelProvider: parsed.data.modelProvider,
      confidence: parsed.data.confidence,
      correlationId: parsed.data.correlationId,
      domainConditions: parsed.data.domainConditions,
      metadata: parsed.data.metadata,
    });

    return void res.status(201).json({ success: true, data: row });
  } catch (err) {
    logger.error({ err }, "POST /outcome-graph/recommendations error:");
    return void res.status(500).json({ error: "Failed to record recommendation" });
  }
});

outcomeGraphRouter.post("/outcome-graph/recommendations/:id/decision", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string ?? "0", 10);
    if (!id) return void res.status(400).json({ error: "Invalid id" });

    const parsed = recordDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      return void res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    }

    const user = (req as any).user;

    const updated = await recordDecision({
      outcomeId: id,
      userDecision: parsed.data.userDecision,
      decidedByUserId: user?.id,
      overrideReason: parsed.data.overrideReason,
      correctionReason: parsed.data.correctionReason,
      actionExecuted: parsed.data.actionExecuted,
    });

    return void res.json({ success: true, data: updated });
  } catch (err: any) {
    if (err?.code === "NOT_FOUND") return void res.status(404).json({ error: "Outcome record not found" });
    logger.error({ err }, "POST /outcome-graph/recommendations/:id/decision error:");
    return void res.status(500).json({ error: "Failed to record decision" });
  }
});

outcomeGraphRouter.post("/outcome-graph/recommendations/:id/outcome", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string ?? "0", 10);
    if (!id) return void res.status(400).json({ error: "Invalid id" });

    const parsed = recordOutcomeSchema.safeParse(req.body);
    if (!parsed.success) {
      return void res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    }

    const updated = await recordOutcome({
      outcomeId: id,
      outcomeResult: parsed.data.outcomeResult,
      outcomeNotes: parsed.data.outcomeNotes,
      laterImpact: parsed.data.laterImpact,
    });

    return void res.json({ success: true, data: updated });
  } catch (err: any) {
    if (err?.code === "NOT_FOUND") return void res.status(404).json({ error: "Outcome record not found" });
    logger.error({ err }, "POST /outcome-graph/recommendations/:id/outcome error:");
    return void res.status(500).json({ error: "Failed to record outcome" });
  }
});

outcomeGraphRouter.get("/outcome-graph/recommendations/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string ?? "0", 10);
    if (!id) return void res.status(400).json({ error: "Invalid id" });

    const row = await getOutcomeById(id);
    if (!row) return void res.status(404).json({ error: "Outcome record not found" });

    return void res.json({ success: true, data: row });
  } catch (err) {
    logger.error({ err }, "GET /outcome-graph/recommendations/:id error:");
    return void res.status(500).json({ error: "Failed to get outcome" });
  }
});

outcomeGraphRouter.get("/outcome-graph/recommendations", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const orgId: number | undefined = user?.orgId ?? undefined;

    const domain = req.query.domain as string | undefined;
    const entityType = req.query.entityType as string | undefined;
    const entityId = req.query.entityId as string | undefined;
    const status = req.query.status as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string ?? "50", 10), 200);
    const offset = parseInt(req.query.offset as string ?? "0", 10);

    const rows = await listOutcomes({
      orgId,
      domain: domain as any,
      entityType,
      entityId,
      status: status as any,
      limit,
      offset,
    });

    return void res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    logger.error({ err }, "GET /outcome-graph/recommendations error:");
    return void res.status(500).json({ error: "Failed to list outcomes" });
  }
});

outcomeGraphRouter.get("/outcome-graph/stats", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const orgId: number | undefined = user?.orgId ?? undefined;

    const domain = req.query.domain as string | undefined;
    const since = req.query.since ? new Date(req.query.since as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const stats = await getOutcomeStats({
      orgId,
      domain: domain as any,
      since,
    });

    return void res.json({ success: true, data: stats });
  } catch (err) {
    logger.error({ err }, "GET /outcome-graph/stats error:");
    return void res.status(500).json({ error: "Failed to get outcome stats" });
  }
});

outcomeGraphRouter.post(
  "/outcome-graph/learning-jobs",
  requireRole("admin", "super_admin"),
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        domain: domainEnum,
        jobType: z.enum([
          "ranking_calibration", "confidence_calibration", "escalation_threshold",
          "workflow_template", "owner_suggestion", "artifact_defaults",
        ]),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return void res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

      const user = (req as any).user;

      const job = await triggerLearningJob({
        orgId: user?.orgId ?? undefined,
        domain: parsed.data.domain,
        jobType: parsed.data.jobType,
        triggeredBy: user?.email ?? "operator",
      });

      return void res.status(201).json({ success: true, data: job });
    } catch (err) {
      logger.error({ err }, "POST /outcome-graph/learning-jobs error:");
      return void res.status(500).json({ error: "Failed to create learning job" });
    }
  },
);

outcomeGraphRouter.post(
  "/outcome-graph/learning-jobs/:id/run",
  requireRole("admin", "super_admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string ?? "0", 10);
      if (!id) return void res.status(400).json({ error: "Invalid id" });

      const result = await runLearningCalibration(id);
      return void res.json({ success: true, data: result });
    } catch (err: any) {
      if (err?.code === "NOT_FOUND") return void res.status(404).json({ error: "Learning job not found" });
      logger.error({ err }, "POST /outcome-graph/learning-jobs/:id/run error:");
      return void res.status(500).json({ error: "Failed to run learning calibration" });
    }
  },
);

outcomeGraphRouter.get(
  "/outcome-graph/learning-jobs",
  requireRole("admin", "super_admin"),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const orgId: number | undefined = user?.orgId ?? undefined;
      const domain = req.query.domain as string | undefined;
      const status = req.query.status as string | undefined;
      const limit = Math.min(parseInt(req.query.limit as string ?? "50", 10), 100);

      const rows = await listLearningJobs({
        orgId,
        domain: domain as any,
        status: status as any,
        limit,
      });

      return void res.json({ success: true, data: rows });
    } catch (err) {
      logger.error({ err }, "GET /outcome-graph/learning-jobs error:");
      return void res.status(500).json({ error: "Failed to list learning jobs" });
    }
  },
);

const inlineFeedbackSchema = z.object({
  recommendationKey: z.string().min(1),
  domain: domainEnum.default("general"),
  recommendationText: z.string().min(1),
  vote: z.enum(["up", "down"]),
  comment: z.string().optional(),
});

outcomeGraphRouter.post("/outcome-graph/feedback", async (req: Request, res: Response) => {
  try {
    const parsed = inlineFeedbackSchema.safeParse(req.body);
    if (!parsed.success) {
      return void res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    }

    const user = (req as any).user;
    const { recommendationKey, domain, recommendationText, vote, comment } = parsed.data;

    const row = await recordRecommendation({
      orgId: user?.orgId ?? null,
      domain,
      entityType: "inline_feedback",
      entityId: recommendationKey,
      recommendationId: recommendationKey,
      recommendationText,
      agentId: "inline",
      confidence: undefined,
    });

    const decision = await recordDecision({
      outcomeId: row.id,
      userDecision: vote === "up" ? "accepted" : "rejected",
      decidedByUserId: user?.id,
      overrideReason: comment,
    });

    return void res.status(201).json({ success: true, data: { id: row.id, vote, decision } });
  } catch (err) {
    logger.error({ err }, "POST /outcome-graph/feedback error:");
    return void res.status(500).json({ error: "Failed to record inline feedback" });
  }
});

export default outcomeGraphRouter;
