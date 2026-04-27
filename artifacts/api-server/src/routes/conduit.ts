import { Router, type IRouter, type Request, type Response } from 'express';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import { db } from '@szl-holdings/db';
import {
  conduitConnectionsTable,
  conduitSyncMappingsTable,
  conduitSyncRunRowsTable,
  conduitSyncRunsTable,
  conduitSyncsTable,
  conduitTemplatesTable,
} from '@szl-holdings/db';
import { logger } from '../lib/logger';
import { logActivityFromRequest } from '@szl-holdings/audit';

const router: IRouter = Router();

const CONDUIT_DESTINATIONS = [
  'salesforce', 'hubspot', 'slack', 'google_sheets', 'notion', 'airtable',
  'zendesk', 'marketo', 'intercom', 'pipedrive', 'mailchimp', 'segment', 'webhook',
];

const BUILTIN_TEMPLATES = [
  {
    id: 'tpl-terra-salesforce',
    name: 'Terra Deals → Salesforce Opportunities',
    sourceType: 'api_resource',
    destination: 'salesforce',
    description: 'Sync Terra investment deals to Salesforce Opportunity records, mapping deal stage and financials.',
    category: 'CRM',
    icon: 'building',
    mappingCount: 8,
    mappings: [
      { sourceField: 'name', destinationField: 'Name', transform: null, transformConfig: {}, sortOrder: 0 },
      { sourceField: 'stage', destinationField: 'StageName', transform: null, transformConfig: {}, sortOrder: 1 },
      { sourceField: 'dealValue', destinationField: 'Amount', transform: null, transformConfig: {}, sortOrder: 2 },
      { sourceField: 'closeDate', destinationField: 'CloseDate', transform: 'format_date', transformConfig: { format: 'YYYY-MM-DD' }, sortOrder: 3 },
      { sourceField: 'propertyAddress', destinationField: 'Description', transform: null, transformConfig: {}, sortOrder: 4 },
    ],
  },
  {
    id: 'tpl-vessels-slack',
    name: 'Vessels Alerts → Slack Channel',
    sourceType: 'api_resource',
    destination: 'slack',
    description: 'Push Vessels port state control and sanction alerts to a Slack channel for real-time monitoring.',
    category: 'Notifications',
    icon: 'anchor',
    mappingCount: 4,
    mappings: [
      { sourceField: 'vesselName', destinationField: 'text', transform: null, transformConfig: {}, sortOrder: 0 },
      { sourceField: 'alertType', destinationField: 'username', transform: 'uppercase', transformConfig: {}, sortOrder: 1 },
      { sourceField: 'severity', destinationField: 'icon_emoji', transform: null, transformConfig: {}, sortOrder: 2 },
    ],
  },
  {
    id: 'tpl-prism-notion',
    name: 'PRISM Matters → Notion Database',
    sourceType: 'api_resource',
    destination: 'notion',
    description: 'Mirror PRISM legal matters to a Notion database for team collaboration and external reporting.',
    category: 'Productivity',
    icon: 'scale',
    mappingCount: 7,
    mappings: [
      { sourceField: 'name', destinationField: 'Name', transform: null, transformConfig: {}, sortOrder: 0 },
      { sourceField: 'matterNumber', destinationField: 'Matter Number', transform: null, transformConfig: {}, sortOrder: 1 },
      { sourceField: 'status', destinationField: 'Status', transform: null, transformConfig: {}, sortOrder: 2 },
      { sourceField: 'leadCounsel', destinationField: 'Lead Counsel', transform: null, transformConfig: {}, sortOrder: 3 },
    ],
  },
  {
    id: 'tpl-holdings-hubspot',
    name: 'SZL Holdings Ventures → HubSpot Deals',
    sourceType: 'api_resource',
    destination: 'hubspot',
    description: 'Sync SZL portfolio ventures to HubSpot deals for investor relationship management.',
    category: 'CRM',
    icon: 'briefcase',
    mappingCount: 5,
    mappings: [
      { sourceField: 'name', destinationField: 'dealname', transform: null, transformConfig: {}, sortOrder: 0 },
      { sourceField: 'sector', destinationField: 'industry', transform: null, transformConfig: {}, sortOrder: 1 },
      { sourceField: 'stage', destinationField: 'dealstage', transform: null, transformConfig: {}, sortOrder: 2 },
    ],
  },
];

