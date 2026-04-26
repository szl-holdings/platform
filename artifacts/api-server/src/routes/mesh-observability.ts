/**
 * Mesh Observability Routes
 *
 * GET /mesh/topology   — live call graph (which principals call which endpoints,
 *                        aggregated counts and p95 latency). Requires ops or super_admin.
 * GET /mesh/principals — all active principals with last-seen and call counts.
 *                        Requires ops or super_admin.
 *
 * These endpoints expose the "business observability" layer described in Task #3578:
 * who is talking to whom, usage volume, and latency.
 */

import { apiKeysTable, meshCallLogTable, oauthClientsTable, sessionsTable, db } from '@szl-holdings/db';
import { and, desc, eq, gt, sql } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { logger } from '../lib/logger';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router = Router();

/**
 * GET /mesh/topology
 *
 * Returns the live call graph: source principal → target endpoint with
 * aggregated call counts and p95 latency over the last 24 hours.
 */
router.get(
  '/mesh/topology',
  authMiddleware({ required: true }),
  requireRole('ops', 'admin'),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const edges = await db
        .select({
          principalType: meshCallLogTable.principalType,
          principalId: meshCallLogTable.principalId,
          principalName: meshCallLogTable.principalName,
          path: meshCallLogTable.path,
          method: meshCallLogTable.method,
          callCount: sql<number>`COUNT(*)::int`,
          successCount: sql<number>`COUNT(*) FILTER (WHERE ${meshCallLogTable.statusCode} < 400)::int`,
          errorCount: sql<number>`COUNT(*) FILTER (WHERE ${meshCallLogTable.statusCode} >= 400)::int`,
          avgLatencyMs: sql<number>`ROUND(AVG(${meshCallLogTable.latencyMs}))::int`,
          p95LatencyMs: sql<number>`ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ${meshCallLogTable.latencyMs}))::int`,
          lastCalledAt: sql<string>`MAX(${meshCallLogTable.timestamp})::text`,
        })
        .from(meshCallLogTable)
        .where(gt(meshCallLogTable.timestamp, windowStart))
        .groupBy(
          meshCallLogTable.principalType,
          meshCallLogTable.principalId,
          meshCallLogTable.principalName,
          meshCallLogTable.path,
          meshCallLogTable.method,
        )
        .orderBy(desc(sql`COUNT(*)`))
        .limit(500);

      const totalCalls = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(meshCallLogTable)
        .where(gt(meshCallLogTable.timestamp, windowStart));

      res.json({
        timestamp: new Date().toISOString(),
        windowHours: 24,
        totalCalls: totalCalls[0]?.count ?? 0,
        edges: edges.map((e) => ({
          source: {
            type: e.principalType,
            id: e.principalId,
            name: e.principalName,
          },
          target: {
            method: e.method,
            path: e.path,
          },
          metrics: {
            callCount: e.callCount,
            successCount: e.successCount,
            errorCount: e.errorCount,
            avgLatencyMs: e.avgLatencyMs,
            p95LatencyMs: e.p95LatencyMs,
            lastCalledAt: e.lastCalledAt,
          },
        })),
      });
    } catch (err) {
      logger.error({ err }, '[mesh] topology query failed');
      res.status(500).json({ error: 'Failed to load mesh topology' });
    }
  },
);

/**
 * GET /mesh/principals
 *
 * Lists all active principals (users, API keys, OAuth clients, internal agents)
 * with their last-seen timestamp and call counts from the mesh_call_log.
 */
router.get(
  '/mesh/principals',
  authMiddleware({ required: true }),
  requireRole('ops', 'admin'),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const windowStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Aggregate call counts from mesh_call_log
      const callStats = await db
        .select({
          principalType: meshCallLogTable.principalType,
          principalId: meshCallLogTable.principalId,
          principalName: meshCallLogTable.principalName,
          callCount: sql<number>`COUNT(*)::int`,
          lastSeenAt: sql<string>`MAX(${meshCallLogTable.timestamp})::text`,
          orgId: meshCallLogTable.orgId,
        })
        .from(meshCallLogTable)
        .where(gt(meshCallLogTable.timestamp, windowStart))
        .groupBy(
          meshCallLogTable.principalType,
          meshCallLogTable.principalId,
          meshCallLogTable.principalName,
          meshCallLogTable.orgId,
        )
        .orderBy(desc(sql`COUNT(*)`));

      // Also include active API keys that may not have called yet
      const activeApiKeys = await db
        .select({
          id: apiKeysTable.id,
          name: apiKeysTable.name,
          keyPrefix: apiKeysTable.keyPrefix,
          scopes: apiKeysTable.scopes,
          orgId: apiKeysTable.orgId,
          lastUsedAt: apiKeysTable.lastUsedAt,
          createdAt: apiKeysTable.createdAt,
        })
        .from(apiKeysTable)
        .where(eq(apiKeysTable.isActive, true));

      // Active OAuth clients
      const activeOauthClients = await db
        .select({
          id: oauthClientsTable.id,
          clientId: oauthClientsTable.clientId,
          name: oauthClientsTable.name,
          orgId: oauthClientsTable.orgId,
          allowedScopes: oauthClientsTable.allowedScopes,
          createdAt: oauthClientsTable.createdAt,
        })
        .from(oauthClientsTable)
        .where(eq(oauthClientsTable.isActive, true));

      // Build a lookup map from call stats
      const statsMap = new Map<string, (typeof callStats)[number]>();
      for (const stat of callStats) {
        statsMap.set(`${stat.principalType}:${stat.principalId}`, stat);
      }

      const principals = [
        // Principals from call log
        ...callStats.map((s) => ({
          type: s.principalType,
          id: s.principalId,
          name: s.principalName,
          callCount: s.callCount,
          lastSeenAt: s.lastSeenAt,
          orgId: s.orgId ?? null,
          source: 'call_log' as const,
        })),

        // Active API keys not in call log
        ...activeApiKeys
          .filter((k) => !statsMap.has(`api_key:${k.id}`))
          .map((k) => ({
            type: 'api_key',
            id: String(k.id),
            name: `api_key:${k.id} (${k.name})`,
            callCount: 0,
            lastSeenAt: k.lastUsedAt?.toISOString() ?? null,
            orgId: k.orgId ?? null,
            source: 'registry' as const,
          })),

        // Active OAuth clients not in call log
        ...activeOauthClients
          .filter((c) => !statsMap.has(`oauth_client:${c.clientId}`))
          .map((c) => ({
            type: 'oauth_client',
            id: c.clientId,
            name: `oauth:${c.name}`,
            callCount: 0,
            lastSeenAt: null,
            orgId: c.orgId ?? null,
            source: 'registry' as const,
          })),
      ];

      res.json({
        timestamp: new Date().toISOString(),
        windowDays: 7,
        principals,
        total: principals.length,
        summary: {
          sessionPrincipals: principals.filter((p) => p.type === 'session').length,
          apiKeyPrincipals: principals.filter((p) => p.type === 'api_key').length,
          oauthClientPrincipals: principals.filter((p) => p.type === 'oauth_client').length,
          internalAgentPrincipals: principals.filter((p) => p.type === 'internal_agent').length,
        },
      });
    } catch (err) {
      logger.error({ err }, '[mesh] principals query failed');
      res.status(500).json({ error: 'Failed to load mesh principals' });
    }
  },
);

export default router;
