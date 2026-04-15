import { Router, Request, Response } from "express";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { tenantScope } from "../middlewares/tenant-scope";
import { db } from "@szl-holdings/db";
import { eq, and, desc, or, sql, isNull, not, gte } from "drizzle-orm";
import {
  pcManagedReviewItemsTable,
  pcManagedReviewAssignmentsTable,
  pcManagedReviewNotesTable,
  pcReviewAuditEventsTable,
} from "@szl-holdings/db/schema";
import { logger } from "../lib/logger";

const router = Router();

router.use(authMiddleware());
router.use(tenantScope({ required: true }));

const REVIEW_LIFECYCLE_STATES = ["new", "pending_review", "in_review", "approved", "rejected", "revised", "needs_evidence", "needs_partner_review", "needs_attorney_review", "assigned", "blocked", "exported", "closed"] as const;

const ReviewItemCreateSchema = z.object({
  matterId: z.number().int().positive(),
  reviewWorkType: z.enum(["draft_review", "chronology_review", "evidence_review", "contradiction_review", "low_confidence_extraction_review", "safe_to_send_review", "safe_to_export_review", "recovery_lien_review", "approval_preparation_review"]),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  sourceEntityType: z.string().max(100).optional(),
  sourceEntityId: z.number().int().positive().optional(),
  sourceLineage: z.string().max(2000).optional(),
  isGenerated: z.boolean().optional(),
  confidence: z.number().min(0).max(1).optional(),
  privilegeSensitive: z.boolean().optional(),
  whatThisIs: z.string().max(5000).optional(),
  whyItsHere: z.string().max(5000).optional(),
  whatSupportsIt: z.string().max(5000).optional(),
  whatsMissing: z.string().max(5000).optional(),
  whatRiskExists: z.string().max(5000).optional(),
  whatActionClearsIt: z.string().max(5000).optional(),
  whoIsWaiting: z.string().max(500).optional(),
  whatItUnblocks: z.string().max(5000).optional(),
  deadlineRiskScore: z.number().int().min(0).max(10).optional(),
  settlementFrictionScore: z.number().int().min(0).max(10).optional(),
  insurerPressureScore: z.number().int().min(0).max(10).optional(),
  contradictionSeverityScore: z.number().int().min(0).max(10).optional(),
  lowConfidenceScore: z.number().int().min(0).max(10).optional(),
  exportSendDependencyScore: z.number().int().min(0).max(10).optional(),
  workUnblockedScore: z.number().int().min(0).max(10).optional(),
  partnerUrgencyScore: z.number().int().min(0).max(10).optional(),
  clientFacingImpactScore: z.number().int().min(0).max(10).optional(),
  recoveryLienDependencyScore: z.number().int().min(0).max(10).optional(),
  slaHours: z.number().int().min(1).optional(),
  dueBy: z.string().datetime().optional(),
});

const TransitionSchema = z.object({
  toState: z.string().min(1).max(100),
  reason: z.string().max(2000).optional(),
});

const ApproveActionSchema = z.object({
  notes: z.string().max(5000).optional(),
});

const RejectActionSchema = z.object({
  reason: z.string().max(2000).optional(),
});

const ReviseActionSchema = z.object({
  notes: z.string().max(5000).optional(),
});

const EscalateActionSchema = z.object({
  escalateTo: z.enum(["partner", "attorney"]),
  reason: z.string().max(2000).optional(),
});

const AssignActionSchema = z.object({
  assignTo: z.number().int().positive(),
  role: z.enum(["primary", "attorney", "partner", "secondary"]).optional(),
});

const BlockActionSchema = z.object({
  reason: z.string().max(2000).optional(),
});

const SupportRequestSchema = z.object({
  request: z.string().min(1).max(5000),
});

const AddNoteSchema = z.object({
  noteType: z.enum(["general", "missing_support_request", "escalation", "rejection_reason", "revision_request", "attorney_note", "partner_note"]).optional(),
  content: z.string().min(1).max(10000),
  isPrivileged: z.boolean().optional(),
});

function getOrgId(req: Request): number {
  const orgId = req.tenantOrgId ?? req.user?.orgs[0]?.orgId;
  if (!orgId) throw Object.assign(new Error("Organization context required"), { statusCode: 403 });
  return orgId;
}

async function emitReviewAudit(opts: {
  orgId: number;
  matterId?: number;
  reviewItemId?: number;
  actorId?: number;
  action: string;
  fromState?: string;
  toState?: string;
  details?: Record<string, unknown>;
}) {
  try {
    await db.insert(pcReviewAuditEventsTable).values({
      orgId: opts.orgId,
      matterId: opts.matterId,
      reviewItemId: opts.reviewItemId,
      actorId: opts.actorId,
      action: opts.action,
      fromState: opts.fromState,
      toState: opts.toState,
      details: opts.details ?? {},
      proofChainPreserved: true,
    });
  } catch (err) {
    logger.warn({ err }, "Failed to emit review audit event");
  }
}