// ─── Stats ────────────────────────────────────────────────────────────────────
router.get('/conduit/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const [[syncsAgg], [runsAgg], recentRuns] = await Promise.all([
      db.select({
        totalSyncs: count(),
        activeSyncs: sql<number>`count(*) filter (where status = 'active')`,
      }).from(conduitSyncsTable),
      db.select({
        totalRuns: count(),
        successfulRuns: sql<number>`count(*) filter (where status = 'success')`,
        failedRuns: sql<number>`count(*) filter (where status = 'failed' or status = 'partial')`,
        totalRowsWritten: sql<number>`coalesce(sum(rows_written), 0)`,
      }).from(conduitSyncRunsTable),
      db.select().from(conduitSyncRunsTable).orderBy(desc(conduitSyncRunsTable.startedAt)).limit(5),
    ]);

    const successRate = syncsAgg.totalSyncs > 0 && runsAgg.totalRuns > 0
      ? Math.round((Number(runsAgg.successfulRuns) / Number(runsAgg.totalRuns)) * 100)
      : 0;

    res.json({
      totalSyncs: Number(syncsAgg.totalSyncs),
      activeSyncs: Number(syncsAgg.activeSyncs),
      totalRuns: Number(runsAgg.totalRuns),
      successfulRuns: Number(runsAgg.successfulRuns),
      failedRuns: Number(runsAgg.failedRuns),
      totalRowsWritten: Number(runsAgg.totalRowsWritten),
      successRate,
      recentRuns,
    });
  } catch (err) {
    req.log.error({ err }, 'Failed to get conduit stats');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Connections ──────────────────────────────────────────────────────────────
router.get('/conduit/connections', async (req: Request, res: Response): Promise<void> => {
  try {
    const connections = await db.select().from(conduitConnectionsTable).orderBy(desc(conduitConnectionsTable.createdAt));
    res.json(connections);
  } catch (err) {
    req.log.error({ err }, 'Failed to list connections');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/conduit/connections', async (req: Request, res: Response): Promise<void> => {
  const { name, destination, credentials } = req.body as { name?: string; destination?: string; credentials?: Record<string, unknown> };
  if (!name || !destination) {
    res.status(400).json({ error: 'name and destination are required' });
    return;
  }
  if (!CONDUIT_DESTINATIONS.includes(destination)) {
    res.status(400).json({ error: `Unknown destination: ${destination}` });
    return;
  }
  try {
    const credentialMeta = credentials ? Object.fromEntries(Object.keys(credentials).map(k => [k, '***'])) : {};
    const [connection] = await db.insert(conduitConnectionsTable).values({
      name,
      destination,
      credentialMeta,
      status: 'untested',
    }).returning();
    await logActivityFromRequest(req, 'conduit.connection.create', 'conduit_connection', connection.id, undefined, { name, destination });
    res.status(201).json(connection);
  } catch (err) {
    req.log.error({ err }, 'Failed to create connection');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/conduit/connections/:id', async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const [connection] = await db.select().from(conduitConnectionsTable).where(eq(conduitConnectionsTable.id, id));
    if (!connection) { res.status(404).json({ error: 'Connection not found' }); return; }
    res.json(connection);
  } catch (err) {
    req.log.error({ err }, 'Failed to get connection');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/conduit/connections/:id', async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, credentials } = req.body as { name?: string; credentials?: Record<string, unknown> };
  try {
    const updates: Partial<typeof conduitConnectionsTable.$inferInsert> = {};
    if (name) updates.name = name;
    if (credentials) updates.credentialMeta = Object.fromEntries(Object.keys(credentials).map(k => [k, '***']));
    const [connection] = await db.update(conduitConnectionsTable).set(updates).where(eq(conduitConnectionsTable.id, id)).returning();
    if (!connection) { res.status(404).json({ error: 'Connection not found' }); return; }
    await logActivityFromRequest(req, 'conduit.connection.update', 'conduit_connection', id);
    res.json(connection);
  } catch (err) {
    req.log.error({ err }, 'Failed to update connection');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/conduit/connections/:id', async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const [connection] = await db.delete(conduitConnectionsTable).where(eq(conduitConnectionsTable.id, id)).returning();
    if (!connection) { res.status(404).json({ error: 'Connection not found' }); return; }
    await logActivityFromRequest(req, 'conduit.connection.delete', 'conduit_connection', id);
    res.sendStatus(204);
  } catch (err) {
    req.log.error({ err }, 'Failed to delete connection');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/conduit/connections/:id/test', async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const [connection] = await db.select().from(conduitConnectionsTable).where(eq(conduitConnectionsTable.id, id));
    if (!connection) { res.status(404).json({ error: 'Connection not found' }); return; }
    const start = Date.now();
    // Simulate connection test (real implementation would call the destination API)
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    const latencyMs = Date.now() - start;
    const success = Math.random() > 0.1; // 90% success rate in mock
    await db.update(conduitConnectionsTable).set({
      status: success ? 'active' : 'error',
      testedAt: new Date(),
    }).where(eq(conduitConnectionsTable.id, id));
    res.json({ success, message: success ? 'Connection successful' : 'Connection refused: check credentials', latencyMs });
  } catch (err) {
    req.log.error({ err }, 'Failed to test connection');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Syncs ────────────────────────────────────────────────────────────────────
router.get('/conduit/syncs', async (req: Request, res: Response): Promise<void> => {
  try {
    const syncs = await db.select({
      sync: conduitSyncsTable,
      connection: conduitConnectionsTable,
      mappingCount: sql<number>`(select count(*) from conduit_sync_mappings where sync_id = conduit_syncs.id)`,
    })
      .from(conduitSyncsTable)
      .leftJoin(conduitConnectionsTable, eq(conduitSyncsTable.connectionId, conduitConnectionsTable.id))
      .orderBy(desc(conduitSyncsTable.createdAt));

    res.json(syncs.map(row => ({
      ...row.sync,
      connection: row.connection,
      mappingCount: Number(row.mappingCount),
    })));
  } catch (err) {
    req.log.error({ err }, 'Failed to list syncs');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/conduit/syncs', async (req: Request, res: Response): Promise<void> => {
  const { name, sourceType, sourceMeta, connectionId, objectType, runMode, scheduleExpr, semantics, upsertKey } = req.body as Record<string, unknown>;
  if (!name || !connectionId || !objectType || !runMode || !semantics) {
    res.status(400).json({ error: 'name, connectionId, objectType, runMode, and semantics are required' });
    return;
  }
  try {
    const [sync] = await db.insert(conduitSyncsTable).values({
      name: name as string,
      sourceType: (sourceType as string) || 'postgres',
      sourceMeta: (sourceMeta as Record<string, unknown>) || {},
      connectionId: connectionId as string,
      objectType: objectType as string,
      runMode: (runMode as 'manual' | 'scheduled' | 'on_change') || 'manual',
      scheduleExpr: scheduleExpr as string | undefined,
      semantics: (semantics as 'insert' | 'upsert' | 'mirror') || 'upsert',
      upsertKey: upsertKey as string | undefined,
      status: 'draft',
    }).returning();
    await logActivityFromRequest(req, 'conduit.sync.create', 'conduit_sync', sync.id, undefined, { name, connectionId, objectType });
    res.status(201).json(sync);
  } catch (err) {
    req.log.error({ err }, 'Failed to create sync');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/conduit/syncs/:id', async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const [row] = await db.select({
      sync: conduitSyncsTable,
      connection: conduitConnectionsTable,
      mappingCount: sql<number>`(select count(*) from conduit_sync_mappings where sync_id = conduit_syncs.id)`,
    })
      .from(conduitSyncsTable)
      .leftJoin(conduitConnectionsTable, eq(conduitSyncsTable.connectionId, conduitConnectionsTable.id))
      .where(eq(conduitSyncsTable.id, id));

    if (!row) { res.status(404).json({ error: 'Sync not found' }); return; }
    res.json({ ...row.sync, connection: row.connection, mappingCount: Number(row.mappingCount) });
  } catch (err) {
    req.log.error({ err }, 'Failed to get sync');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/conduit/syncs/:id', async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const updates = req.body as Record<string, unknown>;
  try {
    const allowed = ['name', 'sourceType', 'sourceMeta', 'connectionId', 'objectType', 'runMode', 'scheduleExpr', 'semantics', 'upsertKey', 'status'];
    const filtered = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));
    const [sync] = await db.update(conduitSyncsTable).set(filtered as Partial<typeof conduitSyncsTable.$inferInsert>).where(eq(conduitSyncsTable.id, id)).returning();
    if (!sync) { res.status(404).json({ error: 'Sync not found' }); return; }
    await logActivityFromRequest(req, 'conduit.sync.update', 'conduit_sync', id);
    res.json(sync);
  } catch (err) {
    req.log.error({ err }, 'Failed to update sync');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/conduit/syncs/:id', async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const [sync] = await db.delete(conduitSyncsTable).where(eq(conduitSyncsTable.id, id)).returning();
    if (!sync) { res.status(404).json({ error: 'Sync not found' }); return; }
    await logActivityFromRequest(req, 'conduit.sync.delete', 'conduit_sync', id);
    res.sendStatus(204);
  } catch (err) {
    req.log.error({ err }, 'Failed to delete sync');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Run Sync ─────────────────────────────────────────────────────────────────
router.post('/conduit/syncs/:id/run', async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const [sync] = await db.select().from(conduitSyncsTable).where(eq(conduitSyncsTable.id, id));
    if (!sync) { res.status(404).json({ error: 'Sync not found' }); return; }

    const [run] = await db.insert(conduitSyncRunsTable).values({
      syncId: id,
      status: 'running',
      triggeredBy: 'manual',
    }).returning();

    await logActivityFromRequest(req, 'conduit.sync.run', 'conduit_sync', id, undefined, { runId: run.id });

    // Simulate async execution
    simulateSyncExecution(run.id, id).catch(err => logger.error({ err, runId: run.id }, 'Sync execution error'));

    res.status(202).json(run);
  } catch (err) {
    req.log.error({ err }, 'Failed to trigger sync run');
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function simulateSyncExecution(runId: string, syncId: string): Promise<void> {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 5000));
    const rowsRead = Math.floor(Math.random() * 1000) + 50;
    const rowsFailed = Math.floor(Math.random() * 5);
    const rowsWritten = rowsRead - rowsFailed;
    const status = rowsFailed === 0 ? 'success' : 'partial';
    const durationMs = 2000 + Math.floor(Math.random() * 5000);

    await db.update(conduitSyncRunsTable).set({
      status,
      rowsRead,
      rowsWritten,
      rowsFailed,
      durationMs,
      finishedAt: new Date(),
    }).where(eq(conduitSyncRunsTable.id, runId));

    await db.update(conduitSyncsTable).set({
      lastRunId: runId,
      lastRunAt: new Date(),
      lastRunStatus: status,
    }).where(eq(conduitSyncsTable.id, syncId));

    if (rowsFailed > 0) {
      const failedRows = Array.from({ length: rowsFailed }, (_, i) => ({
        runId,
        rowIndex: i,
        sourceData: { id: `row_${i}`, value: 'example' },
        errorMessage: 'Field mapping error: required destination field missing',
      }));
      await db.insert(conduitSyncRunRowsTable).values(failedRows);
    }
  } catch (err) {
    logger.error({ err, runId }, 'Failed to complete sync execution');
    await db.update(conduitSyncRunsTable).set({
      status: 'failed',
      errorMessage: 'Execution failed unexpectedly',
      finishedAt: new Date(),
    }).where(eq(conduitSyncRunsTable.id, runId));
  }
}

// ─── Sync Mappings ────────────────────────────────────────────────────────────
router.get('/conduit/syncs/:id/mappings', async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const mappings = await db.select().from(conduitSyncMappingsTable)
      .where(eq(conduitSyncMappingsTable.syncId, id))
      .orderBy(conduitSyncMappingsTable.sortOrder);
    res.json(mappings);
  } catch (err) {
    req.log.error({ err }, 'Failed to get sync mappings');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/conduit/syncs/:id/mappings', async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { mappings } = req.body as { mappings?: Array<Record<string, unknown>> };
  if (!Array.isArray(mappings)) { res.status(400).json({ error: 'mappings array required' }); return; }
  try {
    await db.delete(conduitSyncMappingsTable).where(eq(conduitSyncMappingsTable.syncId, id));
    const inserted = mappings.length > 0
      ? await db.insert(conduitSyncMappingsTable).values(
          mappings.map((m, i) => ({
            syncId: id,
            sourceField: m.sourceField as string,
            destinationField: m.destinationField as string,
            transform: m.transform as string | undefined,
            transformConfig: (m.transformConfig as Record<string, unknown>) || {},
            sortOrder: typeof m.sortOrder === 'number' ? m.sortOrder : i,
          }))
        ).returning()
      : [];
    await logActivityFromRequest(req, 'conduit.sync.mappings.update', 'conduit_sync', id, undefined, { mappingCount: mappings.length });
    res.json(inserted);
  } catch (err) {
    req.log.error({ err }, 'Failed to update sync mappings');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Sync Runs ────────────────────────────────────────────────────────────────
router.get('/conduit/sync-runs', async (req: Request, res: Response): Promise<void> => {
  const { syncId, status, limit = '50', offset = '0' } = req.query as Record<string, string>;
  try {
    const conditions = [];
    if (syncId) conditions.push(eq(conduitSyncRunsTable.syncId, syncId));
    if (status) conditions.push(eq(conduitSyncRunsTable.status, status as 'running' | 'success' | 'failed' | 'partial'));

    const [runs, [{ total }]] = await Promise.all([
      db.select({
        run: conduitSyncRunsTable,
        syncName: conduitSyncsTable.name,
      })
        .from(conduitSyncRunsTable)
        .leftJoin(conduitSyncsTable, eq(conduitSyncRunsTable.syncId, conduitSyncsTable.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(conduitSyncRunsTable.startedAt))
        .limit(parseInt(limit))
        .offset(parseInt(offset)),
      db.select({ total: count() })
        .from(conduitSyncRunsTable)
        .where(conditions.length ? and(...conditions) : undefined),
    ]);

    res.json({
      data: runs.map(r => ({ ...r.run, syncName: r.syncName })),
      total: Number(total),
    });
  } catch (err) {
    req.log.error({ err }, 'Failed to list sync runs');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/conduit/sync-runs/:id', async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const [row] = await db.select({ run: conduitSyncRunsTable, sync: conduitSyncsTable })
      .from(conduitSyncRunsTable)
      .leftJoin(conduitSyncsTable, eq(conduitSyncRunsTable.syncId, conduitSyncsTable.id))
      .where(eq(conduitSyncRunsTable.id, id));
    if (!row) { res.status(404).json({ error: 'Sync run not found' }); return; }
    const sampleErrors = await db.select().from(conduitSyncRunRowsTable)
      .where(eq(conduitSyncRunRowsTable.runId, id)).limit(20);
    res.json({ ...row.run, sync: row.sync, sampleErrors });
  } catch (err) {
    req.log.error({ err }, 'Failed to get sync run');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/conduit/sync-runs/:id/rows', async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { limit = '100', offset = '0' } = req.query as Record<string, string>;
  try {
    const rows = await db.select().from(conduitSyncRunRowsTable)
      .where(eq(conduitSyncRunRowsTable.runId, id))
      .limit(parseInt(limit))
      .offset(parseInt(offset));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, 'Failed to list run rows');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/conduit/sync-runs/:id/rows/:rowId/retry', async (req: Request, res: Response): Promise<void> => {
  const rowId = Array.isArray(req.params.rowId) ? req.params.rowId[0] : req.params.rowId;
  try {
    await db.update(conduitSyncRunRowsTable).set({ retried: true, retriedAt: new Date() }).where(eq(conduitSyncRunRowsTable.id, rowId));
    res.sendStatus(202);
  } catch (err) {
    req.log.error({ err }, 'Failed to retry row');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Templates ────────────────────────────────────────────────────────────────
router.get('/conduit/templates', async (_req: Request, res: Response): Promise<void> => {
  res.json(BUILTIN_TEMPLATES);
});

router.get('/conduit/templates/:id', async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const template = BUILTIN_TEMPLATES.find(t => t.id === id);
  if (!template) { res.status(404).json({ error: 'Template not found' }); return; }
  res.json(template);
});

router.post('/conduit/templates/:id/apply', async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const template = BUILTIN_TEMPLATES.find(t => t.id === id);
  if (!template) { res.status(404).json({ error: 'Template not found' }); return; }
  const { connectionId, name } = req.body as { connectionId?: string; name?: string };
  if (!connectionId) { res.status(400).json({ error: 'connectionId is required' }); return; }
  try {
    const [sync] = await db.insert(conduitSyncsTable).values({
      name: name || template.name,
      sourceType: template.sourceType,
      connectionId,
      objectType: template.destination,
      runMode: 'manual',
      semantics: 'upsert',
      status: 'draft',
    }).returning();
    if (template.mappings.length > 0) {
      await db.insert(conduitSyncMappingsTable).values(
        template.mappings.map((m, i) => ({
          syncId: sync.id,
          sourceField: m.sourceField as string,
          destinationField: m.destinationField as string,
          transform: m.transform as 'uppercase' | 'lowercase' | null,
          transformConfig: (m.transformConfig as Record<string, unknown>) || {},
          sortOrder: i,
        }))
      );
    }
    await logActivityFromRequest(req, 'conduit.template.apply', 'conduit_sync', sync.id, undefined, { templateId: id, templateName: template.name });
    res.status(201).json(sync);
  } catch (err) {
    req.log.error({ err }, 'Failed to apply template');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Source Preview ───────────────────────────────────────────────────────────
router.post('/conduit/sources/preview', async (req: Request, res: Response): Promise<void> => {
  const { sourceType, mappings } = req.body as { sourceType?: string; sourceMeta?: Record<string, unknown>; mappings?: Array<Record<string, unknown>> };
  try {
    // Mock preview based on source type
    const MOCK_SOURCES: Record<string, { fields: string[]; rows: Array<Record<string, unknown>> }> = {
      postgres: {
        fields: ['id', 'name', 'email', 'created_at', 'status', 'value'],
        rows: Array.from({ length: 10 }, (_, i) => ({
          id: `row_${i + 1}`, name: `Record ${i + 1}`, email: `user${i + 1}@example.com`,
          created_at: new Date(Date.now() - i * 86400000).toISOString(), status: i % 3 === 0 ? 'active' : 'inactive', value: Math.floor(Math.random() * 10000),
        })),
      },
      api_resource: {
        fields: ['id', 'name', 'stage', 'value', 'address', 'lat', 'lng', 'updatedAt'],
        rows: Array.from({ length: 10 }, (_, i) => ({
          id: `deal_${i + 1}`, name: `Asset ${i + 1}`, stage: ['sourcing', 'diligence', 'offer', 'closed'][i % 4],
          value: (i + 1) * 250000, address: `${100 + i} Main St, New York, NY`, lat: 40.7 + i * 0.01, lng: -74.0 + i * 0.01,
          updatedAt: new Date(Date.now() - i * 3600000).toISOString(),
        })),
      },
      csv: {
        fields: ['col_a', 'col_b', 'col_c', 'col_d'],
        rows: Array.from({ length: 10 }, (_, i) => ({ col_a: `val_a_${i}`, col_b: `val_b_${i}`, col_c: i * 10, col_d: i % 2 === 0 })),
      },
    };
    const mock = MOCK_SOURCES[sourceType || 'postgres'] || MOCK_SOURCES.postgres;
    res.json({ fields: mock.fields, rows: mock.rows.slice(0, 10), totalRows: mock.rows.length });
  } catch (err) {
    req.log.error({ err }, 'Failed to preview source');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Destination metadata ─────────────────────────────────────────────────────
const DESTINATION_OBJECTS: Record<string, Array<{ name: string; label: string; description: string }>> = {
  salesforce: [
    { name: 'Contact', label: 'Contact', description: 'A person in Salesforce' },
    { name: 'Lead', label: 'Lead', description: 'A potential customer' },
    { name: 'Account', label: 'Account', description: 'An organization' },
    { name: 'Opportunity', label: 'Opportunity', description: 'A sales opportunity' },
    { name: 'CustomObject__c', label: 'Custom Object', description: 'Your custom Salesforce object' },
  ],
  hubspot: [
    { name: 'contacts', label: 'Contact', description: 'HubSpot contact record' },
    { name: 'companies', label: 'Company', description: 'HubSpot company record' },
    { name: 'deals', label: 'Deal', description: 'HubSpot deal record' },
    { name: 'tickets', label: 'Ticket', description: 'HubSpot support ticket' },
  ],
  slack: [
    { name: 'message', label: 'Message', description: 'Send a message to a channel' },
  ],
  notion: [
    { name: 'database_row', label: 'Database Row', description: 'Add or update a Notion database row' },
  ],
  google_sheets: [
    { name: 'spreadsheet_row', label: 'Spreadsheet Row', description: 'Append or upsert a row in a Google Sheet' },
  ],
  airtable: [
    { name: 'record', label: 'Record', description: 'Airtable base record' },
  ],
  webhook: [
    { name: 'payload', label: 'Webhook Payload', description: 'HTTP POST payload to your webhook URL' },
  ],
};

const DESTINATION_FIELDS: Record<string, Array<{ name: string; label: string; type: string; required?: boolean; updateable?: boolean }>> = {
  'salesforce:Contact': [
    { name: 'FirstName', label: 'First Name', type: 'string', required: false, updateable: true },
    { name: 'LastName', label: 'Last Name', type: 'string', required: true, updateable: true },
    { name: 'Email', label: 'Email', type: 'email', required: false, updateable: true },
    { name: 'Phone', label: 'Phone', type: 'phone', required: false, updateable: true },
    { name: 'Title', label: 'Title', type: 'string', required: false, updateable: true },
  ],
  'salesforce:Opportunity': [
    { name: 'Name', label: 'Name', type: 'string', required: true, updateable: true },
    { name: 'StageName', label: 'Stage', type: 'picklist', required: true, updateable: true },
    { name: 'Amount', label: 'Amount', type: 'currency', required: false, updateable: true },
    { name: 'CloseDate', label: 'Close Date', type: 'date', required: true, updateable: true },
    { name: 'Description', label: 'Description', type: 'textarea', required: false, updateable: true },
  ],
  'hubspot:contacts': [
    { name: 'email', label: 'Email', type: 'string', required: true, updateable: true },
    { name: 'firstname', label: 'First Name', type: 'string', required: false, updateable: true },
    { name: 'lastname', label: 'Last Name', type: 'string', required: false, updateable: true },
    { name: 'phone', label: 'Phone', type: 'string', required: false, updateable: true },
    { name: 'company', label: 'Company', type: 'string', required: false, updateable: true },
  ],
  'hubspot:deals': [
    { name: 'dealname', label: 'Deal Name', type: 'string', required: true, updateable: true },
    { name: 'amount', label: 'Amount', type: 'number', required: false, updateable: true },
    { name: 'dealstage', label: 'Deal Stage', type: 'picklist', required: false, updateable: true },
    { name: 'industry', label: 'Industry', type: 'string', required: false, updateable: true },
  ],
};

router.get('/conduit/destinations/:destination/objects', async (req: Request, res: Response): Promise<void> => {
  const destination = Array.isArray(req.params.destination) ? req.params.destination[0] : req.params.destination;
  const objects = DESTINATION_OBJECTS[destination] || [];
  res.json(objects);
});

router.get('/conduit/destinations/:destination/objects/:objectType/fields', async (req: Request, res: Response): Promise<void> => {
  const destination = Array.isArray(req.params.destination) ? req.params.destination[0] : req.params.destination;
  const objectType = Array.isArray(req.params.objectType) ? req.params.objectType[0] : req.params.objectType;
  const key = `${destination}:${objectType}`;
  const fields = DESTINATION_FIELDS[key] || [
    { name: 'field_1', label: 'Field 1', type: 'string', required: false, updateable: true },
    { name: 'field_2', label: 'Field 2', type: 'string', required: false, updateable: true },
    { name: 'field_3', label: 'Field 3', type: 'number', required: false, updateable: true },
  ];
  res.json(fields);
});

export default router;
