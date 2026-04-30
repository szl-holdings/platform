/**
 * SRE Observability Routes
 *
 * GET  /ops/slo-dashboard              — current SLO compliance, error budgets, burn-rate alerts
 * GET  /ops/slo-dashboard/trend/:sloId — historical compliance trend for one SLO definition
 *
 * Incident management (both paths are canonical — /ops/incidents is the primary contract):
 * GET    /ops/incidents          (alias: /ops/sre/incidents)
 * POST   /ops/incidents          (alias: /ops/sre/incidents)
 * GET    /ops/incidents/:id      (alias: /ops/sre/incidents/:id)
 * PATCH  /ops/incidents/:id      (alias: /ops/sre/incidents/:id)
 * POST   /ops/incidents/:id/timeline   (alias: /ops/sre/incidents/:id/timeline)
 * GET    /ops/incidents/:id/timeline   (alias: /ops/sre/incidents/:id/timeline)
 *
 * Protected by authMiddleware + requireRole('admin') inherited from the
 * operations router group. Additional Guardian policy enforcement is applied
 * to mutating requests by the global guardian-policy middleware.
 */

import { db, pool, sloDefinitionsTable, sloMeasurementsTable, sreIncidentsTable, sreIncidentTimelineTable } from '@szl-holdings/db';
import { desc, eq, and } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { requireOpsReady } from '../lib/boot-orchestrator';
import { logger } from '../lib/logger';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { validateBody, validateQuery } from '../lib/validation';
import { listQuerySchema } from '../lib/validation';

const router: IRouter = Router();
router.use('/ops', authMiddleware());
router.use('/ops', requireRole('admin'));
router.use('/ops', requireOpsReady);

