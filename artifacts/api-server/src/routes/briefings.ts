/**
 * /briefings — Cross-domain executive briefing endpoint
 *
 * Returns a consolidated, domain-scoped briefing summary pulling from
 * Constellation node counts + domain signal aggregation. Distinct from
 * the /pulse per-day narrative briefing: this is a live API-contract
 * endpoint that domain apps and the Command Portal consume.
 *
 * Routes:
 *   GET  /briefings              — latest cross-domain executive brief
 *   GET  /briefings/:domain      — domain-scoped brief (terra|prism|vessels|aegis|lyte)
 *   POST /briefings/generate     — force-regenerate brief (returns same shape)
 */

import { bodyShape } from '@szl-holdings/contracts/common';
import { cstEdges, cstNodes, db, pulseBriefingsTable } from '@szl-holdings/db';
import { and, eq, sql } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { handleRouteError, sendBadRequest, sendNotFound, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { validateBody } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';
import {
  perUserApiSlidingLimiter,
  perUserWriteSlidingLimiter,
} from '../middlewares/sliding-window-limiter';

const router: IRouter = Router();
router.use(authMiddleware({ required: false }));
router.use(perUserApiSlidingLimiter);

const KNOWN_DOMAINS = [
  'terra',
  'prism',
  'vessels',
  'aegis',
  'lyte',
  'imperium',
  'carlota-jo',
  'platform',
] as const;
type KnownDomain = (typeof KNOWN_DOMAINS)[number];

interface DomainSnapshot {
  domain: string;
  entityCount: number;
  activeCount: number;
  edgeCount: number;
  avgConfidence: number;
  topEntityTypes: Array<{ type: string; count: number }>;
  staleFraction: number;
  healthScore: number;
  summary: string;
}

interface ExecutiveBrief {
  generatedAt: string;
  totalEntities: number;
  totalEdges: number;
  crossDomainLinks: number;
  overallHealthScore: number;
  domains: DomainSnapshot[];
  highlights: string[];
  alerts: Array<{ domain: string; message: string; severity: 'info' | 'warning' | 'critical' }>;
}

async function buildDomainSnapshot(domain: string): Promise<DomainSnapshot> {
  const staleThreshold = new Date(Date.now() - 24 * 3600 * 1000);

  const [entityCount, activeCount, avgRow, typeRows, staleRow, edgeRow] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(cstNodes)
      .where(eq(cstNodes.domain, domain)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(cstNodes)
      .where(and(eq(cstNodes.domain, domain), eq(cstNodes.isActive, true))),
    db
      .select({ avg: sql<number>`coalesce(avg(confidence), 1)::float` })
      .from(cstNodes)
      .where(eq(cstNodes.domain, domain)),
    db
      .select({ entityType: cstNodes.entityType, count: sql<number>`count(*)::int` })
      .from(cstNodes)
      .where(eq(cstNodes.domain, domain))
      .groupBy(cstNodes.entityType)
      .orderBy(sql`count(*) desc`)
      .limit(5),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(cstNodes)
      .where(and(eq(cstNodes.domain, domain), sql`freshness < ${staleThreshold}`)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(cstEdges)
      .where(sql`(select domain from cst_nodes where id = from_node_id limit 1) = ${domain}`),
  ]);

  const total = entityCount[0]?.count ?? 0;
  const active = activeCount[0]?.count ?? 0;
  const avg = avgRow[0]?.avg ?? 1.0;
  const stale = staleRow[0]?.count ?? 0;
  const edges = edgeRow[0]?.count ?? 0;
  const staleFraction = total > 0 ? stale / total : 0;
  const healthScore = Math.round(avg * (1 - staleFraction * 0.3) * 100) / 100;

  return {
    domain,
    entityCount: total,
    activeCount: active,
    edgeCount: edges,
    avgConfidence: Math.round(avg * 1000) / 1000,
    topEntityTypes: typeRows.map((r) => ({ type: r.entityType, count: r.count })),
    staleFraction: Math.round(staleFraction * 1000) / 1000,
    healthScore,
    summary:
      total === 0
        ? `No entities seeded for ${domain} yet.`
        : `${active} active entities across ${typeRows.length} types. Avg confidence ${(avg * 100).toFixed(1)}%.`,
  };
}

async function generateBrief(domains: string[]): Promise<ExecutiveBrief> {
  const snapshots = await Promise.all(domains.map(buildDomainSnapshot));

  const [totalEdges, crossDomainEdges] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(cstEdges),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(cstEdges)
      .where(
        sql`(select domain from cst_nodes where id = from_node_id limit 1) != (select domain from cst_nodes where id = to_node_id limit 1)`,
      ),
  ]);

  const totalEntities = snapshots.reduce((s, d) => s + d.entityCount, 0);
  const overallHealth =
    snapshots.length > 0
      ? Math.round((snapshots.reduce((s, d) => s + d.healthScore, 0) / snapshots.length) * 100) /
        100
      : 1.0;

  const highlights: string[] = [];
  const alerts: ExecutiveBrief['alerts'] = [];

  for (const snap of snapshots) {
    if (snap.entityCount === 0) {
      alerts.push({
        domain: snap.domain,
        message: `No entities found for domain ${snap.domain}`,
        severity: 'info',
      });
    } else if (snap.staleFraction > 0.5) {
      alerts.push({
        domain: snap.domain,
        message: `${Math.round(snap.staleFraction * 100)}% of ${snap.domain} entities are stale (>24h)`,
        severity: 'warning',
      });
    }
    if (snap.entityCount > 0) {
      highlights.push(snap.summary);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totalEntities,
    totalEdges: totalEdges[0]?.count ?? 0,
    crossDomainLinks: crossDomainEdges[0]?.count ?? 0,
    overallHealthScore: overallHealth,
    domains: snapshots,
    highlights,
    alerts,
  };
}

