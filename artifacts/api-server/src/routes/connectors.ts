/**
 * Data Fabric — connector framework routes.
 *
 * Wires the @szl-holdings/connectors runner into the api-server. Audit events
 * are appended to the existing audit_chain_events table (hash-chained, with
 * the chain head bootstrapped from the DB on first use to survive restarts).
 * Ontology entities are registered through @szl-holdings/ontology.
 *
 * Tenant isolation: all per-connector runtime state (drift baseline, run
 * history, enable/pause flag, counters) is scoped by `(orgId, connectorId)`
 * so users in one org cannot pause, resume, or read the syncs of another org.
 *
 * Authorization:
 *   - Read endpoints (`/list`, `/health`, `/drift`, `/runs`, `/:id`) require a
 *     valid session.
 *   - Mutating endpoints (`/sync/:id`, `/pause/:id`, `/resume/:id`) require an
 *     `ops`, `admin`, or `super_admin` role (mirrors `worldline.ts`).
 */

import { auditChainEventsTable, db } from '@szl-holdings/db';
import { registerEntity } from '@szl-holdings/ontology';
import {
  BUILT_IN_CONNECTORS,
  ConnectorRunner,
  type ConnectorHealth,
  type DriftBaseline,
  findConnector,
  type RunnerHooks,
  type SyncResult,
} from '@szl-holdings/connectors';
import { desc } from 'drizzle-orm';
import { type IRouter, type Request, Router } from 'express';
import { createHash } from 'node:crypto';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { computeEventHash } from './audit-chain';

const router: IRouter = Router();
router.use(authMiddleware());

// ---------------------------------------------------------------------------
// Per-org runtime state. Drift baselines, run history, enable flag and
// counters are kept in-process (a future task can promote to its own table).
// State is keyed by `(orgId, connectorId)` so tenants are isolated.
// ---------------------------------------------------------------------------

interface ConnectorRuntimeState {
  baseline: DriftBaseline | null;
  history: SyncResult[];
  consecutiveFailures: number;
  totalSyncs: number;
  totalEntities: number;
  deadLettered: number;
  enabled: boolean;
  escalations: SyncResult[];
}

const STATE = new Map<string, ConnectorRuntimeState>();
const HISTORY_LIMIT = 50;
const DEFAULT_ORG_ID = 0;

function resolveOrgId(req: Request): number {
  const id = (req as unknown as { tenantOrgId?: number }).tenantOrgId;
  if (typeof id === 'number' && Number.isFinite(id)) return id;
  return DEFAULT_ORG_ID;
}

function stateKey(orgId: number, connectorId: string): string {
  return `${orgId}::${connectorId}`;
}

function getState(orgId: number, connectorId: string): ConnectorRuntimeState {
  const key = stateKey(orgId, connectorId);
  let s = STATE.get(key);
  if (!s) {
    s = {
      baseline: null,
      history: [],
      consecutiveFailures: 0,
      totalSyncs: 0,
      totalEntities: 0,
      deadLettered: 0,
      enabled: true,
      escalations: [],
    };
    STATE.set(key, s);
  }
  return s;
}

// ---------------------------------------------------------------------------
// Audit ledger append. Mirrors the audit-chain.ts pattern. The chain head is
// bootstrapped lazily from the most recent event in `audit_chain_events` so
// the chain survives api-server restarts and is not reset to "genesis".
// ---------------------------------------------------------------------------

let lastChainHash: string | null = null;
let chainBootstrapPromise: Promise<void> | null = null;

async function bootstrapChainHead(): Promise<void> {
  if (lastChainHash !== null) return;
  if (!chainBootstrapPromise) {
    chainBootstrapPromise = (async () => {
      try {
        const rows = await db
          .select({ eventHash: auditChainEventsTable.eventHash })
          .from(auditChainEventsTable)
          .orderBy(desc(auditChainEventsTable.createdAt))
          .limit(1);
        const head = rows[0]?.eventHash;
        lastChainHash = typeof head === 'string' && head.length > 0 ? head : 'genesis';
        logger.info(
          { head: lastChainHash.slice(0, 16) },
          '[connectors] audit chain head bootstrapped',
        );
      } catch (err) {
        lastChainHash = 'genesis';
        logger.warn(
          { err },
          '[connectors] audit chain head bootstrap failed; defaulting to genesis',
        );
      }
    })();
  }
  await chainBootstrapPromise;
}