function computePriorityScore(item: {
  deadlineRiskScore?: number | null;
  settlementFrictionScore?: number | null;
  insurerPressureScore?: number | null;
  contradictionSeverityScore?: number | null;
  lowConfidenceScore?: number | null;
  exportSendDependencyScore?: number | null;
  workUnblockedScore?: number | null;
  partnerUrgencyScore?: number | null;
  clientFacingImpactScore?: number | null;
  recoveryLienDependencyScore?: number | null;
}): number {
  const d = item.deadlineRiskScore ?? 0;
  const s = item.settlementFrictionScore ?? 0;
  const i = item.insurerPressureScore ?? 0;
  const c = item.contradictionSeverityScore ?? 0;
  const l = item.lowConfidenceScore ?? 0;
  const e = item.exportSendDependencyScore ?? 0;
  const w = item.workUnblockedScore ?? 0;
  const p = item.partnerUrgencyScore ?? 0;
  const cf = item.clientFacingImpactScore ?? 0;
  const r = item.recoveryLienDependencyScore ?? 0;
  return (
    d * 0.20 +
    s * 0.15 +
    i * 0.12 +
    c * 0.12 +
    l * 0.10 +
    e * 0.08 +
    w * 0.08 +
    p * 0.07 +
    cf * 0.05 +
    r * 0.03
  );
}

function buildValidTransitions(): Record<string, string[]> {
  return {
    new: ["triaged", "blocked"],
    triaged: ["assigned", "needs_evidence", "blocked"],
    assigned: ["in_review", "blocked", "needs_evidence"],
    in_review: ["needs_evidence", "needs_attorney_review", "needs_partner_review", "approved", "rejected", "revised", "blocked"],
    needs_evidence: ["in_review", "blocked"],
    needs_attorney_review: ["in_review", "approved", "rejected", "blocked"],
    needs_partner_review: ["approved", "rejected", "in_review", "blocked"],
    approved: ["exported", "closed"],
    rejected: ["revised", "closed"],
    revised: ["in_review", "triaged"],
    blocked: ["triaged", "in_review"],
    exported: ["closed"],
    closed: [],
  };
}

router.get("/review-desk/my-queue", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId as string) : null;
    const items = await db.select().from(pcManagedReviewItemsTable)
      .where(and(
        eq(pcManagedReviewItemsTable.orgId, getOrgId(req)),
        userId ? eq(pcManagedReviewItemsTable.assignedTo, userId) : sql`true`,
        not(eq(pcManagedReviewItemsTable.lifecycleState, "closed")),
        not(eq(pcManagedReviewItemsTable.lifecycleState, "exported")),
      ))
      .orderBy(desc(pcManagedReviewItemsTable.priorityScore))
      .limit(50);
    res.json({ items, count: items.length });
  } catch (err: any) {
    logger.error({ err }, "Failed to get my review queue");
    res.status(500).json({ error: "Failed to get review queue" });
  }
});

router.get("/review-desk/team-queue", async (req: Request, res: Response) => {
  try {
    const items = await db.select().from(pcManagedReviewItemsTable)
      .where(and(
        eq(pcManagedReviewItemsTable.orgId, getOrgId(req)),
        not(eq(pcManagedReviewItemsTable.lifecycleState, "closed")),
        not(eq(pcManagedReviewItemsTable.lifecycleState, "exported")),
      ))
      .orderBy(desc(pcManagedReviewItemsTable.priorityScore))
      .limit(100);
    res.json({ items, count: items.length });
  } catch (err: any) {
    logger.error({ err }, "Failed to get team review queue");
    res.status(500).json({ error: "Failed to get team review queue" });
  }
});

router.get("/review-desk/high-risk", async (req: Request, res: Response) => {
  try {
    const items = await db.select().from(pcManagedReviewItemsTable)
      .where(and(
        eq(pcManagedReviewItemsTable.orgId, getOrgId(req)),
        sql`${pcManagedReviewItemsTable.priorityScore} >= 0.70`,
        not(eq(pcManagedReviewItemsTable.lifecycleState, "closed")),
      ))
      .orderBy(desc(pcManagedReviewItemsTable.priorityScore))
      .limit(50);
    res.json({ items, count: items.length });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to get high-risk queue" });
  }
});

router.get("/review-desk/low-confidence", async (req: Request, res: Response) => {
  try {
    const items = await db.select().from(pcManagedReviewItemsTable)
      .where(and(
        eq(pcManagedReviewItemsTable.orgId, getOrgId(req)),
        eq(pcManagedReviewItemsTable.reviewWorkType, "low_confidence_extraction_review"),
        not(eq(pcManagedReviewItemsTable.lifecycleState, "closed")),
      ))
      .orderBy(desc(pcManagedReviewItemsTable.lowConfidenceScore))
      .limit(50);
    res.json({ items, count: items.length });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to get low-confidence queue" });
  }
});

router.get("/review-desk/contradiction", async (req: Request, res: Response) => {
  try {
    const items = await db.select().from(pcManagedReviewItemsTable)
      .where(and(
        eq(pcManagedReviewItemsTable.orgId, getOrgId(req)),
        eq(pcManagedReviewItemsTable.reviewWorkType, "contradiction_review"),
        not(eq(pcManagedReviewItemsTable.lifecycleState, "closed")),
      ))
      .orderBy(desc(pcManagedReviewItemsTable.contradictionSeverityScore))
      .limit(50);
    res.json({ items, count: items.length });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to get contradiction queue" });
  }
});

