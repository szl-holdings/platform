import { Router, type IRouter } from "express";
import {
  db,
  platformSignalsTable,
  actionsTable,
  readinessItemsTable,
  savedViewsTable,
  commentsTable,
  eventLogTable,
  organizationsTable,
  workflowsTable,
  workflowRunsTable,
  usersTable,
  orgMembersTable,
} from "@workspace/db";
import { eq, and, desc, sql, or, gte, lte } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam, canAccessOrgRecord } from "../middlewares/auth";
import { isFlagEnabled } from "../lib/platform-flags";

const router: IRouter = Router();

const LYTE_PRODUCT = "lyte";

function logLyteEvent(orgId: number, actorId: number | null, actorName: string, eventType: string, entityType: string, entityId: string | null, before?: Record<string, unknown>, after?: Record<string, unknown>) {
  db.insert(eventLogTable).values({
    orgId,
    product: LYTE_PRODUCT,
    actorId: actorId ?? undefined,
    actorName,
    eventType,
    entityType,
    entityId,
    before: before ?? null,
    after: after ?? null,
  }).catch(() => {});
}

async function trackSignalStateChange(orgId: number, signalId: number, fromStatus: string, toStatus: string, actorId: number | null, actorName: string, extra?: Record<string, unknown>) {
  await db.insert(eventLogTable).values({
    orgId,
    product: LYTE_PRODUCT,
    actorId: actorId ?? undefined,
    actorName,
    eventType: `signal.${toStatus}`,
    entityType: "signal",
    entityId: String(signalId),
    before: { status: fromStatus },
    after: { status: toStatus, ...extra },
  });
}

async function triggerAlloyWorkflow(orgId: number, product: string, entityType: string, entityId: number, triggerData: Record<string, unknown>) {
  try {
    const [workflow] = await db.select().from(workflowsTable).where(
      and(
        eq(workflowsTable.orgId, orgId),
        eq(workflowsTable.status, "active"),
        eq(workflowsTable.product, "alloy"),
      )
    ).limit(1);

    if (workflow) {
      await db.insert(workflowRunsTable).values({
        orgId,
        workflowId: workflow.id,
        status: "queued",
        input: { product, entityType, entityId, ...triggerData },
        startedAt: new Date(),
      });
    }
  } catch {
  }
}


function buildInsightNarratives(signals: any[], actions: any[]): { narratives: string[]; operationalIntelligence: string; riskSummary: string } {
  const active = signals.filter(s => !["resolved", "dismissed"].includes(s.status));
  const critical = active.filter(s => s.severity === "critical");
  const high = active.filter(s => s.severity === "high");
  const totalValueAtRisk = active.filter(s => s.valueAtRisk).reduce((sum, s) => sum + parseFloat(s.valueAtRisk ?? "0"), 0);
  const pendingActions = actions.filter(a => ["pending", "in_progress"].includes(a.status));
  const overdueActions = pendingActions.filter(a => a.dueAt && new Date(a.dueAt) < new Date());

  const narratives: string[] = [];

  if (critical.length > 0) {
    narratives.push(`${critical.length} critical signal${critical.length > 1 ? "s" : ""} require${critical.length === 1 ? "s" : ""} immediate attention — estimated $${(totalValueAtRisk / 1000000).toFixed(1)}M value at risk.`);
  }
  if (high.length > 0) {
    narratives.push(`${high.length} high-severity signal${high.length > 1 ? "s" : ""} are trending toward escalation. Proactive intervention recommended within 2–4 hours.`);
  }
  if (overdueActions.length > 0) {
    narratives.push(`${overdueActions.length} action${overdueActions.length > 1 ? "s are" : " is"} past due. Operational cadence is at risk of SLA breach.`);
  }
  if (pendingActions.length > 10) {
    narratives.push(`Action queue depth at ${pendingActions.length} items indicates backlog accumulation. Consider reassignment or escalation.`);
  }
  if (active.length === 0) {
    narratives.push("All signals resolved. System operating within normal parameters.");
  }

  const operationalIntelligence = narratives.length > 0
    ? `Lyte AIOps has detected ${active.length} active operational signals across ${[...new Set(active.map(s => (s.metadata as any)?.category).filter(Boolean))].length} categories. ` + narratives.join(" ")
    : "No active signals requiring attention at this time.";

  const riskSummary = totalValueAtRisk > 0
    ? `Aggregate value at risk: $${(totalValueAtRisk / 1000000).toFixed(2)}M. Critical path items: ${critical.length} signals, ${overdueActions.length} overdue actions.`
    : "No quantified value at risk currently flagged.";

  return { narratives, operationalIntelligence, riskSummary };
}