async function appendAudit(
  orgId: number,
  event: {
    connectorId: string;
    status: string;
    summary: Record<string, unknown>;
  },
): Promise<string> {
  await bootstrapChainHead();
  const createdAt = new Date().toISOString();
  const payload = {
    action: `connectors.sync.${event.status}`,
    actor: 'system:connector-runner',
    domain: 'platform',
    actionType: 'data_access',
    entityId: event.connectorId,
    createdAt,
    orgId,
  };
  const prevHash = lastChainHash ?? 'genesis';
  const eventHash = computeEventHash(prevHash, payload);
  lastChainHash = eventHash;
  const id = createHash('sha256')
    .update(`${eventHash}:${event.connectorId}`)
    .digest('hex')
    .slice(0, 24);
  try {
    await db.insert(auditChainEventsTable).values({
      orgId: orgId === DEFAULT_ORG_ID ? null : orgId,
      actorUserId: null,
      actorLabel: payload.actor,
      action: payload.action,
      actionType: payload.actionType,
      domain: payload.domain,
      entityId: payload.entityId,
      entityType: 'connector',
      riskLevel: event.status === 'dead-letter' ? 'high' : 'low',
      complianceTags: ['SOC2'],
      outcome: event.status === 'dead-letter' ? 'failure' : 'success',
      details: null,
      metadata: event.summary,
      prevHash,
      eventHash,
    } as never);
  } catch (err) {
    logger.warn(
      { err, connectorId: event.connectorId },
      '[connectors] audit append failed (non-fatal, in-memory only)',
    );
  }
  return id;
}

// ---------------------------------------------------------------------------
// Operator-runtime escalation (non-blocking).
// ---------------------------------------------------------------------------

async function escalate(orgId: number, result: SyncResult): Promise<void> {
  logger.warn(
    {
      orgId,
      connectorId: result.connectorId,
      status: result.status,
      driftSeverity: result.drift?.severity ?? null,
      error: result.errorMessage,
    },
    '[connectors] OPERATOR PAGE — drift or dead-letter',
  );
  const s = getState(orgId, result.connectorId);
  s.escalations.unshift(result);
  if (s.escalations.length > 20) s.escalations.length = 20;
}

// ---------------------------------------------------------------------------
// Build a runner with hooks bound to a specific (org, connector) pair.
// ---------------------------------------------------------------------------

function makeRunner(orgId: number, connectorId: string): ConnectorRunner {
  const hooks: RunnerHooks = {
    appendAudit: (event) => appendAudit(orgId, event),
    registerEntity: async (write) => {
      await registerEntity({
        kind: write.kind as never,
        namespace: write.namespace,
        identifier: String(write.identifier),
        properties: write.properties,
        orgId,
      } as never);
    },
    loadBaseline: async () => getState(orgId, connectorId).baseline,
    saveBaseline: async (baseline) => {
      getState(orgId, connectorId).baseline = baseline;
    },
    escalate: (r) => escalate(orgId, r),
  };
  return new ConnectorRunner(hooks);
}

function buildHealth(orgId: number, connectorId: string): ConnectorHealth | null {
  const conn = findConnector(connectorId);
  if (!conn) return null;
  const s = getState(orgId, connectorId);
  const last = s.history[0] ?? null;
  return {
    connectorId,
    name: conn.name,
    kind: conn.kind,
    source: conn.source,
    enabled: s.enabled,
    scheduleSec: conn.schedule.intervalSec,
    lastSyncAt: last?.startedAt ?? null,
    lastStatus: last?.status ?? null,
    lastDuration: last?.durationMs ?? null,
    consecutiveFailures: s.consecutiveFailures,
    totalSyncs: s.totalSyncs,
    totalEntities: s.totalEntities,
    drift: last?.drift ?? null,
    deadLettered: s.deadLettered,
  };
}

// ---------------------------------------------------------------------------
// Routes — read endpoints (any authenticated user)
// ---------------------------------------------------------------------------

