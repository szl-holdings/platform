import { Router, type Request, type Response } from "express";
import { randomBytes } from "crypto";
import { logger } from "../lib/logger";
import { db } from "@szl-holdings/db";
import {
  analyticsEventsTable,
  analyticsMetricDefinitionsTable,
  analyticsMetricSnapshotsTable,
  analyticsFunnelDefinitionsTable,
  analyticsCohortDefinitionsTable,
  analyticsAnomaliesTable,
  analyticsDashboardsTable,
  analyticsExportJobsTable,
} from "@szl-holdings/db/schema";
import { eq, and, gte, lte, desc, asc, sql, inArray } from "drizzle-orm";
import {
  parseTimeRange,
  selectGranularity,
  computeNextRunAt,
  serializeAnalyticsEvents,
  serializeMetricSnapshots,
  serializeAnomalies,
  getContentType,
  getFileExtension,
} from "@szl-holdings/observability/analytics";
import { jobQueue } from "../lib/job-queue";
import { JOB_TYPES } from "@szl-holdings/forge-runtime";

const analyticsEngineRouter = Router();

// ---------------------------------------------------------------------------
// Event Ingestion
// ---------------------------------------------------------------------------

analyticsEngineRouter.post("/analytics-engine/events", async (req: Request, res: Response) => {
  try {
    const { eventName, domain, sourceApp, properties, dimensions, numericValue, occurredAt, context, serverSide } = req.body as {
      eventName?: string;
      domain?: string;
      sourceApp?: string;
      properties?: Record<string, unknown>;
      dimensions?: Record<string, string>;
      numericValue?: number;
      occurredAt?: string;
      context?: {
        userId?: string;
        sessionId?: string;
        tenantId?: string;
        organizationId?: number;
        deviceType?: string;
        platform?: string;
        url?: string;
        country?: string;
      };
      serverSide?: boolean;
    };

    if (!eventName || !domain || !sourceApp) {
      res.status(400).json({ error: "eventName, domain, and sourceApp are required" });
      return;
    }

    const eventId = `evt_${randomBytes(12).toString("hex")}`;

    await db.insert(analyticsEventsTable).values({
      eventId,
      eventName,
      domain,
      sourceApp,
      sessionId: context?.sessionId,
      userId: context?.userId,
      organizationId: context?.organizationId,
      tenantId: context?.tenantId,
      deviceType: context?.deviceType,
      platform: context?.platform,
      url: context?.url,
      country: context?.country,
      properties: properties ?? {},
      dimensions: dimensions ?? {},
      numericValue,
      occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
      serverSide: serverSide ?? false,
    });

    res.status(202).json({ ok: true, eventId });
  } catch (err) {
    logger.error({ err }, "[analytics-engine] Failed to ingest event");
    res.status(500).json({ error: "Failed to record event" });
  }
});

analyticsEngineRouter.post("/analytics-engine/events/batch", async (req: Request, res: Response) => {
  try {
    const { events } = req.body as {
      events?: Array<{
        eventName?: string;
        domain?: string;
        sourceApp?: string;
        properties?: Record<string, unknown>;
        dimensions?: Record<string, string>;
        numericValue?: number;
        occurredAt?: string;
        context?: Record<string, unknown>;
        serverSide?: boolean;
      }>;
    };

    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ error: "events array is required" });
      return;
    }

    const rows = events
      .filter(e => e.eventName && e.domain && e.sourceApp)
      .map(e => ({
        eventId: `evt_${randomBytes(12).toString("hex")}`,
        eventName: e.eventName!,
        domain: e.domain!,
        sourceApp: e.sourceApp!,
        sessionId: (e.context as Record<string, string> | undefined)?.sessionId,
        userId: (e.context as Record<string, string> | undefined)?.userId,
        tenantId: (e.context as Record<string, string> | undefined)?.tenantId,
        properties: e.properties ?? {},
        dimensions: e.dimensions ?? {},
        numericValue: e.numericValue,
        occurredAt: e.occurredAt ? new Date(e.occurredAt) : new Date(),
        serverSide: e.serverSide ?? false,
      }));

    if (rows.length > 0) {
      await db.insert(analyticsEventsTable).values(rows);
    }

    res.status(202).json({ ok: true, recorded: rows.length });
  } catch (err) {
    logger.error({ err }, "[analytics-engine] Failed to ingest batch events");
    res.status(500).json({ error: "Failed to record events" });
  }
});

