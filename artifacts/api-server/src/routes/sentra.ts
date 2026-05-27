import { randomUUID } from 'node:crypto';
import { db, sentraAlertsTable, sentraIncidentsTable } from '@szl-holdings/db';
import { desc, eq, not, inArray, sql } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendCreated, sendNotFound, sendSuccess } from '../lib/api-response';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../lib/validation';
import { logger } from '../lib/logger';
import { getReflexivityRuntime } from '../lib/cognitive-reflexivity-runtime';
import {
  getLatestTemporalScore,
  getLatestVerdict,
} from '../lib/sentra-detector-council.js';

/**
 * Emit a cognitive-reflexive observation when a Sentra incident is created.
 * Critical / high severity incidents push the engine to consider detection
 * tuning strategies. Best-effort — never throws into the request path.
 */
function emitSentraIncidentReflexive(opts: {
  incidentId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  mitreStage?: string;
  affectedAssets: string[];
}): void {
  if (opts.severity === 'low' || opts.severity === 'medium') return;
  try {
    const runtime = getReflexivityRuntime();
    const intensity = opts.severity === 'critical' ? 0.9 : 0.7;
    runtime.engine.emit({
      subtype: 'detection.true_positive_confirmed',
      observation: `Sentra incident ${opts.incidentId} (${opts.severity}): ${opts.title}`,
      intensity,
      evidenceRefs: [`sentra:incident:${opts.incidentId}`, ...opts.affectedAssets.map((a) => `asset:${a}`)],
      data: {
        incidentId: opts.incidentId,
        severity: opts.severity,
        mitreStage: opts.mitreStage,
        affectedAssetCount: opts.affectedAssets.length,
      },
      source: 'system',
    });
  } catch (err) {
    logger.debug({ err }, 'Failed to emit sentra incident reflexive signal');
  }
}

const router: IRouter = Router();

// ────────────────────────────────────────────────────────────────────────────
// Zod schemas
// ────────────────────────────────────────────────────────────────────────────

const createIncidentSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  mitreStage: z.string().optional().default('Initial Access'),
  affectedAssets: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  assignedTo: z.string().optional(),
});

const updateIncidentSchema = z.object({
  status: z.enum(['open', 'triaging', 'escalated', 'contained', 'resolved']).optional(),
  assignedTo: z.string().optional(),
  note: z.string().optional(),
  actor: z.string().optional(),
});

const acknowledgeAlertSchema = z.object({
  status: z.enum(['acknowledged', 'suppressed', 'open']),
});

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function rowToIncident(row: typeof sentraIncidentsTable.$inferSelect) {
  // AGI-stack enrichment (#5503): if the Council/Time-R1 fired with the
  // incident id as correlation key, surface the latest verdict + temporal
  // score inline so the commander list can prioritise without an extra
  // round-trip. Both fields are optional and null when no signal exists.
  const verdict = getLatestVerdict(row.id);
  const temporal = getLatestTemporalScore(row.id);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    severity: row.severity,
    status: row.status,
    mitreStage: row.mitreStage,
    detectedAt: row.detectedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString(),
    assignedTo: row.assignedTo ?? undefined,
    affectedAssets: (row.affectedAssets as string[]) ?? [],
    tags: (row.tags as string[]) ?? [],
    timeline: (row.timeline as unknown[]) ?? [],
    councilSeverity: verdict?.arbitratedSeverity ?? null,
    councilConfidence: verdict?.confidence ?? null,
    councilGovernanceCeiling: verdict?.governanceCeiling ?? null,
    temporalScore: temporal?.temporalScore ?? null,
    temporalSeverity: temporal?.severity ?? null,
  };
}

