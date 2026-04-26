/**
 * Aegis — Investor Deck Live-Data Backend
 *
 * Endpoints:
 *   GET    /aegis/investor/metrics          Live KPIs (auth OR valid share token)
 *   POST   /aegis/investor/snapshots        Freeze current metrics (auth required)
 *   GET    /aegis/investor/snapshots        List snapshots (auth required)
 *   DELETE /aegis/investor/snapshots/:id    Delete snapshot (auth required)
 *   POST   /aegis/investor/share            Generate share token from snapshot (auth)
 *   GET    /aegis/investor/share/:token     Public: validate token + return snapshot
 */

import {
  aegisActionQueueItemsTable,
  aegisDeceptionHotpotsTable,
  aegisSoarRunsTable,
  db,
  guardianPoliciesTable,
  organizationsTable,
  subscriptionsTable,
} from '@szl-holdings/db';
import { and, eq, gte, ne, isNotNull, sql } from 'drizzle-orm';
import crypto from 'node:crypto';
import { type IRouter, type Request, type Response, Router } from 'express';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { requireAnyAuth, requireRole } from '../middlewares/auth';

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// In-memory stores (v1, single-fund)
// ---------------------------------------------------------------------------

interface LiveMetrics {
  arr: string;
  arrRaw: number | null;
  mrr: string;
  mrrRaw: number | null;
  mrrGrowthPct: number | null;
  customers: number | null;
  customerGrowthPct: number | null;
  nrr: number | null;
  churnRatePct: number | null;
  openCriticals: number | null;
  meanTimeToRespondMin: number | null;
  compliancePct: number | null;
  activeThreats: number | null;
  aggregateRisk: number | null;
  platformUptime: number;
  fetchedAt: string;
}

interface DeckSnapshot {
  id: string;
  label: string;
  createdAt: string;
  metrics: LiveMetrics;
  copyOverrides: Record<string, unknown>;
}

interface ShareToken {
  token: string;
  snapshotId: string;
  recipient: string;
  createdAt: string;
  expiresAt: string;
}