// ---------------------------------------------------------------------------
// Metric Definitions
// ---------------------------------------------------------------------------

analyticsEngineRouter.get("/analytics-engine/metrics", async (req: Request, res: Response) => {
  try {
    const { domain } = req.query as { domain?: string };
    const conditions = domain ? [eq(analyticsMetricDefinitionsTable.domain, domain)] : [];

    const metrics = await db
      .select()
      .from(analyticsMetricDefinitionsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(analyticsMetricDefinitionsTable.domain), asc(analyticsMetricDefinitionsTable.name));

    res.json({ metrics, total: metrics.length });
  } catch (err) {
    logger.error({ err }, "[analytics-engine] Failed to list metrics");
    res.status(500).json({ error: "Failed to list metrics" });
  }
});

analyticsEngineRouter.post("/analytics-engine/metrics", async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      metricId?: string;
      domain?: string;
      name?: string;
      calculationType?: string;
    };

    if (!body.metricId || !body.domain || !body.name || !body.calculationType) {
      res.status(400).json({ error: "metricId, domain, name, and calculationType are required" });
      return;
    }

    const [created] = await db.insert(analyticsMetricDefinitionsTable).values({
      ...body,
      metricId: body.metricId,
      domain: body.domain,
      name: body.name,
      calculationType: body.calculationType as typeof analyticsMetricDefinitionsTable.$inferInsert["calculationType"],
      filterConditions: (req.body.filterConditions ?? []) as typeof analyticsMetricDefinitionsTable.$inferInsert["filterConditions"],
      dimensions: (req.body.dimensions ?? []) as string[],
      granularities: (req.body.granularities ?? ["hour", "day", "week", "month"]) as string[],
      createdByUserId: (req as Request & { user?: { id?: number } }).user?.id,
    }).returning();

    res.status(201).json({ metric: created });
  } catch (err) {
    logger.error({ err }, "[analytics-engine] Failed to create metric");
    res.status(500).json({ error: "Failed to create metric definition" });
  }
});

analyticsEngineRouter.get("/analytics-engine/metrics/:metricId/query", async (req: Request, res: Response) => {
  try {
    const { metricId } = req.params;
    const { range = "7d", granularity: granularityParam, from: fromParam, to: toParam } = req.query as {
      range?: string;
      granularity?: string;
      from?: string;
      to?: string;
    };

    const { from, to } = fromParam && toParam
      ? { from: new Date(fromParam), to: new Date(toParam) }
      : parseTimeRange(range);

    const granularity = (granularityParam as "minute" | "hour" | "day" | "week" | "month" | undefined) ??
      selectGranularity(from, to);

    const [definition] = await db
      .select()
      .from(analyticsMetricDefinitionsTable)
      .where(eq(analyticsMetricDefinitionsTable.metricId, metricId!))
      .limit(1);

    if (!definition) {
      res.status(404).json({ error: "Metric definition not found" });
      return;
    }

    const snapshots = await db
      .select()
      .from(analyticsMetricSnapshotsTable)
      .where(
        and(
          eq(analyticsMetricSnapshotsTable.metricId, metricId!),
          eq(analyticsMetricSnapshotsTable.granularity, granularity as typeof analyticsMetricSnapshotsTable.$inferSelect["granularity"]),
          gte(analyticsMetricSnapshotsTable.periodStart, from),
          lte(analyticsMetricSnapshotsTable.periodStart, to)
        )
      )
      .orderBy(asc(analyticsMetricSnapshotsTable.periodStart));

    const dataPoints = snapshots.map(s => ({
      timestamp: s.periodStart,
      value: s.value,
      sampleCount: s.sampleCount,
      dimensions: s.dimensions as Record<string, string> | undefined,
    }));

    const currentValue = dataPoints[dataPoints.length - 1]?.value ?? 0;
    const previousValue = dataPoints[dataPoints.length - 2]?.value;
    const changePercent = previousValue != null && previousValue !== 0
      ? ((currentValue - previousValue) / previousValue) * 100
      : undefined;

    res.json({
      metricId: definition.metricId,
      name: definition.name,
      domain: definition.domain,
      unit: definition.unit,
      granularity,
      periodStart: from.toISOString(),
      periodEnd: to.toISOString(),
      currentValue,
      previousValue,
      changePercent,
      dataPoints: dataPoints.map(dp => ({
        timestamp: dp.timestamp.toISOString(),
        value: dp.value,
        sampleCount: dp.sampleCount,
      })),
    });
  } catch (err) {
    logger.error({ err }, "[analytics-engine] Failed to query metric");
    res.status(500).json({ error: "Failed to query metric" });
  }
});

