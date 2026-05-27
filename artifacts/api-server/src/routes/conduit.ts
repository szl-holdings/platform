import { createHash } from 'node:crypto';
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
import { getReflexivityRuntime } from '../lib/cognitive-reflexivity-runtime';
import {
  initConduitEngine,
  getSource,
  getDestination,
  executeSyncRun,
  retryFailedRow,
  applyMappings,
} from '../lib/conduit/index';
import { dryRunUnstructured } from '../lib/conduit/sources/unstructured-source';
import { recallEpisodes, hashEmbedding, type MemnetEpisode } from '@szl-holdings/ai-engine/memory/memnet-recall';
import {
  rankExtractionConfidencePeaks,
  composeEpisodicScene,
  episodicSceneToUsd,
  type EpisodicRecallInput,
} from '@szl-holdings/document-intelligence';
import { runStagedDocumentPipeline } from '@szl-holdings/document-intelligence/staged-pipeline';

/**
 * Emit a cognitive-reflexive observation when a sync run completes.
 * Best-effort — never throws into the sync execution path.
 */
function emitConduitReflexive(
  result: 'success' | 'partial' | 'failed',
  ctx: { syncId: string; runId: string; rowsRead: number; rowsFailed: number; durationMs?: number; errorMessage?: string },
): void {
  try {
    const runtime = getReflexivityRuntime();
    const failureRate = ctx.rowsRead > 0 ? ctx.rowsFailed / ctx.rowsRead : 0;
    if (result === 'failed') {
      runtime.engine.emit({
        subtype: 'sync.failed',
        observation: `Conduit sync ${ctx.syncId} run ${ctx.runId} failed: ${ctx.errorMessage ?? 'execution error'}`,
        intensity: 0.75,
        evidenceRefs: [`conduit:sync:${ctx.syncId}`, `conduit:run:${ctx.runId}`],
        data: { syncId: ctx.syncId, runId: ctx.runId, errorMessage: ctx.errorMessage },
        source: 'system',
      });
      return;
    }
    if (result === 'partial' && failureRate >= 0.05) {
      runtime.engine.emit({
        subtype: 'sync.degraded',
        observation: `Conduit sync ${ctx.syncId} ran with ${(failureRate * 100).toFixed(1)}% row failures (${ctx.rowsFailed}/${ctx.rowsRead}).`,
        intensity: Math.min(0.9, 0.4 + failureRate * 4),
        evidenceRefs: [`conduit:sync:${ctx.syncId}`, `conduit:run:${ctx.runId}`],
        data: { syncId: ctx.syncId, runId: ctx.runId, failureRate, rowsFailed: ctx.rowsFailed, rowsRead: ctx.rowsRead },
        source: 'system',
      });
      return;
    }
    if (result === 'success' && ctx.durationMs && ctx.durationMs > 6000) {
      runtime.engine.emit({
        subtype: 'sync.slow',
        observation: `Conduit sync ${ctx.syncId} succeeded but took ${ctx.durationMs}ms (above 6s baseline).`,
        intensity: 0.45,
        evidenceRefs: [`conduit:sync:${ctx.syncId}`, `conduit:run:${ctx.runId}`],
        data: { syncId: ctx.syncId, runId: ctx.runId, durationMs: ctx.durationMs },
        source: 'system',
      });
    }
  } catch (err) {
    logger.debug({ err }, 'Failed to emit conduit reflexive signal');
  }
}

const router: IRouter = Router();

const CONDUIT_DESTINATIONS = [
  'salesforce', 'hubspot', 'slack', 'google_sheets', 'notion', 'airtable',
  'zendesk', 'marketo', 'intercom', 'pipedrive', 'mailchimp', 'segment', 'webhook',
];

interface CredentialRule {
  field: string;
  label: string;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  patternHint?: string;
}

