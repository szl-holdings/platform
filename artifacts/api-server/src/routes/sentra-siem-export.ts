import { randomUUID } from 'node:crypto';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { db, siemExportConnectionsTable, siemExportEventsTable } from '@szl-holdings/db';
import { getExportAdapter, listExportAdapters, type SentraFinding } from '../siem/export-registry';
import { handleRouteError, sendBadRequest, sendCreated, sendNotFound, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { logger } from '../lib/logger';
import { authMiddleware } from '../middlewares/auth';
import { getUserOrgIds } from '../middlewares/tenant-scope';

const router = Router();

const SIEM_AUTH_PATHS = [
  '/sentra/siem-export/connections',
  '/sentra/siem-export/events',
];
router.use(SIEM_AUTH_PATHS, authMiddleware());

function getCallerOrgId(req: Request): string | null {
  const orgIds = getUserOrgIds(req.user!);
  if (orgIds !== null && orgIds.size > 0) return String([...orgIds][0]!);
  return null;
}

function buildOrgCondition(req: Request) {
  const orgIds = getUserOrgIds(req.user!);
  if (orgIds === null) return undefined;
  if (orgIds.size === 0) return eq(siemExportConnectionsTable.orgId, '__no_org_match__');
  return inArray(siemExportConnectionsTable.orgId, [...orgIds].map(String));
}

router.get('/sentra/siem-export/adapters', (_req: Request, res: Response) => {
  try {
    const adapters = listExportAdapters().map((a) => ({
      id: a.id,
      displayName: a.displayName,
      description: a.description,
      configFields: Object.entries(a.configSchema.shape).map(([key, schema]) => ({
        key,
        description: (schema as { description?: string }).description ?? '',
      })),
    }));
    sendSuccess(res, { adapters });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list SIEM export adapters');
  }
});

const createExportConnectionSchema = z.object({
  name: z.string().min(1).max(100),
  adapterId: z.enum(['splunk-cef', 'sentinel-asim', 'chronicle-udm']),
  config: z.record(z.unknown()),
});

router.post(
  '/sentra/siem-export/connections',
  validateBody(createExportConnectionSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof createExportConnectionSchema>;
      const adapter = getExportAdapter(body.adapterId);
      if (!adapter) {
        sendBadRequest(res, `Unknown export adapter: ${body.adapterId}`);
        return;
      }

      const validation = adapter.validate(body.config as Record<string, unknown>);
      if (!validation.ok) {
        sendBadRequest(res, 'Invalid adapter config: ' + validation.errors.join('; '));
        return;
      }

      const connectionId = randomUUID();
      const orgId = getCallerOrgId(req);
      const userId = req.user?.id ? String(req.user.id) : null;

      await db.insert(siemExportConnectionsTable).values({
        connectionId,
        name: body.name,
        adapterId: body.adapterId,
        config: body.config as Record<string, unknown>,
        orgId,
        createdBy: userId,
      });

      const [created] = await db
        .select()
        .from(siemExportConnectionsTable)
        .where(eq(siemExportConnectionsTable.connectionId, connectionId));

      logger.info({ connectionId, adapterId: body.adapterId }, '[siem-export] connection created');
      sendCreated(res, { ...created, config: sanitizeConfig(created!.config as Record<string, unknown>) });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create SIEM export connection');
    }
  },
);

router.get('/sentra/siem-export/connections', async (req: Request, res: Response) => {
  try {
    const orgFilter = buildOrgCondition(req);
    const connections = await db
      .select()
      .from(siemExportConnectionsTable)
      .where(orgFilter)
      .orderBy(desc(siemExportConnectionsTable.createdAt));

    const sanitized = connections.map((c) => ({
      ...c,
      config: sanitizeConfig(c.config as Record<string, unknown>),
    }));

    sendSuccess(res, { connections: sanitized, total: sanitized.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list SIEM export connections');
  }
});

router.post(
  '/sentra/siem-export/connections/:connectionId/test',
  async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const orgFilter = buildOrgCondition(req);
      const conditions = [eq(siemExportConnectionsTable.connectionId, connectionId!)];
      if (orgFilter) conditions.push(orgFilter);

      const [conn] = await db
        .select()
        .from(siemExportConnectionsTable)
        .where(and(...conditions));

      if (!conn) {
        sendNotFound(res, 'SIEM Export Connection');
        return;
      }

      const adapter = getExportAdapter(conn.adapterId);
      if (!adapter) {
        sendBadRequest(res, `Unknown adapter: ${conn.adapterId}`);
        return;
      }

      const result = await adapter.testConnection(conn.config as Record<string, unknown>);
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to test SIEM export connection');
    }
  },
);

router.post(
  '/sentra/siem-export/connections/:connectionId/toggle',
  async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const orgFilter = buildOrgCondition(req);
      const conditions = [eq(siemExportConnectionsTable.connectionId, connectionId!)];
      if (orgFilter) conditions.push(orgFilter);

      const [conn] = await db
        .select()
        .from(siemExportConnectionsTable)
        .where(and(...conditions));

      if (!conn) {
        sendNotFound(res, 'SIEM Export Connection');
        return;
      }

      const newEnabled = conn.enabled === 'true' ? 'false' : 'true';
      await db
        .update(siemExportConnectionsTable)
        .set({ enabled: newEnabled, updatedAt: new Date() })
        .where(eq(siemExportConnectionsTable.connectionId, connectionId!));

      sendSuccess(res, { connectionId, enabled: newEnabled === 'true' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to toggle SIEM export connection');
    }
  },
);

