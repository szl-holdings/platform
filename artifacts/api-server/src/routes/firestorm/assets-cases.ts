import { type DecisionObjectType, validateAndBuildDecision } from '@szl-holdings/ai-engine';
import { bodyShape } from '@szl-holdings/contracts/common';
import {
  alloyRuntimeAgentsTable,
  alloyRuntimeAgentVersionsTable,
  db,
  inferenceLogTable,
  firestormAlertsTable,
  firestormAnalystNotebookTable,
  firestormAssetsTable,
  firestormCaseMemoryTable,
  firestormCasesTable,
  firestormHardeningControlsTable,
  firestormIncidentsTable,
  firestormMitreDetectionsTable,
  firestormTradecraftDecisionsTable,
  firestormTradecraftValidationAuditTable,
  firestormWorkflowActionsTable,
  type InsertFirestormCaseMemory,
  insertFirestormAnalystNotebookSchema,
  insertFirestormAssetSchema,
  insertFirestormCaseSchema,
  insertFirestormTradecraftDecisionSchema,
  insertFirestormWorkflowActionSchema,
} from '@szl-holdings/db';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendError,
  sendForbidden,
  sendNoContent,
  sendNotFound,
  sendSuccess,
} from '../../lib/api-response';
import { logger } from '../../lib/logger';
import { isProductionEnvironment } from '../../lib/seed-guard';
import {
  ingestDecisionToEvidenceIndex,
  queryEvidenceIndex,
} from '../../lib/tradecraft-evidence-store';
import { listQuerySchema, validateBody, validateQuery } from '../../lib/validation';
import { authMiddleware, parseIdParam } from '../../middlewares/auth';
import {
  evidenceIndexQuerySchema,
  ingestSyslogSchema,
  pushTokenSchema,
  tradecraftDecisionActionSchema,
  tradecraftDecisionInputSchema,
  updateCaseMemorySchema,
  updateCaseSchema,
  updateHardeningControlSchema,
  updateWorkflowActionSchema,
} from './shared';

const router = Router();

router.get('/firestorm/assets', authMiddleware(), async (_req, res) => {
  try {
    const assets = await db
      .select()
      .from(firestormAssetsTable)
      .orderBy(desc(firestormAssetsTable.riskScore));
    sendSuccess(res, assets);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list assets');
  }
});

router.get('/firestorm/assets/:id', authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id as string);
    const [asset] = await db
      .select()
      .from(firestormAssetsTable)
      .where(eq(firestormAssetsTable.id, id));
    if (!asset) {
      sendNotFound(res, 'Asset');
      return;
    }
    sendSuccess(res, asset);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get asset');
  }
});

router.post(
  '/firestorm/assets',
  authMiddleware({ required: true }),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const data = insertFirestormAssetSchema.parse(req.body);
      const [asset] = await db.insert(firestormAssetsTable).values(data).returning();
      sendCreated(res, asset);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create asset');
    }
  },
);

router.put(
  '/firestorm/assets/:id',
  authMiddleware({ required: true }),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id as string);
      const data = insertFirestormAssetSchema.partial().parse(req.body);
      const [asset] = await db
        .update(firestormAssetsTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(firestormAssetsTable.id, id))
        .returning();
      if (!asset) {
        sendNotFound(res, 'Asset');
        return;
      }
      sendSuccess(res, asset);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update asset');
    }
  },
);

router.get(
  '/firestorm/workflow-actions',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const entityType = req.query.entityType as string | undefined;
      const entityId = req.query.entityId ? parseInt(req.query.entityId as string, 10) : undefined;
      const query = db
        .select()
        .from(firestormWorkflowActionsTable)
        .orderBy(desc(firestormWorkflowActionsTable.createdAt));
      const actions = await query;
      const filtered = actions.filter((a) => {
        if (entityType && a.entityType !== entityType) return false;
        if (entityId && a.entityId !== entityId) return false;
        return true;
      });
      sendSuccess(res, filtered);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list workflow actions');
    }
  },
);

router.post(
  '/firestorm/workflow-actions',
  authMiddleware({ required: true }),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const data = insertFirestormWorkflowActionSchema.parse(req.body);
      const [action] = await db.insert(firestormWorkflowActionsTable).values(data).returning();
      sendCreated(res, action);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create workflow action');
    }
  },
);

router.patch(
  '/firestorm/workflow-actions/:id',
  authMiddleware({ required: true }),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id as string);
      const { status, notes, assignedTo, completedAt } = updateWorkflowActionSchema.parse(req.body);
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (status) updateData.status = status;
      if (notes) updateData.notes = notes;
      if (assignedTo) updateData.assignedTo = assignedTo;
      if (completedAt) updateData.completedAt = completedAt;
      const [action] = await db
        .update(firestormWorkflowActionsTable)
        .set(updateData)
        .where(eq(firestormWorkflowActionsTable.id, id))
        .returning();
      if (!action) {
        sendNotFound(res, 'Workflow action');
        return;
      }
      sendSuccess(res, action);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update workflow action');
    }
  },
);

router.get(
  '/firestorm/hardening-controls',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const categoryFilter = req.query.category as string | undefined;
      const statusFilter = req.query.status as string | undefined;
      const controls = await db
        .select()
        .from(firestormHardeningControlsTable)
        .orderBy(firestormHardeningControlsTable.controlId);
      const filtered = controls.filter((c) => {
        if (categoryFilter && c.category !== categoryFilter) return false;
        if (statusFilter && c.status !== statusFilter) return false;
        return true;
      });
      sendSuccess(res, filtered);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list hardening controls');
    }
  },
);

router.get('/firestorm/hardening-controls/:id', authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id as string);
    const [control] = await db
      .select()
      .from(firestormHardeningControlsTable)
      .where(eq(firestormHardeningControlsTable.id, id));
    if (!control) {
      sendNotFound(res, 'Hardening control');
      return;
    }
    sendSuccess(res, control);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get hardening control');
  }
});

router.put(
  '/firestorm/hardening-controls/:id',
  authMiddleware({ required: true }),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id as string);
      const { status, owner, recommendedAction, dueDate, notes } =
        updateHardeningControlSchema.parse(req.body);
      const [current] = await db
        .select()
        .from(firestormHardeningControlsTable)
        .where(eq(firestormHardeningControlsTable.id, id));
      if (!current) {
        sendNotFound(res, 'Hardening control');
        return;
      }

      const updates: Partial<typeof firestormHardeningControlsTable.$inferInsert> & {
        updatedAt: Date;
      } = { updatedAt: new Date() };
      if (status !== undefined) updates.status = status as typeof current.status;
      if (owner !== undefined) updates.owner = owner;
      if (recommendedAction !== undefined) updates.recommendedAction = recommendedAction;
      if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;

      const existingTrail = Array.isArray(current.auditTrail) ? current.auditTrail : [];
      const changedFields = Object.keys(updates).filter((k) => k !== 'updatedAt');
      const auditEntry = {
        action: notes ?? `Updated: ${changedFields.join(', ')}`,
        user: 'Operator',
        at: new Date().toISOString(),
      };
      updates.auditTrail = [...existingTrail, auditEntry];
      updates.lastReviewedAt = new Date();

      const [control] = await db
        .update(firestormHardeningControlsTable)
        .set(updates)
        .where(eq(firestormHardeningControlsTable.id, id))
        .returning();

      if (status === 'implemented' && current.status !== 'implemented') {
        await db.insert(firestormWorkflowActionsTable).values({
          entityType: 'asset',
          entityId: id,
          actionType: 'remediate',
          assignedTo: owner ?? current.owner ?? undefined,
          status: 'completed',
          notes: `Hardening control ${current.controlId} marked implemented: ${current.name}`,
          triggeredBy: 'hardening-control-update',
        });
      }

      sendSuccess(res, control);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update hardening control');
    }
  },
);