router.get("/review-desk/needs-attorney", async (req: Request, res: Response) => {
  try {
    const items = await db.select().from(pcManagedReviewItemsTable)
      .where(and(
        eq(pcManagedReviewItemsTable.orgId, getOrgId(req)),
        eq(pcManagedReviewItemsTable.lifecycleState, "needs_attorney_review"),
      ))
      .orderBy(desc(pcManagedReviewItemsTable.priorityScore))
      .limit(50);
    res.json({ items, count: items.length });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to get attorney review queue" });
  }
});

router.get("/review-desk/needs-partner", async (req: Request, res: Response) => {
  try {
    const items = await db.select().from(pcManagedReviewItemsTable)
      .where(and(
        eq(pcManagedReviewItemsTable.orgId, getOrgId(req)),
        eq(pcManagedReviewItemsTable.lifecycleState, "needs_partner_review"),
      ))
      .orderBy(desc(pcManagedReviewItemsTable.priorityScore))
      .limit(50);
    res.json({ items, count: items.length });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to get partner review queue" });
  }
});

router.get("/review-desk/ready-to-export", async (req: Request, res: Response) => {
  try {
    const items = await db.select().from(pcManagedReviewItemsTable)
      .where(and(
        eq(pcManagedReviewItemsTable.orgId, getOrgId(req)),
        eq(pcManagedReviewItemsTable.lifecycleState, "approved"),
        eq(pcManagedReviewItemsTable.exportSafe, true),
      ))
      .orderBy(desc(pcManagedReviewItemsTable.priorityScore))
      .limit(50);
    res.json({ items, count: items.length });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to get ready-to-export queue" });
  }
});

router.get("/review-desk/blocked", async (req: Request, res: Response) => {
  try {
    const items = await db.select().from(pcManagedReviewItemsTable)
      .where(and(
        eq(pcManagedReviewItemsTable.orgId, getOrgId(req)),
        or(
          eq(pcManagedReviewItemsTable.lifecycleState, "blocked"),
          eq(pcManagedReviewItemsTable.lifecycleState, "needs_evidence"),
        ),
      ))
      .orderBy(desc(pcManagedReviewItemsTable.priorityScore))
      .limit(50);
    res.json({ items, count: items.length });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to get blocked queue" });
  }
});

router.get("/review-desk/overview", async (req: Request, res: Response) => {
  try {
    const [all, byState, slaBreaches] = await Promise.all([
      db.select().from(pcManagedReviewItemsTable)
        .where(and(
          eq(pcManagedReviewItemsTable.orgId, getOrgId(req)),
          not(eq(pcManagedReviewItemsTable.lifecycleState, "closed")),
        )),
      db.select({
        state: pcManagedReviewItemsTable.lifecycleState,
        workType: pcManagedReviewItemsTable.reviewWorkType,
        count: sql<number>`count(*)::int`,
      }).from(pcManagedReviewItemsTable)
        .where(and(
          eq(pcManagedReviewItemsTable.orgId, getOrgId(req)),
          not(eq(pcManagedReviewItemsTable.lifecycleState, "closed")),
        ))
        .groupBy(pcManagedReviewItemsTable.lifecycleState, pcManagedReviewItemsTable.reviewWorkType),
      db.select().from(pcManagedReviewItemsTable)
        .where(and(
          eq(pcManagedReviewItemsTable.orgId, getOrgId(req)),
          not(isNull(pcManagedReviewItemsTable.slaBreachedAt)),
          not(eq(pcManagedReviewItemsTable.lifecycleState, "closed")),
        )),
    ]);

    const stateBreakdown: Record<string, number> = {};
    const typeBreakdown: Record<string, number> = {};
    byState.forEach(r => {
      stateBreakdown[r.state] = (stateBreakdown[r.state] ?? 0) + r.count;
      typeBreakdown[r.workType] = (typeBreakdown[r.workType] ?? 0) + r.count;
    });

    const highPriority = all.filter(i => i.priorityScore >= 0.70).length;
    const avgAge = all.length > 0
      ? all.reduce((sum, i) => sum + (Date.now() - new Date(i.createdAt).getTime()), 0) / all.length / 3600000
      : 0;

    res.json({
      totalActive: all.length,
      highPriority,
      slaBreaches: slaBreaches.length,
      avgAgeHours: Math.round(avgAge * 10) / 10,
      stateBreakdown,
      typeBreakdown,
      topItems: all
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, 10),
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to get review desk overview");
    res.status(500).json({ error: "Failed to get overview" });
  }
});

router.get("/review-desk/items/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const [item, notes, assignments] = await Promise.all([
      db.select().from(pcManagedReviewItemsTable)
        .where(and(eq(pcManagedReviewItemsTable.id, id), eq(pcManagedReviewItemsTable.orgId, getOrgId(req))))
        .limit(1),
      db.select().from(pcManagedReviewNotesTable)
        .where(eq(pcManagedReviewNotesTable.reviewItemId, id))
        .orderBy(desc(pcManagedReviewNotesTable.createdAt)),
      db.select().from(pcManagedReviewAssignmentsTable)
        .where(eq(pcManagedReviewAssignmentsTable.reviewItemId, id)),
    ]);
    if (!item.length) return void res.status(404).json({ error: "Review item not found" });
    res.json({ item: item[0], notes, assignments });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to get review item" });
  }
});