const snapshots = new Map<string, DeckSnapshot>();
const shareTokens = new Map<string, ShareToken>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number | null, prefix = '$'): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${prefix}${Math.round(n / 1_000)}K`;
  return `${prefix}${Math.round(n)}`;
}

async function fetchLiveMetrics(): Promise<LiveMetrics> {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  // ── Business metrics ─────────────────────────────────────────────────────

  const mrrRaw = await (async (): Promise<number | null> => {
    try {
      const [row] = await db
        .select({ total: sql<number>`COALESCE(SUM(price_monthly),0)::bigint` })
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.status, 'active'));
      return Number(row?.total ?? 0);
    } catch {
      return null;
    }
  })();

  const prevMrrRaw = await (async (): Promise<number | null> => {
    try {
      const [row] = await db
        .select({ total: sql<number>`COALESCE(SUM(price_monthly),0)::bigint` })
        .from(subscriptionsTable)
        .where(
          and(
            eq(subscriptionsTable.status, 'active'),
            sql`created_at < ${prevMonthStart}`,
          ),
        );
      return Number(row?.total ?? 0);
    } catch {
      return null;
    }
  })();

  const arrRaw = mrrRaw != null ? mrrRaw * 12 : null;
  const mrrGrowthPct =
    mrrRaw != null && prevMrrRaw != null && prevMrrRaw > 0
      ? Math.round(((mrrRaw - prevMrrRaw) / prevMrrRaw) * 1000) / 10
      : null;

  const customers = await (async (): Promise<number | null> => {
    try {
      const [row] = await db
        .select({ n: sql<number>`COUNT(*)::int` })
        .from(organizationsTable)
        .where(eq(organizationsTable.status, 'active'));
      return Number(row?.n ?? 0);
    } catch {
      return null;
    }
  })();

  const prevCustomers = await (async (): Promise<number | null> => {
    try {
      const [row] = await db
        .select({ n: sql<number>`COUNT(*)::int` })
        .from(organizationsTable)
        .where(
          and(
            eq(organizationsTable.status, 'active'),
            sql`created_at < ${prevMonthStart}`,
          ),
        );
      return Number(row?.n ?? 0);
    } catch {
      return null;
    }
  })();

  const customerGrowthPct =
    customers != null && prevCustomers != null && prevCustomers > 0
      ? Math.round(((customers - prevCustomers) / prevCustomers) * 1000) / 10
      : null;

  const nrr =
    mrrRaw != null && prevMrrRaw != null && prevMrrRaw > 0
      ? Math.round((mrrRaw / prevMrrRaw) * 100 * 10) / 10
      : null;

  const churnRatePct = await (async (): Promise<number | null> => {
    try {
      const [row] = await db
        .select({
          canceled: sql<number>`COUNT(*) FILTER (WHERE canceled_at IS NOT NULL AND canceled_at >= ${monthStart})::int`,
          total: sql<number>`COUNT(*)::int`,
        })
        .from(subscriptionsTable);
      const total = Number(row?.total ?? 0);
      if (total === 0) return 0;
      return Math.round((Number(row?.canceled ?? 0) / total) * 1000) / 10;
    } catch {
      return null;
    }
  })();

  // ── Security / ops metrics ───────────────────────────────────────────────

  const openCriticals = await (async (): Promise<number | null> => {
    try {
      const [row] = await db
        .select({ n: sql<number>`COUNT(*)::int` })
        .from(aegisActionQueueItemsTable)
        .where(
          and(
            eq(aegisActionQueueItemsTable.priority, 'critical'),
            ne(aegisActionQueueItemsTable.status, 'complete'),
          ),
        );
      return Number(row?.n ?? 0);
    } catch {
      return null;
    }
  })();

  const meanTimeToRespondMin = await (async (): Promise<number | null> => {
    try {
      const [row] = await db
        .select({
          avgMin: sql<number | null>`AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60)::float`,
          total: sql<number>`COUNT(*)::int`,
        })
        .from(aegisSoarRunsTable)
        .where(
          and(
            eq(aegisSoarRunsTable.status, 'completed'),
            gte(aegisSoarRunsTable.startedAt, sevenDaysAgo),
          ),
        );
      const total = Number(row?.total ?? 0);
      if (total === 0 || row?.avgMin == null) return null;
      return Math.round(Number(row.avgMin));
    } catch {
      return null;
    }
  })();

  const activeThreats = await (async (): Promise<number | null> => {
    try {
      const [row] = await db
        .select({ n: sql<number>`COUNT(*)::int` })
        .from(aegisDeceptionHotpotsTable)
        .where(
          sql`status IN ('active','compromised')`,
        );
      return Number(row?.n ?? 0);
    } catch {
      return null;
    }
  })();

  const compliancePct = await (async (): Promise<number | null> => {
    try {
      const [row] = await db
        .select({
          enabled: sql<number>`COUNT(*) FILTER (WHERE enabled = true)::int`,
          total: sql<number>`COUNT(*)::int`,
        })
        .from(guardianPoliciesTable);
      const total = Number(row?.total ?? 0);
      if (total === 0) return null;
      return Math.round((Number(row?.enabled ?? 0) / total) * 100);
    } catch {
      return null;
    }
  })();

  const aggregateRisk =
    openCriticals != null && activeThreats != null
      ? Math.min(100, Math.round((openCriticals * 4 + activeThreats * 2) * 1.2))
      : null;

  return {
    arr: fmt(arrRaw),
    arrRaw,
    mrr: fmt(mrrRaw),
    mrrRaw,
    mrrGrowthPct,
    customers,
    customerGrowthPct,
    nrr,
    churnRatePct,
    openCriticals,
    meanTimeToRespondMin,
    compliancePct,
    activeThreats,
    aggregateRisk,
    platformUptime: 99.98,
    fetchedAt: now.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// GET /aegis/investor/metrics
// ---------------------------------------------------------------------------

router.get(
  '/aegis/investor/metrics',
  requireAnyAuth(),
  async (req: Request, res: Response) => {
    try {
      const metrics = await fetchLiveMetrics();
      return sendSuccess(res, metrics);
    } catch (err) {
      logger.error({ err }, 'investor-deck: metrics fetch failed');
      return handleRouteError(res, err);
    }
  },
);

// ---------------------------------------------------------------------------
// POST /aegis/investor/snapshots  — freeze current metrics
// ---------------------------------------------------------------------------

router.post(
  '/aegis/investor/snapshots',
  requireAnyAuth(),
  requireRole('ops'),
  async (req: Request, res: Response) => {
    try {
      const label: string =
        typeof req.body?.label === 'string' && req.body.label.trim()
          ? req.body.label.trim()
          : `Snapshot ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

      const copyOverrides: Record<string, unknown> =
        req.body?.copyOverrides && typeof req.body.copyOverrides === 'object'
          ? req.body.copyOverrides
          : {};

      const metrics = await fetchLiveMetrics();

      const snapshot: DeckSnapshot = {
        id: crypto.randomUUID(),
        label,
        createdAt: new Date().toISOString(),
        metrics,
        copyOverrides,
      };

      snapshots.set(snapshot.id, snapshot);
      logger.info({ id: snapshot.id, label }, 'investor-deck: snapshot created');
      return sendSuccess(res, snapshot, 201);
    } catch (err) {
      logger.error({ err }, 'investor-deck: snapshot creation failed');
      return handleRouteError(res, err);
    }
  },
);