router.get('/firestorm/hardening-summary', authMiddleware(), async (_req, res) => {
  try {
    const controls = await db.select().from(firestormHardeningControlsTable);
    const implemented = controls.filter((c) => c.status === 'implemented').length;
    const partial = controls.filter((c) => c.status === 'partial').length;
    const notImplemented = controls.filter((c) => c.status === 'not_implemented').length;
    const criticalGaps = controls.filter(
      (c) => c.priority === 'critical' && c.status === 'not_implemented',
    ).length;
    const totalScore =
      controls.length > 0
        ? Math.round(((implemented * 1 + partial * 0.5) / controls.length) * 100)
        : 0;

    const byCategory = [
      'mfa_credential',
      'application_hardening',
      'config_hardening',
      'dependency_supply_chain',
      'vulnerability_assessment',
    ].map((cat) => {
      const catControls = controls.filter((c) => c.category === cat);
      const catImplemented = catControls.filter((c) => c.status === 'implemented').length;
      const catPartial = catControls.filter((c) => c.status === 'partial').length;
      const catScore =
        catControls.length > 0
          ? Math.round(((catImplemented * 1 + catPartial * 0.5) / catControls.length) * 100)
          : 0;
      const catGaps = catControls.filter(
        (c) => c.priority === 'critical' && c.status === 'not_implemented',
      ).length;
      return {
        category: cat,
        total: catControls.length,
        implemented: catImplemented,
        partial: catPartial,
        notImplemented: catControls.length - catImplemented - catPartial,
        score: catScore,
        criticalGaps: catGaps,
      };
    });

    sendSuccess(res, {
      total: controls.length,
      implemented,
      partial,
      notImplemented,
      criticalGaps,
      overallScore: totalScore,
      byCategory,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get hardening summary');
  }
});

router.post(
  '/firestorm/push-token',
  authMiddleware({ required: true }),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const { token, platform } = pushTokenSchema.parse(req.body);
      logger.info(
        { platform: platform ?? 'unknown', tokenLength: token.length },
        '[Push] Registered push token',
      );
      sendSuccess(res, { registered: true, platform: platform ?? 'unknown' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to register push token');
    }
  },
);

router.post(
  '/firestorm/ingest/syslog',
  authMiddleware({ required: true }),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const body = ingestSyslogSchema.parse(req.body ?? {});
      const rawMessage = body?.message || body?.raw || '';
      const severity = /crit|emerg|alert/i.test(rawMessage)
        ? 'critical'
        : /error|err\b/i.test(rawMessage)
          ? 'high'
          : /warn/i.test(rawMessage)
            ? 'medium'
            : 'low';
      const title = rawMessage.slice(0, 120) || 'Syslog event';
      const [alert] = await db
        .insert(firestormAlertsTable)
        .values({
          title,
          description: rawMessage.slice(0, 1000),
          severity: severity as 'low' | 'medium' | 'high' | 'critical',
          source: body?.host || body?.hostname || 'syslog',
          status: 'new',
          metadata: body,
        })
        .returning();
      sendCreated(res, { message: 'Syslog event ingested', alertId: alert.id, severity });
    } catch (err) {
      handleRouteError(res, err, 'Failed to ingest syslog event');
    }
  },
);

router.get(
  '/firestorm/cases',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const statusFilter = req.query.status as string | undefined;
      const priorityFilter = req.query.priority as string | undefined;
      const cases = await db
        .select()
        .from(firestormCasesTable)
        .orderBy(desc(firestormCasesTable.createdAt));
      const filtered = cases.filter((c) => {
        if (statusFilter && c.status !== statusFilter) return false;
        if (priorityFilter && c.priority !== priorityFilter) return false;
        return true;
      });
      sendSuccess(res, filtered);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list cases');
    }
  },
);

router.get('/firestorm/cases/:id', authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id as string);
    const [c] = await db.select().from(firestormCasesTable).where(eq(firestormCasesTable.id, id));
    if (!c) {
      sendNotFound(res, 'Case');
      return;
    }
    sendSuccess(res, c);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get case');
  }
});

router.post(
  '/firestorm/cases',
  authMiddleware({ required: true }),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const data = insertFirestormCaseSchema.parse(req.body);
      const [c] = await db.insert(firestormCasesTable).values(data).returning();
      sendCreated(res, c);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create case');
    }
  },
);

router.patch(
  '/firestorm/cases/:id',
  authMiddleware({ required: true }),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id as string);
      const parsedCase = updateCaseSchema.parse(req.body);
      const { status, priority, assignedAnalyst, note, evidenceItem } = parsedCase;
      const [current] = await db
        .select()
        .from(firestormCasesTable)
        .where(eq(firestormCasesTable.id, id));
      if (!current) {
        sendNotFound(res, 'Case');
        return;
      }

      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (status !== undefined) updates.status = status;
      if (priority !== undefined) updates.priority = priority;
      if (assignedAnalyst !== undefined) updates.assignedAnalyst = assignedAnalyst;

      if (status === 'in_progress' && current.status === 'open' && !current.triagedAt) {
        updates.triagedAt = new Date();
      }
      if (status === 'resolved' && !current.resolvedAt) {
        updates.resolvedAt = new Date();
      }

      const existingTrail = Array.isArray(current.auditTrail) ? current.auditTrail : [];
      const auditUser = parsedCase.updatedBy ?? 'Operator';
      const auditEntries: Array<{ action: string; user: string; at: string }> = [];
      if (status !== undefined && status !== current.status) {
        auditEntries.push({
          action: `Status updated to ${status}`,
          user: auditUser,
          at: new Date().toISOString(),
        });
      }
      if (priority !== undefined && priority !== current.priority) {
        auditEntries.push({
          action: `Priority updated to ${priority}`,
          user: auditUser,
          at: new Date().toISOString(),
        });
      }
      if (assignedAnalyst !== undefined && assignedAnalyst !== current.assignedAnalyst) {
        auditEntries.push({
          action: `Assigned to ${assignedAnalyst ?? 'Unassigned'}`,
          user: auditUser,
          at: new Date().toISOString(),
        });
      }

      if (note) {
        const existingNotes = Array.isArray(current.notes) ? current.notes : [];
        updates.notes = [
          ...existingNotes,
          { content: note.content, author: note.author ?? 'Analyst', at: new Date().toISOString() },
        ];
      }

      if (evidenceItem) {
        const ev: Record<string, unknown> = evidenceItem;
        const evStr = (key: string): string | undefined => {
          const v = ev[key];
          return typeof v === 'string' ? v : undefined;
        };
        const evNum = (key: string): number | undefined => {
          const v = ev[key];
          return typeof v === 'number' ? v : undefined;
        };
        const origin = ev.origin && typeof ev.origin === 'object' ? (ev.origin as any) : {};
        const originName = typeof origin.name === 'string' ? origin.name : undefined;
        const originId =
          typeof origin.id === 'string' || typeof origin.id === 'number'
            ? String(origin.id)
            : undefined;

        const existingEvidence = Array.isArray(current.evidence) ? current.evidence : [];
        updates.evidence = [...existingEvidence, { ...ev, addedAt: new Date().toISOString() }];
        const isTrace =
          evStr('type') === 'constellation_trace' || evStr('source') === 'constellation_graph';
        const summary = isTrace
          ? `Attached Constellation trace · origin ${originName ?? originId ?? 'unknown'} · ${evNum('nodeCount') ?? 0} nodes within ${evNum('hopCount') ?? 0} hops`
          : `Attached evidence: ${evStr('name') ?? 'item'}`;
        auditEntries.push({ action: summary, user: auditUser, at: new Date().toISOString() });
      }

      // Always record at least one audit entry per PATCH so the timeline reflects the operator action.
      if (auditEntries.length === 0) {
        auditEntries.push({
          action: 'Case updated',
          user: auditUser,
          at: new Date().toISOString(),
        });
      }
      updates.auditTrail = [...existingTrail, ...auditEntries];

      const [updated] = await db
        .update(firestormCasesTable)
        .set(updates)
        .where(eq(firestormCasesTable.id, id))
        .returning();
      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update case');
    }
  },
);

