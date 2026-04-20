import crypto from 'node:crypto';
import { bodyShape } from '@szl-holdings/contracts/common';
import {
  db,
  lyteAlertEventsTable,
  lyteAlertsTable,
  lyteDashboardsTable,
  lyteEscalationsTable,
  lyteMetricsTable,
  lytePrismScoresTable,
  lyteSignalsTable,
} from '@szl-holdings/db';
import { and, asc, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  parsePagination,
  sendBadRequest,
  sendError,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, denyIfReadOnly, parseIdParam } from '../middlewares/auth';
import { withDbSpan } from '../middlewares/telemetry';

const router: IRouter = Router();

router.get(
  '/lyte/prism/scores',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const lens = req.query.lens as string | undefined;
      const lenses = [
        'financial_health',
        'operational_risk',
        'growth_velocity',
        'customer_sentiment',
        'compliance_drift',
        'talent_stability',
        'market_position',
      ] as const;
      if (lens && !lenses.includes(lens as any)) {
        sendBadRequest(res, 'Invalid lens');
        return;
      }
      const rows = await withDbSpan(
        req,
        () =>
          db
            .select()
            .from(lytePrismScoresTable)
            .where(lens ? eq(lytePrismScoresTable.lens, lens as any) : undefined)
            .orderBy(desc(lytePrismScoresTable.scoredAt))
            .limit(lens ? 30 : 7),
        'lyte_prism_scores:list',
      );
      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, 'Failed to get PRISM scores');
    }
  },
);

router.get('/lyte/prism/summary', authMiddleware(), async (req, res) => {
  try {
    const lenses = [
      'financial_health',
      'operational_risk',
      'growth_velocity',
      'customer_sentiment',
      'compliance_drift',
      'talent_stability',
      'market_position',
    ] as const;
    const rows = await withDbSpan(
      req,
      () =>
        Promise.all(
          lenses.map(async (lens) => {
            const [latest] = await db
              .select()
              .from(lytePrismScoresTable)
              .where(eq(lytePrismScoresTable.lens, lens))
              .orderBy(desc(lytePrismScoresTable.scoredAt))
              .limit(1);
            return latest ?? null;
          }),
        ),
      'lyte_prism_scores:summary',
    );
    const composite = rows.filter(Boolean);
    const avgScore =
      composite.length > 0
        ? Math.round(composite.reduce((s, r) => s + (r!.score ?? 0), 0) / composite.length)
        : 0;
    sendSuccess(res, { lenses: rows, compositeScore: avgScore, lensCount: composite.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get PRISM summary');
  }
});

router.post(
  '/lyte/prism/scores',
  authMiddleware(),
  denyIfReadOnly(),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const [row] = await db.insert(lytePrismScoresTable).values(req.body).returning();
      sendSuccess(res, row, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create PRISM score');
    }
  },
);

router.get('/lyte/metrics', authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const service = req.query.service as string | undefined;
    const metricName = req.query.metricName as string | undefined;
    const window = req.query.window as string | undefined;
    const windowMap: Record<string, number> = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
      '30d': 720,
    };
    const windowHours = window && windowMap[window] ? windowMap[window] : 24;
    const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    const conditions = [gte(lyteMetricsTable.recordedAt, cutoff)];
    if (service) conditions.push(eq(lyteMetricsTable.service, service));
    if (metricName) conditions.push(eq(lyteMetricsTable.metricName, metricName));

    const [rows, [{ count }], services, metricNames] = await withDbSpan(
      req,
      () =>
        Promise.all([
          db
            .select()
            .from(lyteMetricsTable)
            .where(and(...conditions))
            .orderBy(asc(lyteMetricsTable.recordedAt))
            .limit(Math.min(limit, 2000))
            .offset(offset),
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(lyteMetricsTable)
            .where(and(...conditions)),
          db
            .selectDistinct({ service: lyteMetricsTable.service })
            .from(lyteMetricsTable)
            .orderBy(asc(lyteMetricsTable.service)),
          db
            .selectDistinct({ metricName: lyteMetricsTable.metricName })
            .from(lyteMetricsTable)
            .orderBy(asc(lyteMetricsTable.metricName)),
        ]),
      'lyte_metrics:list',
    );

    sendSuccess(res, {
      rows,
      services: services.map((s) => s.service),
      metricNames: metricNames.map((m) => m.metricName),
      total: count,
      window: window || '24h',
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get metrics');
  }
});