const SRE_INCIDENT_TRANSITIONS: Record<string, string[]> = {
  open: ['investigating'],
  investigating: ['mitigating', 'open'],
  mitigating: ['resolved', 'investigating'],
  resolved: ['postmortem'],
  postmortem: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// SLO Dashboard
// ─────────────────────────────────────────────────────────────────────────────

router.get('/ops/slo-dashboard', async (_req, res) => {
  try {
    const definitions = await db
      .select()
      .from(sloDefinitionsTable)
      .where(eq(sloDefinitionsTable.enabled, true))
      .orderBy(sloDefinitionsTable.serviceGroup, sloDefinitionsTable.metricType);

    // Most recent 24h snapshot per SLO (for burn-rate and real-time status)
    const latestMeasurements = await pool.query<{
      slo_definition_id: number;
      service_group: string;
      metric_type: string;
      compliance_pct: number;
      error_budget_remaining_pct: number;
      burn_rate_1h: number | null;
      burn_rate_6h: number | null;
      burn_rate_24h: number | null;
      request_count: number;
      error_count: number;
      p50_ms: number | null;
      p95_ms: number | null;
      p99_ms: number | null;
      alert_fired: boolean;
      measured_at: string;
    }>(`
      SELECT DISTINCT ON (slo_definition_id)
        slo_definition_id,
        service_group,
        metric_type,
        compliance_pct,
        error_budget_remaining_pct,
        burn_rate_1h,
        burn_rate_6h,
        burn_rate_24h,
        request_count,
        error_count,
        p50_ms,
        p95_ms,
        p99_ms,
        alert_fired,
        measured_at
      FROM slo_measurements
      WHERE window_hours = 24
      ORDER BY slo_definition_id, measured_at DESC, id DESC
    `);

    // 30-day rolling compliance — computed from persisted measurements (survives restarts)
    const rolling30dCompliance = await pool.query<{
      slo_definition_id: number;
      compliance_30d_pct: number;
      error_budget_30d_pct: number;
      sample_count: number;
      min_compliance: number;
    }>(`
      SELECT
        slo_definition_id,
        ROUND(AVG(compliance_pct)::numeric, 4) AS compliance_30d_pct,
        ROUND(AVG(error_budget_remaining_pct)::numeric, 4) AS error_budget_30d_pct,
        COUNT(*) AS sample_count,
        ROUND(MIN(compliance_pct)::numeric, 4) AS min_compliance
      FROM slo_measurements
      WHERE window_hours = 24
        AND measured_at > NOW() - INTERVAL '30 days'
      GROUP BY slo_definition_id
    `);

    const rolling30dMap = new Map(
      rolling30dCompliance.rows.map((r) => [r.slo_definition_id, r]),
    );

    const measurementMap = new Map(
      latestMeasurements.rows.map((m) => [m.slo_definition_id, m]),
    );

    const sloStatus = definitions.map((def) => {
      const latest = measurementMap.get(def.id);
      const rolling30d = rolling30dMap.get(def.id);
      // isHealthy: error budget is not fully consumed (works for all metric types)
      const isHealthy = !latest || latest.error_budget_remaining_pct > 0;
      const isCriticalBurn =
        latest &&
        ((latest.burn_rate_1h !== null && latest.burn_rate_1h > 14.4) ||
          (latest.burn_rate_6h !== null && latest.burn_rate_6h > 6.0));

      return {
        sloId: def.id,
        serviceGroup: def.serviceGroup,
        metricType: def.metricType,
        target: def.targetValue,
        windowHours: def.windowHours,
        description: def.description,
        status: latest
          ? isCriticalBurn
            ? 'critical'
            : !isHealthy
              ? 'breached'
              : latest.error_budget_remaining_pct < 20
                ? 'at_risk'
                : 'healthy'
          : 'no_data',
        compliancePct: latest?.compliance_pct ?? null,
        errorBudgetRemainingPct: latest?.error_budget_remaining_pct ?? null,
        rolling30d: rolling30d
          ? {
              compliancePct: Number(rolling30d.compliance_30d_pct),
              errorBudgetRemainingPct: Number(rolling30d.error_budget_30d_pct),
              minCompliancePct: Number(rolling30d.min_compliance),
              sampleCount: Number(rolling30d.sample_count),
            }
          : null,
        burnRate: {
          h1: latest?.burn_rate_1h ?? null,
          h6: latest?.burn_rate_6h ?? null,
          h24: latest?.burn_rate_24h ?? null,
        },
        latency: {
          p50Ms: latest?.p50_ms ?? null,
          p95Ms: latest?.p95_ms ?? null,
          p99Ms: latest?.p99_ms ?? null,
        },
        requestCount: latest?.request_count ?? 0,
        errorCount: latest?.error_count ?? 0,
        alertFired: latest?.alert_fired ?? false,
        lastMeasuredAt: latest?.measured_at ?? null,
      };
    });

    const breached = sloStatus.filter((s) => s.status === 'breached' || s.status === 'critical');
    const atRisk = sloStatus.filter((s) => s.status === 'at_risk');
    const healthy = sloStatus.filter((s) => s.status === 'healthy');
    const noData = sloStatus.filter((s) => s.status === 'no_data');

    const activeIncidents = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM sre_incidents WHERE status NOT IN ('resolved', 'postmortem')`,
    );

    const recentAlerts = await pool.query<{
      service_group: string;
      metric_type: string;
      compliance_pct: number;
      error_budget_remaining_pct: number;
      measured_at: string;
    }>(`
      SELECT service_group, metric_type, compliance_pct, error_budget_remaining_pct, measured_at
      FROM slo_measurements
      WHERE alert_fired = true AND measured_at > NOW() - INTERVAL '24 hours'
      ORDER BY measured_at DESC
      LIMIT 20
    `);

    res.json({
      summary: {
        total: sloStatus.length,
        healthy: healthy.length,
        atRisk: atRisk.length,
        breached: breached.length,
        noData: noData.length,
        activeIncidents: parseInt(activeIncidents.rows[0]?.count ?? '0', 10),
      },
      slos: sloStatus,
      recentBurnRateAlerts: recentAlerts.rows.map((a) => ({
        serviceGroup: a.service_group,
        metricType: a.metric_type,
        compliancePct: a.compliance_pct,
        errorBudgetRemainingPct: a.error_budget_remaining_pct,
        firedAt: a.measured_at,
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, '[sre] Failed to build SLO dashboard');
    res.status(500).json({ error: 'Failed to load SLO dashboard' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SLO Historical Trend (last N measurements for a definition)
// ─────────────────────────────────────────────────────────────────────────────

router.get('/ops/slo-dashboard/trend/:sloId', async (req, res) => {
  try {
    const sloId = parseInt(req.params.sloId, 10);
    if (isNaN(sloId)) return res.status(400).json({ error: 'Invalid sloId' });

    const measurements = await db
      .select()
      .from(sloMeasurementsTable)
      .where(eq(sloMeasurementsTable.sloDefinitionId, sloId))
      .orderBy(desc(sloMeasurementsTable.measuredAt))
      .limit(288);

    res.json({ sloId, measurements });
  } catch (err) {
    logger.error({ err }, '[sre] Failed to fetch SLO trend');
    res.status(500).json({ error: 'Failed to load SLO trend' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SRE Incidents — sub-router (mounted at both /ops/incidents and /ops/sre/incidents)
// ─────────────────────────────────────────────────────────────────────────────

const createSreIncidentSchema = z.object({
  title: z.string().min(3).max(300),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  affectedServices: z.array(z.string()).default([]),
  description: z.string().optional(),
  assignee: z.string().optional(),
  sloImpacted: z.boolean().default(false),
  impactedSloServices: z.array(z.string()).default([]),
});

const updateSreIncidentSchema = z.object({
  status: z.enum(['open', 'investigating', 'mitigating', 'resolved', 'postmortem']).optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  assignee: z.string().optional(),
  rootCause: z.string().optional(),
  resolutionNotes: z.string().optional(),
  postmortemUrl: z.string().url().optional(),
  timelineMessage: z.string().optional(),
  author: z.string().optional(),
});

const addTimelineSchema = z.object({
  message: z.string().min(1).max(2000),
  eventType: z.enum(['update', 'assigned', 'slo_linked']).default('update'),
  author: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const incidentsRouter: IRouter = Router();

incidentsRouter.get('/', validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { status, severity } = req.query as { status?: string; severity?: string };

    const conditions = [];
    if (status) conditions.push(eq(sreIncidentsTable.status, status as never));
    if (severity) conditions.push(eq(sreIncidentsTable.severity, severity as never));

    const incidents = await db
      .select()
      .from(sreIncidentsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(sreIncidentsTable.detectedAt))
      .limit(100);

    res.json({ incidents });
  } catch (err) {
    logger.error({ err }, '[sre] Failed to list SRE incidents');
    res.status(500).json({ error: 'Failed to list SRE incidents' });
  }
});

incidentsRouter.post('/', validateBody(createSreIncidentSchema), async (req, res) => {
  try {
    const body = createSreIncidentSchema.parse(req.body);
    const incidentKey = `INC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const [incident] = await db
      .insert(sreIncidentsTable)
      .values({
        incidentKey,
        title: body.title,
        severity: body.severity,
        status: 'open',
        affectedServices: body.affectedServices,
        description: body.description,
        assignee: body.assignee,
        sloImpacted: body.sloImpacted,
        impactedSloServices: body.impactedSloServices,
        detectedAt: new Date(),
      })
      .returning();

    await db.insert(sreIncidentTimelineTable).values({
      incidentId: incident.id,
      eventType: 'created',
      message: `Incident created: ${body.title}`,
      newStatus: 'open',
      author: (req as unknown as { user?: { email?: string } }).user?.email ?? 'system',
    });

    logger.info({ incidentId: incident.id, incidentKey, severity: body.severity }, '[sre] SRE incident created');
    res.status(201).json({ incident });
  } catch (err) {
    logger.error({ err }, '[sre] Failed to create SRE incident');
    res.status(500).json({ error: 'Failed to create SRE incident' });
  }
});

incidentsRouter.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid incident ID' });

    const [incident] = await db
      .select()
      .from(sreIncidentsTable)
      .where(eq(sreIncidentsTable.id, id));

    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const timeline = await db
      .select()
      .from(sreIncidentTimelineTable)
      .where(eq(sreIncidentTimelineTable.incidentId, id))
      .orderBy(sreIncidentTimelineTable.occurredAt);

    res.json({ incident, timeline });
  } catch (err) {
    logger.error({ err }, '[sre] Failed to get SRE incident');
    res.status(500).json({ error: 'Failed to get SRE incident' });
  }
});

