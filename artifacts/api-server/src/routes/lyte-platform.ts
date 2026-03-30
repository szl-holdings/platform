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
} from "@workspace/db";
import { eq, and, desc, sql, or, gte, lte } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

const LYTE_PRODUCT = "lyte";

function logLyteEvent(orgId: number, actorId: number | null, actorName: string, eventType: string, entityType: string, entityId: string | null, before?: unknown, after?: unknown) {
  db.insert(eventLogTable).values({
    orgId,
    product: LYTE_PRODUCT,
    actorId: actorId ?? undefined,
    actorName,
    eventType,
    entityType,
    entityId,
    before: before as any ?? null,
    after: after as any ?? null,
  }).catch(() => {});
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
    const role = (req.user?.roles?.[0] as string) || null;

    const [signals, actions, readinessItems] = await Promise.all([
      db.select().from(platformSignalsTable).where(
        and(eq(platformSignalsTable.orgId, orgId), eq(platformSignalsTable.product, LYTE_PRODUCT))
      ).orderBy(desc(platformSignalsTable.detectedAt)).limit(50),
      db.select().from(actionsTable).where(
        and(eq(actionsTable.orgId, orgId), eq(actionsTable.product, LYTE_PRODUCT))
      ).orderBy(desc(actionsTable.createdAt)).limit(50),
      db.select().from(readinessItemsTable).where(
        and(eq(readinessItemsTable.orgId, orgId), eq(readinessItemsTable.product, LYTE_PRODUCT))
      ).orderBy(desc(readinessItemsTable.createdAt)).limit(20),
    ]);

    sendSuccess(res, buildLyteDashboard(role, signals, actions, readinessItems));
  } catch (err) {
    handleRouteError(res, err, "Failed to build lyte dashboard");
  }
});

router.get("/lyte/platform/signals", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const status = req.query.status as string | undefined;
    const severity = req.query.severity as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);
    const offset = parseInt(req.query.offset as string || "0", 10);

    const signals = await db.select().from(platformSignalsTable).where(
      and(
        eq(platformSignalsTable.orgId, orgId),
        eq(platformSignalsTable.product, LYTE_PRODUCT),
        status ? eq(platformSignalsTable.status, status as any) : undefined,
        severity ? eq(platformSignalsTable.severity, severity as any) : undefined,
      )
    ).orderBy(desc(platformSignalsTable.detectedAt)).limit(limit).offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(platformSignalsTable).where(
      and(eq(platformSignalsTable.orgId, orgId), eq(platformSignalsTable.product, LYTE_PRODUCT))
    );

    sendSuccess(res, signals, 200, { total: count, limit, offset });
  } catch (err) {
    handleRouteError(res, err, "Failed to list lyte signals");
  }
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

router.post("/lyte/platform/signals/:id/acknowledge", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;

    const [signal] = await db.update(platformSignalsTable).set({
      status: "acknowledged",
      acknowledgedAt: new Date(),
      updatedAt: new Date(),
    }).where(and(eq(platformSignalsTable.id, id), eq(platformSignalsTable.orgId, orgId))).returning();

    if (!signal) { sendNotFound(res, "Signal"); return; }
    logLyteEvent(orgId, req.user?.id ?? null, req.user?.displayName ?? "system", "signal.acknowledged", "signal", String(id));
    sendSuccess(res, signal);
  } catch (err) {
    handleRouteError(res, err, "Failed to acknowledge signal");
  }
});

router.post("/lyte/platform/signals/:id/assign", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const { assignedTo } = req.body as { assignedTo: number };
    if (!assignedTo) { sendBadRequest(res, "assignedTo required"); return; }

    const [signal] = await db.update(platformSignalsTable).set({
      status: "assigned",
      assignedTo,
      updatedAt: new Date(),
    }).where(and(eq(platformSignalsTable.id, id), eq(platformSignalsTable.orgId, orgId))).returning();

    if (!signal) { sendNotFound(res, "Signal"); return; }
    logLyteEvent(orgId, req.user?.id ?? null, req.user?.displayName ?? "system", "signal.assigned", "signal", String(id), null, { assignedTo });
    sendSuccess(res, signal);
  } catch (err) {
    handleRouteError(res, err, "Failed to assign signal");
  }
});

