import { Router, type IRouter } from "express";
import {
  db,
  lyteSignalsTable,
  lytePrismScoresTable,
  lyteMetricsTable,
  lyteAlertsTable,
  lyteAlertEventsTable,
  lyteEscalationsTable,
} from "@workspace/db";
import { eq, desc, gte, lte, and, sql, inArray, asc } from "drizzle-orm";
import { sendSuccess, sendNotFound, sendError, sendBadRequest, handleRouteError, parsePagination } from "../lib/api-response";
import { authMiddleware, parseIdParam, denyIfReadOnly } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/lyte/prism/scores", authMiddleware(), async (req, res) => {
  try {
    const lens = req.query.lens as string | undefined;
    const lenses = ["financial_health", "operational_risk", "growth_velocity", "customer_sentiment", "compliance_drift", "talent_stability", "market_position"] as const;
    if (lens && !lenses.includes(lens as any)) { sendBadRequest(res, "Invalid lens"); return; }
    const rows = await db.select().from(lytePrismScoresTable)
      .where(lens ? eq(lytePrismScoresTable.lens, lens as any) : undefined)
      .orderBy(desc(lytePrismScoresTable.scoredAt))
      .limit(lens ? 30 : 7);
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to get PRISM scores"); }
});

router.get("/lyte/prism/summary", authMiddleware(), async (req, res) => {
  try {
    const lenses = ["financial_health", "operational_risk", "growth_velocity", "customer_sentiment", "compliance_drift", "talent_stability", "market_position"] as const;
    const rows = await Promise.all(lenses.map(async (lens) => {
      const [latest] = await db.select().from(lytePrismScoresTable)
        .where(eq(lytePrismScoresTable.lens, lens))
        .orderBy(desc(lytePrismScoresTable.scoredAt))
        .limit(1);
      return latest ?? null;
    }));
    const composite = rows.filter(Boolean);
    const avgScore = composite.length > 0 ? Math.round(composite.reduce((s, r) => s + (r!.score ?? 0), 0) / composite.length) : 0;
    sendSuccess(res, { lenses: rows, compositeScore: avgScore, lensCount: composite.length });
  } catch (err) { handleRouteError(res, err, "Failed to get PRISM summary"); }
});

router.post("/lyte/prism/scores", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const [row] = await db.insert(lytePrismScoresTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create PRISM score"); }
});

router.get("/lyte/metrics", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const service = req.query.service as string | undefined;
    const metricName = req.query.metricName as string | undefined;
    const window = req.query.window as string | undefined;
    const windowMap: Record<string, number> = { "1h": 1, "6h": 6, "24h": 24, "7d": 168, "30d": 720 };
    const windowHours = window && windowMap[window] ? windowMap[window] : 24;
    const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    const conditions = [gte(lyteMetricsTable.recordedAt, cutoff)];
    if (service) conditions.push(eq(lyteMetricsTable.service, service));
    if (metricName) conditions.push(eq(lyteMetricsTable.metricName, metricName));

    const rows = await db.select().from(lyteMetricsTable)
      .where(and(...conditions))
      .orderBy(asc(lyteMetricsTable.recordedAt))
      .limit(Math.min(limit, 2000))
      .offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(lyteMetricsTable)
      .where(and(...conditions));

    const services = await db.selectDistinct({ service: lyteMetricsTable.service }).from(lyteMetricsTable).orderBy(asc(lyteMetricsTable.service));
    const metricNames = await db.selectDistinct({ metricName: lyteMetricsTable.metricName }).from(lyteMetricsTable).orderBy(asc(lyteMetricsTable.metricName));

    sendSuccess(res, { rows, services: services.map(s => s.service), metricNames: metricNames.map(m => m.metricName), total: count, window: window || "24h" });
  } catch (err) { handleRouteError(res, err, "Failed to get metrics"); }
});

router.post("/lyte/metrics", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const [row] = await db.insert(lyteMetricsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create metric"); }
});