router.post("/review-desk/items", async (req: Request, res: Response) => {
  try {
    const bodyParsed = ReviewItemCreateSchema.safeParse(req.body);
    if (!bodyParsed.success) { res.status(400).json({ error: "Invalid request body", issues: bodyParsed.error.issues }); return; }
    const {
      matterId, reviewWorkType, title, description,
      sourceEntityType, sourceEntityId, sourceLineage, isGenerated,
      confidence, privilegeSensitive,
      whatThisIs, whyItsHere, whatSupportsIt, whatsMissing,
      whatRiskExists, whatActionClearsIt, whoIsWaiting, whatItUnblocks,
      deadlineRiskScore, settlementFrictionScore, insurerPressureScore,
      contradictionSeverityScore, lowConfidenceScore, exportSendDependencyScore,
      workUnblockedScore, partnerUrgencyScore, clientFacingImpactScore,
      recoveryLienDependencyScore, slaHours, dueBy,
    } = bodyParsed.data;

    const scores = {
      deadlineRiskScore: deadlineRiskScore ?? 0,
      settlementFrictionScore: settlementFrictionScore ?? 0,
      insurerPressureScore: insurerPressureScore ?? 0,
      contradictionSeverityScore: contradictionSeverityScore ?? 0,
      lowConfidenceScore: lowConfidenceScore ?? 0,
      exportSendDependencyScore: exportSendDependencyScore ?? 0,
      workUnblockedScore: workUnblockedScore ?? 0,
      partnerUrgencyScore: partnerUrgencyScore ?? 0,
      clientFacingImpactScore: clientFacingImpactScore ?? 0,
      recoveryLienDependencyScore: recoveryLienDependencyScore ?? 0,
    };
    const priorityScore = computePriorityScore(scores);

    const [item] = await db.insert(pcManagedReviewItemsTable).values({
      orgId: getOrgId(req),
      matterId,
      reviewWorkType,
      title,
      description,
      sourceEntityType,
      sourceEntityId,
      sourceLineage,
      isGenerated: isGenerated ?? false,
      confidence,
      privilegeSensitive: privilegeSensitive ?? false,
      whatThisIs,
      whyItsHere,
      whatSupportsIt,
      whatsMissing,
      whatRiskExists,
      whatActionClearsIt,
      whoIsWaiting,
      whatItUnblocks,
      ...scores,
      priorityScore,
      slaHours: slaHours ?? 24,
      dueBy: dueBy ? new Date(dueBy) : null,
      lifecycleState: "new",
    }).returning();

    await emitReviewAudit({
      orgId: getOrgId(req),
      matterId,
      reviewItemId: item.id,
      action: "review_item_created",
      toState: "new",
      details: { reviewWorkType, title },
    });

    res.status(201).json({ item });
  } catch (err: any) {
    logger.error({ err }, "Failed to create review item");
    res.status(500).json({ error: "Failed to create review item" });
  }
});

router.post("/review-desk/items/:id/transition", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const parsed = TransitionSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues }); return; }
    const { toState, reason } = parsed.data;
    const actorId = req.user!.id;
    const validTransitions = buildValidTransitions();

    const [item] = await db.select().from(pcManagedReviewItemsTable)
      .where(and(eq(pcManagedReviewItemsTable.id, id), eq(pcManagedReviewItemsTable.orgId, getOrgId(req))))
      .limit(1);
    if (!item) return void res.status(404).json({ error: "Review item not found" });

    const allowed = validTransitions[item.lifecycleState] ?? [];
    if (!allowed.includes(toState)) {
      return void res.status(400).json({ error: `Invalid transition from ${item.lifecycleState} to ${toState}`, allowed });
    }

    const now = new Date();
    const updateData: Record<string, unknown> = {
      lifecycleState: toState,
      updatedAt: now,
    };

    if (toState === "approved") {
      updateData.approvedBy = actorId;
      updateData.approvedAt = now;
    } else if (toState === "rejected") {
      updateData.rejectedBy = actorId;
      updateData.rejectedAt = now;
    } else if (toState === "in_review") {
      updateData.reviewedBy = actorId;
      updateData.reviewedAt = now;
    } else if (toState === "exported") {
      updateData.exportedAt = now;
    } else if (toState === "assigned") {
      updateData.assignedAt = now;
    } else if (toState === "blocked") {
      updateData.blockedReason = reason;
    }

    const [updated] = await db.update(pcManagedReviewItemsTable)
      .set(updateData)
      .where(eq(pcManagedReviewItemsTable.id, id))
      .returning();

    await emitReviewAudit({
      orgId: getOrgId(req),
      matterId: item.matterId,
      reviewItemId: id,
      actorId,
      action: `review_${toState}`,
      fromState: item.lifecycleState,
      toState,
      details: { reason },
    });

    res.json({ item: updated });
  } catch (err: any) {
    logger.error({ err }, "Failed to transition review item");
    res.status(500).json({ error: "Failed to transition review item" });
  }
});