incidentsRouter.patch('/:id', validateBody(updateSreIncidentSchema), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid incident ID' });

    const body = updateSreIncidentSchema.parse(req.body);
    const actor = (req as unknown as { user?: { email?: string } }).user?.email ?? 'system';

    const [current] = await db
      .select({ status: sreIncidentsTable.status })
      .from(sreIncidentsTable)
      .where(eq(sreIncidentsTable.id, id));

    if (!current) return res.status(404).json({ error: 'Incident not found' });

    if (body.status && body.status !== current.status) {
      const allowed = SRE_INCIDENT_TRANSITIONS[current.status] ?? [];
      if (!allowed.includes(body.status)) {
        return res.status(422).json({
          error: `Invalid status transition: ${current.status} → ${body.status}`,
          allowed,
        });
      }
    }

    const updates: Partial<typeof sreIncidentsTable.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.status) updates.status = body.status;
    if (body.severity) updates.severity = body.severity;
    if (body.assignee !== undefined) updates.assignee = body.assignee;
    if (body.rootCause !== undefined) updates.rootCause = body.rootCause;
    if (body.resolutionNotes !== undefined) updates.resolutionNotes = body.resolutionNotes;
    if (body.postmortemUrl !== undefined) updates.postmortemUrl = body.postmortemUrl;

    if (body.status === 'resolved' && !current.status.startsWith('resolved')) {
      updates.resolvedAt = new Date();
    }
    if (body.status === 'investigating' && current.status === 'open') {
      updates.acknowledgedAt = new Date();
    }

    const [updated] = await db
      .update(sreIncidentsTable)
      .set(updates)
      .where(eq(sreIncidentsTable.id, id))
      .returning();

    const timelineEntries: typeof sreIncidentTimelineTable.$inferInsert[] = [];

    if (body.status && body.status !== current.status) {
      timelineEntries.push({
        incidentId: id,
        eventType: body.status === 'resolved' ? 'resolved' : 'status_changed',
        message: `Status changed from ${current.status} to ${body.status}`,
        previousStatus: current.status,
        newStatus: body.status,
        author: actor,
      });
    }

    if (body.assignee) {
      timelineEntries.push({
        incidentId: id,
        eventType: 'assigned',
        message: `Assigned to ${body.assignee}`,
        author: actor,
      });
    }

    if (body.postmortemUrl) {
      timelineEntries.push({
        incidentId: id,
        eventType: 'postmortem_added',
        message: `Postmortem linked: ${body.postmortemUrl}`,
        author: actor,
      });
    }

    if (body.timelineMessage) {
      timelineEntries.push({
        incidentId: id,
        eventType: 'update',
        message: body.timelineMessage,
        author: body.author ?? actor,
      });
    }

    if (timelineEntries.length > 0) {
      await db.insert(sreIncidentTimelineTable).values(timelineEntries);
    }

    res.json({ incident: updated });
  } catch (err) {
    logger.error({ err }, '[sre] Failed to update SRE incident');
    res.status(500).json({ error: 'Failed to update SRE incident' });
  }
});