analyticsEngineRouter.get("/analytics-engine/metrics/bulk", async (req: Request, res: Response) => {
  try {
    const { metrics: metricsParam, range = "7d", domain } = req.query as {
      metrics?: string;
      range?: string;
      domain?: string;
    };

    if (!metricsParam) {
      res.status(400).json({ error: "metrics parameter required (comma-separated metricIds)" });
      return;
    }

    const metricIds = metricsParam.split(",").map(m => m.trim()).filter(Boolean);
    const { from, to } = parseTimeRange(range);
    const granularity = selectGranularity(from, to);

    const snapshots = await db
      .select()
      .from(analyticsMetricSnapshotsTable)
      .where(
        and(
          inArray(analyticsMetricSnapshotsTable.metricId, metricIds),
          eq(analyticsMetricSnapshotsTable.granularity, granularity as typeof analyticsMetricSnapshotsTable.$inferSelect["granularity"]),
          gte(analyticsMetricSnapshotsTable.periodStart, from),
          lte(analyticsMetricSnapshotsTable.periodStart, to),
          ...(domain ? [eq(analyticsMetricSnapshotsTable.domain, domain)] : [])
        )
      )
      .orderBy(asc(analyticsMetricSnapshotsTable.periodStart));

    const byMetric: Record<string, typeof snapshots> = {};
    for (const snap of snapshots) {
      const list = byMetric[snap.metricId] ?? [];
      list.push(snap);
      byMetric[snap.metricId] = list;
    }

    const results: Record<string, unknown> = {};
    for (const metricId of metricIds) {
      const points = (byMetric[metricId] ?? []).map(s => ({
        timestamp: s.periodStart.toISOString(),
        value: s.value,
        sampleCount: s.sampleCount,
      }));
      const currentValue = points[points.length - 1]?.value ?? 0;
      results[metricId] = { metricId, granularity, currentValue, dataPoints: points };
    }

    res.json({ results, granularity, periodStart: from.toISOString(), periodEnd: to.toISOString() });
  } catch (err) {
    logger.error({ err }, "[analytics-engine] Failed to bulk query metrics");
    res.status(500).json({ error: "Failed to bulk query metrics" });
  }
});

// ---------------------------------------------------------------------------
// Funnels
// ---------------------------------------------------------------------------

