import { Router, type IRouter } from "express";
import {
  db,
  outcomeGraphTable,
  outcomeGraphLearningJobsTable,
} from "@szl-holdings/db";
import { eq, and, desc, gte, count, avg } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";
import type { Request, Response } from "express";
import { z } from "zod";

const outcomeGraphRouter: IRouter = Router();

outcomeGraphRouter.use("/outcome-graph", authMiddleware({ required: true }));

const recordRecommendationSchema = z.object({
  domain: z.enum(["maritime", "security", "real_estate", "aiops", "research", "creative", "analytics", "infrastructure", "readiness", "general"]).default("general"),
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
      return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    }

    const user = (req as any).user;
    const orgId: number | null = user?.orgId ?? null;

    const [row] = await db.insert(outcomeGraphTable).values({
      orgId,
      domain: parsed.data.domain,
      entityType: parsed.data.entityType,
      entityId: parsed.data.entityId ?? null,
      recommendationId: parsed.data.recommendationId ?? null,
      recommendationText: parsed.data.recommendationText,
      recommendationAction: parsed.data.recommendationAction ?? null,
      agentId: parsed.data.agentId ?? null,
      modelId: parsed.data.modelId ?? null,
      modelProvider: parsed.data.modelProvider ?? null,
      confidence: parsed.data.confidence ?? 0.5,
      status: "pending",
      correlationId: parsed.data.correlationId ?? null,
      domainConditions: parsed.data.domainConditions ?? {},
      metadata: parsed.data.metadata ?? {},
    }).returning();

    return res.status(201).json({ success: true, data: row });
  } catch (err) {
    console.error("POST /outcome-graph/recommendations error:", err);
    return res.status(500).json({ error: "Failed to record recommendation" });
  }
});

outcomeGraphRouter.post("/outcome-graph/recommendations/:id/decision", async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id ?? "0"), 10);
    if (!id) return res.status(400).json({ error: "Invalid id" });

    const parsed = recordDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    }

    const user = (req as any).user;
    const now = new Date();
    const statusMap: Record<string, string> = {
      accepted: "accepted",
      rejected: "rejected",
      overridden: "overridden",
      deferred: "deferred",
    };

    const [updated] = await db.update(outcomeGraphTable)
      .set({
        userDecision: parsed.data.userDecision,
        decidedByUserId: user?.id ?? null,
        decidedAt: now,
        status: statusMap[parsed.data.userDecision] as any,
        overrideReason: parsed.data.overrideReason ?? null,
        correctionReason: parsed.data.correctionReason ?? null,
        actionExecuted: parsed.data.actionExecuted ?? null,
        actionExecutedAt: parsed.data.actionExecuted ? now : null,
        updatedAt: now,
      })
      .where(eq(outcomeGraphTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Outcome record not found" });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("POST /outcome-graph/recommendations/:id/decision error:", err);
    return res.status(500).json({ error: "Failed to record decision" });
  }
});

outcomeGraphRouter.post("/outcome-graph/recommendations/:id/outcome", async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id ?? "0"), 10);
    if (!id) return res.status(400).json({ error: "Invalid id" });

    const parsed = recordOutcomeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    }

    const [existing] = await db.select().from(outcomeGraphTable).where(eq(outcomeGraphTable.id, id));
    if (!existing) return res.status(404).json({ error: "Outcome record not found" });

    const now = new Date();
    const timeToOutcomeMs = existing.decidedAt
      ? now.getTime() - existing.decidedAt.getTime()
      : null;

    const [updated] = await db.update(outcomeGraphTable)
      .set({
        outcomeResult: parsed.data.outcomeResult,
        outcomeNotes: parsed.data.outcomeNotes ?? null,
        outcomeRecordedAt: now,
        timeToOutcomeMs,
        laterImpact: parsed.data.laterImpact ?? {},
        status: "executed",
        updatedAt: now,
      })
      .where(eq(outcomeGraphTable.id, id))
      .returning();

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("POST /outcome-graph/recommendations/:id/outcome error:", err);
    return res.status(500).json({ error: "Failed to record outcome" });
  }
});