router.get('/firestorm/mitre-detections', authMiddleware(), async (_req, res) => {
  try {
    const detections = await db
      .select()
      .from(firestormMitreDetectionsTable)
      .orderBy(desc(firestormMitreDetectionsTable.detectionCount));
    sendSuccess(res, detections);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list MITRE detections');
  }
});

router.get('/firestorm/mitre-detections/:techniqueId', authMiddleware(), async (req, res) => {
  try {
    const techniqueId = String(req.params.techniqueId as string);
    const [detection] = await db
      .select()
      .from(firestormMitreDetectionsTable)
      .where(eq(firestormMitreDetectionsTable.techniqueId, techniqueId));
    if (!detection) {
      sendNotFound(res, 'MITRE detection');
      return;
    }
    const relatedIncidents = detection.relatedIncidentIds?.length
      ? await db
          .select()
          .from(firestormIncidentsTable)
          .where(inArray(firestormIncidentsTable.id, detection.relatedIncidentIds as number[]))
      : [];
    sendSuccess(res, { ...detection, relatedIncidents });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get MITRE detection');
  }
});

// NOTE: POST /firestorm/seed is registered conditionally inside `register()`
// below — it is mounted ONLY when `isProductionEnvironment()` is false.
// In production the route is never declared on the router, so requests get
// a generic Express 404 (route not found). See DEAD_ROUTES_AUDIT / SURFACE_MAP.
function registerSeedRouteIfNonProd(): void {
  if (isProductionEnvironment()) return;
  router.post(
    '/firestorm/seed',
    validateBody(bodyShape({})),
    authMiddleware({ required: true }),
    async (_req, res) => {
      try {
        // @ts-expect-error - seed-paragon.ts is dynamically imported via seed-aegis shim in non-prod
        const { seedAegis } = await import('../../scripts/seed-aegis.js');
        const result = await seedAegis();
        sendSuccess(res, { message: 'Aegis data seeded successfully', result });
      } catch (err) {
        handleRouteError(res, err, 'Failed to seed Aegis data');
      }
    },
  );
}

// ─── External Threat Intelligence (T003) ───────────────────────────────────

const threatCache = new Map<
  string,
  { data: unknown; expiry: number; fetchedAt: number; source: string }
>();

function getThreatCached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<{ data: T; source: string }>,
): Promise<{ data: T; source: string; cacheAgeSeconds: number; isStale: boolean }> {
  const c = threatCache.get(key);
  const now = Date.now();
  if (c && c.expiry > now)
    return Promise.resolve({
      data: c.data as T,
      source: c.source,
      cacheAgeSeconds: Math.floor((now - c.fetchedAt) / 1000),
      isStale: false,
    });
  return fetcher()
    .then(({ data, source }) => {
      threatCache.set(key, { data, expiry: now + ttlMs, fetchedAt: now, source });
      return { data, source, cacheAgeSeconds: 0, isStale: false };
    })
    .catch(() => {
      const s = threatCache.get(key);
      if (s)
        return {
          data: s.data as T,
          source: 'stale',
          cacheAgeSeconds: Math.floor((now - s.fetchedAt) / 1000),
          isStale: true,
        };
      throw new Error('Data unavailable');
    });
}

async function fetchThreatJson(
  url: string,
  timeoutMs = 10000,
  extraHeaders: Record<string, string> = {},
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SZL-Aegis/1.0', Accept: 'application/json', ...extraHeaders },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

router.get(
  '/firestorm/live/shodan-ip',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const ip = (req.query.ip as string)?.trim();
      if (!ip || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
        sendBadRequest(res, 'Valid IPv4 address required as ?ip= parameter');
        return;
      }
      const result = await getThreatCached<any>(`shodan-ip-${ip}`, 3600000, async () => {
        try {
          const raw = (await fetchThreatJson(`https://internetdb.shodan.io/${ip}`, 8000)) as any;
          if (!raw?.ip) throw new Error('No Shodan data');
          return {
            data: {
              ip: raw.ip,
              hostnames: raw.hostnames ?? [],
              openPorts: raw.ports ?? [],
              cpes: raw.cpes ?? [],
              tags: raw.tags ?? [],
              vulnerabilities: raw.vulns ?? [],
              riskScore:
                raw.vulns?.length > 5
                  ? 'critical'
                  : raw.vulns?.length > 2
                    ? 'high'
                    : raw.vulns?.length > 0
                      ? 'medium'
                      : 'low',
              summary: `${raw.ports?.length ?? 0} open port(s), ${raw.vulns?.length ?? 0} known CVE(s)`,
            },
            source: 'live-shodan-internetdb',
          };
        } catch {
          return {
            data: {
              ip,
              hostnames: [],
              openPorts: [],
              cpes: [],
              tags: [],
              vulnerabilities: [],
              riskScore: 'unknown',
              summary: 'No data available for this IP',
            },
            source: 'fallback-api-unavailable',
          };
        }
      });

      sendSuccess(res, {
        source: 'Shodan InternetDB (keyless public API)',
        url: `https://internetdb.shodan.io/${ip}`,
        ...result.data,
        dataSource: result.source,
        liveData: result.source.startsWith('live'),
        cacheAgeSeconds: result.cacheAgeSeconds,
        isStale: result.isStale,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to query Shodan InternetDB');
    }
  },
);

router.get(
  '/firestorm/live/greynoise-ip',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const ip = (req.query.ip as string)?.trim();
      if (!ip || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
        sendBadRequest(res, 'Valid IPv4 address required as ?ip= parameter');
        return;
      }
      const result = await getThreatCached(`greynoise-ip-${ip}`, 3600000, async () => {
        try {
          const raw = (await fetchThreatJson(
            `https://api.greynoise.io/v3/community/${ip}`,
            8000,
          )) as any;
          return {
            data: {
              ip,
              noise: raw.noise ?? false,
              riot: raw.riot ?? false,
              classification: raw.classification ?? 'unknown',
              name: raw.name ?? null,
              link: raw.link ?? null,
              lastSeen: raw.last_seen ?? null,
              message: raw.message ?? 'No data',
              intent: raw.riot
                ? 'benign/trusted'
                : raw.noise
                  ? (raw.classification ?? 'scanning')
                  : 'not observed',
            },
            source: 'live-greynoise-community',
          };
        } catch {
          return {
            data: {
              ip,
              noise: false,
              riot: false,
              classification: 'unknown',
              name: null,
              link: null,
              lastSeen: null,
              message: 'No classification data available',
              intent: 'unknown',
            },
            source: 'fallback-api-unavailable',
          };
        }
      });

      sendSuccess(res, {
        source: 'GreyNoise Community API — Mass-internet scanner detection',
        url: `https://viz.greynoise.io/ip/${ip}`,
        ...result.data,
        dataSource: result.source,
        liveData: result.source.startsWith('live'),
        cacheAgeSeconds: result.cacheAgeSeconds,
        isStale: result.isStale,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to query GreyNoise');
    }
  },
);

router.get('/firestorm/live/malware-bazaar', authMiddleware(), async (_req, res) => {
  try {
    const result = await getThreatCached('malware-bazaar-recent', 3600000, async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12000);
        const response = await fetch('https://mb-api.abuse.ch/api/v1/', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'SZL-Aegis/1.0',
          },
          body: 'query=get_recent&selector=100',
        });
        clearTimeout(timer);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const raw = (await response.json()) as any;

        if (raw.query_status !== 'ok' || !Array.isArray(raw.data))
          throw new Error('MalwareBazaar error');

        const samples = raw.data.slice(0, 20).map((s: any) => ({
          sha256: s.sha256_hash,
          md5: s.md5_hash,
          fileName: s.file_name,
          fileType: s.file_type,
          fileSize: s.file_size,
          mimeType: s.mime_type,
          tags: s.tags ?? [],
          signature: s.signature ?? null,
          firstSeen: s.first_seen,
          lastSeen: s.last_seen,
          deliveryMethod: s.delivery_method ?? null,
          originCountry: s.origin_country ?? null,
        }));

        const tagCounts = samples.reduce((acc: Record<string, number>, s: any) => {
          (s.tags ?? []).forEach((t: string) => {
            acc[t] = (acc[t] ?? 0) + 1;
          });
          return acc;
        }, {});

        const fileTypeCounts = samples.reduce((acc: Record<string, number>, s: any) => {
          if (s.fileType) acc[s.fileType] = (acc[s.fileType] ?? 0) + 1;
          return acc;
        }, {});

        return {
          data: {
            totalSamples: raw.data.length,
            samples,
            topTags: Object.entries(tagCounts as Record<string, number>)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([tag, count]) => ({ tag, count })),
            fileTypeBreakdown: fileTypeCounts,
            retrievedAt: new Date().toISOString(),
          },
          source: 'live-malwarebazaar',
        };
      } catch {
        return {
          data: {
            totalSamples: 100,
            samples: [
              {
                sha256: 'a3b1c2d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
                fileName: 'invoice_2026.exe',
                fileType: 'exe',
                fileSize: 245760,
                tags: ['AgentTesla', 'stealer'],
                signature: 'AgentTesla',
                firstSeen: new Date(Date.now() - 3600000).toISOString(),
                deliveryMethod: 'email',
              },
              {
                sha256: 'b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
                fileName: 'update.js',
                fileType: 'js',
                fileSize: 18432,
                tags: ['AsyncRAT', 'rat'],
                signature: 'AsyncRAT',
                firstSeen: new Date(Date.now() - 7200000).toISOString(),
                deliveryMethod: 'web',
              },
            ],
            topTags: [
              { tag: 'AgentTesla', count: 18 },
              { tag: 'stealer', count: 14 },
              { tag: 'AsyncRAT', count: 11 },
              { tag: 'rat', count: 9 },
            ],
            fileTypeBreakdown: { exe: 38, xlsx: 22, js: 18, pdf: 12, zip: 10 },
            retrievedAt: new Date().toISOString(),
          },
          source: 'fallback-api-unavailable',
        };
      }
    });

    sendSuccess(res, {
      source: 'MalwareBazaar — Abuse.ch malware sample repository',
      url: 'https://bazaar.abuse.ch/',
      ...result.data,
      dataSource: result.source,
      liveData: result.source.startsWith('live'),
      cacheAgeSeconds: result.cacheAgeSeconds,
      isStale: result.isStale,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch MalwareBazaar data');
  }
});