router.get('/list', async (_req, res) => {
  try {
    const connectors = BUILT_IN_CONNECTORS.map((c) => ({
      id: c.id,
      name: c.name,
      kind: c.kind,
      description: c.description,
      source: c.source,
      schedule: c.schedule,
    }));
    sendSuccess(res, { connectors });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list connectors');
  }
});

router.get('/health', async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    const health = BUILT_IN_CONNECTORS.map((c) => buildHealth(orgId, c.id)).filter(
      (h): h is ConnectorHealth => h !== null,
    );
    sendSuccess(res, { health, generatedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch connector health');
  }
});

router.get('/drift', async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    const reports = BUILT_IN_CONNECTORS.map((c) => {
      const s = getState(orgId, c.id);
      const last = s.history[0];
      return {
        connectorId: c.id,
        name: c.name,
        baseline: s.baseline,
        latestDrift: last?.drift ?? null,
        escalations: s.escalations.slice(0, 10),
      };
    });
    sendSuccess(res, { reports });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch drift reports');
  }
});

router.get('/runs', async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    const runs = BUILT_IN_CONNECTORS.flatMap((c) =>
      getState(orgId, c.id)
        .history.slice(0, 10)
        .map((r) => ({ ...r, name: c.name })),
    )
      .sort((a, b) => (b.startedAt > a.startedAt ? 1 : -1))
      .slice(0, 50);
    sendSuccess(res, { runs });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch sync runs');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const conn = findConnector(req.params.id);
    if (!conn) return sendNotFound(res, 'Connector not registered');
    const orgId = resolveOrgId(req);
    const s = getState(orgId, conn.id);
    sendSuccess(res, {
      connector: {
        id: conn.id,
        name: conn.name,
        kind: conn.kind,
        description: conn.description,
        source: conn.source,
        schedule: conn.schedule,
      },
      health: buildHealth(orgId, conn.id),
      baseline: s.baseline,
      history: s.history.slice(0, 25),
      escalations: s.escalations.slice(0, 10),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch connector detail');
  }
});

// ---------------------------------------------------------------------------
// Routes — mutating endpoints (ops/admin/super_admin only)
// ---------------------------------------------------------------------------

const OPS_ROLES = ['ops', 'admin', 'super_admin'] as const;

router.post('/sync/:id', requireRole(...OPS_ROLES), async (req, res) => {
  try {
    const conn = findConnector(req.params.id);
    if (!conn) return sendNotFound(res, 'Connector not registered');
    const orgId = resolveOrgId(req);
    const s = getState(orgId, conn.id);
    if (!s.enabled) return sendBadRequest(res, 'Connector is paused');
    const runner = makeRunner(orgId, conn.id);
    const lastSyncAt = s.history[0]?.startedAt ?? null;
    const result = await runner.run(conn, { lastSyncAt });
    s.history.unshift(result);
    if (s.history.length > HISTORY_LIMIT) s.history.length = HISTORY_LIMIT;
    s.totalSyncs += 1;
    s.totalEntities += result.entitiesRegistered;
    if (result.status === 'dead-letter') {
      s.consecutiveFailures += 1;
      s.deadLettered += 1;
    } else {
      s.consecutiveFailures = 0;
    }
    sendCreated(res, { result });
  } catch (err) {
    handleRouteError(res, err, 'Connector sync failed');
  }
});

router.post('/pause/:id', requireRole(...OPS_ROLES), async (req, res) => {
  try {
    const conn = findConnector(req.params.id);
    if (!conn) return sendNotFound(res, 'Connector not registered');
    const orgId = resolveOrgId(req);
    getState(orgId, conn.id).enabled = false;
    sendSuccess(res, { connectorId: conn.id, enabled: false });
  } catch (err) {
    handleRouteError(res, err, 'Failed to pause connector');
  }
});

router.post('/resume/:id', requireRole(...OPS_ROLES), async (req, res) => {
  try {
    const conn = findConnector(req.params.id);
    if (!conn) return sendNotFound(res, 'Connector not registered');
    const orgId = resolveOrgId(req);
    getState(orgId, conn.id).enabled = true;
    sendSuccess(res, { connectorId: conn.id, enabled: true });
  } catch (err) {
    handleRouteError(res, err, 'Failed to resume connector');
  }
});

export default router;