function buildActionQueue(actions: any[]) {
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const pending = actions.filter(a => ["pending", "in_progress", "blocked"].includes(a.status));
  const sorted = [...pending].sort((a, b) => {
    const pDiff = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
    if (pDiff !== 0) return pDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return {
    total: sorted.length,
    critical: sorted.filter(a => a.priority === "critical").length,
    high: sorted.filter(a => a.priority === "high").length,
    overdue: sorted.filter(a => a.dueAt && new Date(a.dueAt) < new Date()).length,
    queue: sorted.slice(0, 20),
  };
}

function calculateReadinessScore(items: any[]) {
  if (items.length === 0) return { score: 0, breakdown: {}, blockerCount: 0 };

  const completed = items.filter(i => i.status === "completed").length;
  const blocked = items.filter(i => i.status === "blocked").length;
  const inProgress = items.filter(i => i.status === "in_progress").length;
  const notStarted = items.filter(i => i.status === "not_started").length;

  const rawScore = ((completed + inProgress * 0.5) / items.length) * 100;
  const blockerPenalty = blocked * 5;
  const score = Math.max(0, Math.round(rawScore - blockerPenalty));

  const byCategory: Record<string, { total: number; completed: number; score: number }> = {};
  for (const item of items) {
    if (!byCategory[item.category]) byCategory[item.category] = { total: 0, completed: 0, score: 0 };
    byCategory[item.category].total++;
    if (item.status === "completed") byCategory[item.category].completed++;
  }
  for (const cat of Object.keys(byCategory)) {
    const b = byCategory[cat];
    b.score = Math.round((b.completed / b.total) * 100);
  }

  return {
    score,
    breakdown: { completed, inProgress, notStarted, blocked },
    blockerCount: blocked,
    byCategory,
    readinessLevel: score >= 90 ? "ready" : score >= 70 ? "near_ready" : score >= 50 ? "in_progress" : "at_risk",
  };
}

function buildExecutiveDashboard(signals: any[], actions: any[], readinessItems: any[]) {
  const activeSignals = signals.filter(s => !["resolved", "dismissed"].includes(s.status));
  const criticalSignals = activeSignals.filter(s => s.severity === "critical");
  const totalValueAtRisk = activeSignals.filter(s => s.valueAtRisk).reduce((sum, s) => sum + parseFloat(s.valueAtRisk ?? "0"), 0);
  const readiness = calculateReadinessScore(readinessItems);
  const insights = buildInsightNarratives(signals, actions);
  const criticalActions = actions.filter(a => a.priority === "critical" && ["pending", "in_progress"].includes(a.status));

  return {
    role: "executive",
    headline: {
      operationalHealth: readiness.score >= 80 ? "green" : readiness.score >= 60 ? "yellow" : "red",
      readinessScore: readiness.score,
      riskExposureUsd: Math.round(totalValueAtRisk),
      criticalSignals: criticalSignals.length,
      criticalActionsRequired: criticalActions.length,
      trendDirection: activeSignals.length <= 3 ? "improving" : activeSignals.length >= 10 ? "deteriorating" : "stable",
    },
    executiveSummary: insights.operationalIntelligence,
    riskSummary: insights.riskSummary,
    topRisks: criticalSignals.slice(0, 3).map(s => ({
      id: s.id,
      title: s.title,
      severity: s.severity,
      valueAtRisk: s.valueAtRisk,
      detectedAt: s.receivedAt,
    })),
    requiredDecisions: criticalActions.slice(0, 5),
    readinessOverview: { score: readiness.score, level: readiness.readinessLevel, blockers: readiness.blockerCount },
  };
}

function buildOperationsDashboard(signals: any[], actions: any[], readinessItems: any[]) {
  const activeSignals = signals.filter(s => !["resolved", "dismissed"].includes(s.status));
  const actionQueue = buildActionQueue(actions);
  const insights = buildInsightNarratives(signals, actions);
  const readiness = calculateReadinessScore(readinessItems);

  const byCategory: Record<string, number> = {};
  for (const s of activeSignals) {
    const cat = (s.metadata as any)?.category;
    if (cat) byCategory[cat] = (byCategory[cat] ?? 0) + 1;
  }

  return {
    role: "operations",
    signalSummary: {
      total: activeSignals.length,
      critical: activeSignals.filter(s => s.severity === "critical").length,
      high: activeSignals.filter(s => s.severity === "high").length,
      medium: activeSignals.filter(s => s.severity === "medium").length,
      byCategory,
    },
    actionQueue,
    recentSignals: activeSignals.slice(0, 15),
    insights: insights.narratives,
    readinessScore: readiness.score,
    unassignedSignals: 0,
    avgResolutionSignals: signals.filter(s => s.status === "processed" && s.processedAt).length,
  };
}

function buildDeliveryDashboard(signals: any[], actions: any[], readinessItems: any[]) {
  const activeSignals = signals.filter(s => !["resolved", "dismissed"].includes(s.status));
  const readiness = calculateReadinessScore(readinessItems);
  const myActions = actions.filter(a => ["pending", "in_progress"].includes(a.status));
  const overdue = myActions.filter(a => a.dueAt && new Date(a.dueAt) < new Date());

  return {
    role: "delivery",
    deliveryHealth: {
      blockers: readiness.blockerCount,
      readinessScore: readiness.score,
      readinessLevel: readiness.readinessLevel,
      overdueItems: overdue.length,
      pendingActions: myActions.length,
    },
    byCategory: readiness.byCategory,
    blockedItems: readinessItems.filter(i => i.status === "blocked"),
    upcomingDue: myActions.filter(a => a.dueAt && new Date(a.dueAt) > new Date()).sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()).slice(0, 10),
    signalImpactOnDelivery: activeSignals.filter(s => ["critical", "high"].includes(s.severity)).slice(0, 5),
    completedThisWeek: readinessItems.filter(i => i.status === "completed" && i.completedAt && new Date(i.completedAt) > new Date(Date.now() - 7 * 86400000)).length,
  };
}

function buildLyteDashboard(role: string | null | undefined, signals: any[], actions: any[], readinessItems: any[]) {
  const activeSignals = signals.filter(s => !["resolved", "dismissed"].includes(s.status));
  const criticalSignals = activeSignals.filter(s => s.severity === "critical");
  const highSignals = activeSignals.filter(s => s.severity === "high");
  const pendingActions = actions.filter(a => ["pending", "in_progress"].includes(a.status));
  const criticalActions = pendingActions.filter(a => a.priority === "critical");

  const readinessScore = readinessItems.length > 0
    ? Math.round(readinessItems.reduce((sum, r) => sum + (parseFloat(r.score ?? "0") / parseFloat(r.targetScore ?? "100")), 0) / readinessItems.length * 100)
    : 0;

  const totalValueAtRisk = activeSignals
    .filter(s => s.valueAtRisk)
    .reduce((sum, s) => sum + parseFloat(s.valueAtRisk ?? "0"), 0);

  const isExecView = role === "executive_viewer" || role === "exec";
  const isReadOnly = role === "executive_viewer" || role === "analyst" || role === "pilot_customer_user";

  const base = {
    summary: {
      totalSignals: signals.length,
      activeSignals: activeSignals.length,
      criticalSignals: criticalSignals.length,
      highSignals: highSignals.length,
      pendingActions: pendingActions.length,
      criticalActions: criticalActions.length,
      readinessScore,
      totalValueAtRisk: Math.round(totalValueAtRisk),
    },
    recentSignals: activeSignals.slice(0, 10),
    priorityActions: criticalActions.slice(0, 5),
    readinessOverview: readinessItems.slice(0, 8),
    roleContext: { role, isReadOnly, isExecView },
  };

  if (isExecView) {
    return {
      ...base,
      executiveSummary: {
        operationalHealth: readinessScore > 80 ? "good" : readinessScore > 60 ? "fair" : "at_risk",
        riskExposureUsd: Math.round(totalValueAtRisk),
        actionItemsRequiringAttention: criticalActions.length,
        signalsRequiringReview: criticalSignals.length,
        trendDirection: activeSignals.length < signals.length * 0.5 ? "improving" : "stable",
      },
    };
  }

  return base;
}

router.get("/lyte/platform/dashboard", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const roleParam = req.query.role as string | undefined;
    const role = roleParam || (req.user?.roles?.[0] as string) || null;

    const [signals, actions, readinessItems] = await Promise.all([
      db.select().from(platformSignalsTable).where(
        and(eq(platformSignalsTable.orgId, orgId))
      ).orderBy(desc(platformSignalsTable.receivedAt)).limit(50),
      db.select().from(actionsTable).where(
        and(eq(actionsTable.orgId, orgId), eq(actionsTable.product, LYTE_PRODUCT))
      ).orderBy(desc(actionsTable.createdAt)).limit(50),
      db.select().from(readinessItemsTable).where(
        and(eq(readinessItemsTable.orgId, orgId), eq(readinessItemsTable.product, LYTE_PRODUCT))
      ).orderBy(desc(readinessItemsTable.createdAt)).limit(20),
    ]);

    let dashboard: any;
    if (role === "executive" || role === "exec" || role === "executive_viewer") {
      dashboard = buildExecutiveDashboard(signals, actions, readinessItems);
    } else if (role === "operations" || role === "ops") {
      dashboard = buildOperationsDashboard(signals, actions, readinessItems);
    } else if (role === "delivery") {
      dashboard = buildDeliveryDashboard(signals, actions, readinessItems);
    } else {
      dashboard = buildLyteDashboard(role, signals, actions, readinessItems);
    }

    sendSuccess(res, dashboard);
  } catch (err) {
    handleRouteError(res, err, "Failed to build lyte dashboard");
  }
});