analyticsEngineRouter.get("/analytics-engine/funnels", async (req: Request, res: Response) => {
  try {
    const { domain } = req.query as { domain?: string };
    const conditions = domain ? [eq(analyticsFunnelDefinitionsTable.domain, domain)] : [];
    const funnels = await db.select().from(analyticsFunnelDefinitionsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    res.json({ funnels });
  } catch (err) {
    logger.error({ err }, "[analytics-engine] Failed to list funnels");
    res.status(500).json({ error: "Failed to list funnels" });
  }
});

analyticsEngineRouter.post("/analytics-engine/funnels", async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      funnelId?: string;
      domain?: string;
      name?: string;
      steps?: unknown[];
    };

    if (!body.funnelId || !body.domain || !body.name || !Array.isArray(body.steps)) {
      res.status(400).json({ error: "funnelId, domain, name, and steps are required" });
      return;
    }

    const [created] = await db.insert(analyticsFunnelDefinitionsTable).values({
      funnelId: body.funnelId,
      domain: body.domain,
      name: body.name,
      description: req.body.description,
      steps: body.steps as typeof analyticsFunnelDefinitionsTable.$inferInsert["steps"],
      windowHours: req.body.windowHours ?? 168,
      createdByUserId: (req as Request & { user?: { id?: number } }).user?.id,
    }).returning();

    res.status(201).json({ funnel: created });
  } catch (err) {
    logger.error({ err }, "[analytics-engine] Failed to create funnel");
    res.status(500).json({ error: "Failed to create funnel" });
  }
});

analyticsEngineRouter.get("/analytics-engine/funnels/:funnelId", async (req: Request, res: Response) => {
  try {
    const { funnelId } = req.params;
    const { range = "7d" } = req.query as { range?: string };

    const [definition] = await db.select().from(analyticsFunnelDefinitionsTable)
      .where(eq(analyticsFunnelDefinitionsTable.funnelId, funnelId!))
      .limit(1);

    if (!definition) {
      res.status(404).json({ error: "Funnel not found" });
      return;
    }

    const { from, to } = parseTimeRange(range);

    const steps = definition.steps as Array<{ id: string; name: string; eventName: string }>;
    const eventNames = steps.map(s => s.eventName).filter(Boolean);

    const events = eventNames.length > 0
      ? await db.select({
          eventName: analyticsEventsTable.eventName,
          userId: analyticsEventsTable.userId,
          sessionId: analyticsEventsTable.sessionId,
          occurredAt: analyticsEventsTable.occurredAt,
          properties: analyticsEventsTable.properties,
        })
        .from(analyticsEventsTable)
        .where(
          and(
            eq(analyticsEventsTable.domain, definition.domain),
            inArray(analyticsEventsTable.eventName, eventNames),
            gte(analyticsEventsTable.occurredAt, from),
            lte(analyticsEventsTable.occurredAt, to)
          )
        )
        .orderBy(asc(analyticsEventsTable.occurredAt))
      : [];

    const byEntity = new Map<string, Array<typeof events[0]>>();
    for (const event of events) {
      const entityId = event.userId ?? event.sessionId ?? "anonymous";
      const list = byEntity.get(entityId) ?? [];
      list.push(event);
      byEntity.set(entityId, list);
    }

    const windowHours = definition.windowHours ?? 168;
    const stepCounts = steps.map((_step, idx) => {
      let count = 0;
      for (const [_entityId, entityEvents] of byEntity) {
        let stepIdx = 0;
        let windowStart: Date | null = null;
        for (const event of entityEvents) {
          if (stepIdx > idx) break;
          if (event.eventName === steps[stepIdx]?.eventName) {
            if (stepIdx === 0) {
              windowStart = event.occurredAt;
              stepIdx++;
            } else if (windowStart) {
              const windowEnd = new Date(windowStart.getTime() + windowHours * 3600 * 1000);
              if (event.occurredAt <= windowEnd) {
                stepIdx++;
              }
            }
          }
        }
        if (stepIdx > idx) count++;
      }
      return count;
    });

    const totalEntries = stepCounts[0] ?? 0;
    const totalCompletions = stepCounts[stepCounts.length - 1] ?? 0;
    const overallConversionRate = totalEntries > 0 ? (totalCompletions / totalEntries) * 100 : 0;

    const stepResults = steps.map((step, idx) => {
      const count = stepCounts[idx] ?? 0;
      const prevCount = idx > 0 ? (stepCounts[idx - 1] ?? count) : totalEntries;
      return {
        stepId: step.id,
        stepName: step.name,
        eventName: step.eventName,
        count,
        conversionRate: prevCount > 0 ? (count / prevCount) * 100 : 0,
        dropoffRate: prevCount > 0 ? ((prevCount - count) / prevCount) * 100 : 0,
      };
    });

    res.json({
      funnelId: definition.funnelId,
      name: definition.name,
      domain: definition.domain,
      periodStart: from.toISOString(),
      periodEnd: to.toISOString(),
      totalEntries,
      totalCompletions,
      overallConversionRate,
      steps: stepResults,
    });
  } catch (err) {
    logger.error({ err }, "[analytics-engine] Failed to compute funnel");
    res.status(500).json({ error: "Failed to compute funnel" });
  }
});

