import { Router, type IRouter } from "express";
import { db } from "@szl-holdings/db";
import {
  complianceSuitabilityTable,
  complianceArchivalTable,
  complianceSupervisionQueueTable,
  complianceCalendarTable,
  complianceRiskScoreTable,
} from "@szl-holdings/db";
import { eq, desc, and, gte, lte, or, ilike, sql } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { z } from "zod";
import crypto from "crypto";

const router: IRouter = Router();

function generateItemId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function computeContentHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

const CreateSuitabilitySchema = z.object({
  clientId: z.string().min(1),
  clientName: z.string().min(1),
  advisorId: z.string().min(1),
  advisorName: z.string().min(1),
  recommendationType: z.enum(["security", "insurance", "annuity", "rollover", "account_type", "other"]),
  recommendationSummary: z.string().min(1),
  rationaleText: z.string().min(10, "Rationale must be at least 10 characters for Reg BI compliance"),
  clientProfile: z.record(z.unknown()),
  riskTolerance: z.enum(["conservative", "moderate", "aggressive", "very_aggressive"]),
  investmentObjective: z.string().min(1),
  timeHorizonYears: z.number().int().optional(),
  liquidityNeeds: z.string().optional(),
  financialSituation: z.record(z.unknown()).optional(),
  conflicts: z.record(z.unknown()).optional(),
});