router.get("/lyte/platform/dashboard/executive", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const [signals, actions, readinessItems] = await Promise.all([
      db.select().from(platformSignalsTable).where(and(eq(platformSignalsTable.orgId, orgId))).orderBy(desc(platformSignalsTable.receivedAt)).limit(50),
      db.select().from(actionsTable).where(and(eq(actionsTable.orgId, orgId), eq(actionsTable.product, LYTE_PRODUCT))).orderBy(desc(actionsTable.createdAt)).limit(50),
      db.select().from(readinessItemsTable).where(and(eq(readinessItemsTable.orgId, orgId), eq(readinessItemsTable.product, LYTE_PRODUCT))).limit(20),
    ]);
    sendSuccess(res, buildExecutiveDashboard(signals, actions, readinessItems));
  } catch (err) { handleRouteError(res, err, "Failed to build executive dashboard"); }
});

router.get("/lyte/platform/dashboard/operations", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const [signals, actions, readinessItems] = await Promise.all([
      db.select().from(platformSignalsTable).where(and(eq(platformSignalsTable.orgId, orgId))).orderBy(desc(platformSignalsTable.receivedAt)).limit(100),
      db.select().from(actionsTable).where(and(eq(actionsTable.orgId, orgId), eq(actionsTable.product, LYTE_PRODUCT))).orderBy(desc(actionsTable.createdAt)).limit(100),
      db.select().from(readinessItemsTable).where(and(eq(readinessItemsTable.orgId, orgId), eq(readinessItemsTable.product, LYTE_PRODUCT))).limit(50),
    ]);
    sendSuccess(res, buildOperationsDashboard(signals, actions, readinessItems));
  } catch (err) { handleRouteError(res, err, "Failed to build operations dashboard"); }
});