// ---------------------------------------------------------------------------
// Cohorts
// ---------------------------------------------------------------------------

analyticsEngineRouter.get("/analytics-engine/cohorts", async (req: Request, res: Response) => {
  try {
    const { domain } = req.query as { domain?: string };
    const conditions = domain ? [eq(analyticsCohortDefinitionsTable.domain, domain)] : [];
    const cohorts = await db.select().from(analyticsCohortDefinitionsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    res.json({ cohorts });
  } catch (err) {
    logger.error({ err }, "[analytics-engine] Failed to list cohorts");
    res.status(500).json({ error: "Failed to list cohorts" });
  }
});

analyticsEngineRouter.post("/analytics-engine/cohorts", async (req: Request, res: Response) => {
  try {
    const body = req.body as { cohortId?: string; domain?: string; name?: string; entityType?: string };
    if (!body.cohortId || !body.domain || !body.name || !body.entityType) {
      res.status(400).json({ error: "cohortId, domain, name, and entityType are required" });
      return;
    }

    const [created] = await db.insert(analyticsCohortDefinitionsTable).values({
      cohortId: body.cohortId,
      domain: body.domain,
      name: body.name,
      description: req.body.description,
      entityType: body.entityType,
      entryConditions: (req.body.entryConditions ?? []) as typeof analyticsCohortDefinitionsTable.$inferInsert["entryConditions"],
      entryEventName: req.body.entryEventName,
      analysisType: req.body.analysisType ?? "retention",
      windowDays: req.body.windowDays ?? 30,
      createdByUserId: (req as Request & { user?: { id?: number } }).user?.id,
    }).returning();

    res.status(201).json({ cohort: created });
  } catch (err) {
    logger.error({ err }, "[analytics-engine] Failed to create cohort");
    res.status(500).json({ error: "Failed to create cohort" });
  }
});

// ---------------------------------------------------------------------------
// Anomalies
// ---------------------------------------------------------------------------

analyticsEngineRouter.get("/analytics-engine/anomalies", async (req: Request, res: Response) => {
  try {
    const { domain, metricId, severity, resolved } = req.query as {
      domain?: string;
      metricId?: string;
      severity?: string;
      resolved?: string;
    };

    const conditions = [];
    if (domain) conditions.push(eq(analyticsAnomaliesTable.domain, domain));
    if (metricId) conditions.push(eq(analyticsAnomaliesTable.metricId, metricId));
    if (severity) conditions.push(eq(analyticsAnomaliesTable.severity, severity as typeof analyticsAnomaliesTable.$inferSelect["severity"]));
    if (resolved !== undefined) conditions.push(eq(analyticsAnomaliesTable.isResolved, resolved === "true"));

    const anomalies = await db.select().from(analyticsAnomaliesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(analyticsAnomaliesTable.detectedAt))
      .limit(100);

    res.json({ anomalies, total: anomalies.length });
  } catch (err) {
    logger.error({ err }, "[analytics-engine] Failed to list anomalies");
    res.status(500).json({ error: "Failed to list anomalies" });
  }
});

analyticsEngineRouter.patch("/analytics-engine/anomalies/:anomalyId/resolve", async (req: Request, res: Response) => {
  try {
    const { anomalyId } = req.params;
    await db.update(analyticsAnomaliesTable)
      .set({ isResolved: true, resolvedAt: new Date() })
      .where(eq(analyticsAnomaliesTable.anomalyId, anomalyId!));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "[analytics-engine] Failed to resolve anomaly");
    res.status(500).json({ error: "Failed to resolve anomaly" });
  }
});