router.get('/firestorm/live/threat-aggregator', authMiddleware(), async (_req, res) => {
  try {
    const result = await getThreatCached('threat-aggregator', 3600000, async () => {
      try {
        const [mbResult, urlhausResult, nvdResult, cisaResult] = await Promise.allSettled([
          fetch('https://mb-api.abuse.ch/api/v1/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'SZL-Aegis/1.0',
            },
            body: 'query=get_recent&selector=100',
          }).then((r) => r.json()) as Promise<any>,
          fetchThreatJson(
            'https://urlhaus-api.abuse.ch/v1/urls/recent/limit/100/',
            10000,
          ) as Promise<any>,
          fetchThreatJson(
            'https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=10&pubStartDate=' +
              new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0] +
              'T00:00:00.000',
            12000,
          ) as Promise<any>,
          fetchThreatJson(
            'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
            10000,
          ) as Promise<any>,
        ]);

        const mb = mbResult.status === 'fulfilled' ? mbResult.value : null;
        const urlhaus = urlhausResult.status === 'fulfilled' ? urlhausResult.value : null;
        const nvd = nvdResult.status === 'fulfilled' ? nvdResult.value : null;
        const cisa = cisaResult.status === 'fulfilled' ? cisaResult.value : null;

        const mbSamples = mb?.data?.slice(0, 5) ?? [];
        const mbTopFamily = mb?.data?.reduce((acc: Record<string, number>, s: any) => {
          if (s.signature) acc[s.signature] = (acc[s.signature] ?? 0) + 1;
          return acc;
        }, {});
        const mbTopFamilySorted = mbTopFamily
          ? Object.entries(mbTopFamily as Record<string, number>)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
          : [];

        const urlhausUrls = urlhaus?.urls?.slice(0, 5) ?? [];
        const urlhausThreatTypes = urlhaus?.urls?.reduce((acc: Record<string, number>, u: any) => {
          if (u.threat) acc[u.threat] = (acc[u.threat] ?? 0) + 1;
          return acc;
        }, {});

        const nvdCves =
          nvd?.vulnerabilities?.slice(0, 5).map((v: any) => ({
            cveId: v.cve?.id,
            description: v.cve?.descriptions
              ?.find((d: any) => d.lang === 'en')
              ?.value?.slice(0, 120),
            severity: v.cve?.metrics?.cvssMetricV31?.[0]?.cvssData?.baseSeverity ?? 'Unknown',
            score: v.cve?.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore ?? null,
            published: v.cve?.published,
          })) ?? [];

        const cisaLatest =
          cisa?.vulnerabilities?.slice(0, 5).map((v: any) => ({
            cveId: v.cveID,
            vendorProject: v.vendorProject,
            product: v.product,
            dueDate: v.dueDate,
            shortDescription: v.shortDescription?.slice(0, 100),
          })) ?? [];

        return {
          data: {
            threatLevel:
              nvdCves.filter((c: any) => c.severity === 'CRITICAL').length > 2
                ? 'elevated'
                : 'moderate',
            feeds: {
              malwareBazaar: {
                status: mb?.query_status === 'ok' ? 'live' : 'unavailable',
                recentSamplesCount: mb?.data?.length ?? 0,
                topMalwareFamilies: mbTopFamilySorted.map(([family, count]) => ({ family, count })),
                recentSamples: mbSamples.map((s: any) => ({
                  sha256: s.sha256_hash,
                  fileName: s.file_name,
                  signature: s.signature,
                  tags: s.tags,
                  firstSeen: s.first_seen,
                })),
              },
              urlhaus: {
                status: urlhaus?.query_status === 'isok' ? 'live' : 'unavailable',
                recentUrlsCount: urlhaus?.urls?.length ?? 0,
                threatTypes: urlhausThreatTypes ?? {},
                recentUrls: urlhausUrls.map((u: any) => ({
                  url: u.url,
                  threat: u.threat,
                  dateAdded: u.date_added,
                  urlStatus: u.url_status,
                })),
              },
              nvd: {
                status: nvd?.totalResults !== undefined ? 'live' : 'unavailable',
                recentCvesCount: nvd?.totalResults ?? 0,
                criticalCount: nvdCves.filter((c: any) => c.severity === 'CRITICAL').length,
                recentCves: nvdCves,
              },
              cisa: {
                status: cisa?.vulnerabilities?.length > 0 ? 'live' : 'unavailable',
                totalKev: cisa?.vulnerabilities?.length ?? 0,
                latestKev: cisaLatest,
              },
            },
            generatedAt: new Date().toISOString(),
          },
          source: [mb, urlhaus, nvd, cisa].some(Boolean) ? 'live' : 'fallback-api-unavailable',
        };
      } catch {
        return {
          data: {
            threatLevel: 'moderate',
            feeds: {
              malwareBazaar: {
                status: 'unavailable',
                recentSamplesCount: 0,
                topMalwareFamilies: [],
                recentSamples: [],
              },
              urlhaus: {
                status: 'unavailable',
                recentUrlsCount: 0,
                threatTypes: {},
                recentUrls: [],
              },
              nvd: { status: 'unavailable', recentCvesCount: 0, criticalCount: 0, recentCves: [] },
              cisa: { status: 'unavailable', totalKev: 0, latestKev: [] },
            },
            generatedAt: new Date().toISOString(),
          },
          source: 'fallback-api-unavailable',
        };
      }
    });

    sendSuccess(res, {
      source: 'Unified Threat Intelligence Aggregator — MalwareBazaar + URLhaus + NVD + CISA KEV',
      ...result.data,
      dataSource: result.source,
      liveData: result.source.startsWith('live'),
      cacheAgeSeconds: result.cacheAgeSeconds,
      isStale: result.isStale,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch unified threat aggregator');
  }
});

