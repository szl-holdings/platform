import { Router, type IRouter } from "express";
import {
  db,
  lyteActionsTable,
  lyteSavedViewsTable,
  lyteSignalCommentsTable,
  lyteReadinessItemsTable,
  lyteSignalTimelineTable,
  lyteSignalsTable,
  lyteWorkspacesTable,
  lyteIncidentsTable,
  lyteCommandCardsTable,
  lyteRecommendationsTable,
  insertLyteActionSchema,
  insertLyteSavedViewSchema,
  insertLyteSignalCommentSchema,
  insertLyteReadinessItemSchema,
} from "@workspace/db";
import { eq, desc, and, sql, ne } from "drizzle-orm";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  sendNoContent,
  handleRouteError,
  parsePagination,
} from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";
import { requireFeatureFlag } from "../middlewares/feature-flag";

const router: IRouter = Router();

async function recordSignalTimeline(params: {
  signalId: number;
  eventType: "created" | "acknowledged" | "assigned" | "escalated" | "resolved" | "dismissed" | "commented" | "status_changed";
  fromState?: string;
  toState?: string;
  actorName?: string;
  actorId?: number;
  notes?: string;
}) {
  try {
    await db.insert(lyteSignalTimelineTable).values({
      signalId: params.signalId,
      eventType: params.eventType,
      fromState: params.fromState ?? null,
      toState: params.toState ?? null,
      actorName: params.actorName ?? "system",
      actorId: params.actorId ?? null,
      notes: params.notes ?? null,
    });
  } catch {}
}

router.post("/signals/:id/acknowledge", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [signal] = await db.select().from(lyteSignalsTable).where(eq(lyteSignalsTable.id, id));
    if (!signal) { sendNotFound(res, "Signal"); return; }
    if (signal.status !== "new") { sendBadRequest(res, "Only new signals can be acknowledged"); return; }
    const [row] = await db.update(lyteSignalsTable).set({ status: "acknowledged" }).where(eq(lyteSignalsTable.id, id)).returning();
    await recordSignalTimeline({ signalId: id, eventType: "acknowledged", fromState: "new", toState: "acknowledged", actorName: req.user?.displayName, actorId: req.user?.id });
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to acknowledge signal");
  }
});

router.post("/signals/:id/assign", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const { assignee } = req.body;
    if (!assignee) { sendBadRequest(res, "assignee is required"); return; }
    const [signal] = await db.select().from(lyteSignalsTable).where(eq(lyteSignalsTable.id, id));
    if (!signal) { sendNotFound(res, "Signal"); return; }
    const [row] = await db.update(lyteSignalsTable).set({
      status: signal.status === "new" ? "acknowledged" : signal.status,
      metadata: { ...(signal.metadata as Record<string, unknown> ?? {}), assignee, assignedAt: new Date().toISOString() },
    }).where(eq(lyteSignalsTable.id, id)).returning();
    await recordSignalTimeline({ signalId: id, eventType: "assigned", fromState: signal.status, toState: row.status, actorName: req.user?.displayName, actorId: req.user?.id, notes: `Assigned to ${assignee}` });
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to assign signal");
  }
});

router.post("/signals/:id/escalate", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [signal] = await db.select().from(lyteSignalsTable).where(eq(lyteSignalsTable.id, id));
    if (!signal) { sendNotFound(res, "Signal"); return; }
    const severityMap: Record<string, string> = { info: "low", low: "medium", medium: "high", high: "critical" };
    const newSeverity = severityMap[signal.severity] ?? signal.severity;
    const [row] = await db.update(lyteSignalsTable).set({ severity: newSeverity as typeof signal.severity }).where(eq(lyteSignalsTable.id, id)).returning();
    await recordSignalTimeline({ signalId: id, eventType: "escalated", actorName: req.user?.displayName, actorId: req.user?.id, notes: `Escalated to ${newSeverity}` });
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to escalate signal");
  }
});

router.post("/signals/:id/resolve", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [signal] = await db.select().from(lyteSignalsTable).where(eq(lyteSignalsTable.id, id));
    if (!signal) { sendNotFound(res, "Signal"); return; }
    if (signal.status === "resolved") { sendBadRequest(res, "Signal is already resolved"); return; }
    const [row] = await db.update(lyteSignalsTable).set({ status: "resolved" }).where(eq(lyteSignalsTable.id, id)).returning();
    await recordSignalTimeline({ signalId: id, eventType: "resolved", fromState: signal.status, toState: "resolved", actorName: req.user?.displayName, actorId: req.user?.id, notes: req.body.resolution });
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to resolve signal");
  }
});