router.post("/review-desk/items/:id/approve", async (req: Request, res: Response) => {
  req.body.toState = "approved";
  req.params.id = req.params.id;
  return void ((router as any).handle?.(req, res, () => {}) ?? res.status(500).json({ error: "Route error" }));
});

router.post("/review-desk/items/:id/actions/approve", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const parsed = ApproveActionSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues }); return; }
    const { notes } = parsed.data;
    const actorId = req.user!.id;

    const [item] = await db.select().from(pcManagedReviewItemsTable)
      .where(and(eq(pcManagedReviewItemsTable.id, id), eq(pcManagedReviewItemsTable.orgId, getOrgId(req))))
      .limit(1);
    if (!item) return void res.status(404).json({ error: "Not found" });

    const allowed = buildValidTransitions()[item.lifecycleState] ?? [];
    if (!allowed.includes("approved")) {
      return void res.status(400).json({ error: `Cannot approve from state: ${item.lifecycleState}` });
    }

    const [updated] = await db.update(pcManagedReviewItemsTable)
      .set({ lifecycleState: "approved", approvedBy: actorId, approvedAt: new Date(), updatedAt: new Date() })
      .where(eq(pcManagedReviewItemsTable.id, id))
      .returning();

    if (notes) {
      await db.insert(pcManagedReviewNotesTable).values({
        orgId: getOrgId(req), reviewItemId: id, noteType: "general",
        content: notes, authorId: actorId,
      });
    }

    await emitReviewAudit({ orgId: getOrgId(req), matterId: item.matterId, reviewItemId: id, actorId, action: "review_approved", fromState: item.lifecycleState, toState: "approved" });
    res.json({ item: updated });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to approve" });
  }
});

router.post("/review-desk/items/:id/actions/reject", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const parsed = RejectActionSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues }); return; }
    const { reason } = parsed.data;
    const actorId = req.user!.id;

    const [item] = await db.select().from(pcManagedReviewItemsTable)
      .where(and(eq(pcManagedReviewItemsTable.id, id), eq(pcManagedReviewItemsTable.orgId, getOrgId(req))))
      .limit(1);
    if (!item) return void res.status(404).json({ error: "Not found" });

    const [updated] = await db.update(pcManagedReviewItemsTable)
      .set({ lifecycleState: "rejected", rejectedBy: actorId, rejectedAt: new Date(), updatedAt: new Date() })
      .where(eq(pcManagedReviewItemsTable.id, id))
      .returning();

    if (reason) {
      await db.insert(pcManagedReviewNotesTable).values({
        orgId: getOrgId(req), reviewItemId: id, noteType: "rejection_reason",
        content: reason, authorId: actorId,
      });
    }

    await emitReviewAudit({ orgId: getOrgId(req), matterId: item.matterId, reviewItemId: id, actorId, action: "review_rejected", fromState: item.lifecycleState, toState: "rejected", details: { reason } });
    res.json({ item: updated });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to reject" });
  }
});

router.post("/review-desk/items/:id/actions/revise", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const parsed = ReviseActionSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues }); return; }
    const { notes } = parsed.data;
    const actorId = req.user!.id;

    const [item] = await db.select().from(pcManagedReviewItemsTable)
      .where(and(eq(pcManagedReviewItemsTable.id, id), eq(pcManagedReviewItemsTable.orgId, getOrgId(req))))
      .limit(1);
    if (!item) return void res.status(404).json({ error: "Not found" });

    const [updated] = await db.update(pcManagedReviewItemsTable)
      .set({ lifecycleState: "revised", updatedAt: new Date() })
      .where(eq(pcManagedReviewItemsTable.id, id))
      .returning();

    if (notes) {
      await db.insert(pcManagedReviewNotesTable).values({
        orgId: getOrgId(req), reviewItemId: id, noteType: "revision_request",
        content: notes, authorId: actorId,
      });
    }

    await emitReviewAudit({ orgId: getOrgId(req), matterId: item.matterId, reviewItemId: id, actorId, action: "review_revised", fromState: item.lifecycleState, toState: "revised" });
    res.json({ item: updated });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to revise" });
  }
});

router.post("/review-desk/items/:id/actions/escalate", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const parsed = EscalateActionSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues }); return; }
    const { escalateTo, reason } = parsed.data;
    const actorId = req.user!.id;

    const [item] = await db.select().from(pcManagedReviewItemsTable)
      .where(and(eq(pcManagedReviewItemsTable.id, id), eq(pcManagedReviewItemsTable.orgId, getOrgId(req))))
      .limit(1);
    if (!item) return void res.status(404).json({ error: "Not found" });

    const newState = escalateTo === "partner" ? "needs_partner_review" : "needs_attorney_review";
    const [updated] = await db.update(pcManagedReviewItemsTable)
      .set({
        lifecycleState: newState, escalatedTo: escalateTo,
        escalatedAt: new Date(), updatedAt: new Date(),
      })
      .where(eq(pcManagedReviewItemsTable.id, id))
      .returning();

    await db.insert(pcManagedReviewNotesTable).values({
      orgId: getOrgId(req), reviewItemId: id, noteType: "escalation",
      content: reason ?? `Escalated to ${escalateTo}`, authorId: actorId,
    });

    await emitReviewAudit({ orgId: getOrgId(req), matterId: item.matterId, reviewItemId: id, actorId, action: "review_escalated", fromState: item.lifecycleState, toState: newState, details: { escalateTo, reason } });
    res.json({ item: updated });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to escalate" });
  }
});