outcomeGraphRouter.get("/outcome-graph/recommendations", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const orgId: number | null = user?.orgId ?? null;

    const domain = req.query.domain as string | undefined;
    const entityType = req.query.entityType as string | undefined;
    const entityId = req.query.entityId as string | undefined;
    const status = req.query.status as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string ?? "50", 10), 200);
    const offset = parseInt(req.query.offset as string ?? "0", 10);

    const conditions: any[] = [];
    if (orgId != null) conditions.push(eq(outcomeGraphTable.orgId, orgId));
    if (domain) conditions.push(eq(outcomeGraphTable.domain, domain as any));
    if (entityType) conditions.push(eq(outcomeGraphTable.entityType, entityType));
    if (entityId) conditions.push(eq(outcomeGraphTable.entityId, entityId));
    if (status) conditions.push(eq(outcomeGraphTable.status, status as any));

    const q = db.select().from(outcomeGraphTable)
      .orderBy(desc(outcomeGraphTable.createdAt))
      .limit(limit)
      .offset(offset);

    const rows = conditions.length > 0 ? await q.where(and(...conditions)) : await q;
    return res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    console.error("GET /outcome-graph/recommendations error:", err);
    return res.status(500).json({ error: "Failed to list outcomes" });
  }
});

outcomeGraphRouter.get("/outcome-graph/stats", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const orgId: number | null = user?.orgId ?? null;

    const domain = req.query.domain as string | undefined;
    const since = req.query.since ? new Date(req.query.since as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const conditions: any[] = [gte(outcomeGraphTable.createdAt, since)];
    if (orgId != null) conditions.push(eq(outcomeGraphTable.orgId, orgId));
    if (domain) conditions.push(eq(outcomeGraphTable.domain, domain as any));

    const rows = await db
      .select({
        domain: outcomeGraphTable.domain,
        total: count(),
        avgConfidence: avg(outcomeGraphTable.confidence),
      })
      .from(outcomeGraphTable)
      .where(and(...conditions))
      .groupBy(outcomeGraphTable.domain);

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("GET /outcome-graph/stats error:", err);
    return res.status(500).json({ error: "Failed to get outcome stats" });
  }
});

outcomeGraphRouter.post("/outcome-graph/learning-jobs", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      domain: z.enum(["maritime", "security", "real_estate", "aiops", "research", "creative", "analytics", "infrastructure", "readiness", "general"]),
      jobType: z.enum(["ranking_calibration", "confidence_calibration", "escalation_threshold", "workflow_template", "owner_suggestion", "artifact_defaults"]),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

    const user = (req as any).user;
    const orgId: number | null = user?.orgId ?? null;

    const [job] = await db.insert(outcomeGraphLearningJobsTable).values({
      orgId,
      domain: parsed.data.domain,
      jobType: parsed.data.jobType,
      status: "pending",
      triggeredBy: user?.email ?? "operator",
    }).returning();

    return res.status(201).json({ success: true, data: job });
  } catch (err) {
    console.error("POST /outcome-graph/learning-jobs error:", err);
    return res.status(500).json({ error: "Failed to create learning job" });
  }
});

outcomeGraphRouter.get("/outcome-graph/learning-jobs", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const orgId: number | null = user?.orgId ?? null;

    const conditions: any[] = [];
    if (orgId != null) conditions.push(eq(outcomeGraphLearningJobsTable.orgId, orgId));

    const q = db.select().from(outcomeGraphLearningJobsTable)
      .orderBy(desc(outcomeGraphLearningJobsTable.createdAt))
      .limit(50);

    const rows = conditions.length > 0 ? await q.where(and(...conditions)) : await q;
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("GET /outcome-graph/learning-jobs error:", err);
    return res.status(500).json({ error: "Failed to list learning jobs" });
  }
});

export default outcomeGraphRouter;