const DECISION_TYPE_ENUM = new Set([
  'TriageDecision',
  'IncidentAssessment',
  'RiskDecision',
  'EscalationDecision',
  'ApprovalRecommendation',
  'ResponsePlan',
  'ExecutiveBrief',
  'ControlGapFinding',
]);

async function upsertCaseMemoryFromDecision(
  caseId: string,
  incidentId: string | null,
  decision: {
    objectId: string;
    decisionType: string;
    summary: string;
    confidence: string;
    confidenceLabel: string;
    impactLevel: string;
    urgency: string;
    recommendedAction: string;
    approvalRequired: boolean;
    humanReviewRequired: boolean;
    gapsAndUnknowns: unknown[];
  },
): Promise<void> {
  const now = new Date();
  const decisionSnapshot = {
    objectId: decision.objectId,
    decisionType: decision.decisionType,
    summary: decision.summary,
    confidence: decision.confidence,
    confidenceLabel: decision.confidenceLabel,
    impactLevel: decision.impactLevel,
    urgency: decision.urgency,
    recommendedAction: decision.recommendedAction,
    approvalRequired: decision.approvalRequired,
    humanReviewRequired: decision.humanReviewRequired,
    gapsAndUnknowns: decision.gapsAndUnknowns,
    createdAt: now.toISOString(),
  };

  const existing = await db
    .select()
    .from(firestormCaseMemoryTable)
    .where(sql`${firestormCaseMemoryTable.caseId} = ${caseId}`);
  if (existing.length === 0) {
    const initialSummary = {
      totalDecisions: 1,
      lastDecisionAt: now.toISOString(),
      currentRiskLevel: decision.impactLevel,
      pendingApprovals: decision.approvalRequired ? 1 : 0,
      humanReviewRequired: decision.humanReviewRequired,
    };
    await db.insert(firestormCaseMemoryTable).values({
      caseId,
      incidentId,
      phase: 'triage',
      phaseHistory: [
        { phase: 'detection', enteredAt: now.toISOString(), exitedAt: now.toISOString() },
        { phase: 'triage', enteredAt: now.toISOString(), exitedAt: null },
      ],
      decisions: [decisionSnapshot],
      evidenceSnapshots: [],
      analystNotes: [],
      changeLog: [
        {
          changeId: `change_${Date.now()}`,
          fieldChanged: 'decision_added',
          previousValue: null,
          newValue: decision.objectId,
          changedBy: 'system',
          changedAt: now.toISOString(),
          decisionObjectId: decision.objectId,
        },
      ],
      summary: initialSummary,
      openedAt: now,
      lastUpdatedAt: now,
    });
  } else {
    const current = existing[0]!;
    const currentDecisions = Array.isArray(current.decisions)
      ? (current.decisions as (typeof decisionSnapshot)[])
      : [];
    const updatedDecisions = [...currentDecisions, decisionSnapshot];
    const pendingApprovals = updatedDecisions.filter((d) => d.approvalRequired).length;
    const humanReviewRequired = updatedDecisions.some((d) => d.humanReviewRequired);
    const updatedSummary = {
      totalDecisions: updatedDecisions.length,
      lastDecisionAt: now.toISOString(),
      currentRiskLevel: decision.impactLevel,
      pendingApprovals,
      humanReviewRequired,
    };
    const currentChangeLog = Array.isArray(current.changeLog) ? current.changeLog : [];
    await db
      .update(firestormCaseMemoryTable)
      .set({
        decisions: updatedDecisions,
        summary: updatedSummary,
        lastUpdatedAt: now,
        updatedAt: now,
        changeLog: [
          ...currentChangeLog,
          {
            changeId: `change_${Date.now()}`,
            fieldChanged: 'decision_added',
            previousValue: null,
            newValue: decision.objectId,
            changedBy: 'system',
            changedAt: now.toISOString(),
            decisionObjectId: decision.objectId,
          },
        ],
      })
      .where(sql`${firestormCaseMemoryTable.caseId} = ${caseId}`);
  }
}

router.get(
  '/firestorm/tradecraft/decisions',
  authMiddleware({ required: true }),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const caseId = typeof req.query.caseId === 'string' ? req.query.caseId : undefined;
      const incidentId =
        typeof req.query.incidentId === 'string' ? req.query.incidentId : undefined;
      const decisionType =
        typeof req.query.decisionType === 'string' ? req.query.decisionType : undefined;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const limit = Math.min(
        parseInt(typeof req.query.limit === 'string' ? req.query.limit : '50', 10),
        200,
      );

      const conditions = [
        eq(firestormTradecraftDecisionsTable.tenantId, 'default'),
        ...(caseId ? [eq(firestormTradecraftDecisionsTable.caseId, caseId)] : []),
        ...(incidentId ? [eq(firestormTradecraftDecisionsTable.incidentId, incidentId)] : []),
        ...(decisionType
          ? [eq(firestormTradecraftDecisionsTable.decisionType, decisionType as 'TriageDecision')]
          : []),
        ...(status ? [eq(firestormTradecraftDecisionsTable.status, status as 'active')] : []),
      ];
      const decisions = await db
        .select()
        .from(firestormTradecraftDecisionsTable)
        .where(and(...conditions))
        .orderBy(desc(firestormTradecraftDecisionsTable.createdAt))
        .limit(limit);
      sendSuccess(res, decisions);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list tradecraft decisions');
    }
  },
);

router.get(
  '/firestorm/tradecraft/decisions/:objectId',
  authMiddleware({ required: true }),
  async (req, res) => {
    try {
      const [decision] = await db
        .select()
        .from(firestormTradecraftDecisionsTable)
        .where(
          and(
            sql`${firestormTradecraftDecisionsTable.objectId} = ${req.params.objectId as string}`,
            eq(firestormTradecraftDecisionsTable.tenantId, 'default'),
          ),
        );
      if (!decision) {
        sendNotFound(res, 'Tradecraft Decision');
        return;
      }
      sendSuccess(res, decision);
    } catch (err) {
      handleRouteError(res, err, 'Failed to get tradecraft decision');
    }
  },
);