incidentsRouter.post('/:id/timeline', validateBody(addTimelineSchema), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid incident ID' });

    const body = addTimelineSchema.parse(req.body);
    const actor = (req as unknown as { user?: { email?: string } }).user?.email ?? 'system';

    const [incident] = await db
      .select({ id: sreIncidentsTable.id })
      .from(sreIncidentsTable)
      .where(eq(sreIncidentsTable.id, id));

    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const [entry] = await db
      .insert(sreIncidentTimelineTable)
      .values({
        incidentId: id,
        eventType: body.eventType,
        message: body.message,
        author: body.author ?? actor,
        metadata: body.metadata ?? {},
      })
      .returning();

    res.status(201).json({ entry });
  } catch (err) {
    logger.error({ err }, '[sre] Failed to add timeline entry');
    res.status(500).json({ error: 'Failed to add timeline entry' });
  }
});

incidentsRouter.get('/:id/timeline', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid incident ID' });

    const timeline = await db
      .select()
      .from(sreIncidentTimelineTable)
      .where(eq(sreIncidentTimelineTable.incidentId, id))
      .orderBy(sreIncidentTimelineTable.occurredAt);

    res.json({ incidentId: id, timeline });
  } catch (err) {
    logger.error({ err }, '[sre] Failed to get incident timeline');
    res.status(500).json({ error: 'Failed to get incident timeline' });
  }
});

// Mount incidents sub-router at primary contract path and the legacy /sre/ alias
router.use('/ops/incidents', incidentsRouter);
router.use('/ops/sre/incidents', incidentsRouter);

export default router;