router.get('/briefings', async (_req: Request, res: Response) => {
  try {
    const brief = await generateBrief([...KNOWN_DOMAINS]);
    return sendSuccess(res, brief);
  } catch (err) {
    return handleRouteError(res, err, 'GET /briefings');
  }
});

router.get('/briefings/:domain', async (req: Request, res: Response) => {
  try {
    const { domain } = req.params as { domain: string };
    if (!KNOWN_DOMAINS.includes(domain as KnownDomain)) {
      return sendBadRequest(res, `Unknown domain '${domain}'. Valid: ${KNOWN_DOMAINS.join(', ')}`);
    }
    const snap = await buildDomainSnapshot(domain);
    return sendSuccess(res, snap);
  } catch (err) {
    return handleRouteError(res, err, `GET /briefings/${req.params.domain}`);
  }
});

router.put(
  '/briefings/:id/approve',
  authMiddleware({ required: true }),
  requireRole('ops', 'exec', 'admin', 'super_admin'),
  perUserWriteSlidingLimiter,
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const existing = await db
        .select()
        .from(pulseBriefingsTable)
        .where(eq(pulseBriefingsTable.id, id))
        .limit(1);
      if (existing.length === 0) {
        return sendNotFound(res, `Briefing '${id}' not found`);
      }
      const [updated] = await db
        .update(pulseBriefingsTable)
        .set({ status: 'published' })
        .where(eq(pulseBriefingsTable.id, id))
        .returning({ id: pulseBriefingsTable.id, status: pulseBriefingsTable.status });
      logger.info({ briefingId: id, by: req.user?.id ?? 'system' }, 'Briefing approved');
      return sendSuccess(res, {
        id: updated?.id,
        status: updated?.status,
        approvedAt: new Date().toISOString(),
      });
    } catch (err) {
      return handleRouteError(res, err, `PUT /briefings/${req.params.id}/approve`);
    }
  },
);

router.put(
  '/briefings/:id/archive',
  authMiddleware({ required: true }),
  requireRole('ops', 'exec', 'admin', 'super_admin'),
  perUserWriteSlidingLimiter,
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const existing = await db
        .select()
        .from(pulseBriefingsTable)
        .where(eq(pulseBriefingsTable.id, id))
        .limit(1);
      if (existing.length === 0) {
        return sendNotFound(res, `Briefing '${id}' not found`);
      }
      const [updated] = await db
        .update(pulseBriefingsTable)
        .set({ status: 'archived' })
        .where(eq(pulseBriefingsTable.id, id))
        .returning({ id: pulseBriefingsTable.id, status: pulseBriefingsTable.status });
      logger.info({ briefingId: id, by: req.user?.id ?? 'system' }, 'Briefing archived');
      return sendSuccess(res, {
        id: updated?.id,
        status: updated?.status,
        archivedAt: new Date().toISOString(),
      });
    } catch (err) {
      return handleRouteError(res, err, `PUT /briefings/${req.params.id}/archive`);
    }
  },
);

router.post(
  '/briefings/generate',
  validateBody(bodyShape({})),
  async (_req: Request, res: Response) => {
    try {
      logger.info('Force-generating executive brief');
      const brief = await generateBrief([...KNOWN_DOMAINS]);
      return sendSuccess(res, { ...brief, forced: true });
    } catch (err) {
      return handleRouteError(res, err, 'POST /briefings/generate');
    }
  },
);

export default router;