router.post(
  '/lyte/metrics',
  authMiddleware(),
  denyIfReadOnly(),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const [row] = await db.insert(lyteMetricsTable).values(req.body).returning();
      sendSuccess(res, row, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create metric');
    }
  },
);

router.get('/lyte/topology', authMiddleware(), async (_req, res) => {
  try {
    const windowHours = 24;
    const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const recentMetrics = await db
      .select()
      .from(lyteMetricsTable)
      .where(gte(lyteMetricsTable.recordedAt, cutoff))
      .orderBy(desc(lyteMetricsTable.recordedAt));

    const serviceMap: Record<
      string,
      { latencies: number[]; errorRates: number[]; anomalies: number; total: number }
    > = {};
    for (const m of recentMetrics) {
      if (!serviceMap[m.service])
        serviceMap[m.service] = { latencies: [], errorRates: [], anomalies: 0, total: 0 };
      serviceMap[m.service].total++;
      if (m.anomaly) serviceMap[m.service].anomalies++;
      if (m.metricType === 'latency') serviceMap[m.service].latencies.push(m.value);
      if (m.metricType === 'error_rate') serviceMap[m.service].errorRates.push(m.value);
    }

    const nodes = Object.entries(serviceMap).map(([service, data]) => {
      const avgLatency =
        data.latencies.length > 0
          ? data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length
          : 0;
      const avgError =
        data.errorRates.length > 0
          ? data.errorRates.reduce((a, b) => a + b, 0) / data.errorRates.length
          : 0;
      const health =
        avgError > 5
          ? 'degraded'
          : avgError > 10
            ? 'down'
            : avgLatency > 500
              ? 'degraded'
              : 'healthy';
      return {
        service,
        avgLatency: Math.round(avgLatency),
        avgErrorRate: Math.round(avgError * 100) / 100,
        anomalyCount: data.anomalies,
        dataPoints: data.total,
        health,
      };
    });

    const firingAlerts = await db
      .select()
      .from(lyteAlertsTable)
      .where(eq(lyteAlertsTable.status, 'firing'));

    sendSuccess(res, {
      nodes,
      firingAlertCount: firingAlerts.length,
      snapshotAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get topology');
  }
});

router.get('/lyte/alerts', authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query.status as string | undefined;
    const service = req.query.service as string | undefined;
    const severity = req.query.severity as string | undefined;

    const query = db.select().from(lyteAlertsTable);
    const conditions: ReturnType<typeof eq>[] = [];
    if (status) conditions.push(eq(lyteAlertsTable.status, status as any));
    if (service) conditions.push(eq(lyteAlertsTable.service, service));
    if (severity) conditions.push(eq(lyteAlertsTable.severity, severity as any));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [rows, [{ count }]] = await withDbSpan(
      req,
      () =>
        Promise.all([
          db
            .select()
            .from(lyteAlertsTable)
            .where(where)
            .orderBy(desc(lyteAlertsTable.createdAt))
            .limit(limit)
            .offset(offset),
          db.select({ count: sql<number>`count(*)::int` }).from(lyteAlertsTable).where(where),
        ]),
      'lyte_alerts:list',
    );

    const firingCount = rows.filter((r) => r.status === 'firing').length;
    const activeCount = rows.filter((r) => r.status === 'active').length;

    sendSuccess(res, rows, 200, { page, limit, total: count, firingCount, activeCount });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list alerts');
  }
});