const DESTINATION_CREDENTIAL_RULES: Record<string, CredentialRule[]> = {
  salesforce: [
    { field: 'apiKey', label: 'API Key', required: true, minLength: 15, maxLength: 256, pattern: /^[A-Za-z0-9!]+$/, patternHint: 'must contain only alphanumeric characters' },
    { field: 'instanceUrl', label: 'Instance URL', required: true, pattern: /^https:\/\/.+\.salesforce\.com(\/.*)?$/, patternHint: 'must be a valid Salesforce URL (https://…salesforce.com)' },
  ],
  hubspot: [
    { field: 'apiKey', label: 'API Key', required: true, minLength: 8, maxLength: 256, pattern: /^(pat-|hapi-)?[a-zA-Z0-9-]+$/, patternHint: 'must be a valid HubSpot API key or private app token' },
    { field: 'instanceUrl', label: 'Portal URL', required: false, pattern: /^https:\/\/.+\.hubspot\.com(\/.*)?$/, patternHint: 'must be a valid HubSpot URL (https://…hubspot.com)' },
  ],
  slack: [
    { field: 'apiKey', label: 'Webhook URL or Bot Token', required: true, minLength: 10, maxLength: 2048, pattern: /^(https:\/\/hooks\.slack\.com\/.+|xoxb-[A-Za-z0-9-]+)$/, patternHint: 'must be a Slack webhook URL (https://hooks.slack.com/...) or bot token (xoxb-...)' },
  ],
  google_sheets: [
    { field: 'apiKey', label: 'Service Account Key', required: true, minLength: 20, maxLength: 4096, patternHint: 'must be a valid service account JSON key or API key' },
  ],
  notion: [
    { field: 'apiKey', label: 'Integration Token', required: true, minLength: 10, maxLength: 256, pattern: /^(ntn_|secret_)[A-Za-z0-9]+$/, patternHint: 'must start with ntn_ or secret_ (Notion token format)' },
  ],
  airtable: [
    { field: 'apiKey', label: 'Personal Access Token', required: true, minLength: 10, maxLength: 256, pattern: /^(pat|key)[A-Za-z0-9.]+$/, patternHint: 'must start with pat or key (Airtable token format)' },
  ],
  zendesk: [
    { field: 'apiKey', label: 'API Token', required: true, minLength: 8, maxLength: 256 },
    { field: 'instanceUrl', label: 'Subdomain URL', required: true, pattern: /^https:\/\/.+\.zendesk\.com(\/.*)?$/, patternHint: 'must be a valid Zendesk URL (https://…zendesk.com)' },
  ],
  marketo: [
    { field: 'apiKey', label: 'Client ID', required: true, minLength: 8, maxLength: 256, pattern: /^[a-f0-9-]+$/i, patternHint: 'must be a valid UUID-style client ID' },
  ],
  intercom: [
    { field: 'apiKey', label: 'Access Token', required: true, minLength: 10, maxLength: 256, pattern: /^[A-Za-z0-9=_-]+$/, patternHint: 'must contain only alphanumeric characters, =, _, -' },
  ],
  pipedrive: [
    { field: 'apiKey', label: 'API Token', required: true, minLength: 10, maxLength: 256, pattern: /^[a-f0-9]+$/, patternHint: 'must be a hexadecimal API token' },
  ],
  mailchimp: [
    { field: 'apiKey', label: 'API Key', required: true, minLength: 10, maxLength: 256, pattern: /^[a-f0-9]+-us\d+$/, patternHint: 'must end with a data center suffix (e.g., -us21)' },
  ],
  segment: [
    { field: 'apiKey', label: 'Write Key', required: true, minLength: 10, maxLength: 256, pattern: /^[A-Za-z0-9]+$/, patternHint: 'must contain only alphanumeric characters' },
  ],
  webhook: [
    { field: 'apiKey', label: 'Webhook URL', required: true, minLength: 10, maxLength: 2048, pattern: /^https?:\/\/.+/, patternHint: 'must be a valid HTTP or HTTPS URL' },
  ],
};