analyticsEngineRouter.patch("/analytics-engine/anomalies/:anomalyId/suppress", async (req: Request, res: Response) => {
  try {
    const { anomalyId } = req.params;
    await db.update(analyticsAnomaliesTable)
      .set({ isSuppressed: true })
      .where(eq(analyticsAnomaliesTable.anomalyId, anomalyId!));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "[analytics-engine] Failed to suppress anomaly");
    res.status(500).json({ error: "Failed to suppress anomaly" });
  }
});

// ---------------------------------------------------------------------------
// Dashboards
// ---------------------------------------------------------------------------

analyticsEngineRouter.get("/analytics-engine/dashboards", async (req: Request, res: Response) => {
  try {
    const { domain } = req.query as { domain?: string };
    const conditions = domain ? [eq(analyticsDashboardsTable.domain, domain)] : [];
    const dashboards = await db.select().from(analyticsDashboardsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    res.json({ dashboards });
  } catch (err) {
    logger.error({ err }, "[analytics-engine] Failed to list dashboards");
    res.status(500).json({ error: "Failed to list dashboards" });
  }
});

analyticsEngineRouter.post("/analytics-engine/dashboards", async (req: Request, res: Response) => {
  try {
    const body = req.body as { dashboardId?: string; domain?: string; name?: string; layout?: unknown[] };
    if (!body.dashboardId || !body.domain || !body.name) {
      res.status(400).json({ error: "dashboardId, domain, and name are required" });
      return;
    }

    const [created] = await db.insert(analyticsDashboardsTable).values({
      dashboardId: body.dashboardId,
      domain: body.domain,
      name: body.name,
      description: req.body.description,
      layout: (body.layout ?? []) as typeof analyticsDashboardsTable.$inferInsert["layout"],
      defaultTimeRange: req.body.defaultTimeRange ?? "7d",
      isPublic: req.body.isPublic ?? false,
      createdByUserId: (req as Request & { user?: { id?: number } }).user?.id,
    }).returning();

    res.status(201).json({ dashboard: created });
  } catch (err) {
    logger.error({ err }, "[analytics-engine] Failed to create dashboard");
    res.status(500).json({ error: "Failed to create dashboard" });
  }
});

analyticsEngineRouter.get("/analytics-engine/dashboards/:dashboardId", async (req: Request, res: Response) => {
  try {
    const { dashboardId } = req.params;
    const [dashboard] = await db.select().from(analyticsDashboardsTable)
      .where(eq(analyticsDashboardsTable.dashboardId, dashboardId!))
      .limit(1);

    if (!dashboard) {
      res.status(404).json({ error: "Dashboard not found" });
      return;
    }

    res.json({ dashboard });
  } catch (err) {
    logger.error({ err }, "[analytics-engine] Failed to get dashboard");
    res.status(500).json({ error: "Failed to get dashboard" });
  }
});

// ---------------------------------------------------------------------------
// Data Export
// ---------------------------------------------------------------------------

analyticsEngineRouter.post("/analytics-engine/export", async (req: Request, res: Response) => {
  try {
    const {
      exportType = "events",
      domain,
      format = "csv",
      range = "30d",
      filterParams = {},
      scheduleFrequency = "once",
      webhookUrl,
    } = req.body as {
      exportType?: string;
      domain?: string;
      format?: string;
      range?: string;
      filterParams?: Record<string, unknown>;
      scheduleFrequency?: string;
      webhookUrl?: string;
    };

    if (!domain) {
      res.status(400).json({ error: "domain is required" });
      return;
    }

    const exportId = `exp_${randomBytes(12).toString("hex")}`;
    const { from, to } = parseTimeRange(range);

    const nextRunAt = computeNextRunAt(scheduleFrequency as "once" | "daily" | "weekly" | "monthly");

    const [exportJob] = await db.insert(analyticsExportJobsTable).values({
      exportId,
      domain,
      exportType: exportType as typeof analyticsExportJobsTable.$inferInsert["exportType"],
      format: format as typeof analyticsExportJobsTable.$inferInsert["format"],
      status: "pending",
      filterParams: { ...filterParams, from: from.toISOString(), to: to.toISOString() },
      scheduleFrequency: scheduleFrequency as typeof analyticsExportJobsTable.$inferInsert["scheduleFrequency"],
      nextRunAt: nextRunAt ?? undefined,
      webhookUrl,
      triggeredByUserId: (req as Request & { user?: { id?: number } }).user?.id,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    }).returning();

    jobQueue.enqueue(JOB_TYPES.ANALYTICS_EXPORT, { exportId, domain, exportType, format, from: from.toISOString(), to: to.toISOString() }).catch(err => {
      logger.warn({ err, exportId }, "[analytics-engine] Failed to enqueue export job");
    });

    res.status(202).json({ exportId, status: "pending", message: "Export job queued" });
  } catch (err) {
    logger.error({ err }, "[analytics-engine] Failed to create export job");
    res.status(500).json({ error: "Failed to create export job" });
  }
});

analyticsEngineRouter.get("/analytics-engine/export/:exportId", async (req: Request, res: Response) => {
  try {
    const { exportId } = req.params;
    const [job] = await db.select().from(analyticsExportJobsTable)
      .where(eq(analyticsExportJobsTable.exportId, exportId!))
      .limit(1);

    if (!job) {
      res.status(404).json({ error: "Export job not found" });
      return;
    }

    res.json({ job });
  } catch (err) {
    logger.error({ err }, "[analytics-engine] Failed to get export job");
    res.status(500).json({ error: "Failed to get export job" });
  }
});

analyticsEngineRouter.get("/analytics-engine/export/:exportId/download", async (req: Request, res: Response) => {
  try {
    const { exportId } = req.params;
    const { token } = req.query as { token?: string };

    const [job] = await db.select().from(analyticsExportJobsTable)
      .where(eq(analyticsExportJobsTable.exportId, exportId!))
      .limit(1);

    if (!job) {
      res.status(404).json({ error: "Export job not found" });
      return;
    }

    if (job.status !== "completed") {
      res.status(409).json({ error: "Export not yet completed", status: job.status });
      return;
    }

    if (job.downloadToken && job.downloadToken !== token) {
      res.status(403).json({ error: "Invalid download token" });
      return;
    }

    if (job.expiresAt && job.expiresAt < new Date()) {
      res.status(410).json({ error: "Export has expired" });
      return;
    }

    const format = job.format as "csv" | "json" | "parquet";
    const { from, to } = {
      from: new Date((job.filterParams as Record<string, string>)?.from ?? Date.now() - 30 * 24 * 3600 * 1000),
      to: new Date((job.filterParams as Record<string, string>)?.to ?? Date.now()),
    };

    const events = await db.select().from(analyticsEventsTable)
      .where(
        and(
          eq(analyticsEventsTable.domain, job.domain),
          gte(analyticsEventsTable.occurredAt, from),
          lte(analyticsEventsTable.occurredAt, to)
        )
      )
      .limit(50000);

    const content = serializeAnalyticsEvents(events, format);
    const contentType = getContentType(format);
    const ext = getFileExtension(format);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="analytics_export_${exportId}${ext}"`);
    res.send(content);
  } catch (err) {
    logger.error({ err }, "[analytics-engine] Failed to download export");
    res.status(500).json({ error: "Failed to download export" });
  }
});

// ---------------------------------------------------------------------------
// Attribution
// ---------------------------------------------------------------------------

analyticsEngineRouter.get("/analytics-engine/attribution", async (req: Request, res: Response) => {
  try {
    const { domain, range = "30d", model = "linear" } = req.query as {
      domain?: string;
      range?: string;
      model?: string;
    };

    if (!domain) {
      res.status(400).json({ error: "domain is required" });
      return;
    }

    const { from, to } = parseTimeRange(range);

    const touchpoints = await db.select({
      journeyId: analyticsEventsTable.sessionId,
      channel: analyticsEventsTable.referrer,
      eventName: analyticsEventsTable.eventName,
      occurredAt: analyticsEventsTable.occurredAt,
      properties: analyticsEventsTable.properties,
    })
    .from(analyticsEventsTable)
    .where(
      and(
        eq(analyticsEventsTable.domain, domain),
        gte(analyticsEventsTable.occurredAt, from),
        lte(analyticsEventsTable.occurredAt, to)
      )
    )
    .orderBy(asc(analyticsEventsTable.occurredAt))
    .limit(5000);

    const channelCounts = new Map<string, { firstTouch: number; lastTouch: number; total: number }>();
    const byJourney = new Map<string, typeof touchpoints>();

    for (const tp of touchpoints) {
      const journeyId = tp.journeyId ?? "anon";
      const list = byJourney.get(journeyId) ?? [];
      list.push(tp);
      byJourney.set(journeyId, list);
    }

    for (const [, journey] of byJourney) {
      if (journey.length === 0) continue;
      const sorted = journey.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
      const firstChannel = sorted[0]?.channel ?? "direct";
      const lastChannel = sorted[sorted.length - 1]?.channel ?? "direct";

      const first = channelCounts.get(firstChannel) ?? { firstTouch: 0, lastTouch: 0, total: 0 };
      first.firstTouch += 1; first.total += 1;
      channelCounts.set(firstChannel, first);

      if (lastChannel !== firstChannel) {
        const last = channelCounts.get(lastChannel) ?? { firstTouch: 0, lastTouch: 0, total: 0 };
        last.lastTouch += 1;
        channelCounts.set(lastChannel, last);
      } else {
        first.lastTouch += 1;
      }
    }

    const channelSummary = Array.from(channelCounts.entries()).map(([channel, counts]) => ({
      channel,
      ...counts,
    })).sort((a, b) => b.total - a.total);

    res.json({
      domain,
      model,
      periodStart: from.toISOString(),
      periodEnd: to.toISOString(),
      totalJourneys: byJourney.size,
      channels: channelSummary,
    });
  } catch (err) {
    logger.error({ err }, "[analytics-engine] Failed to compute attribution");
    res.status(500).json({ error: "Failed to compute attribution" });
  }
});

// ---------------------------------------------------------------------------
// Summary / Health endpoint
// ---------------------------------------------------------------------------

analyticsEngineRouter.get("/analytics-engine/summary", async (req: Request, res: Response) => {
  try {
    const { domain } = req.query as { domain?: string };
    const conditions = domain ? [eq(analyticsEventsTable.domain, domain)] : [];

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [eventCount] = await db.select({ count: sql<number>`count(*)` })
      .from(analyticsEventsTable)
      .where(and(...conditions, gte(analyticsEventsTable.occurredAt, since24h)));

    const [metricCount] = await db.select({ count: sql<number>`count(*)` })
      .from(analyticsMetricDefinitionsTable)
      .where(domain ? eq(analyticsMetricDefinitionsTable.domain, domain) : undefined);

    const [anomalyCount] = await db.select({ count: sql<number>`count(*)` })
      .from(analyticsAnomaliesTable)
      .where(
        and(
          domain ? eq(analyticsAnomaliesTable.domain, domain) : undefined,
          eq(analyticsAnomaliesTable.isResolved, false),
          eq(analyticsAnomaliesTable.isSuppressed, false)
        )
      );

    res.json({
      domain: domain ?? "all",
      last24h: {
        events: Number(eventCount?.count ?? 0),
      },
      total: {
        metricDefinitions: Number(metricCount?.count ?? 0),
        activeAnomalies: Number(anomalyCount?.count ?? 0),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "[analytics-engine] Failed to get summary");
    res.status(500).json({ error: "Failed to get analytics summary" });
  }
});

export default analyticsEngineRouter;