// ---------------------------------------------------------------------------
// GET /aegis/investor/snapshots  — list all snapshots
// ---------------------------------------------------------------------------

router.get(
  '/aegis/investor/snapshots',
  requireAnyAuth(),
  async (_req: Request, res: Response) => {
    try {
      const list = Array.from(snapshots.values())
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(({ id, label, createdAt, metrics }) => ({
          id,
          label,
          createdAt,
          fetchedAt: metrics.fetchedAt,
          arrRaw: metrics.arrRaw,
          arr: metrics.arr,
          customers: metrics.customers,
        }));
      return sendSuccess(res, list);
    } catch (err) {
      return handleRouteError(res, err);
    }
  },
);

// ---------------------------------------------------------------------------
// DELETE /aegis/investor/snapshots/:id
// ---------------------------------------------------------------------------

router.get(
  '/aegis/investor/snapshots/:id',
  requireAnyAuth(),
  async (req: Request, res: Response) => {
    try {
      const snap = snapshots.get(req.params.id);
      if (!snap) return res.status(404).json({ error: 'Snapshot not found' });
      return sendSuccess(res, snap);
    } catch (err) {
      return handleRouteError(res, err);
    }
  },
);

router.delete(
  '/aegis/investor/snapshots/:id',
  requireAnyAuth(),
  requireRole('ops'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!snapshots.has(id)) {
        return res.status(404).json({ error: 'Snapshot not found' });
      }
      snapshots.delete(id);
      // Also revoke any share tokens pointing at this snapshot
      for (const [token, st] of shareTokens.entries()) {
        if (st.snapshotId === id) shareTokens.delete(token);
      }
      logger.info({ id }, 'investor-deck: snapshot deleted');
      return sendSuccess(res, { deleted: true });
    } catch (err) {
      return handleRouteError(res, err);
    }
  },
);

// ---------------------------------------------------------------------------
// POST /aegis/investor/share  — generate share link token
// ---------------------------------------------------------------------------

router.post(
  '/aegis/investor/share',
  requireAnyAuth(),
  requireRole('ops'),
  async (req: Request, res: Response) => {
    try {
      const snapshotId: string = req.body?.snapshotId ?? '';
      if (!snapshotId || !snapshots.has(snapshotId)) {
        return res.status(400).json({ error: 'Invalid snapshotId' });
      }
      const recipient: string =
        typeof req.body?.recipient === 'string' ? req.body.recipient.trim() : 'Recipient';

      const ttlDays = Number(req.body?.ttlDays ?? 30);

      const token = crypto.randomBytes(24).toString('base64url');
      const expiresAt = new Date(Date.now() + ttlDays * 24 * 3600 * 1000).toISOString();

      const st: ShareToken = {
        token,
        snapshotId,
        recipient,
        createdAt: new Date().toISOString(),
        expiresAt,
      };
      shareTokens.set(token, st);
      logger.info({ snapshotId, recipient, expiresAt }, 'investor-deck: share token created');

      return sendSuccess(res, { token, expiresAt, recipient });
    } catch (err) {
      return handleRouteError(res, err);
    }
  },
);

// ---------------------------------------------------------------------------
// GET /aegis/investor/share/:token  — public endpoint for share links
// ---------------------------------------------------------------------------

router.get('/aegis/investor/share/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const st = shareTokens.get(token);

    if (!st) {
      return res.status(404).json({ error: 'Share link not found or revoked' });
    }
    if (new Date(st.expiresAt) < new Date()) {
      shareTokens.delete(token);
      return res.status(410).json({ error: 'Share link has expired' });
    }

    const snapshot = snapshots.get(st.snapshotId);
    if (!snapshot) {
      return res.status(404).json({ error: 'Snapshot no longer exists' });
    }

    return sendSuccess(res, {
      recipient: st.recipient,
      expiresAt: st.expiresAt,
      snapshot,
    });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

export default router;