router.post("/lyte/platform/signals/:id/escalate", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;

    const [signal] = await db.update(platformSignalsTable).set({
      status: "escalated",
      severity: "critical",
      updatedAt: new Date(),
      metadata: { ...(req.body.metadata || {}), escalatedAt: new Date().toISOString(), escalatedBy: req.user?.displayName ?? "system" } as any,
    }).where(and(eq(platformSignalsTable.id, id), eq(platformSignalsTable.orgId, orgId))).returning();

    if (!signal) { sendNotFound(res, "Signal"); return; }
    logLyteEvent(orgId, req.user?.id ?? null, req.user?.displayName ?? "system", "signal.escalated", "signal", String(id));
    sendSuccess(res, signal);
  } catch (err) {
    handleRouteError(res, err, "Failed to escalate signal");
  }
});

router.post("/lyte/platform/signals/:id/resolve", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;

    const [signal] = await db.update(platformSignalsTable).set({
      status: "resolved",
      resolvedAt: new Date(),
      updatedAt: new Date(),
      metadata: { ...(req.body.metadata || {}), resolution: req.body.resolution, resolvedBy: req.user?.displayName ?? "system" } as any,
    }).where(and(eq(platformSignalsTable.id, id), eq(platformSignalsTable.orgId, orgId))).returning();

    if (!signal) { sendNotFound(res, "Signal"); return; }
    logLyteEvent(orgId, req.user?.id ?? null, req.user?.displayName ?? "system", "signal.resolved", "signal", String(id));
    sendSuccess(res, signal);
  } catch (err) {
    handleRouteError(res, err, "Failed to resolve signal");
  }
});

router.post("/lyte/platform/signals/:id/override", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const { severity, status, reason } = req.body as { severity?: string; status?: string; reason?: string };

    const updates: Record<string, unknown> = { updatedAt: new Date(), status: "overridden" };
    if (severity) updates.severity = severity;
    if (status) updates.status = status;
    updates.metadata = { overrideReason: reason, overriddenBy: req.user?.displayName ?? "system", overriddenAt: new Date().toISOString() } as any;

    const [signal] = await db.update(platformSignalsTable).set(updates as any).where(
      and(eq(platformSignalsTable.id, id), eq(platformSignalsTable.orgId, orgId))
    ).returning();

    if (!signal) { sendNotFound(res, "Signal"); return; }
    logLyteEvent(orgId, req.user?.id ?? null, req.user?.displayName ?? "system", "signal.overridden", "signal", String(id), null, { severity, status, reason });
    sendSuccess(res, signal);
  } catch (err) {
    handleRouteError(res, err, "Failed to override signal");
  }
});

router.get("/lyte/platform/actions", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const status = req.query.status as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);

    const actions = await db.select().from(actionsTable).where(
      and(
        eq(actionsTable.orgId, orgId),
        eq(actionsTable.product, LYTE_PRODUCT),
        status ? eq(actionsTable.status, status as any) : undefined,
      )
    ).orderBy(desc(actionsTable.createdAt)).limit(limit);

    sendSuccess(res, actions);
  } catch (err) {
    handleRouteError(res, err, "Failed to list actions");
  }
});

router.post("/lyte/platform/actions", authMiddleware({ required: false }), async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const orgId = typeof body.orgId === "number" ? body.orgId : 1;

    const [action] = await db.insert(actionsTable).values({
      orgId,
      product: LYTE_PRODUCT,
      title: body.title as string,
      description: body.description as string || null,
      actionType: (body.actionType as any) || "manual",
      status: "pending",
      priority: (body.priority as any) || "medium",
      signalId: typeof body.signalId === "number" ? body.signalId : null,
      assignedTo: typeof body.assignedTo === "number" ? body.assignedTo : null,
      ownerId: req.user?.id ?? null,
      dueAt: body.dueAt ? new Date(body.dueAt as string) : null,
      metadata: (body.metadata as any) || null,
    }).returning();

    logLyteEvent(orgId, req.user?.id ?? null, req.user?.displayName ?? "system", "action.created", "action", String(action.id));
    sendCreated(res, action);
  } catch (err) {
    handleRouteError(res, err, "Failed to create action");
  }
});