router.post(
  '/firestorm/tradecraft/decisions',
  authMiddleware({ required: true }),
  validateBody(
    bodyShape({
      caseId: z.unknown().optional(),
      decisionType: z.unknown().optional(),
      incidentId: z.unknown().optional(),
      modelRoute: z.unknown().optional(),
      objectId: z.unknown().optional(),
      rawOutput: z.unknown().optional(),
      signalId: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { randomUUID } = await import('node:crypto');
      const parsedDecision = tradecraftDecisionInputSchema.parse(req.body);
      const body = parsedDecision as any;

      if (!DECISION_TYPE_ENUM.has(parsedDecision.decisionType)) {
        sendError(
          res,
          'Invalid or missing decisionType. Must be one of the 8 supported decision object types.',
          422,
          'UNPROCESSABLE_ENTITY',
        );
        return;
      }
      if (parsedDecision.confidence !== undefined) {
        const conf = parseFloat(String(parsedDecision.confidence));
        if (Number.isNaN(conf) || conf < 0 || conf > 1) {
          sendError(
            res,
            'confidence must be a number between 0 and 1.',
            422,
            'UNPROCESSABLE_ENTITY',
          );
          return;
        }
      }

      const rawOutput = typeof body.rawOutput === 'string' ? body.rawOutput : null;
      const tenantId = 'default';
      const modelRoute = typeof body.modelRoute === 'string' ? body.modelRoute : 'unknown';

      const validationResult = validateAndBuildDecision(
        body,
        body.decisionType as DecisionObjectType,
        {
          tenantId,
          modelRoute,
          rawOutput,
        },
      );

      if (!validationResult.valid || !validationResult.object) {
        const { randomUUID: uuid422 } = await import('node:crypto');
        await db
          .insert(firestormTradecraftValidationAuditTable)
          .values({
            auditId: uuid422(),
            decisionType: String(body.decisionType),
            tenantId: 'default',
            caseId: typeof body.caseId === 'string' ? body.caseId : null,
            incidentId: typeof body.incidentId === 'string' ? body.incidentId : null,
            validationErrors: validationResult.errors as string[],
            rawOutput: rawOutput ?? null,
            rawPayload: body,
            modelRoute: typeof body.modelRoute === 'string' ? body.modelRoute : 'unknown',
            errorClass: 'schema_validation',
            resolved: false,
          })
          .catch((auditErr) => {
            logger.warn(
              { auditErr },
              '[tradecraft] Failed to persist validation audit record — non-fatal',
            );
          });
        sendError(
          res,
          'Decision object failed structured validation. Payload does not satisfy the required schema for this decision type.',
          422,
          'UNPROCESSABLE_ENTITY',
          {
            decisionType: body.decisionType,
            validationErrors: validationResult.errors,
            rawOutput,
          },
        );
        return;
      }

      const validated = validationResult.object;
      const validationErrors: string[] = validationResult.errors;
      const policyClass = validated.policyClass;
      const issueStatement = validated.issueStatement;

      const data = insertFirestormTradecraftDecisionSchema.parse({
        objectId: typeof body.objectId === 'string' ? body.objectId : validated.objectId,
        tenantId: validated.tenantId,
        caseId:
          typeof body.caseId === 'string'
            ? body.caseId
            : ((validated as { caseId?: string | null }).caseId ?? null),
        incidentId:
          typeof body.incidentId === 'string'
            ? body.incidentId
            : ((validated as { incidentId?: string | null }).incidentId ?? null),
        signalId:
          typeof body.signalId === 'string'
            ? body.signalId
            : ((validated as { signalId?: string | null }).signalId ?? null),
        decisionType: validated.decisionType,
        policyClass,
        schemaVersion: validated.schemaVersion,
        summary: validated.summary,
        issueStatement,
        evidenceRefs: validated.evidenceRefs,
        evidenceQuality: validated.evidenceQuality,
        assumptions: validated.assumptions,
        alternatives: validated.alternatives,
        confidence: String(validated.confidence),
        confidenceLabel: validated.confidenceLabel,
        confidenceStatement: validated.confidenceStatement,
        gapsAndUnknowns: validated.gapsAndUnknowns,
        impactLevel: validated.impactLevel,
        urgency: validated.urgency,
        recommendedAction: validated.recommendedAction,
        ownerSuggestion: validated.ownerSuggestion,
        approvalRequired: validated.approvalRequired,
        approvalReason: validated.approvalReason,
        humanReviewRequired: validated.humanReviewRequired,
        humanReviewReason: validated.humanReviewReason,
        modelRoute: validated.modelRoute,
        rawOutput: validated.rawOutput,
        decisionPayload: body as any,
        status: 'active',
        validationErrors,
      });

      const [decision] = await db
        .insert(firestormTradecraftDecisionsTable)
        .values(data)
        .returning();

      if (decision.caseId) {
        await upsertCaseMemoryFromDecision(decision.caseId, decision.incidentId ?? null, {
          objectId: decision.objectId,
          decisionType: decision.decisionType,
          summary: decision.summary,
          confidence: String(decision.confidence ?? '0'),
          confidenceLabel: decision.confidenceLabel,
          impactLevel: decision.impactLevel,
          urgency: decision.urgency,
          recommendedAction: decision.recommendedAction,
          approvalRequired: decision.approvalRequired,
          humanReviewRequired: decision.humanReviewRequired,
          gapsAndUnknowns: Array.isArray(decision.gapsAndUnknowns) ? decision.gapsAndUnknowns : [],
        }).catch((err) => {
          logger.warn(
            { err, caseId: decision.caseId },
            '[tradecraft] Failed to upsert case memory from decision — non-fatal',
          );
        });
      }

      ingestDecisionToEvidenceIndex({
        objectId: decision.objectId,
        decisionType: decision.decisionType,
        summary: decision.summary,
        caseId: decision.caseId ?? null,
        confidence: parseFloat(String(decision.confidence ?? '0')),
        recommendedAction: decision.recommendedAction,
        createdAt: decision.createdAt.toISOString(),
      }).catch(() => {});

      sendCreated(res, decision);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create tradecraft decision');
    }
  },
);

router.put(
  '/firestorm/tradecraft/decisions/:objectId',
  authMiddleware({ required: true }),
  validateBody(
    bodyShape({
      action: z.unknown().optional(),
      rejectionReason: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const body = tradecraftDecisionActionSchema.parse(req.body) as any;
      const action = typeof body.action === 'string' ? body.action : null;
      const user = req.user;

      if (action === 'approve' || action === 'reject') {
        const canApprove =
          user &&
          (user.roles.includes('admin') ||
            user.roles.includes('super_admin') ||
            user.roles.includes('ops'));
        if (!canApprove) {
          sendForbidden(
            res,
            'Forbidden: decision approval requires admin, super_admin, or ops role',
          );
          return;
        }
        const reviewerName = user.displayName ?? user.email ?? `user:${user.id}`;

        const decisionTenant = 'default';

        if (action === 'approve') {
          const [decision] = await db
            .update(firestormTradecraftDecisionsTable)
            .set({
              approvedBy: reviewerName,
              approvedAt: new Date(),
              rejectedBy: null,
              rejectedAt: null,
              rejectionReason: null,
              updatedAt: new Date(),
            })
            .where(
              and(
                sql`${firestormTradecraftDecisionsTable.objectId} = ${req.params.objectId as string}`,
                eq(firestormTradecraftDecisionsTable.tenantId, decisionTenant),
              ),
            )
            .returning();
          if (!decision) {
            sendNotFound(res, 'Tradecraft Decision');
            return;
          }
          sendSuccess(res, { ...decision, reviewStatus: 'approved' });
          return;
        }

        const rejectionReason =
          typeof body.rejectionReason === 'string' ? body.rejectionReason : null;
        const [decision] = await db
          .update(firestormTradecraftDecisionsTable)
          .set({
            rejectedBy: reviewerName,
            rejectedAt: new Date(),
            approvedBy: null,
            approvedAt: null,
            rejectionReason,
            updatedAt: new Date(),
          })
          .where(
            and(
              sql`${firestormTradecraftDecisionsTable.objectId} = ${req.params.objectId as string}`,
              eq(firestormTradecraftDecisionsTable.tenantId, decisionTenant),
            ),
          )
          .returning();
        if (!decision) {
          sendNotFound(res, 'Tradecraft Decision');
          return;
        }
        sendSuccess(res, { ...decision, reviewStatus: 'rejected' });
        return;
      }

      const allowedUpdates = insertFirestormTradecraftDecisionSchema
        .omit({
          approvedBy: true,
          approvedAt: true,
          rejectedBy: true,
          rejectedAt: true,
          rejectionReason: true,
        })
        .partial()
        .parse(body);
      const [decision] = await db
        .update(firestormTradecraftDecisionsTable)
        .set({ ...allowedUpdates, updatedAt: new Date() })
        .where(
          and(
            sql`${firestormTradecraftDecisionsTable.objectId} = ${req.params.objectId as string}`,
            eq(firestormTradecraftDecisionsTable.tenantId, 'default'),
          ),
        )
        .returning();
      if (!decision) {
        sendNotFound(res, 'Tradecraft Decision');
        return;
      }
      sendSuccess(res, decision);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update tradecraft decision');
    }
  },
);

router.get(
  '/firestorm/tradecraft/case-memory/:caseId',
  authMiddleware({ required: true }),
  async (req, res) => {
    try {
      const [memory] = await db
        .select()
        .from(firestormCaseMemoryTable)
        .where(sql`${firestormCaseMemoryTable.caseId} = ${req.params.caseId as string}`);
      if (!memory) {
        sendNotFound(res, 'Case Memory');
        return;
      }
      sendSuccess(res, memory);
    } catch (err) {
      handleRouteError(res, err, 'Failed to get case memory');
    }
  },
);

router.post(
  '/firestorm/tradecraft/case-memory',
  authMiddleware({ required: true }),
  validateBody(
    bodyShape({
      caseId: z.unknown().optional(),
      incidentId: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const body = updateCaseMemorySchema.parse(req.body) as any;
      const caseId = body.caseId;
      const incidentId = body.incidentId ?? null;
      const existing = await db
        .select()
        .from(firestormCaseMemoryTable)
        .where(sql`${firestormCaseMemoryTable.caseId} = ${caseId}`);
      if (existing.length > 0) {
        sendSuccess(res, existing[0]);
        return;
      }
      const now = new Date();
      const [memory] = await db
        .insert(firestormCaseMemoryTable)
        .values({
          caseId,
          incidentId,
          phase: 'detection',
          phaseHistory: [{ phase: 'detection', enteredAt: now.toISOString(), exitedAt: null }],
          decisions: [],
          evidenceSnapshots: [],
          analystNotes: [],
          changeLog: [],
          summary: {
            totalDecisions: 0,
            lastDecisionAt: null,
            currentRiskLevel: null,
            pendingApprovals: 0,
            humanReviewRequired: false,
          },
          openedAt: now,
          lastUpdatedAt: now,
        })
        .returning();
      sendCreated(res, memory);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create case memory');
    }
  },
);

router.put(
  '/firestorm/tradecraft/case-memory/:caseId',
  authMiddleware({ required: true }),
  validateBody(
    bodyShape({
      analystNotes: z.unknown().optional(),
      changeLog: z.unknown().optional(),
      closedAt: z.unknown().optional(),
      phase: z.unknown().optional(),
      phaseHistory: z.unknown().optional(),
      summary: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const body = updateCaseMemorySchema.parse(req.body);

      const update: Partial<InsertFirestormCaseMemory> & { lastUpdatedAt: Date; updatedAt: Date } =
        {
          lastUpdatedAt: new Date(),
          updatedAt: new Date(),
        };

      if (body.phase) update.phase = body.phase;
      if (body.phaseHistory) update.phaseHistory = body.phaseHistory;
      if (body.analystNotes) update.analystNotes = body.analystNotes;
      if (body.changeLog) update.changeLog = body.changeLog;
      if (body.summary) update.summary = body.summary;
      if (body.closedAt) update.closedAt = new Date(body.closedAt);

      const [memory] = await db
        .update(firestormCaseMemoryTable)
        .set(update)
        .where(sql`${firestormCaseMemoryTable.caseId} = ${req.params.caseId as string}`)
        .returning();
      if (!memory) {
        sendNotFound(res, 'Case Memory');
        return;
      }
      sendSuccess(res, memory);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update case memory');
    }
  },
);

router.get(
  '/firestorm/tradecraft/notebook',
  authMiddleware({ required: true }),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const caseId = typeof req.query.caseId === 'string' ? req.query.caseId : undefined;
      const incidentId =
        typeof req.query.incidentId === 'string' ? req.query.incidentId : undefined;
      const isKey =
        req.query.isKey === 'true' ? true : req.query.isKey === 'false' ? false : undefined;
      const limit = Math.min(
        parseInt(typeof req.query.limit === 'string' ? req.query.limit : '50', 10),
        200,
      );
      const noteConditions = [
        ...(caseId ? [eq(firestormAnalystNotebookTable.caseId, caseId)] : []),
        ...(incidentId ? [eq(firestormAnalystNotebookTable.incidentId, incidentId)] : []),
        ...(isKey !== undefined ? [eq(firestormAnalystNotebookTable.isKey, isKey)] : []),
      ];
      const notes = await db
        .select()
        .from(firestormAnalystNotebookTable)
        .where(noteConditions.length > 0 ? and(...noteConditions) : undefined)
        .orderBy(desc(firestormAnalystNotebookTable.createdAt))
        .limit(limit);
      sendSuccess(res, notes);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list analyst notes');
    }
  },
);

router.post(
  '/firestorm/tradecraft/notebook',
  authMiddleware({ required: true }),
  validateBody(
    bodyShape({
      content: z.unknown().optional(),
      noteId: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { randomUUID } = await import('node:crypto');
      const body = req.body as any;
      if (!body.content || typeof body.content !== 'string' || body.content.trim().length < 3) {
        sendError(
          res,
          'content is required and must be at least 3 characters.',
          422,
          'UNPROCESSABLE_ENTITY',
        );
        return;
      }
      const noteData = {
        ...body,
        noteId: typeof body.noteId === 'string' ? body.noteId : `note_${randomUUID()}`,
      };
      const data = insertFirestormAnalystNotebookSchema.parse(noteData);
      const [note] = await db.insert(firestormAnalystNotebookTable).values(data).returning();

      if (note.caseId) {
        const nowNote = new Date();
        const noteSnapshot = {
          noteId: note.noteId,
          content: `[${note.noteType}] ${note.isKey ? 'KEY: ' : ''}analyst note`,
          author: note.author,
          noteType: note.noteType,
          createdAt: nowNote.toISOString(),
        };
        const changeEntry = {
          changeId: `change_${Date.now()}`,
          fieldChanged: 'analyst_note_added',
          previousValue: null,
          newValue: note.noteId,
          changedBy: note.author,
          changedAt: nowNote.toISOString(),
          decisionObjectId: null,
        };
        const existingCm = await db
          .select()
          .from(firestormCaseMemoryTable)
          .where(sql`${firestormCaseMemoryTable.caseId} = ${note.caseId}`);
        if (existingCm.length > 0) {
          const cm = existingCm[0]!;
          const currentNotes = Array.isArray(cm.analystNotes)
            ? (cm.analystNotes as (typeof noteSnapshot)[])
            : [];
          const currentChangeLog = Array.isArray(cm.changeLog)
            ? (cm.changeLog as (typeof changeEntry)[])
            : [];
          await db
            .update(firestormCaseMemoryTable)
            .set({
              analystNotes: [...currentNotes, noteSnapshot],
              lastUpdatedAt: nowNote,
              updatedAt: nowNote,
              changeLog: [...currentChangeLog, changeEntry],
            })
            .where(sql`${firestormCaseMemoryTable.caseId} = ${note.caseId}`)
            .catch((err: unknown) => {
              logger.warn(
                { err },
                '[tradecraft] Failed to auto-update case memory with note — non-fatal',
              );
            });
        } else {
          await db
            .insert(firestormCaseMemoryTable)
            .values({
              caseId: note.caseId,
              incidentId: note.incidentId ?? null,
              phase: 'investigation',
              phaseHistory: [
                { phase: 'investigation', enteredAt: nowNote.toISOString(), exitedAt: null },
              ],
              decisions: [],
              evidenceSnapshots: [],
              analystNotes: [noteSnapshot],
              changeLog: [changeEntry],
              summary: {
                totalDecisions: 0,
                lastDecisionAt: null,
                currentRiskLevel: 'medium',
                pendingApprovals: 0,
                humanReviewRequired: false,
              } as unknown as any,
              openedAt: nowNote,
              lastUpdatedAt: nowNote,
            })
            .catch((err: unknown) => {
              logger.warn(
                { err },
                '[tradecraft] Failed to create case memory for note — non-fatal',
              );
            });
        }
      }

      sendCreated(res, note);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create analyst note');
    }
  },
);

router.put(
  '/firestorm/tradecraft/notebook/:noteId',
  authMiddleware({ required: true }),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const body = req.body as any;
      const data = insertFirestormAnalystNotebookSchema.partial().parse(body);
      const [note] = await db
        .update(firestormAnalystNotebookTable)
        .set({ ...data, updatedAt: new Date() })
        .where(sql`${firestormAnalystNotebookTable.noteId} = ${req.params.noteId as string}`)
        .returning();
      if (!note) {
        sendNotFound(res, 'Analyst Note');
        return;
      }
      sendSuccess(res, note);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update analyst note');
    }
  },
);

router.delete(
  '/firestorm/tradecraft/notebook/:noteId',
  validateBody(bodyShape({})),
  authMiddleware({ required: true }),
  async (req, res) => {
    try {
      const [note] = await db
        .delete(firestormAnalystNotebookTable)
        .where(sql`${firestormAnalystNotebookTable.noteId} = ${req.params.noteId as string}`)
        .returning();
      if (!note) {
        sendNotFound(res, 'Analyst Note');
        return;
      }
      sendNoContent(res);
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete analyst note');
    }
  },
);

router.get(
  '/firestorm/tradecraft/evidence-index',
  authMiddleware({ required: true }),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const query = typeof req.query.q === 'string' ? req.query.q : 'threat incident alert';
      const caseId = typeof req.query.caseId === 'string' ? req.query.caseId : undefined;
      const incidentId =
        typeof req.query.incidentId === 'string' ? req.query.incidentId : undefined;
      const maxResults = Math.min(
        parseInt(typeof req.query.limit === 'string' ? req.query.limit : '20', 10),
        100,
      );
      const minRelevance =
        typeof req.query.minRelevance === 'string' ? parseFloat(req.query.minRelevance) : 0.0;

      const result = await queryEvidenceIndex({
        query,
        caseId,
        incidentId,
        maxResults,
        minRelevance,
      });

      sendSuccess(res, {
        entries: result.entries,
        totalIndexed: result.totalIndexed,
        method: result.method,
        confidenceDowngraded: result.confidenceDowngraded,
        confidenceDowngradeReason: result.confidenceDowngradeReason ?? null,
        weakRetrievalWarning: result.weakRetrievalWarning ?? null,
        latencyMs: result.latencyMs,
        indexedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to query evidence index');
    }
  },
);

router.post(
  '/firestorm/tradecraft/evidence-index/query',
  authMiddleware({ required: true }),
  validateBody(
    bodyShape({
      caseId: z.unknown().optional(),
      incidentId: z.unknown().optional(),
      maxResults: z.unknown().optional(),
      minRelevance: z.unknown().optional(),
      query: z.unknown().optional(),
      sourceTypes: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const body = evidenceIndexQuerySchema.parse(req.body);
      const query = body.query.trim();
      const { caseId, incidentId, sourceTypes } = body;
      const maxResults = body.maxResults !== undefined ? Math.min(body.maxResults, 50) : 15;
      const minRelevance = body.minRelevance ?? 0.0;

      const result = await queryEvidenceIndex({
        query,
        caseId,
        incidentId,
        sourceTypes,
        maxResults,
        minRelevance,
      });

      sendSuccess(res, {
        query,
        entries: result.entries,
        totalIndexed: result.totalIndexed,
        method: result.method,
        confidenceDowngraded: result.confidenceDowngraded,
        confidenceDowngradeReason: result.confidenceDowngradeReason ?? null,
        weakRetrievalWarning: result.weakRetrievalWarning ?? null,
        latencyMs: result.latencyMs,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to query evidence index');
    }
  },
);

// ─── AI Governance: Model Registry & Inference Log ──────────────────────────

function getSessionContext(req: import('express').Request): {
  userId: number | undefined;
  orgId: number | undefined;
  isPrivileged: boolean;
} {
  const user = (req as unknown as any).user as
    | {
        id?: unknown;
        roles?: string[];
        orgs?: Array<{ orgId?: unknown }>;
      }
    | undefined;
  const rawOrgId = user?.orgs?.[0]?.orgId;
  const rawUserId = user?.id;
  const toInt = (v: unknown) => {
    const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10);
    return Number.isNaN(n) ? undefined : n;
  };
  return {
    userId: toInt(rawUserId),
    orgId: toInt(rawOrgId),
    isPrivileged: (user?.roles ?? []).some((r) => r === 'super_admin' || r === 'admin'),
  };
}

router.get('/firestorm/ai-governance/registry', authMiddleware(), async (req, res) => {
  try {
    const { orgId, isPrivileged } = getSessionContext(req);

    if (orgId == null && !isPrivileged) {
      sendForbidden(res, 'Forbidden: org context required');
      return;
    }

    const agentBaseQuery = db
      .select({
        id: alloyRuntimeAgentsTable.id,
        agentId: alloyRuntimeAgentsTable.agentId,
        name: alloyRuntimeAgentsTable.name,
        description: alloyRuntimeAgentsTable.description,
        domain: alloyRuntimeAgentsTable.domain,
        policyTier: alloyRuntimeAgentsTable.policyTier,
        defaultModel: alloyRuntimeAgentsTable.defaultModel,
        isActive: alloyRuntimeAgentsTable.isActive,
        metadata: alloyRuntimeAgentsTable.metadata,
        createdAt: alloyRuntimeAgentsTable.createdAt,
        updatedAt: alloyRuntimeAgentsTable.updatedAt,
      })
      .from(alloyRuntimeAgentsTable)
      .orderBy(desc(alloyRuntimeAgentsTable.updatedAt))
      .limit(100);

    const agents =
      orgId != null
        ? await agentBaseQuery.where(eq(alloyRuntimeAgentsTable.orgId, orgId))
        : await agentBaseQuery;

    const versions =
      agents.length > 0
        ? await db
            .select()
            .from(alloyRuntimeAgentVersionsTable)
            .where(eq(alloyRuntimeAgentVersionsTable.isDeployed, true))
            .orderBy(desc(alloyRuntimeAgentVersionsTable.deployedAt))
        : [];

    const versionByAgent: Record<string, (typeof versions)[number]> = {};
    for (const v of versions) {
      if (!versionByAgent[v.agentId]) versionByAgent[v.agentId] = v;
    }

    const registry = agents.map((agent) => {
      const meta = (agent.metadata ?? {}) as any;
      const version = versionByAgent[agent.agentId];
      const rawModel = agent.defaultModel ?? '';
      const [providerSlug, ...modelParts] = rawModel.includes('/')
        ? rawModel.split('/')
        : ['internal', rawModel];
      const provider = providerSlug.charAt(0).toUpperCase() + providerSlug.slice(1);
      const modelName = modelParts.join('/') || rawModel || agent.name;
      return {
        id: agent.agentId,
        name: agent.name,
        description: agent.description,
        provider,
        model: modelName,
        version: (version?.version ?? meta.version ?? '1.0') as string,
        domain: agent.domain,
        policyTier: agent.policyTier,
        status: agent.isActive ? 'active' : 'deprecated',
        confidenceBaseline: (meta.confidenceBaseline ?? meta.confidence_baseline ?? null) as
          | number
          | null,
        deployedAt: version?.deployedAt ?? null,
        updatedAt: agent.updatedAt,
        createdAt: agent.createdAt,
      };
    });

    sendSuccess(res, { registry, total: registry.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch AI model registry');
  }
});

router.get(
  '/firestorm/ai-governance/log',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const rawLimit = parseInt((req.query.limit as string) ?? '50', 10);
      const limit = Number.isNaN(rawLimit) ? 50 : Math.max(1, Math.min(rawLimit, 200));

      const { orgId, isPrivileged } = getSessionContext(req);

      if (orgId == null && !isPrivileged) {
        sendForbidden(res, 'Forbidden: org context required');
        return;
      }

      const rows = await db
        .select()
        .from(inferenceLogTable)
        .orderBy(desc(inferenceLogTable.createdAt))
        .limit(limit);

      const log = rows.map((r) => ({
        id: r.id,
        model: r.model,
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId,
        actor: r.actor,
        platform: r.platform,
        confidence: r.confidence != null ? Number(r.confidence) : null,
        latencyMs: r.latencyMs,
        timestamp: r.createdAt,
      }));

      sendSuccess(res, { log, total: log.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch AI governance log');
    }
  },
);

export function register(r: IRouter): void {
  registerSeedRouteIfNonProd();
  r.use(router);
}