router.post("/review-desk/items/:id/actions/assign", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const parsed = AssignActionSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues }); return; }
    const { assignTo, role } = parsed.data;
    const actorId = req.user!.id;

    const [item] = await db.select().from(pcManagedReviewItemsTable)
      .where(and(eq(pcManagedReviewItemsTable.id, id), eq(pcManagedReviewItemsTable.orgId, getOrgId(req))))
      .limit(1);
    if (!item) return void res.status(404).json({ error: "Not found" });

    await db.update(pcManagedReviewAssignmentsTable)
      .set({ status: "reassigned" })
      .where(and(
        eq(pcManagedReviewAssignmentsTable.reviewItemId, id),
        eq(pcManagedReviewAssignmentsTable.status, "active"),
      ));

    await db.insert(pcManagedReviewAssignmentsTable).values({
      orgId: getOrgId(req), reviewItemId: id, assignedTo: assignTo,
      assignedBy: actorId, role: role ?? "primary", status: "active",
    });

    const [updated] = await db.update(pcManagedReviewItemsTable)
      .set({ assignedTo: assignTo, assignedBy: actorId, assignedAt: new Date(), lifecycleState: "assigned", updatedAt: new Date() })
      .where(eq(pcManagedReviewItemsTable.id, id))
      .returning();

    await emitReviewAudit({ orgId: getOrgId(req), matterId: item.matterId, reviewItemId: id, actorId, action: "review_assigned", fromState: item.lifecycleState, toState: "assigned", details: { assignTo, role } });
    res.json({ item: updated });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to assign" });
  }
});

router.post("/review-desk/items/:id/actions/block", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const parsed = BlockActionSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues }); return; }
    const { reason } = parsed.data;
    const actorId = req.user!.id;

    const [item] = await db.select().from(pcManagedReviewItemsTable)
      .where(and(eq(pcManagedReviewItemsTable.id, id), eq(pcManagedReviewItemsTable.orgId, getOrgId(req))))
      .limit(1);
    if (!item) return void res.status(404).json({ error: "Not found" });

    const [updated] = await db.update(pcManagedReviewItemsTable)
      .set({ lifecycleState: "blocked", blockedReason: reason, updatedAt: new Date() })
      .where(eq(pcManagedReviewItemsTable.id, id))
      .returning();

    await emitReviewAudit({ orgId: getOrgId(req), matterId: item.matterId, reviewItemId: id, actorId, action: "review_blocked", fromState: item.lifecycleState, toState: "blocked", details: { reason } });
    res.json({ item: updated });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to block" });
  }
});

router.post("/review-desk/items/:id/actions/request-support", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const parsed = SupportRequestSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues }); return; }
    const { request } = parsed.data;
    const actorId = req.user!.id;

    const [item] = await db.select().from(pcManagedReviewItemsTable)
      .where(and(eq(pcManagedReviewItemsTable.id, id), eq(pcManagedReviewItemsTable.orgId, getOrgId(req))))
      .limit(1);
    if (!item) return void res.status(404).json({ error: "Not found" });

    const [updated] = await db.update(pcManagedReviewItemsTable)
      .set({ lifecycleState: "needs_evidence", updatedAt: new Date() })
      .where(eq(pcManagedReviewItemsTable.id, id))
      .returning();

    await db.insert(pcManagedReviewNotesTable).values({
      orgId: getOrgId(req), reviewItemId: id, noteType: "missing_support_request",
      content: request, authorId: actorId,
    });

    await emitReviewAudit({ orgId: getOrgId(req), matterId: item.matterId, reviewItemId: id, actorId, action: "review_support_requested", fromState: item.lifecycleState, toState: "needs_evidence" });
    res.json({ item: updated });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to request support" });
  }
});

router.post("/review-desk/items/:id/actions/generate-review-packet", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const actorId = req.user!.id;

    const [item] = await db.select().from(pcManagedReviewItemsTable)
      .where(and(eq(pcManagedReviewItemsTable.id, id), eq(pcManagedReviewItemsTable.orgId, getOrgId(req))))
      .limit(1);
    if (!item) return void res.status(404).json({ error: "Not found" });

    const packetRef = `review-packet-${id}-${Date.now()}`;
    await db.update(pcManagedReviewItemsTable)
      .set({ auditPacketRef: packetRef, updatedAt: new Date() })
      .where(eq(pcManagedReviewItemsTable.id, id));

    await emitReviewAudit({ orgId: getOrgId(req), matterId: item.matterId, reviewItemId: id, actorId, action: "review_packet_generated", details: { packetRef } });
    res.json({ packetRef, message: "Review packet generation queued" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to generate review packet" });
  }
});