router.patch("/lyte/platform/actions/:id/status", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const { status, notes } = req.body as { status: string; notes?: string };

    const updates: Record<string, unknown> = { status, updatedAt: new Date() };
    if (status === "completed") updates.completedAt = new Date();
    if (notes) updates.metadata = { notes, updatedBy: req.user?.displayName ?? "system" } as any;

    const [action] = await db.update(actionsTable).set(updates as any).where(
      and(eq(actionsTable.id, id), eq(actionsTable.orgId, orgId))
    ).returning();

    if (!action) { sendNotFound(res, "Action"); return; }
    logLyteEvent(orgId, req.user?.id ?? null, req.user?.displayName ?? "system", `action.${status}`, "action", String(id));
    sendSuccess(res, action);
  } catch (err) {
    handleRouteError(res, err, "Failed to update action status");
  }
});

router.get("/lyte/platform/readiness", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const category = req.query.category as string | undefined;

    const items = await db.select().from(readinessItemsTable).where(
      and(
        eq(readinessItemsTable.orgId, orgId),
        eq(readinessItemsTable.product, LYTE_PRODUCT),
        category ? eq(readinessItemsTable.category, category as any) : undefined,
      )
    ).orderBy(readinessItemsTable.priority, desc(readinessItemsTable.createdAt));

    const byCategory: Record<string, any[]> = {};
    for (const item of items) {
      if (!byCategory[item.category]) byCategory[item.category] = [];
      byCategory[item.category].push(item);
    }

    const overallScore = items.length > 0
      ? Math.round(items.filter(i => i.status === "completed").length / items.length * 100)
      : 0;

    sendSuccess(res, { items, byCategory, overallScore, totalItems: items.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to get readiness items");
  }
});

router.post("/lyte/platform/readiness", authMiddleware({ required: false }), async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const orgId = typeof body.orgId === "number" ? body.orgId : 1;

    const [item] = await db.insert(readinessItemsTable).values({
      orgId,
      product: LYTE_PRODUCT,
      category: (body.category as any) || "operational",
      title: body.title as string,
      description: body.description as string || null,
      status: "not_started",
      priority: (body.priority as any) || "medium",
      score: (body.score as any) || null,
      targetScore: (body.targetScore as any) || "100",
      ownerId: req.user?.id ?? null,
      dueAt: body.dueAt ? new Date(body.dueAt as string) : null,
      notes: body.notes as string || null,
      metadata: (body.metadata as any) || null,
    }).returning();

    sendCreated(res, item);
  } catch (err) {
    handleRouteError(res, err, "Failed to create readiness item");
  }
});

router.patch("/lyte/platform/readiness/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;

    const updates = { ...req.body, updatedAt: new Date() };
    if (updates.status === "completed" && !updates.completedAt) updates.completedAt = new Date();

    const [item] = await db.update(readinessItemsTable).set(updates).where(
      and(eq(readinessItemsTable.id, id), eq(readinessItemsTable.orgId, orgId))
    ).returning();

    if (!item) { sendNotFound(res, "Readiness item"); return; }
    sendSuccess(res, item);
  } catch (err) {
    handleRouteError(res, err, "Failed to update readiness item");
  }
});

router.delete("/lyte/platform/readiness/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
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

router.post("/lyte/platform/views", authMiddleware({ required: false }), async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const orgId = typeof body.orgId === "number" ? body.orgId : 1;

    const [view] = await db.insert(savedViewsTable).values({
      orgId,
      product: LYTE_PRODUCT,
      userId: req.user?.id ?? null,
      name: body.name as string,
      description: body.description as string || null,
      filters: (body.filters as any) || null,
      columns: (body.columns as any) || null,
      sortBy: body.sortBy as string || null,
      isDefault: Boolean(body.isDefault),
      isShared: Boolean(body.isShared),
    }).returning();

    sendCreated(res, view);
  } catch (err) {
    handleRouteError(res, err, "Failed to create saved view");
  }
});

router.delete("/lyte/platform/views/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
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

router.post("/lyte/platform/signals/:id/comments", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const { content } = req.body as { content: string };
    if (!content?.trim()) { sendBadRequest(res, "content required"); return; }

    const [comment] = await db.insert(commentsTable).values({
      entityType: "lyte_signal",
      entityId: String(id),
      authorId: req.user?.id ?? null,
      authorName: req.user?.displayName ?? "Anonymous",
      authorInitials: (req.user?.displayName ?? "??").slice(0, 2).toUpperCase(),
      content: content.trim(),
    }).returning();

    sendCreated(res, comment);
  } catch (err) {
    handleRouteError(res, err, "Failed to create comment");
  }
});

export default router;