router.delete('/sentra/siem-export/connections/:connectionId', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const orgFilter = buildOrgCondition(req);
    const conditions = [eq(siemExportConnectionsTable.connectionId, connectionId!)];
    if (orgFilter) conditions.push(orgFilter);

    const deleted = await db
      .delete(siemExportConnectionsTable)
      .where(and(...conditions))
      .returning();

    if (deleted.length === 0) {
      sendNotFound(res, 'SIEM Export Connection');
      return;
    }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, 'Failed to delete SIEM export connection');
  }
});

const exportFindingsSchema = z.object({
  findings: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
      category: z.string(),
      description: z.string(),
      source: z.string(),
      asset: z.string().optional(),
      mitreTactic: z.string().optional(),
      mitreTechnique: z.string().optional(),
      detectedAt: z.string(),
      rawPayload: z.unknown().optional(),
    }),
  ),
});

router.post(
  '/sentra/siem-export/connections/:connectionId/export',
  validateBody(exportFindingsSchema),
  async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const { findings } = req.body as z.infer<typeof exportFindingsSchema>;

      const orgFilter = buildOrgCondition(req);
      const conditions = [eq(siemExportConnectionsTable.connectionId, connectionId!)];
      if (orgFilter) conditions.push(orgFilter);

      const [conn] = await db
        .select()
        .from(siemExportConnectionsTable)
        .where(and(...conditions));

      if (!conn) {
        sendNotFound(res, 'SIEM Export Connection');
        return;
      }

      if (conn.enabled !== 'true') {
        sendBadRequest(res, 'Connection is disabled');
        return;
      }

      const adapter = getExportAdapter(conn.adapterId);
      if (!adapter) {
        sendBadRequest(res, `Unknown adapter: ${conn.adapterId}`);
        return;
      }

      const formatMap: Record<string, string> = {
        'splunk-cef': 'cef',
        'sentinel-asim': 'asim',
        'chronicle-udm': 'udm',
      };

      const result = await adapter.export(
        conn.config as Record<string, unknown>,
        findings as SentraFinding[],
      );

      const allExported = result.exported === findings.length;
      const allFailed = result.failed === findings.length;

      for (let i = 0; i < findings.length; i++) {
        const finding = findings[i]!;
        const findingStatus = allExported
          ? 'exported'
          : allFailed
            ? 'failed'
            : i < result.exported
              ? 'exported'
              : 'failed';

        await db.insert(siemExportEventsTable).values({
          eventId: randomUUID(),
          connectionId: connectionId!,
          findingId: finding.id,
          format: (formatMap[conn.adapterId] ?? 'cef') as 'cef' | 'asim' | 'udm',
          status: findingStatus,
          payload: finding as unknown as Record<string, unknown>,
          errorMessage: findingStatus === 'failed' && result.errors.length > 0 ? result.errors.join('; ') : null,
          exportedAt: findingStatus === 'exported' ? new Date() : null,
        });
      }

      await db
        .update(siemExportConnectionsTable)
        .set({
          lastExportAt: new Date(),
          totalExported: sql`${siemExportConnectionsTable.totalExported} + ${result.exported}`,
          totalFailed: sql`${siemExportConnectionsTable.totalFailed} + ${result.failed}`,
          updatedAt: new Date(),
        })
        .where(eq(siemExportConnectionsTable.connectionId, connectionId!));

      logger.info(
        { connectionId, exported: result.exported, failed: result.failed },
        '[siem-export] findings exported',
      );
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to export findings');
    }
  },
);

router.get('/sentra/siem-export/events', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '50'), 10), 200);
    const connectionId = req.query.connectionId as string | undefined;

    const orgFilter = buildOrgCondition(req);
    let allowedConnectionIds: string[] | undefined;

    if (orgFilter) {
      const ownedConns = await db
        .select({ connectionId: siemExportConnectionsTable.connectionId })
        .from(siemExportConnectionsTable)
        .where(orgFilter);
      allowedConnectionIds = ownedConns.map((c) => c.connectionId);
      if (allowedConnectionIds.length === 0) {
        sendSuccess(res, { events: [], total: 0 });
        return;
      }
    }

    const eventConditions = [];
    if (connectionId) {
      eventConditions.push(eq(siemExportEventsTable.connectionId, connectionId));
    }
    if (allowedConnectionIds) {
      eventConditions.push(inArray(siemExportEventsTable.connectionId, allowedConnectionIds));
    }

    const events = await db
      .select()
      .from(siemExportEventsTable)
      .where(eventConditions.length > 0 ? and(...eventConditions) : undefined)
      .orderBy(desc(siemExportEventsTable.createdAt))
      .limit(limit);

    sendSuccess(res, { events, total: events.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list export events');
  }
});

function sanitizeConfig(config: Record<string, unknown>): Record<string, unknown> {
  const sensitive = ['token', 'secret', 'key', 'password', 'sharedKey', 'serviceAccountJson', 'hecToken'];
  const sanitized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config)) {
    if (sensitive.some((s) => k.toLowerCase().includes(s.toLowerCase()))) {
      sanitized[k] = typeof v === 'string' ? `${v.slice(0, 4)}${'*'.repeat(Math.max(0, String(v).length - 4))}` : '***';
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

export default router;
