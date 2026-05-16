import { agentMeshDriftSnapshotsTable, auditEventsTable, db } from '@szl-holdings/db';
import { and, eq, sql } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { type GatewayEventPayload, gatewayEventBus } from '../lib/gateway-event-bus';
import { logger } from '../lib/logger';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { loadMeshState, runMeshScan } from '../services/agent-mesh-collector';
import {
  type GatewayExportRow,
  type GatewayLiveSummaryFilters,
  getGatewayEventsForExport,
  getGatewayLatencyBreakdown,
  getGatewayLiveSummary,
} from './mcp-gateway';

const router: IRouter = Router();

const VALID_GATEWAY_DECISIONS = new Set(['allowed', 'logged', 'blocked', 'quarantined'] as const);
type GatewayDecisionFilter = GatewayLiveSummaryFilters['decision'];

function readQueryString(req: Request, key: string): string | undefined {
  const raw = req.query[key];
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function approverLabelFromUser(
  user: { displayName?: string | null; email?: string | null } | undefined,
): string {
  const name = user?.displayName?.trim();
  const email = user?.email?.trim();
  if (name && email && name !== email) return `${name} (${email})`;
  return name || email || 'operator';
}

function orgIdFromReq(req: Request): number | null {
  const u = req.user as { orgId?: number | string } | undefined;
  if (!u?.orgId) return null;
  const n = typeof u.orgId === 'string' ? parseInt(u.orgId, 10) : u.orgId;
  return Number.isFinite(n) ? n : null;
}

router.get('/agent-mesh/state', authMiddleware({ required: true }), requireRole('super_admin', 'ops'), async (req: Request, res: Response) => {
  try {
    const state = await loadMeshState(orgIdFromReq(req));
    res.json(state);
  } catch (err) {
    logger.warn({ err }, '[agent-mesh] state failed');
    res.status(500).json({ error: 'agent-mesh state unavailable' });
  }
});

router.get('/agent-mesh/index', authMiddleware({ required: true }), requireRole('super_admin', 'ops'), async (req: Request, res: Response) => {
  try {
    const state = await loadMeshState(orgIdFromReq(req));
    if (!state.resilienceIndex) {
      res.status(404).json({ error: 'no resilience index — run /agent-mesh/scan first' });
      return;
    }
    res.json(state.resilienceIndex);
  } catch (err) {
    logger.warn({ err }, '[agent-mesh] index failed');
    res.status(500).json({ error: 'index unavailable' });
  }
});

router.get('/agent-mesh/gateway', authMiddleware({ required: true }), requireRole('super_admin', 'ops'), async (req: Request, res: Response) => {
  try {
    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 50;
    const filters: GatewayLiveSummaryFilters = {};
    const decisionRaw = readQueryString(req, 'decision');
    if (decisionRaw && VALID_GATEWAY_DECISIONS.has(decisionRaw as GatewayDecisionFilter as never)) {
      filters.decision = decisionRaw as GatewayDecisionFilter;
    }
    const agentClass = readQueryString(req, 'agentClass');
    if (agentClass) filters.agentClass = agentClass;
    const ruleId = readQueryString(req, 'ruleId');
    if (ruleId) filters.ruleId = ruleId;
    const summary = await getGatewayLiveSummary(limit, filters);
    res.json(summary);
  } catch (err) {
    logger.warn({ err }, '[agent-mesh] gateway summary failed');
    res.status(500).json({ error: 'agent-mesh gateway unavailable' });
  }
});

router.get('/agent-mesh/gateway/stream', authMiddleware({ required: true }), requireRole('super_admin', 'ops'), (req: Request, res: Response) => {
  // SSE push channel for newly persisted gateway events. The Containment
  // Rules dashboard subscribes here so filtered views update instantly
  // instead of waiting for the next 30s poll. Optional query params
  // (decision, agentClass, ruleId) match the /agent-mesh/gateway filters
  // so each subscriber only receives events relevant to its current view.
  try {
    const decisionRaw = readQueryString(req, 'decision');
    const decisionFilter =
      decisionRaw && VALID_GATEWAY_DECISIONS.has(decisionRaw as GatewayDecisionFilter as never)
        ? (decisionRaw as GatewayDecisionFilter)
        : undefined;
    const agentClassFilter = readQueryString(req, 'agentClass');
    const ruleIdFilter = readQueryString(req, 'ruleId');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    res.write(`event: connected\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);

    const matches = (e: GatewayEventPayload): boolean => {
      if (decisionFilter && e.decision !== decisionFilter) return false;
      if (agentClassFilter && e.agentClass !== agentClassFilter) return false;
      if (ruleIdFilter && e.ruleId !== ruleIdFilter) return false;
      return true;
    };

    const unsubscribe = gatewayEventBus.onEvent((e) => {
      if (res.writableEnded) return;
      if (!matches(e)) return;
      try {
        res.write(`event: gateway-event\ndata: ${JSON.stringify(e)}\n\n`);
      } catch {
        /* ignore write errors — close handler will clean up */
      }
    });

    const heartbeat = setInterval(() => {
      if (res.writableEnded) {
        clearInterval(heartbeat);
        unsubscribe();
        return;
      }
      res.write(': heartbeat\n\n');
    }, 25_000);

    const cleanup = () => {
      clearInterval(heartbeat);
      unsubscribe();
    };
    req.on('close', cleanup);
    req.on('error', cleanup);
  } catch (err) {
    logger.warn({ err }, '[agent-mesh] gateway stream failed to start');
    if (!res.headersSent) {
      res.status(500).json({ error: 'agent-mesh gateway stream unavailable' });
    } else {
      res.end();
    }
  }
});

// CSV export of the gateway event stream, scoped by the same filter
// query params as /agent-mesh/gateway. Returns *every* matching row
// (capped at GATEWAY_EXPORT_MAX_ROWS in the loader), not just the 50
// the dashboard renders. Operators trigger this from the "Download CSV"
// button next to the filter chips.
const CSV_COLUMNS: Array<keyof GatewayExportRow> = [
  'occurredAt',
  'decision',
  'ruleId',
  'agentClass',
  'mcpServerId',
  'tool',
  'egressDomain',
  'reason',
  'linkedExposureId',
];

function csvEscape(value: string | null | undefined): string {
  if (value == null) return '';
  // Quote any field containing a delimiter, quote, or newline. Inside a
  // quoted field, double-quotes must be doubled per RFC 4180.
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCsv(rows: GatewayExportRow[]): string {
  const lines: string[] = [CSV_COLUMNS.join(',')];
  for (const row of rows) {
    lines.push(CSV_COLUMNS.map((c) => csvEscape(row[c])).join(','));
  }
  // Trailing newline — Excel and most CSV parsers expect one.
  return `${lines.join('\r\n')}\r\n`;
}

router.get('/agent-mesh/gateway/export.csv', authMiddleware({ required: true }), requireRole('super_admin', 'ops'), async (req: Request, res: Response) => {
  try {
    const filters: GatewayLiveSummaryFilters = {};
    const decisionRaw = readQueryString(req, 'decision');
    if (decisionRaw && VALID_GATEWAY_DECISIONS.has(decisionRaw as GatewayDecisionFilter as never)) {
      filters.decision = decisionRaw as GatewayDecisionFilter;
    }
    const agentClass = readQueryString(req, 'agentClass');
    if (agentClass) filters.agentClass = agentClass;
    const ruleId = readQueryString(req, 'ruleId');
    if (ruleId) filters.ruleId = ruleId;

    const rows = await getGatewayEventsForExport(filters);
    const csv = buildCsv(rows);

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `gateway-events-${ts}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(csv);
  } catch (err) {
    logger.warn({ err }, '[agent-mesh] gateway csv export failed');
    res.status(500).json({ error: 'agent-mesh gateway export unavailable' });
  }
});

router.get('/agent-mesh/gateway/latency', authMiddleware({ required: true }), requireRole('super_admin', 'ops'), async (req: Request, res: Response) => {
  try {
    const hoursRaw = Number(req.query.hours);
    const windowHours =
      Number.isFinite(hoursRaw) && hoursRaw > 0 && hoursRaw <= 24 * 30 ? hoursRaw : 24;
    const breakdown = await getGatewayLatencyBreakdown(windowHours);
    res.json(breakdown);
  } catch (err) {
    logger.warn({ err }, '[agent-mesh] gateway latency breakdown failed');
    res.status(500).json({ error: 'agent-mesh gateway latency unavailable' });
  }
});

router.post(
  '/agent-mesh/drift/:id/approve',
  authMiddleware({ required: true }),
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id ?? '').trim();
      if (!id) {
        res.status(400).json({ error: 'drift snapshot id required' });
        return;
      }

      const orgId = orgIdFromReq(req);
      const approver = approverLabelFromUser(req.user);

      // Approve the drift snapshot AND write the central audit_events row
      // in a single transaction. Compliance requires every approval to
      // appear in the audit timeline, so if the audit insert fails we roll
      // back the approval rather than leaving an unaudited approval behind.
      const userId = typeof req.user?.id === 'number' ? req.user.id : null;
      const txResult = await db.transaction(async (tx) => {
        const updated = await tx
          .update(agentMeshDriftSnapshotsTable)
          .set({ policyApproved: true, approvedBy: approver })
          .where(
            and(
              eq(agentMeshDriftSnapshotsTable.id, id),
              orgId == null
                ? sql`${agentMeshDriftSnapshotsTable.orgId} IS NULL`
                : eq(agentMeshDriftSnapshotsTable.orgId, orgId),
            ),
          )
          .returning({
            id: agentMeshDriftSnapshotsTable.id,
            policyApproved: agentMeshDriftSnapshotsTable.policyApproved,
            approvedBy: agentMeshDriftSnapshotsTable.approvedBy,
            changedBy: agentMeshDriftSnapshotsTable.changedBy,
            configFile: agentMeshDriftSnapshotsTable.configFile,
          });

        const r = updated[0];
        if (!r) return null;

        await tx.insert(auditEventsTable).values({
          userId,
          action: 'agent_mesh.drift.approved',
          entityType: 'agent_mesh_drift_snapshot',
          entityId: r.id,
          newValues: {
            driftId: r.id,
            configFile: r.configFile,
            approverName: req.user?.displayName ?? null,
            approverEmail: req.user?.email ?? null,
            approverLabel: approver,
            changedBy: r.changedBy,
            orgId,
          },
          ipAddress: req.ip ?? null,
          userAgent: req.get('user-agent') ?? null,
        });

        return r;
      });

      if (!txResult) {
        res.status(404).json({ error: 'drift snapshot not found' });
        return;
      }
      const row = txResult;

      logger.info(
        { driftId: id, approvedBy: approver, configFile: row.configFile },
        '[agent-mesh] drift approved',
      );

      res.json({
        id: row.id,
        policyApproved: row.policyApproved,
        approvedBy: row.approvedBy,
        changedBy: row.changedBy,
        configFile: row.configFile,
      });
    } catch (err) {
      logger.warn({ err }, '[agent-mesh] drift approve failed');
      res.status(500).json({ error: 'drift approval failed' });
    }
  },
);