function rowToAlert(row: typeof sentraAlertsTable.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    severity: row.severity,
    source: row.source,
    status: row.status,
    description: row.description,
    asset: row.asset ?? undefined,
    detectedAt: row.detectedAt.toISOString(),
    linkedIncidentId: row.linkedIncidentId ?? undefined,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────────────────────────────────

// GET /api/sentra/incidents
// Pagination: ?limit=N (default 200, max 1000), ?offset=M (default 0).
// Default cap of 200 keeps demo payloads under ~120KB even when the org has
// 1000+ incidents on file (was returning ~558KB before the cap was added).
router.get('/sentra/incidents', async (req: Request, res: Response) => {
  try {
    const limitRaw = Number.parseInt(String(req.query.limit ?? ''), 10);
    const offsetRaw = Number.parseInt(String(req.query.offset ?? ''), 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 1000) : 200;
    const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;

    const [rows, totalRow] = await Promise.all([
      db
        .select()
        .from(sentraIncidentsTable)
        .orderBy(desc(sentraIncidentsTable.detectedAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(sentraIncidentsTable),
    ]);
    const incidents = rows.map(rowToIncident);
    const total = totalRow[0]?.count ?? incidents.length;
    sendSuccess(res, { incidents, total, returned: incidents.length, limit, offset, source: 'live' });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list incidents');
  }
});

// GET /api/sentra/incidents/:id
router.get('/sentra/incidents/:id', async (req: Request, res: Response) => {
  try {
    const [row] = await db
      .select()
      .from(sentraIncidentsTable)
      .where(eq(sentraIncidentsTable.id, req.params.id as string))
      .limit(1);
    if (!row) {
      sendNotFound(res, 'Incident');
      return;
    }
    sendSuccess(res, rowToIncident(row));
  } catch (err) {
    handleRouteError(res, err, 'Failed to get incident');
  }
});

// POST /api/sentra/incidents
router.post('/sentra/incidents', authMiddleware(), validateBody(createIncidentSchema), async (req: Request, res: Response) => {
  try {
    const body = req.body as z.infer<typeof createIncidentSchema>;
    const id = `INC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const now = new Date();
    const initialTimeline = [
      {
        id: randomUUID(),
        type: 'system',
        message: `Incident ${id} created`,
        actor: body.assignedTo ?? 'Operator',
        timestamp: now.toISOString(),
      },
    ];

    const [row] = await db
      .insert(sentraIncidentsTable)
      .values({
        id,
        title: body.title,
        description: body.description,
        severity: body.severity,
        status: 'open',
        mitreStage: body.mitreStage ?? 'Initial Access',
        detectedAt: now,
        updatedAt: now,
        affectedAssets: body.affectedAssets ?? [],
        tags: body.tags ?? [],
        assignedTo: body.assignedTo ?? null,
        timeline: initialTimeline,
      })
      .returning();

    if (!row) {
      handleRouteError(res, new Error('Insert returned no row'), 'Failed to create incident');
      return;
    }

    logger.info({ id }, '[sentra] incident created');
    emitSentraIncidentReflexive({
      incidentId: id,
      severity: body.severity,
      title: body.title,
      mitreStage: body.mitreStage,
      affectedAssets: body.affectedAssets ?? [],
    });
    sendCreated(res, rowToIncident(row));
  } catch (err) {
    handleRouteError(res, err, 'Failed to create incident');
  }
});

// PATCH /api/sentra/incidents/:id
router.patch('/sentra/incidents/:id', authMiddleware(), validateBody(updateIncidentSchema), async (req: Request, res: Response) => {
  try {
    const incidentId = req.params.id as string;
    const [existing] = await db
      .select()
      .from(sentraIncidentsTable)
      .where(eq(sentraIncidentsTable.id, incidentId))
      .limit(1);

    if (!existing) {
      sendNotFound(res, 'Incident');
      return;
    }

    const body = req.body as z.infer<typeof updateIncidentSchema>;
    const now = new Date();
    const prevStatus = existing.status;
    const actor = body.actor ?? existing.assignedTo ?? 'Operator';

    const tlEntry = {
      id: randomUUID(),
      type:
        body.status === 'resolved'
          ? 'resolution'
          : body.status === 'escalated'
            ? 'escalation'
            : 'user',
      message:
        body.note ??
        (body.status && body.status !== prevStatus
          ? `Status changed: ${prevStatus} → ${body.status}`
          : body.assignedTo
            ? `Assigned to ${body.assignedTo}`
            : 'Incident updated'),
      actor,
      timestamp: now.toISOString(),
    };

    const existingTimeline = (existing.timeline as unknown[]) ?? [];
    const updatedTimeline = [tlEntry, ...existingTimeline];

    const updateValues: Partial<typeof sentraIncidentsTable.$inferInsert> = {
      updatedAt: now,
      timeline: updatedTimeline,
    };
    if (body.status) updateValues.status = body.status;
    if (body.assignedTo !== undefined) updateValues.assignedTo = body.assignedTo;
    if (body.status === 'resolved') updateValues.resolvedAt = now;

    const [updated] = await db
      .update(sentraIncidentsTable)
      .set(updateValues)
      .where(eq(sentraIncidentsTable.id, incidentId))
      .returning();

    if (!updated) {
      handleRouteError(res, new Error('Update returned no row'), 'Failed to update incident');
      return;
    }

    logger.info({ id: incidentId, status: updated.status }, '[sentra] incident updated');
    sendSuccess(res, rowToIncident(updated));
  } catch (err) {
    handleRouteError(res, err, 'Failed to update incident');
  }
});

// GET /api/sentra/alerts
// Pagination: ?limit=N (default 200, max 1000), ?offset=M (default 0).
// Default cap keeps payload bounded (~80KB) even when 1000+ alerts exist.
router.get('/sentra/alerts', async (req: Request, res: Response) => {
  try {
    const limitRaw = Number.parseInt(String(req.query.limit ?? ''), 10);
    const offsetRaw = Number.parseInt(String(req.query.offset ?? ''), 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 1000) : 200;
    const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;

    const [rows, totalRow] = await Promise.all([
      db
        .select()
        .from(sentraAlertsTable)
        .orderBy(desc(sentraAlertsTable.detectedAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(sentraAlertsTable),
    ]);
    const alerts = rows.map(rowToAlert);
    const total = totalRow[0]?.count ?? alerts.length;
    sendSuccess(res, { alerts, total, returned: alerts.length, limit, offset, source: 'live' });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list alerts');
  }
});

// PATCH /api/sentra/alerts/:id
router.patch('/sentra/alerts/:id', authMiddleware(), validateBody(acknowledgeAlertSchema), async (req: Request, res: Response) => {
  try {
    const alertId = req.params.id as string;
    const [existing] = await db
      .select()
      .from(sentraAlertsTable)
      .where(eq(sentraAlertsTable.id, alertId))
      .limit(1);

    if (!existing) {
      sendNotFound(res, 'Alert');
      return;
    }

    const body = req.body as z.infer<typeof acknowledgeAlertSchema>;
    const [updated] = await db
      .update(sentraAlertsTable)
      .set({ status: body.status, updatedAt: new Date() })
      .where(eq(sentraAlertsTable.id, alertId))
      .returning();

    if (!updated) {
      handleRouteError(res, new Error('Update returned no row'), 'Failed to update alert');
      return;
    }

    logger.info({ id: alertId, status: updated.status }, '[sentra] alert updated');
    sendSuccess(res, rowToAlert(updated));
  } catch (err) {
    handleRouteError(res, err, 'Failed to update alert');
  }
});

// GET /api/sentra/summary
router.get('/sentra/summary', async (_req: Request, res: Response) => {
  try {
    const [activeIncidentsResult, criticalAlertsResult, totalOpenAlertsResult] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(sentraIncidentsTable)
        .where(not(inArray(sentraIncidentsTable.status, ['resolved', 'contained']))),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(sentraAlertsTable)
        .where(eq(sentraAlertsTable.status, 'open')),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(sentraAlertsTable)
        .where(eq(sentraAlertsTable.status, 'open')),
    ]);

    const criticalAlerts = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sentraAlertsTable)
      .where(
        sql`${sentraAlertsTable.severity} = 'critical' AND ${sentraAlertsTable.status} = 'open'`,
      );

    sendSuccess(res, {
      source: 'live',
      activeIncidents: activeIncidentsResult[0]?.count ?? 0,
      criticalAlerts: criticalAlerts[0]?.count ?? 0,
      totalAlerts: totalOpenAlertsResult[0]?.count ?? 0,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get summary');
  }
});

export default router;