router.get("/lyte/platform/dashboard/delivery", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const [signals, actions, readinessItems] = await Promise.all([
      db.select().from(platformSignalsTable).where(and(eq(platformSignalsTable.orgId, orgId))).orderBy(desc(platformSignalsTable.receivedAt)).limit(50),
      db.select().from(actionsTable).where(and(eq(actionsTable.orgId, orgId), eq(actionsTable.product, LYTE_PRODUCT))).orderBy(desc(actionsTable.createdAt)).limit(50),
      db.select().from(readinessItemsTable).where(and(eq(readinessItemsTable.orgId, orgId), eq(readinessItemsTable.product, LYTE_PRODUCT))).limit(50),
    ]);
    sendSuccess(res, buildDeliveryDashboard(signals, actions, readinessItems));
  } catch (err) { handleRouteError(res, err, "Failed to build delivery dashboard"); }
});

router.get("/lyte/platform/signals", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const status = req.query.status as string | undefined;
    const severity = req.query.severity as string | undefined;
    const owner = req.query.owner ? parseInt(req.query.owner as string, 10) : undefined;
    const category = req.query.category as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);
    const offset = parseInt(req.query.offset as string || "0", 10);

    const baseWhere = and(
      eq(platformSignalsTable.orgId, orgId),
      status ? eq(platformSignalsTable.status, status as typeof platformSignalsTable.status._.data) : undefined,
      severity ? eq(platformSignalsTable.severity, severity as typeof platformSignalsTable.severity._.data) : undefined,
      from ? gte(platformSignalsTable.receivedAt, new Date(from)) : undefined,
      to ? lte(platformSignalsTable.receivedAt, new Date(to)) : undefined,
    );

    const [signals, [{ count }]] = await Promise.all([
      db.select().from(platformSignalsTable).where(baseWhere).orderBy(desc(platformSignalsTable.receivedAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(platformSignalsTable).where(baseWhere),
    ]);

    sendSuccess(res, signals, 200, { total: count, limit, offset });
  } catch (err) {
    handleRouteError(res, err, "Failed to list lyte signals");
  }
});

router.get("/lyte/platform/signals/insights", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const [signals, actions] = await Promise.all([
      db.select().from(platformSignalsTable).where(and(eq(platformSignalsTable.orgId, orgId))).orderBy(desc(platformSignalsTable.receivedAt)).limit(100),
      db.select().from(actionsTable).where(and(eq(actionsTable.orgId, orgId), eq(actionsTable.product, LYTE_PRODUCT))).orderBy(desc(actionsTable.createdAt)).limit(50),
    ]);
    sendSuccess(res, buildInsightNarratives(signals, actions));
  } catch (err) { handleRouteError(res, err, "Failed to build insight narratives"); }
});

router.get("/lyte/platform/signals/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const [signal] = await db.select().from(platformSignalsTable).where(
      and(eq(platformSignalsTable.id, id), eq(platformSignalsTable.orgId, orgId))
    );
    if (!signal) { sendNotFound(res, "Signal"); return; }
    sendSuccess(res, signal);
  } catch (err) {
    handleRouteError(res, err, "Failed to get signal");
  }
});