function validateDestinationCredentials(
  destination: string,
  credentials: Record<string, string> | null,
  credentialMeta?: Record<string, unknown> | null,
): { valid: boolean; errors: string[] } {
  const rules = DESTINATION_CREDENTIAL_RULES[destination];
  if (!rules) {
    return { valid: false, errors: [`Unknown destination type: ${destination}`] };
  }

  const errors: string[] = [];
  const creds = credentials || {};
  const meta = credentialMeta || {};

  for (const rule of rules) {
    const value = creds[rule.field];
    const metaHasKey = rule.field in meta;

    if (credentials) {
      if (rule.required && (!value || value.trim().length === 0)) {
        errors.push(`${rule.label} is required`);
        continue;
      }

      if (value && value.trim().length > 0) {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${rule.label} is too short (minimum ${rule.minLength} characters)`);
        } else if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${rule.label} is too long (maximum ${rule.maxLength} characters)`);
        } else if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(`${rule.label} format is invalid — ${rule.patternHint || 'check the value and try again'}`);
        }
      }
    } else {
      if (rule.required && !metaHasKey) {
        errors.push(`${rule.label} is required but was not provided when this connection was created`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

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
function redactCredentials(connection: Record<string, unknown>): Record<string, unknown> {
  const result = { ...connection };
  if (result.credentialMeta && typeof result.credentialMeta === 'object') {
    const meta = result.credentialMeta as Record<string, unknown>;
    result.credentialMeta = Object.fromEntries(
      Object.keys(meta).map(k => [k, '***'])
    );
  }
  return result;
}

router.get('/conduit/connections', async (req: Request, res: Response): Promise<void> => {
  try {
    const connections = await db.select().from(conduitConnectionsTable).orderBy(desc(conduitConnectionsTable.createdAt));
    res.json(connections.map(c => redactCredentials(c as unknown as Record<string, unknown>)));
  } catch (err) {
    req.log.error({ err }, 'Failed to list connections');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/conduit/connections', async (req: Request, res: Response): Promise<void> => {
  const { name, destination, credentials } = req.body as { name?: string; destination?: string; credentials?: Record<string, string> };
  if (!name || !destination) {
    res.status(400).json({ error: 'name and destination are required' });
    return;
  }
  if (!CONDUIT_DESTINATIONS.includes(destination)) {
    res.status(400).json({ error: `Unknown destination: ${destination}` });
    return;
  }
  const validation = validateDestinationCredentials(destination, credentials || null);
  if (!validation.valid) {
    res.status(400).json({ error: 'Invalid credentials: ' + validation.errors.join('; '), errors: validation.errors });
    return;
  }
  try {
    const credentialMeta = credentials || {};
    const [connection] = await db.insert(conduitConnectionsTable).values({
      name,
      destination,
      credentialMeta,
      status: 'active',
    }).returning();
    await logActivityFromRequest(req, 'conduit.connection.create', 'conduit_connection', connection.id, undefined, { name, destination });
    res.status(201).json(redactCredentials(connection as unknown as Record<string, unknown>));
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
    res.json(redactCredentials(connection as unknown as Record<string, unknown>));
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
    if (credentials) updates.credentialMeta = credentials as Record<string, unknown>;
    const [connection] = await db.update(conduitConnectionsTable).set(updates).where(eq(conduitConnectionsTable.id, id)).returning();
    if (!connection) { res.status(404).json({ error: 'Connection not found' }); return; }
    await logActivityFromRequest(req, 'conduit.connection.update', 'conduit_connection', id);
    res.json(redactCredentials(connection as unknown as Record<string, unknown>));
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

router.post('/conduit/connections/validate', async (req: Request, res: Response): Promise<void> => {
  const { destination, credentials } = req.body as { destination?: string; credentials?: Record<string, string> };
  if (!destination) {
    res.status(400).json({ error: 'destination is required' });
    return;
  }
  if (!CONDUIT_DESTINATIONS.includes(destination)) {
    res.status(400).json({ error: `Unknown destination: ${destination}` });
    return;
  }
  const start = Date.now();
  const result = validateDestinationCredentials(destination, credentials || null);
  const latencyMs = Date.now() - start;
  res.json({
    success: result.valid,
    message: result.valid
      ? 'Credentials look good — format and structure validated'
      : result.errors.join('; '),
    errors: result.errors,
    latencyMs,
  });
});

router.post('/conduit/connections/:id/test', async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const [connection] = await db.select().from(conduitConnectionsTable).where(eq(conduitConnectionsTable.id, id));
    if (!connection) { res.status(404).json({ error: 'Connection not found' }); return; }

    initConduitEngine();
    const connector = getDestination(connection.destination);
    if (!connector) {
      res.json({ success: false, message: `No connector registered for ${connection.destination}`, errors: ['Unknown destination'], latencyMs: 0 });
      return;
    }

    const body = (req.body || {}) as { credentials?: Record<string, string> };
    const creds = body.credentials || (connection.credentialMeta as Record<string, unknown>) || {};
    const result = await connector.checkConnection(creds);

    const newStatus = result.success ? 'active' : 'error';
    await db.update(conduitConnectionsTable).set({
      status: newStatus,
      testedAt: new Date(),
    }).where(eq(conduitConnectionsTable.id, id));

    res.json({
      success: result.success,
      message: result.message,
      errors: result.success ? [] : [result.message],
      latencyMs: result.latencyMs,
    });
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

    initConduitEngine();
    executeSyncRun(run.id, id, { triggeredBy: 'manual' })
      .then(() => {
        const emitCtx = { syncId: id, runId: run.id, rowsRead: 0, rowsFailed: 0 };
        db.select().from(conduitSyncRunsTable).where(eq(conduitSyncRunsTable.id, run.id))
          .then(([completed]) => {
            if (completed) {
              const status = completed.status === 'success' ? 'success' : completed.status === 'failed' ? 'failed' : 'partial';
              emitConduitReflexive(status, {
                ...emitCtx,
                rowsRead: completed.rowsRead,
                rowsFailed: completed.rowsFailed,
                durationMs: completed.durationMs ?? undefined,
                errorMessage: completed.errorMessage ?? undefined,
              });
            }
          }).catch(() => {});
      })
      .catch(err => logger.error({ err, runId: run.id }, 'Sync execution error'));

    res.status(202).json(run);
  } catch (err) {
    req.log.error({ err }, 'Failed to trigger sync run');
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ─── Doctrine V6 Ingestion Primitives ────────────────────────────────────────
// Public dry-run endpoints for the schema-grounded, visual, and recall
// primitives. These run pure functions and emit receipts; they do NOT
// persist by themselves. To persist into a sync run, configure a sync with
// sourceType='unstructured' and POST /conduit/syncs/:id/run — the
// unstructuredSource connector will surface every gap/conflict/extracted
// row through the standard sync-run table.

router.post('/conduit/unstructured/dry-run', async (req: Request, res: Response): Promise<void> => {
  const { documentText, documentBytesB64, documentMime, schema, hits } = req.body as {
    documentText?: string;
    documentBytesB64?: string;
    documentMime?: string;
    schema?: { schemaRef: string; fields: Array<{ name: string; type: string; required: boolean }> };
    hits?: Array<{ class: string; text: string; startChar: number; endChar: number; attributes?: Record<string, string> }>;
  };
  // Document ingestion adapter: accept inline text OR base64 bytes + MIME.
  // HTML is stripped to plain text; PDF/other types should pre-decode upstream.
  let effectiveText = documentText;
  if (!effectiveText && documentBytesB64) {
    const raw = Buffer.from(documentBytesB64, 'base64').toString('utf8');
    const mime = (documentMime ?? 'text/plain').toLowerCase();
    effectiveText = mime.includes('html')
      ? raw.replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            // Insert newlines at block-level boundaries so the field-anchor
            // regex still has natural row breaks after tag stripping.
            .replace(/<\/(p|div|li|tr|h[1-6]|section|article|br)\s*>/gi, '\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/[ \t]+/g, ' ').replace(/\n+/g, '\n').trim()
      : raw;
  }
  if (!effectiveText || !schema?.fields?.length) {
    res.status(400).json({ error: 'documentText (or documentBytesB64+documentMime) and schema.fields are required' });
    return;
  }
  try {
    const result = dryRunUnstructured(
      effectiveText,
      schema as unknown as import('@workspace/langextract-bridge').DocumentSchema,
      hits as unknown as import('@workspace/langextract-bridge').ExtractionHit[] | undefined,
    );
    res.json({ ...result, documentMime: documentMime ?? (documentText ? 'text/plain' : undefined) });
  } catch (err) {
    req.log.error({ err }, 'unstructured dry-run failed');
    res.status(500).json({ error: err instanceof Error ? err.message : 'dry-run failed' });
  }
});

router.post('/conduit/visual/dry-run', async (req: Request, res: Response): Promise<void> => {
  const { schemaRef, labels, frameBytesB64, detections } = req.body as {
    schemaRef?: string;
    labels?: string[];
    frameBytesB64?: string;
    detections?: Array<{ label: string; bbox: [number, number, number, number]; confidence?: number }>;
  };
  if (!schemaRef || !Array.isArray(labels) || !frameBytesB64 || !Array.isArray(detections)) {
    res.status(400).json({ error: 'schemaRef, labels[], frameBytesB64, detections[] are required' });
    return;
  }
  try {
    const { groundVisualClaims } = await import('@workspace/seeing-eye');
    const frameBytes = Uint8Array.from(Buffer.from(frameBytesB64, 'base64'));
    const result = groundVisualClaims({ schemaRef, labels }, frameBytes, detections);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, 'visual dry-run failed');
    const status = err instanceof Error && err.name === 'UngroundedVisualClaimError' ? 422 : 500;
    res.status(status).json({ error: err instanceof Error ? err.message : 'dry-run failed' });
  }
});

router.post('/conduit/mappings/suggest', async (req: Request, res: Response): Promise<void> => {
  const { query, scope = 'mapping', topK = 5 } = req.body as { query?: string; scope?: string; topK?: number };
  if (!query) { res.status(400).json({ error: 'query is required' }); return; }
  try {
    const rows = await db.select({
      id: conduitSyncMappingsTable.id,
      sourceField: conduitSyncMappingsTable.sourceField,
      destinationField: conduitSyncMappingsTable.destinationField,
      transform: conduitSyncMappingsTable.transform,
      syncId: conduitSyncMappingsTable.syncId,
      createdAt: conduitSyncMappingsTable.createdAt,
    }).from(conduitSyncMappingsTable).limit(500);

    const episodes: MemnetEpisode<typeof rows[number]>[] = rows.map((r) => ({
      episodeId: r.id,
      contentVector: hashEmbedding(`${r.sourceField} ${r.destinationField} ${r.transform ?? ''}`),
      occurredAt: (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt ?? Date.now())).toISOString(),
      scope,
      payload: r,
    }));

    const result = recallEpisodes(episodes, {
      contentVector: hashEmbedding(query),
      now: new Date().toISOString(),
      topK,
      scope,
    });
    res.json({
      query,
      scope,
      suggestions: result.items.map((it) => ({
        sourceField: it.episode.payload.sourceField,
        destinationField: it.episode.payload.destinationField,
        transform: it.episode.payload.transform,
        contentSimilarity: it.contentSimilarity,
        temporalSimilarity: it.temporalSimilarity,
        fused: it.fused,
        citedEpisodeId: it.episode.episodeId,
      })),
      recallPath: result.recallPath,
      receipt: result.receipt,
    });
  } catch (err) {
    req.log.error({ err }, 'mapping suggest failed');
    res.status(500).json({ error: 'mapping suggest failed' });
  }
});

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
  const { mappings, reuseCitations } = req.body as {
    mappings?: Array<Record<string, unknown> & { _citedEpisodeId?: string }>;
    reuseCitations?: Array<{ sourceField: string; destinationField: string; citedEpisodeId: string; fused?: number }>;
  };
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

    // Doctrine V6: when an operator reuses a recalled mapping (i.e. they
    // applied a suggestion citing a prior episode), emit a memory.recall.v1
    // receipt at *apply* time and persist it in the activity log so the
    // governance panel can show "this mapping reused episode X". Receipt
    // hash is deterministic over the citation set + syncId.
    const citations = Array.isArray(reuseCitations) ? reuseCitations : mappings
      .filter((m) => typeof m._citedEpisodeId === 'string')
      .map((m) => ({
        sourceField: m.sourceField as string,
        destinationField: m.destinationField as string,
        citedEpisodeId: m._citedEpisodeId as string,
        fused: typeof m._fused === 'number' ? (m._fused as number) : undefined,
      }));

    let reuseReceipt: { kind: string; producedAt: string; receiptHash: string } | undefined;
    if (citations.length > 0) {
      const producedAt = new Date().toISOString();
      const canonical = JSON.stringify({ syncId: id, citations: citations.map((c) => ({
        s: c.sourceField, d: c.destinationField, e: c.citedEpisodeId,
      })) });
      const receiptHash = createHash('sha256').update(canonical, 'utf8').digest('hex');
      reuseReceipt = { kind: 'memory.recall.v1', producedAt, receiptHash };
    }

    await logActivityFromRequest(req, 'conduit.sync.mappings.update', 'conduit_sync', id, undefined, {
      mappingCount: mappings.length,
      reuseCitationCount: citations.length,
      reuseReceipt,
    });
    res.json({ mappings: inserted, reuseReceipt, reuseCitationCount: citations.length });
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
  const runId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rowId = Array.isArray(req.params.rowId) ? req.params.rowId[0] : req.params.rowId;
  try {
    initConduitEngine();
    const result = await retryFailedRow(runId, rowId);
    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(422).json({ success: false, message: result.message });
    }
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
  const { sourceType, sourceMeta, mappings: rawMappings } = req.body as {
    sourceType?: string;
    sourceMeta?: Record<string, unknown>;
    mappings?: Array<{ sourceField: string; destinationField: string; transform?: string | null; transformConfig?: Record<string, unknown> }>;
  };
  try {
    initConduitEngine();
    const connector = getSource(sourceType || 'postgres');
    if (!connector) {
      res.json({ fields: [], rows: [], totalRows: 0 });
      return;
    }
    const config = sourceMeta || {};
    const preview = await connector.previewRows(config, 10);

    if (rawMappings && rawMappings.length > 0 && preview.rows.length > 0) {
      const mappingConfigs = rawMappings.map(m => ({
        sourceField: m.sourceField,
        destinationField: m.destinationField,
        transform: m.transform ?? null,
        transformConfig: m.transformConfig ?? {},
      }));
      const { records, errors } = applyMappings(preview.rows, mappingConfigs);
      const transformedFields = rawMappings.map(m => m.destinationField);
      res.json({
        fields: transformedFields,
        rows: records,
        totalRows: preview.totalRows,
        transformErrors: errors.length > 0 ? errors : undefined,
      });
      return;
    }

    res.json(preview);
  } catch (err) {
    req.log.error({ err }, 'Failed to preview source');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Destination metadata ─────────────────────────────────────────────────────
router.get('/conduit/destinations/:destination/objects', async (req: Request, res: Response): Promise<void> => {
  const destination = Array.isArray(req.params.destination) ? req.params.destination[0] : req.params.destination;
  try {
    initConduitEngine();
    const connector = getDestination(destination);
    if (!connector) {
      res.json([]);
      return;
    }
    const { objects } = await connector.discover({});
    res.json(objects);
  } catch (err) {
    req.log.error({ err }, 'Failed to list destination objects');
    res.json([]);
  }
});

router.get('/conduit/destinations/:destination/objects/:objectType/fields', async (req: Request, res: Response): Promise<void> => {
  const destination = Array.isArray(req.params.destination) ? req.params.destination[0] : req.params.destination;
  const objectType = Array.isArray(req.params.objectType) ? req.params.objectType[0] : req.params.objectType;
  try {
    initConduitEngine();
    const connector = getDestination(destination);
    if (!connector) {
      res.json([]);
      return;
    }
    const { fields } = await connector.discover({});
    const objectFields = fields[objectType] || [];
    res.json(objectFields);
  } catch (err) {
    req.log.error({ err }, 'Failed to list destination fields');
    res.json([]);
  }
});

// ---------------------------------------------------------------------------
// Ingest Trace — sequence-pipeline backbone (Task #5517)
//
// Runs the *real* staged document-intelligence pipeline against a small
// synthetic batch and returns the per-stage `pipeline.stage.v1` receipt
// chain (with SHA-256 hashes), the unified `DocumentPipelineResult`s,
// the SeeingEye `VisualGroundedResult`, the `EpisodicRecallResult`, the
// peak-detector review queue ranking, and the USD round-trip of the
// procedural-kit recall scene. The Conduit `/ingest-trace` page fetches
// this and renders the actual stage receipts (FNV-1a previews are only
// the local-only fallback).
//
// Public read surface — Conduit is one of the six A11oy products and the
// page that consumes this lives at `/conduit/ingest-trace` (no session).
// The batch is in-memory only; no DB writes.
// ---------------------------------------------------------------------------
const INGEST_TRACE_EPISODES: EpisodicRecallInput['episodes'] = [
  { episodeId: 'ep-2024-q3', text: 'reefer return air defrost frost door seal', occurredAt: '2024-08-12T11:30:00Z', scope: 'reefer-screening', payload: { sourceField: 'observed_return_air_c', destField: 'reefer.return_air_c', outcome: 'accepted' } },
  { episodeId: 'ep-2025-q1', text: 'container weight manifest variance reefer', occurredAt: '2025-03-04T09:10:00Z', scope: 'reefer-screening', payload: { sourceField: 'observed_weight_kg', destField: 'reefer.gross_weight_kg', outcome: 'accepted' } },
  { episodeId: 'ep-2026-q1', text: 'reefer power draw kw amperage nominal', occurredAt: '2026-02-08T08:20:00Z', scope: 'reefer-screening', payload: { sourceField: 'power_draw_kw', destField: 'reefer.power_kw', outcome: 'accepted' } },
];

const INGEST_TRACE_BATCH = [
  { documentId: 'doc-alpha',   fileName: 'engagement-letter.pdf',  lane: 'counsel' as const, trace: [0.95, 0.93, 0.92, 0.30, 0.91, 0.94, 0.93], hasVisual: false, hasRecall: false },
  { documentId: 'doc-bravo',   fileName: 'voyage-manifest.pdf',    lane: 'vessels' as const, trace: [0.92, 0.93, 0.92, 0.91, 0.93, 0.92, 0.94], hasVisual: false, hasRecall: false },
  { documentId: 'doc-charlie', fileName: 'reefer-inspection.pdf',  lane: 'vessels' as const, trace: [0.85, 0.82, 0.84, 0.65, 0.84, 0.83, 0.85], hasVisual: true,  hasRecall: true  },
  { documentId: 'doc-delta',   fileName: 'foreclosure-notice.pdf', lane: 'terra'   as const, trace: [0.96, 0.95, 0.97, 0.10, 0.96, 0.95, 0.97], hasVisual: false, hasRecall: false },
];

router.get('/conduit/ingest-trace/run', async (_req: Request, res: Response): Promise<void> => {
  try {
    const staged = [];
    for (const spec of INGEST_TRACE_BATCH) {
      const result = await runStagedDocumentPipeline(
        {
          request: {
            documentId: spec.documentId,
            kind: 'filing',
            lane: spec.lane,
            fileName: spec.fileName,
            mimeType: 'application/pdf',
            content: new TextEncoder().encode(`${spec.documentId} synthetic body`),
          },
          visual: spec.hasVisual ? {
            frameBytes: new TextEncoder().encode('PSC-204|reefer|TGHU-9182'),
            labels: ['door_seal_frost', 'manifest_placard'],
            rawDetections: [
              { label: 'door_seal_frost', bbox: [0.12, 0.22, 0.31, 0.38], confidence: 0.86 },
              { label: 'manifest_placard', bbox: [0.40, 0.62, 0.66, 0.78], confidence: 0.79 },
            ],
          } : undefined,
          episodicRecall: spec.hasRecall ? {
            queryText: 'reefer return air defrost frost door seal',
            scope: 'reefer-screening',
            episodes: INGEST_TRACE_EPISODES,
            now: new Date('2026-05-27T00:00:00Z'),
            topK: 3,
          } : undefined,
        },
        { pipelineId: `pipe-${spec.documentId}` },
      );
      // Splice the deterministic confidence trace onto the document's
      // chunks so the peak-detector ranking is reproducible across runs.
      const traceChunks = spec.trace.map((c, idx) => ({
        chunkId: `${spec.documentId}-trace-${idx}`,
        documentId: spec.documentId,
        stage: 'qa' as const,
        page: 1,
        text: '',
        confidence: c,
        contentType: 'qa-answer' as const,
        evidenceRef: { documentId: spec.documentId, chunkId: `${spec.documentId}-trace-${idx}`, page: 1, retrievedAt: result.document.completedAt },
        provenance: { documentId: spec.documentId, lane: spec.lane, kind: 'filing' as const, stage: 'qa' as const, adapterProvider: 'trace', confidence: c, generatedAt: result.document.completedAt },
      }));
      const augmentedDoc = { ...result.document, chunks: [...result.document.chunks, ...traceChunks] };
      staged.push({
        pipelineId: result.pipelineResult.pipelineId,
        stages: result.pipelineResult.stages,
        document: augmentedDoc,
        visual: result.visual,
        episodicRecall: result.episodicRecall,
      });
    }
    const ranked = rankExtractionConfidencePeaks(staged.map((s) => s.document), { mode: 'gap', topK: 4 });
    const recall = staged.find((s) => s.episodicRecall)?.episodicRecall ?? null;
    const usd = recall ? episodicSceneToUsd(composeEpisodicScene(recall)) : null;
    res.json({ generatedAt: new Date().toISOString(), staged, ranked, recall, usd });
  } catch (err) {
    req.log?.error?.({ err }, 'ingest-trace run failed');
    res.status(500).json({ error: 'ingest-trace run failed', message: (err as Error).message });
  }
});

export default router;