router.post(
  '/lyte/alerts',
  authMiddleware(),
  denyIfReadOnly(),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const [row] = await db.insert(lyteAlertsTable).values(req.body).returning();
      sendSuccess(res, row, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create alert');
    }
  },
);

router.get('/lyte/alerts/:id', authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [alert] = await db.select().from(lyteAlertsTable).where(eq(lyteAlertsTable.id, id));
    if (!alert) {
      sendNotFound(res, 'Alert');
      return;
    }
    const events = await db
      .select()
      .from(lyteAlertEventsTable)
      .where(eq(lyteAlertEventsTable.alertId, id))
      .orderBy(desc(lyteAlertEventsTable.occurredAt))
      .limit(50);
    sendSuccess(res, { ...alert, events });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get alert');
  }
});

router.patch(
  '/lyte/alerts/:id',
  authMiddleware(),
  denyIfReadOnly(),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [row] = await db
        .update(lyteAlertsTable)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(lyteAlertsTable.id, id))
        .returning();
      if (!row) {
        sendNotFound(res, 'Alert');
        return;
      }
      sendSuccess(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update alert');
    }
  },
);

router.delete(
  '/lyte/alerts/:id',
  validateBody(bodyShape({})),
  authMiddleware(),
  denyIfReadOnly(),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [row] = await db.delete(lyteAlertsTable).where(eq(lyteAlertsTable.id, id)).returning();
      if (!row) {
        sendNotFound(res, 'Alert');
        return;
      }
      sendSuccess(res, { deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete alert');
    }
  },
);

router.get(
  '/lyte/alert-events',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const alertId = req.query.alertId ? parseInt(req.query.alertId as string) : undefined;
      const rows = await db
        .select()
        .from(lyteAlertEventsTable)
        .where(alertId ? eq(lyteAlertEventsTable.alertId, alertId) : undefined)
        .orderBy(desc(lyteAlertEventsTable.occurredAt))
        .limit(200);
      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list alert events');
    }
  },
);