router.post("/lyte/platform/signals/:id/acknowledge", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }

    const [existing] = await db.select({ status: platformSignalsTable.status }).from(platformSignalsTable).where(and(eq(platformSignalsTable.id, id), eq(platformSignalsTable.orgId, orgId)));
    if (!existing) { sendNotFound(res, "Signal"); return; }

    const [signal] = await db.update(platformSignalsTable).set({
      status: "processing" as any,
      processedAt: new Date(),
    }).where(and(eq(platformSignalsTable.id, id), eq(platformSignalsTable.orgId, orgId))).returning();

    if (!signal) { sendNotFound(res, "Signal"); return; }
    await trackSignalStateChange(orgId, id, existing.status, "acknowledged", req.user.id ?? null, req.user.displayName ?? "system");
    sendSuccess(res, signal);
  } catch (err) {
    handleRouteError(res, err, "Failed to acknowledge signal");
  }
});

router.post("/lyte/platform/signals/:id/assign", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }

    const { assignedTo } = req.body as { assignedTo: number };
    if (!assignedTo || typeof assignedTo !== "number") { sendBadRequest(res, "assignedTo (number) required"); return; }

    const [membership] = await db.select({ role: orgMembersTable.role }).from(orgMembersTable).where(
      and(eq(orgMembersTable.orgId, orgId), eq(orgMembersTable.userId, assignedTo))
    ).limit(1);

    if (!membership) { sendBadRequest(res, "assignedTo user is not a member of this organization"); return; }
    if (!["owner", "admin", "member"].includes(membership.role)) {
      sendBadRequest(res, "assignedTo user does not have a role that permits assignment"); return;
    }

    const [existing] = await db.select({ status: platformSignalsTable.status }).from(platformSignalsTable).where(and(eq(platformSignalsTable.id, id), eq(platformSignalsTable.orgId, orgId)));
    if (!existing) { sendNotFound(res, "Signal"); return; }

    const [signal] = await db.update(platformSignalsTable).set({
      status: "processing" as any,
      metadata: { assignedTo },
    }).where(and(eq(platformSignalsTable.id, id), eq(platformSignalsTable.orgId, orgId))).returning();

    if (!signal) { sendNotFound(res, "Signal"); return; }
    await trackSignalStateChange(orgId, id, existing.status, "assigned", req.user.id ?? null, req.user.displayName ?? "system", { assignedTo });
    sendSuccess(res, signal);
  } catch (err) {
    handleRouteError(res, err, "Failed to assign signal");
  }
});

router.post("/lyte/platform/signals/:id/escalate", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }

    const [existing] = await db.select({ status: platformSignalsTable.status, severity: platformSignalsTable.severity }).from(platformSignalsTable).where(and(eq(platformSignalsTable.id, id), eq(platformSignalsTable.orgId, orgId)));
    if (!existing) { sendNotFound(res, "Signal"); return; }

    const [signal] = await db.update(platformSignalsTable).set({
      status: "processing" as any,
      severity: "critical",
      metadata: { escalatedAt: new Date().toISOString(), escalatedBy: req.user.displayName ?? "system" },
    }).where(and(eq(platformSignalsTable.id, id), eq(platformSignalsTable.orgId, orgId))).returning();

    if (!signal) { sendNotFound(res, "Signal"); return; }
    await trackSignalStateChange(orgId, id, existing.status, "escalated", req.user.id ?? null, req.user.displayName ?? "system", { prevSeverity: existing.severity });
    await triggerAlloyWorkflow(orgId, LYTE_PRODUCT, "signal", id, { action: "escalate", signalId: id, severity: "critical" });
    sendSuccess(res, signal);
  } catch (err) {
    handleRouteError(res, err, "Failed to escalate signal");
  }
});

router.post("/lyte/platform/signals/:id/resolve", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }

    const [existing] = await db.select({ status: platformSignalsTable.status }).from(platformSignalsTable).where(and(eq(platformSignalsTable.id, id), eq(platformSignalsTable.orgId, orgId)));
    if (!existing) { sendNotFound(res, "Signal"); return; }

    const resolution = typeof req.body?.resolution === "string" ? req.body.resolution : null;

    const [signal] = await db.update(platformSignalsTable).set({
      status: "processed" as any,
      processedAt: new Date(),
      metadata: { resolution, resolvedBy: req.user.displayName ?? "system" },
    }).where(and(eq(platformSignalsTable.id, id), eq(platformSignalsTable.orgId, orgId))).returning();

    if (!signal) { sendNotFound(res, "Signal"); return; }
    await trackSignalStateChange(orgId, id, existing.status, "resolved", req.user.id ?? null, req.user.displayName ?? "system", { resolution });
    sendSuccess(res, signal);
  } catch (err) {
    handleRouteError(res, err, "Failed to resolve signal");
  }
});