router.get("/lyte/topology", authMiddleware(), async (_req, res) => {
  try {
    const windowHours = 24;
    const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const recentMetrics = await db.select().from(lyteMetricsTable)
      .where(gte(lyteMetricsTable.recordedAt, cutoff))
      .orderBy(desc(lyteMetricsTable.recordedAt));

    const serviceMap: Record<string, { latencies: number[]; errorRates: number[]; anomalies: number; total: number }> = {};
    for (const m of recentMetrics) {
      if (!serviceMap[m.service]) serviceMap[m.service] = { latencies: [], errorRates: [], anomalies: 0, total: 0 };
      serviceMap[m.service].total++;
      if (m.anomaly) serviceMap[m.service].anomalies++;
      if (m.metricType === "latency") serviceMap[m.service].latencies.push(m.value);
      if (m.metricType === "error_rate") serviceMap[m.service].errorRates.push(m.value);
    }

    const nodes = Object.entries(serviceMap).map(([service, data]) => {
      const avgLatency = data.latencies.length > 0 ? data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length : 0;
      const avgError = data.errorRates.length > 0 ? data.errorRates.reduce((a, b) => a + b, 0) / data.errorRates.length : 0;
      const health = avgError > 5 ? "degraded" : avgError > 10 ? "down" : avgLatency > 500 ? "degraded" : "healthy";
      return { service, avgLatency: Math.round(avgLatency), avgErrorRate: Math.round(avgError * 100) / 100, anomalyCount: data.anomalies, dataPoints: data.total, health };
    });

    const firingAlerts = await db.select().from(lyteAlertsTable).where(eq(lyteAlertsTable.status, "firing"));

    sendSuccess(res, { nodes, firingAlertCount: firingAlerts.length, snapshotAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to get topology"); }
});

router.get("/lyte/alerts", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query.status as string | undefined;
    const service = req.query.service as string | undefined;
    const severity = req.query.severity as string | undefined;

    let query = db.select().from(lyteAlertsTable);
    const conditions: ReturnType<typeof eq>[] = [];
    if (status) conditions.push(eq(lyteAlertsTable.status, status as any));
    if (service) conditions.push(eq(lyteAlertsTable.service, service));
    if (severity) conditions.push(eq(lyteAlertsTable.severity, severity as any));

    const rows = await db.select().from(lyteAlertsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(lyteAlertsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(lyteAlertsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const firingCount = rows.filter(r => r.status === "firing").length;
    const activeCount = rows.filter(r => r.status === "active").length;

    sendSuccess(res, rows, 200, { page, limit, total: count, firingCount, activeCount });
  } catch (err) { handleRouteError(res, err, "Failed to list alerts"); }
});

router.post("/lyte/alerts", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const [row] = await db.insert(lyteAlertsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create alert"); }
});

router.get("/lyte/alerts/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [alert] = await db.select().from(lyteAlertsTable).where(eq(lyteAlertsTable.id, id));
    if (!alert) { sendNotFound(res, "Alert"); return; }
    const events = await db.select().from(lyteAlertEventsTable)
      .where(eq(lyteAlertEventsTable.alertId, id))
      .orderBy(desc(lyteAlertEventsTable.occurredAt))
      .limit(50);
    sendSuccess(res, { ...alert, events });
  } catch (err) { handleRouteError(res, err, "Failed to get alert"); }
});

router.patch("/lyte/alerts/:id", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(lyteAlertsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(lyteAlertsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Alert"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update alert"); }
});

router.delete("/lyte/alerts/:id", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(lyteAlertsTable).where(eq(lyteAlertsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Alert"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete alert"); }
});