router.post(
  '/lyte/alert-events',
  authMiddleware(),
  denyIfReadOnly(),
  validateBody(
    bodyShape({
      alertId: z.unknown().optional(),
      eventType: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const [row] = await db.insert(lyteAlertEventsTable).values(req.body).returning();
      if (req.body.alertId && req.body.eventType === 'fired') {
        await db
          .update(lyteAlertsTable)
          .set({
            status: 'firing',
            firingCount: sql`firing_count + 1`,
            lastFiredAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(lyteAlertsTable.id, req.body.alertId));
      } else if (req.body.alertId && req.body.eventType === 'resolved') {
        await db
          .update(lyteAlertsTable)
          .set({ status: 'resolved', lastResolvedAt: new Date(), updatedAt: new Date() })
          .where(eq(lyteAlertsTable.id, req.body.alertId));
      }
      sendSuccess(res, row, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create alert event');
    }
  },
);

router.get(
  '/lyte/escalations',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
      const status = req.query.status as string | undefined;
      const severity = req.query.severity as string | undefined;

      const conditions: ReturnType<typeof eq>[] = [];
      if (status) conditions.push(eq(lyteEscalationsTable.status, status as any));
      if (severity) conditions.push(eq(lyteEscalationsTable.severity, severity as any));
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [rows, [{ count }], openCount, criticalCount] = await withDbSpan(
        req,
        () =>
          Promise.all([
            db
              .select()
              .from(lyteEscalationsTable)
              .where(where)
              .orderBy(desc(lyteEscalationsTable.createdAt))
              .limit(limit)
              .offset(offset),
            db
              .select({ count: sql<number>`count(*)::int` })
              .from(lyteEscalationsTable)
              .where(where),
            db
              .select({ count: sql<number>`count(*)::int` })
              .from(lyteEscalationsTable)
              .where(inArray(lyteEscalationsTable.status, ['open', 'in_progress', 'escalated'])),
            db
              .select({ count: sql<number>`count(*)::int` })
              .from(lyteEscalationsTable)
              .where(
                and(
                  eq(lyteEscalationsTable.severity, 'critical'),
                  inArray(lyteEscalationsTable.status, ['open', 'in_progress', 'escalated']),
                ),
              ),
          ]),
        'lyte_escalations:list',
      );

      sendSuccess(res, rows, 200, {
        page,
        limit,
        total: count,
        openCount: openCount[0].count,
        criticalCount: criticalCount[0].count,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list escalations');
    }
  },
);

router.post(
  '/lyte/escalations',
  authMiddleware(),
  denyIfReadOnly(),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const [row] = await db.insert(lyteEscalationsTable).values(req.body).returning();
      sendSuccess(res, row, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create escalation');
    }
  },
);

router.patch(
  '/lyte/escalations/:id',
  authMiddleware(),
  denyIfReadOnly(),
  validateBody(
    bodyShape({
      status: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const updates: Record<string, unknown> = { ...req.body, updatedAt: new Date() };
      if (req.body.status === 'resolved' || req.body.status === 'closed')
        updates.resolvedAt = new Date();
      const [row] = await db
        .update(lyteEscalationsTable)
        .set(updates)
        .where(eq(lyteEscalationsTable.id, id))
        .returning();
      if (!row) {
        sendNotFound(res, 'Escalation');
        return;
      }
      sendSuccess(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update escalation');
    }
  },
);

router.get('/lyte/observability/summary', authMiddleware(), async (req, res) => {
  try {
    const [signalCounts, alertFiring, escalationOpen, recentAnomalies] = await withDbSpan(
      req,
      () =>
        Promise.all([
          db
            .select({
              status: lyteSignalsTable.status,
              severity: lyteSignalsTable.severity,
              count: sql<number>`count(*)::int`,
            })
            .from(lyteSignalsTable)
            .groupBy(lyteSignalsTable.status, lyteSignalsTable.severity),
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(lyteAlertsTable)
            .where(eq(lyteAlertsTable.status, 'firing')),
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(lyteEscalationsTable)
            .where(inArray(lyteEscalationsTable.status, ['open', 'in_progress', 'escalated'])),
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(lyteMetricsTable)
            .where(
              and(
                eq(lyteMetricsTable.anomaly, true),
                gte(lyteMetricsTable.recordedAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
              ),
            ),
        ]),
      'lyte_observability:summary_multi',
    );

    const signals = { total: 0, critical: 0, new: 0 };
    for (const row of signalCounts) {
      signals.total += row.count;
      if (row.severity === 'critical') signals.critical += row.count;
      if (row.status === 'new') signals.new += row.count;
    }

    sendSuccess(res, {
      signals,
      firingAlerts: alertFiring[0].count,
      openEscalations: escalationOpen[0].count,
      anomaliesLast24h: recentAnomalies[0].count,
      snapshotAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get observability summary');
  }
});

router.get('/lyte/dashboards', authMiddleware(), async (req, res) => {
  try {
    if (!req.user?.id) {
      sendSuccess(res, []);
      return;
    }
    const rows = await withDbSpan(
      req,
      () =>
        db
          .select()
          .from(lyteDashboardsTable)
          .where(eq(lyteDashboardsTable.userId, req.user!.id))
          .orderBy(desc(lyteDashboardsTable.updatedAt))
          .limit(50),
      'lyte_dashboards:list',
    );
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list dashboards');
  }
});

router.post(
  '/lyte/dashboards',
  authMiddleware(),
  denyIfReadOnly(),
  validateBody(
    bodyShape({
      description: z.unknown().optional(),
      isShared: z.unknown().optional(),
      name: z.unknown().optional(),
      template: z.unknown().optional(),
      widgets: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }
      const { name, description, widgets, isShared, template } = req.body;
      if (!name) {
        sendBadRequest(res, 'name is required');
        return;
      }
      const shareToken = isShared ? crypto.randomBytes(16).toString('hex') : null;
      const [row] = await db
        .insert(lyteDashboardsTable)
        .values({
          userId: req.user.id,
          name: String(name),
          description: description ? String(description) : null,
          widgets: Array.isArray(widgets) ? widgets : [],
          template: template ? String(template) : null,
          isShared: Boolean(isShared),
          shareToken,
        })
        .returning();
      sendSuccess(res, row, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create dashboard');
    }
  },
);

router.get('/lyte/dashboards/:id', authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(lyteDashboardsTable).where(eq(lyteDashboardsTable.id, id));
    if (!row) {
      sendNotFound(res, 'Dashboard');
      return;
    }
    if (row.userId !== req.user?.id) {
      sendNotFound(res, 'Dashboard');
      return;
    }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get dashboard');
  }
});

router.get('/lyte/dashboards/shared/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length < 16) {
      sendNotFound(res, 'Dashboard');
      return;
    }
    const [row] = await db
      .select({
        id: lyteDashboardsTable.id,
        name: lyteDashboardsTable.name,
        description: lyteDashboardsTable.description,
        widgets: lyteDashboardsTable.widgets,
        template: lyteDashboardsTable.template,
        isShared: lyteDashboardsTable.isShared,
        createdAt: lyteDashboardsTable.createdAt,
        updatedAt: lyteDashboardsTable.updatedAt,
      })
      .from(lyteDashboardsTable)
      .where(
        and(eq(lyteDashboardsTable.shareToken, token), eq(lyteDashboardsTable.isShared, true)),
      );
    if (!row) {
      sendNotFound(res, 'Dashboard');
      return;
    }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get shared dashboard');
  }
});

router.put(
  '/lyte/dashboards/:id',
  authMiddleware(),
  denyIfReadOnly(),
  validateBody(
    bodyShape({
      description: z.unknown().optional(),
      isShared: z.unknown().optional(),
      name: z.unknown().optional(),
      template: z.unknown().optional(),
      widgets: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [existing] = await db
        .select()
        .from(lyteDashboardsTable)
        .where(eq(lyteDashboardsTable.id, id));
      if (!existing || existing.userId !== req.user?.id) {
        sendNotFound(res, 'Dashboard');
        return;
      }
      const { name, description, widgets, isShared, template } = req.body;
      const shareToken =
        isShared && !existing.shareToken
          ? crypto.randomBytes(16).toString('hex')
          : isShared
            ? existing.shareToken
            : null;
      const [updated] = await db
        .update(lyteDashboardsTable)
        .set({
          name: name ? String(name) : existing.name,
          description:
            description !== undefined
              ? description
                ? String(description)
                : null
              : existing.description,
          widgets: Array.isArray(widgets) ? widgets : existing.widgets,
          template:
            template !== undefined ? (template ? String(template) : null) : existing.template,
          isShared: isShared !== undefined ? Boolean(isShared) : existing.isShared,
          shareToken,
          updatedAt: new Date(),
        })
        .where(eq(lyteDashboardsTable.id, id))
        .returning();
      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update dashboard');
    }
  },
);

router.delete(
  '/lyte/dashboards/:id',
  validateBody(bodyShape({})),
  authMiddleware(),
  denyIfReadOnly(),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [existing] = await db
        .select()
        .from(lyteDashboardsTable)
        .where(eq(lyteDashboardsTable.id, id));
      if (!existing || existing.userId !== req.user?.id) {
        sendNotFound(res, 'Dashboard');
        return;
      }
      await db.delete(lyteDashboardsTable).where(eq(lyteDashboardsTable.id, id));
      sendSuccess(res, { deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete dashboard');
    }
  },
);

export default router;