router.post("/lyte/platform/signals/:id/override", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }

    const { severity, status, reason } = req.body as { severity?: string; status?: string; reason?: string };

    const [existing] = await db.select({ status: platformSignalsTable.status, severity: platformSignalsTable.severity }).from(platformSignalsTable).where(and(eq(platformSignalsTable.id, id), eq(platformSignalsTable.orgId, orgId)));
    if (!existing) { sendNotFound(res, "Signal"); return; }

    const newStatus = status ?? "ignored";
    const [signal] = await db.update(platformSignalsTable).set({
      status: newStatus as typeof platformSignalsTable.status._.data,
      severity: severity ? (severity as typeof platformSignalsTable.severity._.data) : existing.severity,
      metadata: { overrideReason: reason ?? null, overriddenBy: req.user.displayName ?? "system", overriddenAt: new Date().toISOString() },
    }).where(and(eq(platformSignalsTable.id, id), eq(platformSignalsTable.orgId, orgId))).returning();

    if (!signal) { sendNotFound(res, "Signal"); return; }
    await trackSignalStateChange(orgId, id, existing.status, newStatus, req.user.id ?? null, req.user.displayName ?? "system", { severity, reason });
    sendSuccess(res, signal);
  } catch (err) {
    handleRouteError(res, err, "Failed to override signal");
  }
});

router.get("/lyte/platform/actions/queue", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const actions = await db.select().from(actionsTable).where(and(eq(actionsTable.orgId, orgId), eq(actionsTable.product, LYTE_PRODUCT))).orderBy(desc(actionsTable.createdAt)).limit(200);
    sendSuccess(res, buildActionQueue(actions));
  } catch (err) { handleRouteError(res, err, "Failed to build action queue"); }
});

router.get("/lyte/platform/actions", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const status = req.query.status as string | undefined;
    const priority = req.query.priority as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);

    const actions = await db.select().from(actionsTable).where(
      and(
        eq(actionsTable.orgId, orgId),
        eq(actionsTable.product, LYTE_PRODUCT),
        status ? eq(actionsTable.status, status as typeof actionsTable.status._.data) : undefined,
        priority ? eq(actionsTable.priority, priority as typeof actionsTable.priority._.data) : undefined,
      )
    ).orderBy(desc(actionsTable.createdAt)).limit(limit);

    sendSuccess(res, actions);
  } catch (err) {
    handleRouteError(res, err, "Failed to list actions");
  }
});

router.get("/lyte/platform/actions/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const [action] = await db.select().from(actionsTable).where(and(eq(actionsTable.id, id), eq(actionsTable.orgId, orgId)));
    if (!action) { sendNotFound(res, "Action"); return; }
    sendSuccess(res, action);
  } catch (err) { handleRouteError(res, err, "Failed to get action"); }
});

router.post("/lyte/platform/actions", authMiddleware(), async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const orgId = typeof body.orgId === "number" ? body.orgId : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }

    const actionType = (typeof body.actionType === "string" ? body.actionType : "manual") as any;
    const priority = (typeof body.priority === "string" ? body.priority : "medium") as "low" | "medium" | "high" | "critical";

    const [action] = await db.insert(actionsTable).values({
      orgId,
      product: LYTE_PRODUCT,
      title: body.title as string,
      description: typeof body.description === "string" ? body.description : null,
      actionType,
      status: "pending",
      priority,
      signalId: typeof body.signalId === "number" ? body.signalId : null,
      assignedTo: typeof body.assignedTo === "number" ? body.assignedTo : null,
      ownerId: req.user.id ?? null,
      dueAt: body.dueAt ? new Date(body.dueAt as string) : null,
      metadata: (body.metadata && typeof body.metadata === "object") ? body.metadata as Record<string, unknown> : null,
    } as any).returning();

    logLyteEvent(orgId, req.user.id ?? null, req.user.displayName ?? "system", "action.created", "action", String(action.id));
    sendCreated(res, action);
  } catch (err) {
    handleRouteError(res, err, "Failed to create action");
  }
});

async function updateActionStatus(req: import("express").Request, res: import("express").Response) {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : (typeof req.body?.orgId === "number" ? req.body.orgId : 1);
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }

    const { status, notes } = req.body as { status: string; notes?: string };
    const actionStatus = status as "pending" | "in_progress" | "completed" | "deferred" | "cancelled" | "blocked";

    const updates: Record<string, unknown> = { status: actionStatus, updatedAt: new Date() };
    if (status === "completed") updates.completedAt = new Date();
    if (notes) updates.metadata = { notes, updatedBy: req.user.displayName ?? "system" };

    const [action] = await db.update(actionsTable).set(updates as Partial<typeof actionsTable.$inferInsert>).where(
      and(eq(actionsTable.id, id), eq(actionsTable.orgId, orgId))
    ).returning();

    if (!action) { sendNotFound(res, "Action"); return; }
    logLyteEvent(orgId, req.user.id ?? null, req.user.displayName ?? "system", `action.${status}`, "action", String(id));
    sendSuccess(res, action);
  } catch (err) {
    handleRouteError(res, err, "Failed to update action status");
  }
}

