import { randomUUID } from 'crypto';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendCreated, sendError, sendNotFound, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { logger } from '../lib/logger';
import {
  type IncidentSeverity,
  type IncidentStatus,
  type Incident,
  type Alert,
  type TimelineEntry,
  hoursAgo,
  minsAgo,
  incidentsStore,
  alertsStore,
} from '../services/sentra-store';

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
// Routes
// ────────────────────────────────────────────────────────────────────────────

// GET /api/sentra/incidents
router.get('/sentra/incidents', (_req: Request, res: Response) => {
  try {
    const incidents = Array.from(incidentsStore.values()).sort(
      (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime(),
    );
    sendSuccess(res, { incidents, total: incidents.length, source: 'live' });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list incidents');
  }
});

// GET /api/sentra/incidents/:id
router.get('/sentra/incidents/:id', (req: Request, res: Response) => {
  try {
    const incident = incidentsStore.get(req.params.id as string);
    if (!incident) {
      sendNotFound(res, 'Incident');
      return;
    }
    sendSuccess(res, incident);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get incident');
  }
});

// POST /api/sentra/incidents
router.post('/sentra/incidents', validateBody(createIncidentSchema), (req: Request, res: Response) => {
  try {
    const body = req.body as z.infer<typeof createIncidentSchema>;
    const id = `INC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const now = new Date().toISOString();
    const incident: Incident = {
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
      assignedTo: body.assignedTo,
      timeline: [
        {
          id: randomUUID(),
          type: 'system',
          message: `Incident ${id} created`,
          actor: body.assignedTo ?? 'Operator',
          timestamp: now,
        },
      ],
    };
    incidentsStore.set(id, incident);
    logger.info({ id }, '[sentra] incident created');
    sendCreated(res, incident);
  } catch (err) {
    handleRouteError(res, err, 'Failed to create incident');
  }
});

// PATCH /api/sentra/incidents/:id
router.patch('/sentra/incidents/:id', validateBody(updateIncidentSchema), (req: Request, res: Response) => {
  try {
    const incident = incidentsStore.get(req.params.id as string);
    if (!incident) {
      sendNotFound(res, 'Incident');
      return;
    }
    const body = req.body as z.infer<typeof updateIncidentSchema>;
    const now = new Date().toISOString();
    const prev = incident.status;

    if (body.status) incident.status = body.status;
    if (body.assignedTo !== undefined) incident.assignedTo = body.assignedTo;
    incident.updatedAt = now;

    if (body.status === 'resolved') {
      incident.resolvedAt = now;
    }

    const actor = body.actor ?? incident.assignedTo ?? 'Operator';
    const tlEntry: TimelineEntry = {
      id: randomUUID(),
      type:
        body.status === 'resolved'
          ? 'resolution'
          : body.status === 'escalated'
            ? 'escalation'
            : 'user',
      message:
        body.note ??
        (body.status && body.status !== prev
          ? `Status changed: ${prev} → ${body.status}`
          : body.assignedTo
            ? `Assigned to ${body.assignedTo}`
            : 'Incident updated'),
      actor,
      timestamp: now,
    };
    incident.timeline.unshift(tlEntry);
    incidentsStore.set(incident.id, incident);
    logger.info({ id: incident.id, status: incident.status }, '[sentra] incident updated');
    sendSuccess(res, incident);
  } catch (err) {
    handleRouteError(res, err, 'Failed to update incident');
  }
});

// GET /api/sentra/alerts
router.get('/sentra/alerts', (_req: Request, res: Response) => {
  try {
    const sorted = [...alertsStore].sort(
      (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime(),
    );
    sendSuccess(res, { alerts: sorted, total: sorted.length, source: 'live' });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list alerts');
  }
});

// PATCH /api/sentra/alerts/:id
router.patch('/sentra/alerts/:id', validateBody(acknowledgeAlertSchema), (req: Request, res: Response) => {
  try {
    const alert = alertsStore.find((a) => a.id === req.params.id);
    if (!alert) {
      sendNotFound(res, 'Alert');
      return;
    }
    const body = req.body as z.infer<typeof acknowledgeAlertSchema>;
    alert.status = body.status;
    logger.info({ id: alert.id, status: alert.status }, '[sentra] alert updated');
    sendSuccess(res, alert);
  } catch (err) {
    handleRouteError(res, err, 'Failed to update alert');
  }
});

// GET /api/sentra/summary
router.get('/sentra/summary', (_req: Request, res: Response) => {
  try {
    const incidents = Array.from(incidentsStore.values());
    const openIncidents = incidents.filter((i) => !['resolved', 'contained'].includes(i.status));
    const criticalAlerts = alertsStore.filter((a) => a.severity === 'critical' && a.status === 'open');
    sendSuccess(res, {
      source: 'live',
      activeIncidents: openIncidents.length,
      criticalAlerts: criticalAlerts.length,
      totalAlerts: alertsStore.filter((a) => a.status === 'open').length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get summary');
  }
});

export default router;