router.post("/review-desk/items/:id/actions/export-packet", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const actorId = req.user!.id;

    const [item] = await db.select().from(pcManagedReviewItemsTable)
      .where(and(eq(pcManagedReviewItemsTable.id, id), eq(pcManagedReviewItemsTable.orgId, getOrgId(req))))
      .limit(1);
    if (!item) return void res.status(404).json({ error: "Not found" });

    if (item.lifecycleState !== "approved") {
      return void res.status(400).json({ error: "Item must be approved before export" });
    }
    if (!item.exportSafe) {
      return void res.status(400).json({ error: "Item is not marked export-safe" });
    }

    const exportRef = `export-packet-${id}-${Date.now()}`;
    const [updated] = await db.update(pcManagedReviewItemsTable)
      .set({ lifecycleState: "exported", exportPacketRef: exportRef, exportedAt: new Date(), updatedAt: new Date() })
      .where(eq(pcManagedReviewItemsTable.id, id))
      .returning();

    await emitReviewAudit({ orgId: getOrgId(req), matterId: item.matterId, reviewItemId: id, actorId, action: "review_exported", fromState: "approved", toState: "exported", details: { exportRef } });
    res.json({ item: updated, exportRef });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create export packet" });
  }
});

router.post("/review-desk/items/:id/notes", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const parsed = AddNoteSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues }); return; }
    const { noteType, content, isPrivileged } = parsed.data;
    const authorId = req.user!.id;

    const [note] = await db.insert(pcManagedReviewNotesTable).values({
      orgId: getOrgId(req), reviewItemId: id, noteType: noteType ?? "general",
      content, authorId, isPrivileged: isPrivileged ?? false,
    }).returning();

    res.status(201).json({ note });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to add note" });
  }
});