router.post("/signals/:id/override", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [signal] = await db.select().from(lyteSignalsTable).where(eq(lyteSignalsTable.id, id));
    if (!signal) { sendNotFound(res, "Signal"); return; }
    const patch: Record<string, unknown> = {};
    if (req.body.severity) patch.severity = req.body.severity;
    if (req.body.status) patch.status = req.body.status;
    if (req.body.title) patch.title = req.body.title;
    const [row] = await db.update(lyteSignalsTable).set(patch).where(eq(lyteSignalsTable.id, id)).returning();
    await recordSignalTimeline({ signalId: id, eventType: "status_changed", fromState: signal.status, toState: row.status, actorName: req.user?.displayName, actorId: req.user?.id, notes: `Manual override: ${JSON.stringify(req.body)}` });
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to override signal");
  }
});

router.get("/signals/:id/timeline", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(lyteSignalTimelineTable).where(eq(lyteSignalTimelineTable.signalId, id)).orderBy(desc(lyteSignalTimelineTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to get signal timeline");
  }
});

router.get("/signals/:id/comments", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(lyteSignalCommentsTable).where(eq(lyteSignalCommentsTable.signalId, id)).orderBy(desc(lyteSignalCommentsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to get signal comments");
  }
});

router.post("/signals/:id/comments", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [signal] = await db.select().from(lyteSignalsTable).where(eq(lyteSignalsTable.id, id));
    if (!signal) { sendNotFound(res, "Signal"); return; }
    if (!req.body.body) { sendBadRequest(res, "body is required"); return; }
    const [row] = await db.insert(lyteSignalCommentsTable).values({
      signalId: id,
      authorId: req.user?.id ?? null,
      authorName: req.user?.displayName ?? req.body.authorName ?? "Anonymous",
      body: req.body.body,
      commentType: req.body.commentType ?? "comment",
    }).returning();
    await recordSignalTimeline({ signalId: id, eventType: "commented", actorName: req.user?.displayName, actorId: req.user?.id, notes: req.body.body.slice(0, 100) });
    sendCreated(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to create signal comment");
  }
});

router.get("/actions", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(lyteActionsTable).orderBy(desc(lyteActionsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(lyteActionsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list actions");
  }
});

router.post("/actions", authMiddleware(), async (req, res) => {
  try {
    const data = insertLyteActionSchema.parse(req.body);
    const [row] = await db.insert(lyteActionsTable).values(data).returning();
    sendCreated(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to create action");
  }
});

router.patch("/actions/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(lyteActionsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(lyteActionsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Action"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update action");
  }
});

router.delete("/actions/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(lyteActionsTable).where(eq(lyteActionsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Action"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete action");
  }
});

router.get("/saved-views", authMiddleware(), async (req, res) => {
  try {
    const rows = await db.select().from(lyteSavedViewsTable).orderBy(desc(lyteSavedViewsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list saved views");
  }
});

router.post("/saved-views", authMiddleware(), async (req, res) => {
  try {
    const data = insertLyteSavedViewSchema.parse(req.body);
    const [row] = await db.insert(lyteSavedViewsTable).values({ ...data, userId: req.user?.id ? String(req.user.id) : null }).returning();
    sendCreated(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to create saved view");
  }
});

router.patch("/saved-views/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(lyteSavedViewsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(lyteSavedViewsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Saved view"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update saved view");
  }
});

router.delete("/saved-views/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(lyteSavedViewsTable).where(eq(lyteSavedViewsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Saved view"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete saved view");
  }
});

