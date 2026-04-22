/**
 * Admin Cross-Tenant Usage Aggregation API
 *
 * GET /api/admin/usage — aggregate usage metrics across all orgs
 *   Query params:
 *     plan    — filter by plan (free|starter|professional|enterprise)
 *     from    — ISO date string (default: 30 days ago)
 *     to      — ISO date string (default: now)
 *     org     — search by org name or slug (partial match)
 *     limit   — max rows (default: 100, max: 500)
 *     offset  — pagination offset (default: 0)
 */

import {
  db,
  organizationsTable,
  orgMembersTable,
  pool,
  usageEventsTable,
  usersTable,
} from '@szl-holdings/db';
import { and, count, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import type { IRouter, Request, Response } from 'express';
import {
  handleRouteError,
  sendBadRequest,
  sendForbidden,
  sendSuccess,
} from '../../lib/api-response.js';
import { listQuerySchema, validateQuery } from '../../lib/validation.js';
import { readLimiter } from '../../middlewares/rate-limiters.js';

function requireSuperAdmin(req: Request, res: Response): boolean {
  if (!req.user?.roles.includes('super_admin')) {
    sendForbidden(res, 'Super-admin role required');
    return false;
  }
  return true;
}

const PLAN_LIMITS: Record<string, { apiCalls: number; members: number; storageMB: number }> = {
  free: { apiCalls: 1_000, members: 5, storageMB: 500 },
  starter: { apiCalls: 10_000, members: 25, storageMB: 5_000 },
  professional: { apiCalls: 100_000, members: 100, storageMB: 50_000 },
  enterprise: { apiCalls: Infinity, members: Infinity, storageMB: Infinity },
};

function overage(value: number, limit: number): 'none' | 'warn' | 'over' {
  if (limit === Infinity) return 'none';
  if (value >= limit) return 'over';
  if (value >= limit * 0.8) return 'warn';
  return 'none';
}

export function register(router: IRouter): void {
  router.get(
    '/admin/usage',
    readLimiter,
    validateQuery(listQuerySchema),
    async (req: Request, res: Response) => {
      try {
        if (!requireSuperAdmin(req, res)) return;

        const {
          plan,
          from,
          to,
          org: orgSearch,
          limit: limitStr = '100',
          offset: offsetStr = '0',
        } = req.query as Record<string, string | undefined>;

        const limitNum = Math.min(Math.max(1, parseInt(limitStr ?? '100', 10) || 100), 500);
        const offsetNum = Math.max(parseInt(offsetStr ?? '0', 10) || 0, 0);
        const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const toDate = to ? new Date(to) : new Date();

        if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
          sendBadRequest(res, "Invalid date format for 'from' or 'to'");
          return;
        }

        const orgFilters: ReturnType<typeof eq>[] = [];
        if (plan && ['free', 'starter', 'professional', 'enterprise'].includes(plan)) {
          orgFilters.push(
            eq(organizationsTable.plan, plan as 'free' | 'starter' | 'professional' | 'enterprise'),
          );
        }

        let orgQuery = db
          .select({
            id: organizationsTable.id,
            name: organizationsTable.name,
            slug: organizationsTable.slug,
            plan: organizationsTable.plan,
            status: organizationsTable.status,
            createdAt: organizationsTable.createdAt,
          })
          .from(organizationsTable)
          .$dynamic();

        const conditions: ReturnType<typeof eq>[] = [...orgFilters];
        if (orgSearch) {
          conditions.push(
            or(
              ilike(organizationsTable.name, `%${orgSearch}%`),
              ilike(organizationsTable.slug, `%${orgSearch}%`),
            ) as ReturnType<typeof eq>,
          );
        }
        if (conditions.length > 0) {
          orgQuery = orgQuery.where(and(...conditions) as ReturnType<typeof eq>);
        }

        const orgs = await orgQuery;

        if (orgs.length === 0) {
          sendSuccess(res, {
            period: { from: fromDate.toISOString(), to: toDate.toISOString() },
            totals: { orgs: 0, apiCalls: 0, activeUsers: 0, overageCount: 0, warnCount: 0 },
            rows: [],
            pagination: { limit: limitNum, offset: offsetNum, total: 0, hasMore: false },
          });
          return;
        }

        const orgIds = orgs.map((o) => o.id);

        const [memberCounts, activeUserCounts, usageTotals] = await Promise.all([
          db
            .select({ orgId: orgMembersTable.orgId, count: count() })
            .from(orgMembersTable)
            .where(sql`${orgMembersTable.orgId} = ANY(${orgIds})`)
            .groupBy(orgMembersTable.orgId),

          db
            .select({ orgId: orgMembersTable.orgId, count: count() })
            .from(orgMembersTable)
            .innerJoin(usersTable, eq(orgMembersTable.userId, usersTable.id))
            .where(
              and(
                sql`${orgMembersTable.orgId} = ANY(${orgIds})`,
                eq(usersTable.isActive, true),
                gte(usersTable.lastLoginAt, fromDate),
              ),
            )
            .groupBy(orgMembersTable.orgId),

          db
            .select({
              orgId: usageEventsTable.orgId,
              apiCalls: sql<number>`COALESCE(SUM(CASE WHEN ${usageEventsTable.featureKey} LIKE 'api.%' THEN ${usageEventsTable.quantity} ELSE 0 END), 0)::int`,
              featureCount: sql<number>`COUNT(DISTINCT ${usageEventsTable.featureKey})::int`,
            })
            .from(usageEventsTable)
            .where(
              and(
                sql`${usageEventsTable.orgId} = ANY(${orgIds})`,
                gte(usageEventsTable.recordedAt, fromDate),
                lte(usageEventsTable.recordedAt, toDate),
              ),
            )
            .groupBy(usageEventsTable.orgId),
        ]);

        const memberByOrg = new Map(memberCounts.map((r) => [r.orgId, Number(r.count)]));
        const activeByOrg = new Map(activeUserCounts.map((r) => [r.orgId, Number(r.count)]));
        const usageByOrg = new Map(usageTotals.map((r) => [r.orgId, r]));

        let storagePollWorked = false;
        const storageByOrg = new Map<number, number>();
        try {
          const storageResult = await pool.query<{ org_id: number; total: string }>(
            `SELECT org_id, COALESCE(SUM(size_bytes), 0)::bigint as total
           FROM files
           WHERE org_id = ANY($1::int[])
           GROUP BY org_id`,
            [orgIds],
          );
          for (const row of storageResult.rows) {
            storageByOrg.set(Number(row.org_id), Number(row.total));
          }
          storagePollWorked = true;
        } catch {
          storagePollWorked = false;
        }

        const rows = orgs.map((org) => {
          const members = memberByOrg.get(org.id) ?? 0;
          const activeUsers = activeByOrg.get(org.id) ?? 0;
          const usage = usageByOrg.get(org.id);
          const apiCalls = usage?.apiCalls ?? 0;
          const featureCount = usage?.featureCount ?? 0;
          const storageBytes = storageByOrg.get(org.id) ?? 0;
          const storageMB = Math.round(storageBytes / (1024 * 1024));
          const limits = PLAN_LIMITS[org.plan] ?? PLAN_LIMITS.free;

          return {
            orgId: org.id,
            orgName: org.name,
            orgSlug: org.slug,
            plan: org.plan,
            status: org.status,
            createdAt: org.createdAt.toISOString(),
            members,
            activeUsers,
            apiCalls,
            featureCount,
            storageBytes,
            storageMB,
            storageDataAvailable: storagePollWorked,
            overages: {
              apiCalls: overage(apiCalls, limits.apiCalls),
              members: overage(members, limits.members),
              storage: storagePollWorked ? overage(storageMB, limits.storageMB) : 'none',
            },
            planLimits: {
              apiCalls: limits.apiCalls === Infinity ? null : limits.apiCalls,
              members: limits.members === Infinity ? null : limits.members,
              storageMB: limits.storageMB === Infinity ? null : limits.storageMB,
            },
          };
        });

        rows.sort((a, b) => b.apiCalls - a.apiCalls);

        const totalApiCalls = rows.reduce((s, r) => s + r.apiCalls, 0);
        const totalActiveUsers = rows.reduce((s, r) => s + r.activeUsers, 0);
        const overCount = rows.filter((r) =>
          Object.values(r.overages).some((v) => v === 'over'),
        ).length;
        const warnCount = rows.filter((r) =>
          Object.values(r.overages).some((v) => v === 'warn'),
        ).length;

        const paginatedRows = rows.slice(offsetNum, offsetNum + limitNum);

        sendSuccess(res, {
          period: { from: fromDate.toISOString(), to: toDate.toISOString() },
          totals: {
            orgs: rows.length,
            apiCalls: totalApiCalls,
            activeUsers: totalActiveUsers,
            overageCount: overCount,
            warnCount,
          },
          rows: paginatedRows,
          pagination: {
            limit: limitNum,
            offset: offsetNum,
            total: rows.length,
            hasMore: offsetNum + limitNum < rows.length,
          },
        });
      } catch (err) {
        handleRouteError(res, err, 'Failed to aggregate admin usage data');
      }
    },
  );
}