const CreateArchivalSchema = z.object({
  communicationType: z.enum(["email", "chat", "voice_transcript", "written_correspondence", "trade_confirmation", "order_ticket", "advisory_agreement", "other"]),
  participants: z.array(z.object({ id: z.string(), name: z.string(), role: z.string().optional() })),
  subject: z.string().optional(),
  contentSummary: z.string().optional(),
  contentRef: z.string().optional(),
  retentionPolicy: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const CreateSupervisionSchema = z.object({
  category: z.enum(["suitability_review", "reg_bi_violation", "concentration_risk", "best_execution", "outside_business", "communications_review", "complaint", "exception_report", "other"]),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  assignedToId: z.string().optional(),
  assignedToName: z.string().optional(),
  submittedById: z.string().optional(),
  submittedByName: z.string().optional(),
  relatedEntities: z.array(z.record(z.unknown())).optional(),
  riskScore: z.number().min(0).max(100).optional(),
  dueAt: z.string().optional(),
});

const CreateCalendarSchema = z.object({
  eventType: z.enum(["form_adv", "form_adv_part2", "form_crs", "annual_review", "exam_prep", "retention_review", "reg_bi_audit", "finra_exam", "sec_exam", "state_exam", "board_review", "policy_review", "other"]),
  title: z.string().min(1),
  description: z.string().optional(),
  dueAt: z.string(),
  reminderAt: z.string().optional(),
  assignedToId: z.string().optional(),
  assignedToName: z.string().optional(),
  regulatoryBody: z.string().optional(),
  filingReference: z.string().optional(),
  notes: z.string().optional(),
  recurrence: z.enum(["none", "annual", "quarterly", "monthly", "custom"]).optional(),
  metadata: z.record(z.unknown()).optional(),
});

function mockCompliancePosture() {
  return {
    overallRiskScore: 78,
    regBiScore: 82,
    archivalScore: 91,
    supervisionScore: 65,
    openSupervisionItems: 4,
    criticalItems: 1,
    overdueCalendarItems: 2,
    pendingSuitabilityReviews: 3,
    trend: "+2.1 vs last month",
    lastUpdated: new Date().toISOString(),
  };
}

function mockCalendarEvents() {
  const now = new Date();
  return [
    {
      id: "cal-001",
      eventType: "form_adv",
      title: "Form ADV Annual Amendment",
      description: "Annual update to Form ADV Parts 1, 2A, and 2B",
      dueAt: new Date(now.getFullYear(), 3, 30).toISOString(),
      status: "upcoming",
      regulatoryBody: "SEC",
      filingReference: "IA-ADV-2026",
      assignedToName: "Chief Compliance Officer",
    },
    {
      id: "cal-002",
      eventType: "form_crs",
      title: "Form CRS Annual Review",
      description: "Annual review and update of Client Relationship Summary",
      dueAt: new Date(now.getFullYear(), 5, 30).toISOString(),
      status: "upcoming",
      regulatoryBody: "SEC",
      assignedToName: "Compliance Team",
    },
    {
      id: "cal-003",
      eventType: "exam_prep",
      title: "SEC Examination Prep — Q2 2026",
      description: "Prepare documentation and conduct mock exam readiness review",
      dueAt: new Date(now.getFullYear(), 5, 15).toISOString(),
      status: "in_progress",
      regulatoryBody: "SEC",
      assignedToName: "Compliance Director",
    },
    {
      id: "cal-004",
      eventType: "annual_review",
      title: "Annual Compliance Program Review",
      description: "Comprehensive review of all compliance policies, procedures, and controls per Rule 206(4)-7",
      dueAt: new Date(now.getFullYear(), 11, 31).toISOString(),
      status: "upcoming",
      regulatoryBody: "SEC/FINRA",
      assignedToName: "CCO",
    },
    {
      id: "cal-005",
      eventType: "reg_bi_audit",
      title: "Reg BI Suitability Audit — Q1 2026",
      description: "Review Q1 recommendations for Regulation Best Interest compliance",
      dueAt: new Date(now.getFullYear(), 3, 15).toISOString(),
      status: "overdue",
      regulatoryBody: "SEC",
      assignedToName: "Supervisory Principal",
    },
  ];
}

function mockSupervisionItems() {
  return [
    {
      id: "sup-001",
      category: "suitability_review",
      priority: "high",
      status: "open",
      title: "Reg BI Suitability — High-Concentration Bond Recommendation",
      description: "Client portfolio shows 78% allocation to a single bond issuer. Reg BI suitability documentation required.",
      assignedToName: "Senior Supervisor",
      riskScore: 82,
      dueAt: new Date(Date.now() + 3 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      relatedEntities: [{ type: "client", id: "client-441", name: "Meridian Capital" }],
    },
    {
      id: "sup-002",
      category: "communications_review",
      priority: "medium",
      status: "in_review",
      title: "Outside Communication Review — Financial Media Appearance",
      description: "Advisor scheduled external media appearance discussing market outlook. Pre-approval required.",
      assignedToName: "Compliance Officer",
      riskScore: 45,
      dueAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      relatedEntities: [],
    },
    {
      id: "sup-003",
      category: "reg_bi_violation",
      priority: "critical",
      status: "escalated",
      title: "Potential Reg BI Conflict — Proprietary Product Recommendation",
      description: "Recommendation analysis flags potential conflict: advisor recommended proprietary fund with higher compensation structure without documented client-specific rationale.",
      assignedToName: "Chief Compliance Officer",
      riskScore: 94,
      dueAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      relatedEntities: [{ type: "recommendation", id: "rec-882", name: "Proprietary Alpha Fund" }],
    },
    {
      id: "sup-004",
      category: "exception_report",
      priority: "low",
      status: "open",
      title: "Best Execution Exception — Municipal Bond Trade",
      description: "Trade executed at 12bps above best available quote. Exception documentation required for supervisory file.",
      assignedToName: "Trading Supervisor",
      riskScore: 28,
      dueAt: new Date(Date.now() + 14 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      relatedEntities: [],
    },
  ];
}

router.get("/compliance/posture", authMiddleware(), async (req, res) => {
  try {
    const [latestScore] = await db
      .select()
      .from(complianceRiskScoreTable)
      .orderBy(desc(complianceRiskScoreTable.scoreDate))
      .limit(1);

    if (latestScore) {
      sendSuccess(res, {
        overallRiskScore: Number(latestScore.overallScore),
        regBiScore: Number(latestScore.regBiScore),
        archivalScore: Number(latestScore.archivalScore),
        supervisionScore: Number(latestScore.supervisionScore),
        openSupervisionItems: latestScore.openSupervisionItems,
        criticalItems: latestScore.criticalItems,
        overdueCalendarItems: latestScore.overdueCalendarItems,
        pendingSuitabilityReviews: latestScore.pendingSuitabilityReviews,
        lastUpdated: latestScore.createdAt,
        source: "live",
      });
    } else {
      sendSuccess(res, { ...mockCompliancePosture(), source: "demo" });
    }
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch compliance posture");
  }
});

router.get("/compliance/suitability", authMiddleware(), async (req, res) => {
  try {
    const { status, advisorId, limit, offset } = req.query;
    const conditions = [];
    if (status) conditions.push(eq(complianceSuitabilityTable.status, status as string));
    if (advisorId) conditions.push(eq(complianceSuitabilityTable.advisorId, advisorId as string));

    const lim = Math.min(Number(limit ?? 50), 200);
    const off = Number(offset ?? 0);

    const rows = await db
      .select()
      .from(complianceSuitabilityTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(complianceSuitabilityTable.createdAt))
      .limit(lim)
      .offset(off);

    if (rows.length === 0) {
      return sendSuccess(res, {
        count: 3,
        dataMode: "demo",
        items: [
          { id: "suit-001", clientName: "James Holden", advisorName: "Maria Torres", recommendationType: "security", recommendationSummary: "Recommend TIPS ladder for inflation protection", status: "approved", createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
          { id: "suit-002", clientName: "Sarah Mitchell", advisorName: "Carlos Rivera", recommendationType: "annuity", recommendationSummary: "Recommend variable annuity for retirement income", status: "pending_review", createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
          { id: "suit-003", clientName: "Patricia Vance", advisorName: "Maria Torres", recommendationType: "rollover", recommendationSummary: "401k rollover to IRA for investment flexibility", status: "draft", createdAt: new Date().toISOString() },
        ],
      });
    }

    sendSuccess(res, { count: rows.length, dataMode: "live", items: rows });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch suitability records");
  }
});

router.post("/compliance/suitability", authMiddleware({ required: true }), async (req, res) => {
  try {
    const parsed = CreateSuitabilitySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendBadRequest(res, parsed.error.errors.map(e => e.message).join(", "));
      return;
    }
    const body = parsed.data;
    const recommendationId = generateItemId("rec");

    const [inserted] = await db.insert(complianceSuitabilityTable).values({
      ...body,
      recommendationId,
      clientProfile: body.clientProfile as any,
      financialSituation: (body.financialSituation ?? {}) as any,
      conflicts: (body.conflicts ?? {}) as any,
    }).returning();

    sendCreated(res, { recommendationId, record: inserted });
  } catch (err) {
    handleRouteError(res, err, "Failed to create suitability record");
  }
});

router.patch("/compliance/suitability/:id/review", authMiddleware({ required: true }), async (req, res) => {
  try {
    const { id } = req.params as Record<string, string>;
    const { action, reviewNotes, reviewerId } = req.body as { action: "approve" | "reject"; reviewNotes?: string; reviewerId?: string };
    if (!["approve", "reject"].includes(action)) {
      sendBadRequest(res, "action must be approve or reject");
      return;
    }

    const [updated] = await db.update(complianceSuitabilityTable)
      .set({
        status: action === "approve" ? "approved" : "rejected",
        reviewerId: reviewerId ?? null,
        reviewNotes: reviewNotes ?? null,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(complianceSuitabilityTable.recommendationId, id))
      .returning();

    if (!updated) {
      sendNotFound(res, "Suitability record");
      return;
    }

    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to review suitability record");
  }
});

router.get("/compliance/archival", authMiddleware(), async (req, res) => {
  try {
    const { type, limit, offset } = req.query;
    const conditions = [];
    if (type) conditions.push(eq(complianceArchivalTable.communicationType, type as string));

    const lim = Math.min(Number(limit ?? 50), 200);
    const off = Number(offset ?? 0);

    const rows = await db
      .select()
      .from(complianceArchivalTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(complianceArchivalTable.archivedAt))
      .limit(lim)
      .offset(off);

    sendSuccess(res, {
      count: rows.length,
      dataMode: rows.length > 0 ? "live" : "demo",
      totalArchived: rows.length,
      items: rows.length > 0 ? rows : [
        { entryId: "arch-001", communicationType: "email", subject: "Portfolio Review Discussion", participants: [{ id: "adv-1", name: "Maria Torres", role: "advisor" }, { id: "cli-1", name: "James Holden", role: "client" }], contentHash: "sha256:abc123", retentionPolicy: "rule_17a4_3year", retentionExpiresAt: new Date(Date.now() + 3 * 365 * 86400000).toISOString(), archivedAt: new Date(Date.now() - 86400000).toISOString() },
        { entryId: "arch-002", communicationType: "trade_confirmation", subject: "TIPS Ladder Execution Confirmation", participants: [{ id: "adv-1", name: "Maria Torres", role: "advisor" }], contentHash: "sha256:def456", retentionPolicy: "rule_17a4_3year", retentionExpiresAt: new Date(Date.now() + 3 * 365 * 86400000).toISOString(), archivedAt: new Date().toISOString() },
      ],
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch archival records");
  }
});

router.post("/compliance/archival", authMiddleware({ required: true }), async (req, res) => {
  try {
    const parsed = CreateArchivalSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendBadRequest(res, parsed.error.errors.map(e => e.message).join(", "));
      return;
    }
    const body = parsed.data;

    const lastEntry = await db
      .select({ contentHash: complianceArchivalTable.contentHash })
      .from(complianceArchivalTable)
      .orderBy(desc(complianceArchivalTable.archivedAt))
      .limit(1);

    const prevHash = lastEntry[0]?.contentHash ?? null;
    const contentStr = JSON.stringify({ ...body, timestamp: new Date().toISOString() });
    const contentHash = computeContentHash(contentStr);

    const retentionYears = body.retentionPolicy?.includes("6year") ? 6 : 3;
    const retentionExpiresAt = new Date();
    retentionExpiresAt.setFullYear(retentionExpiresAt.getFullYear() + retentionYears);

    const entryId = generateItemId("arch");

    const [inserted] = await db.insert(complianceArchivalTable).values({
      entryId,
      prevHash,
      contentHash,
      communicationType: body.communicationType,
      participants: body.participants as any,
      subject: body.subject ?? null,
      contentSummary: body.contentSummary ?? null,
      contentRef: body.contentRef ?? null,
      retentionPolicy: body.retentionPolicy ?? "rule_17a4_3year",
      retentionExpiresAt,
      isImmutable: true,
      metadata: (body.metadata ?? {}) as any,
    }).returning();

    sendCreated(res, { entryId, contentHash, prevHash, record: inserted });
  } catch (err) {
    handleRouteError(res, err, "Failed to create archival entry");
  }
});

router.get("/compliance/supervision", authMiddleware(), async (req, res) => {
  try {
    const { status, priority, category, limit, offset } = req.query;
    const conditions = [];
    if (status) conditions.push(eq(complianceSupervisionQueueTable.status, status as string));
    if (priority) conditions.push(eq(complianceSupervisionQueueTable.priority, priority as string));
    if (category) conditions.push(eq(complianceSupervisionQueueTable.category, category as string));

    const lim = Math.min(Number(limit ?? 50), 200);
    const off = Number(offset ?? 0);

    const rows = await db
      .select()
      .from(complianceSupervisionQueueTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(complianceSupervisionQueueTable.createdAt))
      .limit(lim)
      .offset(off);

    sendSuccess(res, {
      count: rows.length > 0 ? rows.length : mockSupervisionItems().length,
      dataMode: rows.length > 0 ? "live" : "demo",
      items: rows.length > 0 ? rows : mockSupervisionItems(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch supervision queue");
  }
});

router.post("/compliance/supervision", authMiddleware({ required: true }), async (req, res) => {
  try {
    const parsed = CreateSupervisionSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendBadRequest(res, parsed.error.errors.map(e => e.message).join(", "));
      return;
    }
    const body = parsed.data;
    const itemId = generateItemId("sup");

    const [inserted] = await db.insert(complianceSupervisionQueueTable).values({
      itemId,
      category: body.category,
      priority: body.priority ?? "medium",
      title: body.title,
      description: body.description,
      assignedToId: body.assignedToId ?? null,
      assignedToName: body.assignedToName ?? null,
      submittedById: body.submittedById ?? null,
      submittedByName: body.submittedByName ?? null,
      relatedEntities: (body.relatedEntities ?? []) as any,
      riskScore: body.riskScore ? String(body.riskScore) : null,
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      escalationLevel: 0,
      auditTrail: [{ action: "created", timestamp: new Date().toISOString(), actor: body.submittedByName ?? "system" }] as any,
    }).returning();

    sendCreated(res, { itemId, record: inserted });
  } catch (err) {
    handleRouteError(res, err, "Failed to create supervision item");
  }
});

router.patch("/compliance/supervision/:itemId/action", authMiddleware({ required: true }), async (req, res) => {
  try {
    const { itemId } = req.params as Record<string, string>;
    const { action, notes, assignedToId, assignedToName } = req.body as {
      action: "escalate" | "resolve" | "close" | "assign";
      notes?: string;
      assignedToId?: string;
      assignedToName?: string;
    };

    const [existing] = await db
      .select()
      .from(complianceSupervisionQueueTable)
      .where(eq(complianceSupervisionQueueTable.itemId, itemId))
      .limit(1);

    if (!existing) {
      sendNotFound(res, "Supervision item");
      return;
    }

    const auditTrail = ((existing.auditTrail as unknown[]) ?? []).concat([
      { action, timestamp: new Date().toISOString(), notes, assignedToId, assignedToName },
    ]);

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
      auditTrail,
    };

    if (action === "escalate") {
      updates.status = "escalated";
      updates.escalationLevel = (existing.escalationLevel ?? 0) + 1;
    } else if (action === "resolve") {
      updates.status = "resolved";
      updates.resolvedAt = new Date();
      updates.resolution = notes ?? null;
    } else if (action === "close") {
      updates.status = "closed";
      updates.resolvedAt = new Date();
    } else if (action === "assign") {
      updates.assignedToId = assignedToId ?? existing.assignedToId;
      updates.assignedToName = assignedToName ?? existing.assignedToName;
      updates.status = "in_review";
    }

    const [updated] = await db.update(complianceSupervisionQueueTable)
      .set(updates)
      .where(eq(complianceSupervisionQueueTable.itemId, itemId))
      .returning();

    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to action supervision item");
  }
});

router.get("/compliance/calendar", authMiddleware(), async (req, res) => {
  try {
    const { status, eventType, from, to } = req.query;
    const conditions = [];
    if (status) conditions.push(eq(complianceCalendarTable.status, status as string));
    if (eventType) conditions.push(eq(complianceCalendarTable.eventType, eventType as string));
    if (from) conditions.push(gte(complianceCalendarTable.dueAt, new Date(from as string)));
    if (to) conditions.push(lte(complianceCalendarTable.dueAt, new Date(to as string)));

    const rows = await db
      .select()
      .from(complianceCalendarTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(complianceCalendarTable.dueAt)
      .limit(100);

    sendSuccess(res, {
      count: rows.length > 0 ? rows.length : mockCalendarEvents().length,
      dataMode: rows.length > 0 ? "live" : "demo",
      events: rows.length > 0 ? rows : mockCalendarEvents(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch compliance calendar");
  }
});

router.post("/compliance/calendar", authMiddleware({ required: true }), async (req, res) => {
  try {
    const parsed = CreateCalendarSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendBadRequest(res, parsed.error.errors.map(e => e.message).join(", "));
      return;
    }
    const body = parsed.data;
    const eventId = generateItemId("cal");

    const [inserted] = await db.insert(complianceCalendarTable).values({
      eventId,
      eventType: body.eventType,
      title: body.title,
      description: body.description ?? null,
      dueAt: new Date(body.dueAt),
      reminderAt: body.reminderAt ? new Date(body.reminderAt) : null,
      assignedToId: body.assignedToId ?? null,
      assignedToName: body.assignedToName ?? null,
      regulatoryBody: body.regulatoryBody ?? null,
      filingReference: body.filingReference ?? null,
      notes: body.notes ?? null,
      recurrence: body.recurrence ?? "none",
      metadata: (body.metadata ?? {}) as any,
    }).returning();

    sendCreated(res, { eventId, record: inserted });
  } catch (err) {
    handleRouteError(res, err, "Failed to create calendar event");
  }
});

router.get("/compliance/market-context", authMiddleware(), async (_req, res) => {
  try {
    const { services } = await import("@szl-holdings/services");
    const [fredSnap, marketIndices] = await Promise.allSettled([
      services.fred?.getEconomicSnapshot ? (services as any).fred.getEconomicSnapshot() : Promise.resolve(null),
      services.market_data?.getMarketIndices ? (services as any).market_data.getMarketIndices() : Promise.resolve(null),
    ]);

    sendSuccess(res, {
      economicIndicators: fredSnap.status === "fulfilled" ? fredSnap.value : null,
      marketIndices: marketIndices.status === "fulfilled" ? marketIndices.value : null,
      capRateEnvironment: {
        tenYearTreasury: "4.38%",
        impliedCapRateFloor: "5.25%",
        spreadVsTreasury: "87bps",
        trend: "widening",
        note: "Rising rates compress CRE valuations; Reg BI suitability reviews advised for rate-sensitive recommendations",
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch market context");
  }
});

router.get("/compliance/intelligence-fusion", authMiddleware(), async (_req, res) => {
  try {
    sendSuccess(res, {
      insights: [
        {
          id: "fusion-001",
          type: "suitability_alert",
          severity: "high",
          title: "Cap Rate Drift — Reg BI Suitability Review Required",
          description: "Current 10Y Treasury at 4.38% implies cap rate floor of ~5.25%. Pending deal at 4.8% cap rate is 45bps below market. Reg BI requires updated suitability documentation for affected clients.",
          dealId: "deal-terra-882",
          crmAccountId: "0015f00000AbCdEf",
          crmAccountName: "Meridian Capital Group",
          marketData: { treasuryRate: 4.38, impliedCapRateFloor: 5.25, dealCapRate: 4.80, drift: -0.45 },
          action: "Route to supervision queue: reg_bi_violation",
          createdAt: new Date().toISOString(),
        },
        {
          id: "fusion-002",
          type: "concentration_risk",
          severity: "medium",
          title: "Portfolio Concentration Risk — CRM Pipeline Flag",
          description: "Arcturus Industrial Holdings pipeline opportunity (Fleet Intelligence Suite, $540K) would bring total sector exposure to 68% of AUM. Best Interest obligation requires disclosure.",
          dealId: null,
          crmAccountId: "0015f00000XyZwVu",
          crmAccountName: "Arcturus Industrial Holdings",
          marketData: { currentSectorExposure: 0.68, threshold: 0.50 },
          action: "Flag for communications review",
          createdAt: new Date().toISOString(),
        },
        {
          id: "fusion-003",
          type: "market_opportunity",
          severity: "info",
          title: "Rate Environment — Favorable CMBS Refinancing Window",
          description: "Current 30Y mortgage rate at 6.82%. Life Co spreads tightening for institutional CRE. Comparable transaction data shows 12% increase in bridge-to-perm conversions.",
          dealId: null,
          crmAccountId: null,
          crmAccountName: null,
          marketData: { mortgageRate: 6.82, lifeCoSpread: 185, bridgeConversionTrend: "+12%" },
          action: "Surface to deal originators",
          createdAt: new Date().toISOString(),
        },
      ],
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch intelligence fusion");
  }
});

export default router;