router.get("/readiness", requireFeatureFlag("lyte_readiness_enabled"), authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(lyteReadinessItemsTable).orderBy(desc(lyteReadinessItemsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(lyteReadinessItemsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list readiness items");
  }
});

router.post("/readiness", requireFeatureFlag("lyte_readiness_enabled"), authMiddleware(), async (req, res) => {
  try {
    const data = insertLyteReadinessItemSchema.parse(req.body);
    const [row] = await db.insert(lyteReadinessItemsTable).values(data).returning();
    sendCreated(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to create readiness item");
  }
});

router.patch("/readiness/:id", requireFeatureFlag("lyte_readiness_enabled"), authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const patch = { ...req.body, updatedAt: new Date() };
    const [row] = await db.update(lyteReadinessItemsTable).set(patch).where(eq(lyteReadinessItemsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Readiness item"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update readiness item");
  }
});

router.get("/readiness/score", requireFeatureFlag("lyte_readiness_enabled"), authMiddleware(), async (_req, res) => {
  try {
    const items = await db.select().from(lyteReadinessItemsTable);
    if (items.length === 0) {
      sendSuccess(res, { score: 0, totalItems: 0, completeItems: 0, breakdown: {} });
      return;
    }
    const completeItems = items.filter(i => i.status === "complete");
    const score = Math.round((completeItems.length / items.length) * 100);
    const breakdown = items.reduce<Record<string, { total: number; complete: number }>>((acc, item) => {
      if (!acc[item.itemType]) acc[item.itemType] = { total: 0, complete: 0 };
      acc[item.itemType].total++;
      if (item.status === "complete") acc[item.itemType].complete++;
      return acc;
    }, {});
    sendSuccess(res, { score, totalItems: items.length, completeItems: completeItems.length, breakdown });
  } catch (err) {
    handleRouteError(res, err, "Failed to calculate readiness score");
  }
});

router.get("/dashboard", authMiddleware(), async (_req, res) => {
  try {
    const [
      signalCount,
      criticalSignals,
      openIncidents,
      openActions,
      pendingRecs,
      recentSignals,
      readinessScore,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(lyteSignalsTable).then(r => r[0]?.count ?? 0),
      db.select({ count: sql<number>`count(*)::int` }).from(lyteSignalsTable).where(and(eq(lyteSignalsTable.severity, "critical"), eq(lyteSignalsTable.status, "new"))).then(r => r[0]?.count ?? 0),
      db.select({ count: sql<number>`count(*)::int` }).from(lyteIncidentsTable).where(ne(lyteIncidentsTable.status, "closed")).then(r => r[0]?.count ?? 0),
      db.select({ count: sql<number>`count(*)::int` }).from(lyteActionsTable).where(ne(lyteActionsTable.state, "resolved")).then(r => r[0]?.count ?? 0),
      db.select({ count: sql<number>`count(*)::int` }).from(lyteRecommendationsTable).where(eq(lyteRecommendationsTable.status, "suggested")).then(r => r[0]?.count ?? 0),
      db.select().from(lyteSignalsTable).orderBy(desc(lyteSignalsTable.receivedAt)).limit(5),
      db.select().from(lyteReadinessItemsTable).then(items => {
        if (items.length === 0) return 0;
        return Math.round((items.filter(i => i.status === "complete").length / items.length) * 100);
      }),
    ]);
    sendSuccess(res, {
      summary: {
        totalSignals: signalCount,
        criticalUnresolved: criticalSignals,
        openIncidents,
        openActions,
        pendingRecommendations: pendingRecs,
        readinessScore,
      },
      recentSignals,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to build Lyte dashboard");
  }
});

router.get("/insights/narratives", authMiddleware({ required: false }), async (_req, res) => {
  try {
    let signals: { severity: string; source: string; status: string }[] = [];
    let incidents: { title?: string | null; status: string }[] = [];

    try {
      signals = await db.select().from(lyteSignalsTable).where(ne(lyteSignalsTable.status, "resolved")).orderBy(desc(lyteSignalsTable.receivedAt)).limit(20);
    } catch {
      signals = [];
    }

    try {
      incidents = await db.select().from(lyteIncidentsTable).where(ne(lyteIncidentsTable.status, "closed")).orderBy(desc(lyteIncidentsTable.createdAt)).limit(10);
    } catch {
      incidents = [];
    }

    const bySeverity = signals.reduce<Record<string, number>>((a, s) => {
      const sev = s.severity ?? "unknown";
      a[sev] = (a[sev] ?? 0) + 1;
      return a;
    }, {});
    const bySource = signals.reduce<Record<string, number>>((a, s) => {
      const src = s.source ?? "unknown";
      a[src] = (a[src] ?? 0) + 1;
      return a;
    }, {});
    const narratives: { type: string; priority: string; headline: string; detail: string }[] = [];
    const criticalCount = bySeverity.critical ?? 0;
    if (criticalCount > 0) {
      narratives.push({ type: "alert", priority: "critical", headline: `${criticalCount} critical signal${criticalCount > 1 ? "s" : ""} require immediate attention`, detail: "Critical signals are unacknowledged and may have downstream impact." });
    }
    if (incidents.length > 0) {
      const firstTitle = incidents[0]?.title ?? "Untitled";
      narratives.push({ type: "incident", priority: "high", headline: `${incidents.length} active incident${incidents.length > 1 ? "s" : ""} in progress`, detail: `Most recent: ${firstTitle}` });
    }
    const sourceEntries = Object.entries(bySource).filter(([k]) => k !== "unknown");
    const topSource = sourceEntries.sort((a, b) => b[1] - a[1])[0];
    if (topSource) {
      narratives.push({ type: "pattern", priority: "medium", headline: `${topSource[0]} is the leading signal source (${topSource[1]} signal${topSource[1] > 1 ? "s" : ""})`, detail: "Consider reviewing integration health or thresholds for this source." });
    }
    if (narratives.length === 0) {
      narratives.push({ type: "info", priority: "low", headline: "All systems nominal", detail: "No active signals or open incidents detected." });
    }
    sendSuccess(res, { narratives, signalSummary: bySeverity, sourceSummary: bySource });
  } catch (err) {
    handleRouteError(res, err, "Failed to build insight narratives");
  }
});

export default router;