router.get("/review-desk/metrics", async (req: Request, res: Response) => {
  try {
    const periodDays = parseInt(req.query.days as string ?? "30");
    const since = new Date(Date.now() - periodDays * 86400000);

    const [closed, all, breaches] = await Promise.all([
      db.select().from(pcManagedReviewItemsTable)
        .where(and(
          eq(pcManagedReviewItemsTable.orgId, getOrgId(req)),
          eq(pcManagedReviewItemsTable.lifecycleState, "closed"),
          gte(pcManagedReviewItemsTable.updatedAt, since),
        )),
      db.select().from(pcManagedReviewItemsTable)
        .where(and(
          eq(pcManagedReviewItemsTable.orgId, getOrgId(req)),
          not(eq(pcManagedReviewItemsTable.lifecycleState, "closed")),
        )),
      db.select().from(pcManagedReviewItemsTable)
        .where(and(
          eq(pcManagedReviewItemsTable.orgId, getOrgId(req)),
          not(isNull(pcManagedReviewItemsTable.slaBreachedAt)),
          gte(pcManagedReviewItemsTable.slaBreachedAt, since),
        )),
    ]);

    const approved = closed.filter(i => i.approvedAt !== null);
    const rejected = closed.filter(i => i.rejectedAt !== null);

    const avgAge = all.length > 0
      ? all.reduce((s, i) => s + (Date.now() - new Date(i.createdAt).getTime()), 0) / all.length / 3600000
      : 0;

    const throughput = closed.length / periodDays;

    const contradictionItems = closed.filter(i => i.reviewWorkType === "contradiction_review" && i.reviewedAt);
    const avgContradictionHours = contradictionItems.length > 0
      ? contradictionItems.reduce((s, i) => s + (new Date(i.reviewedAt!).getTime() - new Date(i.createdAt).getTime()), 0) / contradictionItems.length / 3600000
      : null;

    const lowConfItems = closed.filter(i => i.reviewWorkType === "low_confidence_extraction_review" && i.reviewedAt);
    const avgLowConfHours = lowConfItems.length > 0
      ? lowConfItems.reduce((s, i) => s + (new Date(i.reviewedAt!).getTime() - new Date(i.createdAt).getTime()), 0) / lowConfItems.length / 3600000
      : null;

    const exportItems = closed.filter(i => i.exportedAt && i.approvedAt);
    const avgExportTurnaroundHours = exportItems.length > 0
      ? exportItems.reduce((s, i) => s + (new Date(i.exportedAt!).getTime() - new Date(i.approvedAt!).getTime()), 0) / exportItems.length / 3600000
      : null;

    const approvalItems = closed.filter(i => i.approvedAt && i.assignedAt);
    const avgApprovalWaitHours = approvalItems.length > 0
      ? approvalItems.reduce((s, i) => s + (new Date(i.approvedAt!).getTime() - new Date(i.assignedAt!).getTime()), 0) / approvalItems.length / 3600000
      : null;

    const backlogByType: Record<string, number> = {};
    all.forEach(i => { backlogByType[i.reviewWorkType] = (backlogByType[i.reviewWorkType] ?? 0) + 1; });

    res.json({
      period: { days: periodDays, since: since.toISOString() },
      avgReviewAgeHours: Math.round(avgAge * 10) / 10,
      throughputPerDay: Math.round(throughput * 100) / 100,
      totalClosed: closed.length,
      approved: approved.length,
      rejected: rejected.length,
      backlogSize: all.length,
      backlogByType,
      slaBreachCount: breaches.length,
      avgContradictionResolutionHours: avgContradictionHours ? Math.round(avgContradictionHours * 10) / 10 : null,
      avgLowConfidenceResolutionHours: avgLowConfHours ? Math.round(avgLowConfHours * 10) / 10 : null,
      avgExportReadyTurnaroundHours: avgExportTurnaroundHours ? Math.round(avgExportTurnaroundHours * 10) / 10 : null,
      avgApprovalWaitTimeHours: avgApprovalWaitHours ? Math.round(avgApprovalWaitHours * 10) / 10 : null,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to get review metrics");
    res.status(500).json({ error: "Failed to get review metrics" });
  }
});

router.get("/review-desk/admin", requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const [all, breaches] = await Promise.all([
      db.select().from(pcManagedReviewItemsTable)
        .where(eq(pcManagedReviewItemsTable.orgId, getOrgId(req))),
      db.select().from(pcManagedReviewItemsTable)
        .where(and(
          eq(pcManagedReviewItemsTable.orgId, getOrgId(req)),
          not(isNull(pcManagedReviewItemsTable.slaBreachedAt)),
          not(eq(pcManagedReviewItemsTable.lifecycleState, "closed")),
        )),
    ]);

    const backlogByType: Record<string, number> = {};
    const backlogByState: Record<string, number> = {};
    all.filter(i => i.lifecycleState !== "closed").forEach(i => {
      backlogByType[i.reviewWorkType] = (backlogByType[i.reviewWorkType] ?? 0) + 1;
      backlogByState[i.lifecycleState] = (backlogByState[i.lifecycleState] ?? 0) + 1;
    });

    const contradictionBacklog = all.filter(i => i.reviewWorkType === "contradiction_review" && i.lifecycleState !== "closed").length;
    const lowConfBacklog = all.filter(i => i.reviewWorkType === "low_confidence_extraction_review" && i.lifecycleState !== "closed").length;
    const failedPackets = all.filter(i => i.auditPacketRef !== null && i.lifecycleState === "blocked").length;

    res.json({
      backlogByType,
      backlogByState,
      slaBreaches: breaches.map(i => ({
        id: i.id,
        title: i.title,
        reviewWorkType: i.reviewWorkType,
        lifecycleState: i.lifecycleState,
        breachedAt: i.slaBreachedAt,
        priorityScore: i.priorityScore,
      })),
      contradictionBacklog,
      lowConfidenceBacklog: lowConfBacklog,
      reviewPacketFailures: failedPackets,
      totalActive: all.filter(i => !["closed", "exported"].includes(i.lifecycleState)).length,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to get admin view" });
  }
});

router.get("/review-desk/my-review", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId as string) : null;

    const items = await db.select().from(pcManagedReviewItemsTable)
      .where(and(
        eq(pcManagedReviewItemsTable.orgId, getOrgId(req)),
        userId ? eq(pcManagedReviewItemsTable.assignedTo, userId) : sql`true`,
        not(eq(pcManagedReviewItemsTable.lifecycleState, "closed")),
      ))
      .orderBy(desc(pcManagedReviewItemsTable.priorityScore))
      .limit(20);

    const needsAction = items.filter(i => ["new", "triaged", "assigned", "in_review"].includes(i.lifecycleState));
    const risky = items.filter(i => i.priorityScore >= 0.70);
    const missing = items.filter(i => i.lifecycleState === "needs_evidence");
    const readyToClear = items.filter(i => i.lifecycleState === "approved");
    const unblocks = items
      .sort((a, b) => b.workUnblockedScore - a.workUnblockedScore)
      .slice(0, 5);

    res.json({
      needsAction: needsAction.length,
      risky: risky.length,
      missing: missing.length,
      readyToClear: readyToClear.length,
      topItems: needsAction.slice(0, 5),
      riskyItems: risky.slice(0, 3),
      missingItems: missing.slice(0, 3),
      topUnblockers: unblocks,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to get my review summary" });
  }
});

router.get("/review-desk/copilot/max-unblock", async (req: Request, res: Response) => {
  try {
    const items = await db.select().from(pcManagedReviewItemsTable)
      .where(and(
        eq(pcManagedReviewItemsTable.orgId, getOrgId(req)),
        not(eq(pcManagedReviewItemsTable.lifecycleState, "closed")),
        not(eq(pcManagedReviewItemsTable.lifecycleState, "approved")),
        not(eq(pcManagedReviewItemsTable.lifecycleState, "exported")),
      ))
      .orderBy(desc(pcManagedReviewItemsTable.workUnblockedScore))
      .limit(10);

    const top = items[0];
    res.json({
      topUnblocker: top ? {
        id: top.id,
        title: top.title,
        reviewWorkType: top.reviewWorkType,
        lifecycleState: top.lifecycleState,
        workUnblockedScore: top.workUnblockedScore,
        whatItUnblocks: top.whatItUnblocks,
        whatActionClearsIt: top.whatActionClearsIt,
        priorityScore: top.priorityScore,
      } : null,
      allUnblockers: items.map(i => ({
        id: i.id,
        title: i.title,
        reviewWorkType: i.reviewWorkType,
        lifecycleState: i.lifecycleState,
        workUnblockedScore: i.workUnblockedScore,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to get max-unblock item" });
  }
});

export default router;