router.post(
  '/agent-mesh/drift/:id/rollback',
  authMiddleware({ required: true }),
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id ?? '').trim();
      if (!id) {
        res.status(400).json({ error: 'drift snapshot id required' });
        return;
      }

      const orgId = orgIdFromReq(req);
      const operator = approverLabelFromUser(req.user);
      const rolledBackAt = new Date();
      const userId = typeof req.user?.id === 'number' ? req.user.id : null;

      // Mirror the approve path: update the snapshot AND write a central
      // audit_events row in a single transaction so the action shows up in
      // the audit timeline. If the audit insert fails, the rollback is
      // rolled back rather than leaving an unaudited rollback behind.
      const txResult = await db.transaction(async (tx) => {
        const updated = await tx
          .update(agentMeshDriftSnapshotsTable)
          .set({ rolledBackBy: operator, rolledBackAt })
          .where(
            and(
              eq(agentMeshDriftSnapshotsTable.id, id),
              orgId == null
                ? sql`${agentMeshDriftSnapshotsTable.orgId} IS NULL`
                : eq(agentMeshDriftSnapshotsTable.orgId, orgId),
            ),
          )
          .returning({
            id: agentMeshDriftSnapshotsTable.id,
            policyApproved: agentMeshDriftSnapshotsTable.policyApproved,
            approvedBy: agentMeshDriftSnapshotsTable.approvedBy,
            rolledBackBy: agentMeshDriftSnapshotsTable.rolledBackBy,
            rolledBackAt: agentMeshDriftSnapshotsTable.rolledBackAt,
            changedBy: agentMeshDriftSnapshotsTable.changedBy,
            configFile: agentMeshDriftSnapshotsTable.configFile,
          });

        const r = updated[0];
        if (!r) return null;

        await tx.insert(auditEventsTable).values({
          userId,
          action: 'agent_mesh.drift.rolled_back',
          entityType: 'agent_mesh_drift_snapshot',
          entityId: r.id,
          newValues: {
            driftId: r.id,
            configFile: r.configFile,
            operatorName: req.user?.displayName ?? null,
            operatorEmail: req.user?.email ?? null,
            operatorLabel: operator,
            changedBy: r.changedBy,
            rolledBackAt: rolledBackAt.toISOString(),
            orgId,
          },
          ipAddress: req.ip ?? null,
          userAgent: req.get('user-agent') ?? null,
        });

        return r;
      });

      if (!txResult) {
        res.status(404).json({ error: 'drift snapshot not found' });
        return;
      }
      const row = txResult;

      logger.info(
        { driftId: id, rolledBackBy: operator, configFile: row.configFile },
        '[agent-mesh] drift rolled back',
      );

      res.json({
        id: row.id,
        policyApproved: row.policyApproved,
        approvedBy: row.approvedBy,
        rolledBackBy: row.rolledBackBy,
        rolledBackAt:
          row.rolledBackAt instanceof Date ? row.rolledBackAt.toISOString() : row.rolledBackAt,
        changedBy: row.changedBy,
        configFile: row.configFile,
      });
    } catch (err) {
      logger.warn({ err }, '[agent-mesh] drift rollback failed');
      res.status(500).json({ error: 'drift rollback failed' });
    }
  },
);

router.post('/agent-mesh/scan', authMiddleware({ required: true }), requireRole('super_admin', 'ops'), async (req: Request, res: Response) => {
  try {
    const result = await runMeshScan({ extraPaths: [], orgId: orgIdFromReq(req) });
    res.json(result);
  } catch (err) {
    logger.error({ err }, '[agent-mesh] scan failed');
    res.status(500).json({ error: 'scan failed' });
  }
});

export default router;