router.get("/lyte/alert-events", authMiddleware(), async (req, res) => {
  try {
    const alertId = req.query.alertId ? parseInt(req.query.alertId as string) : undefined;
    const rows = await db.select().from(lyteAlertEventsTable)
      .where(alertId ? eq(lyteAlertEventsTable.alertId, alertId) : undefined)
      .orderBy(desc(lyteAlertEventsTable.occurredAt))
      .limit(200);
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list alert events"); }
});

router.post("/lyte/alert-events", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const [row] = await db.insert(lyteAlertEventsTable).values(req.body).returning();
    if (req.body.alertId && req.body.eventType === "fired") {
      await db.update(lyteAlertsTable).set({ status: "firing", firingCount: sql`firing_count + 1`, lastFiredAt: new Date(), updatedAt: new Date() }).where(eq(lyteAlertsTable.id, req.body.alertId));
    } else if (req.body.alertId && req.body.eventType === "resolved") {
      await db.update(lyteAlertsTable).set({ status: "resolved", lastResolvedAt: new Date(), updatedAt: new Date() }).where(eq(lyteAlertsTable.id, req.body.alertId));
    }
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create alert event"); }
});

router.get("/lyte/escalations", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query.status as string | undefined;
    const severity = req.query.severity as string | undefined;

    const conditions: ReturnType<typeof eq>[] = [];
    if (status) conditions.push(eq(lyteEscalationsTable.status, status as any));
    if (severity) conditions.push(eq(lyteEscalationsTable.severity, severity as any));

    const rows = await db.select().from(lyteEscalationsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(lyteEscalationsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(lyteEscalationsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const openCount = await db.select({ count: sql<number>`count(*)::int` }).from(lyteEscalationsTable).where(inArray(lyteEscalationsTable.status, ["open", "in_progress", "escalated"]));
    const criticalCount = await db.select({ count: sql<number>`count(*)::int` }).from(lyteEscalationsTable).where(and(eq(lyteEscalationsTable.severity, "critical"), inArray(lyteEscalationsTable.status, ["open", "in_progress", "escalated"])));

    sendSuccess(res, rows, 200, { page, limit, total: count, openCount: openCount[0].count, criticalCount: criticalCount[0].count });
  } catch (err) { handleRouteError(res, err, "Failed to list escalations"); }
});

router.post("/lyte/escalations", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const [row] = await db.insert(lyteEscalationsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create escalation"); }
});

router.patch("/lyte/escalations/:id", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const updates: Record<string, unknown> = { ...req.body, updatedAt: new Date() };
    if (req.body.status === "resolved" || req.body.status === "closed") updates.resolvedAt = new Date();
    const [row] = await db.update(lyteEscalationsTable).set(updates).where(eq(lyteEscalationsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Escalation"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update escalation"); }
});

router.get("/lyte/observability/summary", authMiddleware(), async (_req, res) => {
  try {
    const [signalCounts, alertFiring, escalationOpen, recentAnomalies] = await Promise.all([
      db.select({ status: lyteSignalsTable.status, severity: lyteSignalsTable.severity, count: sql<number>`count(*)::int` })
        .from(lyteSignalsTable)
        .groupBy(lyteSignalsTable.status, lyteSignalsTable.severity),
      db.select({ count: sql<number>`count(*)::int` }).from(lyteAlertsTable).where(eq(lyteAlertsTable.status, "firing")),
      db.select({ count: sql<number>`count(*)::int` }).from(lyteEscalationsTable).where(inArray(lyteEscalationsTable.status, ["open", "in_progress", "escalated"])),
      db.select({ count: sql<number>`count(*)::int` }).from(lyteMetricsTable).where(and(eq(lyteMetricsTable.anomaly, true), gte(lyteMetricsTable.recordedAt, new Date(Date.now() - 24 * 60 * 60 * 1000)))),
    ]);

    const signals = { total: 0, critical: 0, new: 0 };
    for (const row of signalCounts) {
      signals.total += row.count;
      if (row.severity === "critical") signals.critical += row.count;
      if (row.status === "new") signals.new += row.count;
    }

    sendSuccess(res, {
      signals,
      firingAlerts: alertFiring[0].count,
      openEscalations: escalationOpen[0].count,
      anomaliesLast24h: recentAnomalies[0].count,
      snapshotAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to get observability summary"); }
});

export default router;