router.patch("/lyte/platform/actions/:id/status", authMiddleware(), updateActionStatus);
router.post("/lyte/platform/actions/:id/update-status", authMiddleware(), updateActionStatus);

router.get("/lyte/platform/readiness", authMiddleware({ required: false }), async (req, res) => {
  try {
    const enabled = await isFlagEnabled("lyte_readiness_enabled");
    if (!enabled) {
      res.status(403).json({ error: "Feature not available", feature: "lyte_readiness_enabled", fallback: { items: [], byCategory: {}, overallScore: 0 } });
      return;
    }

    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    if (req.user && !canAccessOrgRecord(req.user, orgId)) {
      sendBadRequest(res, "Unauthorized access to org record");
      return;
    }

    const category = req.query.category as string | undefined;

    const items = await db.select().from(readinessItemsTable).where(
      and(
        eq(readinessItemsTable.orgId, orgId),
        eq(readinessItemsTable.product, LYTE_PRODUCT),
        category ? eq(readinessItemsTable.category, category as typeof readinessItemsTable.category._.data) : undefined,
      )
    ).orderBy(readinessItemsTable.priority, desc(readinessItemsTable.createdAt));

    const byCategory: Record<string, any[]> = {};
    for (const item of items) {
      if (!byCategory[item.category]) byCategory[item.category] = [];
      byCategory[item.category].push(item);
    }

    const scoreDetail = calculateReadinessScore(items);

    sendSuccess(res, { items, byCategory, overallScore: scoreDetail.score, totalItems: items.length, scoreDetail });
  } catch (err) {
    handleRouteError(res, err, "Failed to get readiness items");
  }
});

router.get("/lyte/platform/readiness/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const [item] = await db.select().from(readinessItemsTable).where(and(eq(readinessItemsTable.id, id), eq(readinessItemsTable.orgId, orgId)));
    if (!item) { sendNotFound(res, "Readiness item"); return; }
    sendSuccess(res, item);
  } catch (err) { handleRouteError(res, err, "Failed to get readiness item"); }
});

router.post("/lyte/platform/readiness", authMiddleware(), async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const orgId = typeof body.orgId === "number" ? body.orgId : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }

    const category = (typeof body.category === "string" ? body.category : "operational") as typeof readinessItemsTable.category._.data;
    const priority = (typeof body.priority === "string" ? body.priority : "medium") as typeof readinessItemsTable.priority._.data;
    const score = body.score ? String(body.score) : null;

    const [item] = await db.insert(readinessItemsTable).values({
      orgId,
      product: LYTE_PRODUCT,
      category,
      title: body.title as string,
      description: typeof body.description === "string" ? body.description : null,
      status: "not_started",
      priority,
      score,
      targetScore: body.targetScore ? String(body.targetScore) : "100",
      ownerId: req.user.id ?? null,
      dueAt: body.dueAt ? new Date(body.dueAt as string) : null,
      notes: typeof body.notes === "string" ? body.notes : null,
      metadata: (body.metadata && typeof body.metadata === "object") ? body.metadata as Record<string, unknown> : null,
    }).returning();

    sendCreated(res, item);
  } catch (err) {
    handleRouteError(res, err, "Failed to create readiness item");
  }
});

router.patch("/lyte/platform/readiness/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }

    const { orgId: _drop, ...safeBody } = req.body as Record<string, unknown>;
    const updates = { ...safeBody, updatedAt: new Date() };
    if ((updates as Record<string, unknown>).status === "completed" && !(updates as Record<string, unknown>).completedAt) {
      (updates as Record<string, unknown>).completedAt = new Date();
    }

    const [item] = await db.update(readinessItemsTable).set(updates as Partial<typeof readinessItemsTable.$inferInsert>).where(
      and(eq(readinessItemsTable.id, id), eq(readinessItemsTable.orgId, orgId))
    ).returning();

    if (!item) { sendNotFound(res, "Readiness item"); return; }
    sendSuccess(res, item);
  } catch (err) {
    handleRouteError(res, err, "Failed to update readiness item");
  }
});

router.delete("/lyte/platform/readiness/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }

    const [item] = await db.delete(readinessItemsTable).where(
      and(eq(readinessItemsTable.id, id), eq(readinessItemsTable.orgId, orgId))
    ).returning();
    if (!item) { sendNotFound(res, "Readiness item"); return; }
    sendSuccess(res, { deleted: true, id });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete readiness item");
  }
});

router.get("/lyte/platform/views", authMiddleware({ required: false }), async (req, res) => {
  try {
    const roleViewsEnabled = await isFlagEnabled("lyte_role_views_enabled");
    if (!roleViewsEnabled) {
      res.status(403).json({ error: "Feature not available", feature: "lyte_role_views_enabled", fallback: { views: [] } });
      return;
    }
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const userId = req.user?.id;

    const views = await db.select().from(savedViewsTable).where(
      and(
        eq(savedViewsTable.orgId, orgId),
        eq(savedViewsTable.product, LYTE_PRODUCT),
        or(
          eq(savedViewsTable.isShared, true),
          userId ? eq(savedViewsTable.userId, userId) : undefined,
        )
      )
    ).orderBy(desc(savedViewsTable.createdAt));

    sendSuccess(res, views);
  } catch (err) {
    handleRouteError(res, err, "Failed to list saved views");
  }
});

router.post("/lyte/platform/views", authMiddleware(), async (req, res) => {
  try {
    const roleViewsEnabled = await isFlagEnabled("lyte_role_views_enabled");
    if (!roleViewsEnabled) {
      res.status(403).json({ error: "Feature not available", feature: "lyte_role_views_enabled" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const orgId = typeof body.orgId === "number" ? body.orgId : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }

    const [view] = await db.insert(savedViewsTable).values({
      orgId,
      product: LYTE_PRODUCT,
      userId: req.user.id ?? null,
      name: body.name as string,
      description: typeof body.description === "string" ? body.description : null,
      filters: (body.filters && typeof body.filters === "object") ? body.filters as Record<string, unknown> : null,
      columns: (body.columns && typeof body.columns === "object") ? body.columns as Record<string, unknown> : null,
      sortBy: typeof body.sortBy === "string" ? body.sortBy : null,
      isDefault: Boolean(body.isDefault),
      isShared: Boolean(body.isShared),
    }).returning();

    sendCreated(res, view);
  } catch (err) {
    handleRouteError(res, err, "Failed to create saved view");
  }
});

router.delete("/lyte/platform/views/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }

    const [view] = await db.delete(savedViewsTable).where(
      and(eq(savedViewsTable.id, id), eq(savedViewsTable.orgId, orgId))
    ).returning();
    if (!view) { sendNotFound(res, "Saved view"); return; }
    sendSuccess(res, { deleted: true, id });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete saved view");
  }
});

router.get("/lyte/platform/signals/:id/comments", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const comments = await db.select().from(commentsTable).where(
      and(
        eq(commentsTable.entityType, "lyte_signal"),
        eq(commentsTable.entityId, String(id)),
        eq(commentsTable.isDeleted, false),
      )
    ).orderBy(commentsTable.createdAt);
    sendSuccess(res, comments);
  } catch (err) {
    handleRouteError(res, err, "Failed to get comments");
  }
});

router.post("/lyte/platform/signals/:id/comments", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const { content, orgId: rawOrgId } = req.body as { content: string; orgId?: number };
    const orgId = typeof rawOrgId === "number" ? rawOrgId : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }
    if (!content?.trim()) { sendBadRequest(res, "content required"); return; }

    const [signal] = await db.select({ id: platformSignalsTable.id }).from(platformSignalsTable).where(
      and(eq(platformSignalsTable.id, id), eq(platformSignalsTable.orgId, orgId))
    );
    if (!signal) { sendNotFound(res, "Signal"); return; }

    const [comment] = await db.insert(commentsTable).values({
      entityType: "lyte_signal",
      entityId: String(id),
      authorId: req.user.id ?? null,
      authorName: req.user.displayName ?? "Anonymous",
      authorInitials: (req.user.displayName ?? "??").slice(0, 2).toUpperCase(),
      content: content.trim(),
    }).returning();

    sendCreated(res, comment);
  } catch (err) {
    handleRouteError(res, err, "Failed to create comment");
  }
});

router.get("/lyte/platform/actions/:id/comments", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const comments = await db.select().from(commentsTable).where(
      and(
        eq(commentsTable.entityType, "lyte_action"),
        eq(commentsTable.entityId, String(id)),
        eq(commentsTable.isDeleted, false),
      )
    ).orderBy(commentsTable.createdAt);
    sendSuccess(res, comments);
  } catch (err) {
    handleRouteError(res, err, "Failed to get action comments");
  }
});

router.post("/lyte/platform/actions/:id/comments", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const { content, orgId: rawOrgId } = req.body as { content: string; orgId?: number };
    const orgId = typeof rawOrgId === "number" ? rawOrgId : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }
    if (!content?.trim()) { sendBadRequest(res, "content required"); return; }

    const [action] = await db.select({ id: actionsTable.id }).from(actionsTable).where(
      and(eq(actionsTable.id, id), eq(actionsTable.orgId, orgId))
    );
    if (!action) { sendNotFound(res, "Action"); return; }

    const [comment] = await db.insert(commentsTable).values({
      entityType: "lyte_action",
      entityId: String(id),
      authorId: req.user.id ?? null,
      authorName: req.user.displayName ?? "Anonymous",
      authorInitials: (req.user.displayName ?? "??").slice(0, 2).toUpperCase(),
      content: content.trim(),
    }).returning();

    sendCreated(res, comment);
  } catch (err) {
    handleRouteError(res, err, "Failed to create action comment");
  }
});

export default router;
