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
 *
 * PUT /api/admin/usage/:orgId/limits — set per-org quota overrides
 *   Body: { apiCalls?: number | null, members?: number | null, storageMB?: number | null }
 */

import {
  db,
  organizationsTable,
  orgMembersTable,
  pool,
  quotaConfigsTable,
  usageEventsTable,
  usersTable,
} from '@szl-holdings/db';
import { and, count, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import type { IRouter, Request, Response } from 'express';
import {
  handleRouteError,
  sendBadRequest,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from '../../lib/api-response.js';
import { listQuerySchema, validateQuery } from '../../lib/validation.js';
import { readLimiter, writeLimiter } from '../../middlewares/rate-limiters.js';

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

const QUOTA_FEATURE_KEYS = {
  apiCalls: 'api.calls',
  members: 'members',
  storageMB: 'storage_mb',
} as const;

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

        const [memberCounts, activeUserCounts, usageTotals, quotaConfigs] = await Promise.all([
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

          db
            .select({
              orgId: quotaConfigsTable.orgId,
              featureKey: quotaConfigsTable.featureKey,
              hardLimit: quotaConfigsTable.hardLimit,
            })
            .from(quotaConfigsTable)
            .where(
              and(
                sql`${quotaConfigsTable.orgId} = ANY(${orgIds})`,
                eq(quotaConfigsTable.isActive, true),
                eq(quotaConfigsTable.periodType, 'month'),
                eq(quotaConfigsTable.product, 'platform'),
              ),
            ),
        ]);

        const memberByOrg = new Map(memberCounts.map((r) => [r.orgId, Number(r.count)]));
        const activeByOrg = new Map(activeUserCounts.map((r) => [r.orgId, Number(r.count)]));
        const usageByOrg = new Map(usageTotals.map((r) => [r.orgId, r]));

        const quotaByOrg = new Map<number, Record<string, number | null>>();
        for (const qc of quotaConfigs) {
          if (qc.orgId == null) continue;
          if (!quotaByOrg.has(qc.orgId)) quotaByOrg.set(qc.orgId, {});
          quotaByOrg.get(qc.orgId)![qc.featureKey] =
            qc.hardLimit != null ? Number(qc.hardLimit) : null;
        }

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
          const planDefaults = PLAN_LIMITS[org.plan] ?? PLAN_LIMITS.free;
          const overrides = quotaByOrg.get(org.id) ?? {};

          const effectiveLimits = {
            apiCalls:
              overrides[QUOTA_FEATURE_KEYS.apiCalls] != null
                ? (overrides[QUOTA_FEATURE_KEYS.apiCalls] as number)
                : planDefaults.apiCalls,
            members:
              overrides[QUOTA_FEATURE_KEYS.members] != null
                ? (overrides[QUOTA_FEATURE_KEYS.members] as number)
                : planDefaults.members,
            storageMB:
              overrides[QUOTA_FEATURE_KEYS.storageMB] != null
                ? (overrides[QUOTA_FEATURE_KEYS.storageMB] as number)
                : planDefaults.storageMB,
          };

          const hasOverrides =
            overrides[QUOTA_FEATURE_KEYS.apiCalls] != null ||
            overrides[QUOTA_FEATURE_KEYS.members] != null ||
            overrides[QUOTA_FEATURE_KEYS.storageMB] != null;

          const rawApiCallsOverride = overrides[QUOTA_FEATURE_KEYS.apiCalls] ?? null;
          const rawMembersOverride = overrides[QUOTA_FEATURE_KEYS.members] ?? null;
          const rawStorageMBOverride = overrides[QUOTA_FEATURE_KEYS.storageMB] ?? null;

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
            hasQuotaOverrides: hasOverrides,
            quotaOverrides: {
              apiCalls: rawApiCallsOverride,
              members: rawMembersOverride,
              storageMB: rawStorageMBOverride,
            },
            overages: {
              apiCalls: overage(apiCalls, effectiveLimits.apiCalls),
              members: overage(members, effectiveLimits.members),
              storage: storagePollWorked
                ? overage(storageMB, effectiveLimits.storageMB)
                : 'none',
            },
            planLimits: {
              apiCalls: effectiveLimits.apiCalls === Infinity ? null : effectiveLimits.apiCalls,
              members: effectiveLimits.members === Infinity ? null : effectiveLimits.members,
              storageMB:
                effectiveLimits.storageMB === Infinity ? null : effectiveLimits.storageMB,
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

  router.put(
    '/admin/usage/:orgId/limits',
    writeLimiter,
    async (req: Request, res: Response) => {
      try {
        if (!requireSuperAdmin(req, res)) return;

        const orgId = parseInt(req.params.orgId, 10);
        if (Number.isNaN(orgId)) {
          sendBadRequest(res, 'Invalid orgId');
          return;
        }

        const org = await db
          .select({ id: organizationsTable.id, plan: organizationsTable.plan })
          .from(organizationsTable)
          .where(eq(organizationsTable.id, orgId))
          .limit(1);

        if (org.length === 0) {
          sendNotFound(res, 'Organization');
          return;
        }

        const body = req.body as Record<string, unknown>;

        type FieldSpec = { bodyKey: string; featureKey: string };
        const FIELDS: FieldSpec[] = [
          { bodyKey: 'apiCalls', featureKey: QUOTA_FEATURE_KEYS.apiCalls },
          { bodyKey: 'members', featureKey: QUOTA_FEATURE_KEYS.members },
          { bodyKey: 'storageMB', featureKey: QUOTA_FEATURE_KEYS.storageMB },
        ];

        for (const { bodyKey, featureKey } of FIELDS) {
          if (!(bodyKey in body)) continue;

          const raw = body[bodyKey];

          if (raw === null) {
            await db
              .delete(quotaConfigsTable)
              .where(
                and(
                  eq(quotaConfigsTable.orgId, orgId),
                  eq(quotaConfigsTable.featureKey, featureKey),
                  eq(quotaConfigsTable.periodType, 'month'),
                  eq(quotaConfigsTable.product, 'platform'),
                ),
              );
          } else {
            const value = Number(raw);
            if (!Number.isFinite(value) || value < 0) {
              sendBadRequest(res, `Invalid value for ${bodyKey}: must be a non-negative number`);
              return;
            }

            await db
              .insert(quotaConfigsTable)
              .values({
                orgId,
                featureKey,
                product: 'platform',
                periodType: 'month',
                hardLimit: String(value),
                hardLimitAction: 'block',
                softLimitAction: 'notify',
                isActive: true,
              })
              .onConflictDoUpdate({
                target: [
                  quotaConfigsTable.orgId,
                  quotaConfigsTable.featureKey,
                  quotaConfigsTable.periodType,
                ],
                set: {
                  hardLimit: String(value),
                  isActive: true,
                  updatedAt: new Date(),
                },
              });
          }
        }

        const saved = await db
          .select({
            featureKey: quotaConfigsTable.featureKey,
            hardLimit: quotaConfigsTable.hardLimit,
          })
          .from(quotaConfigsTable)
          .where(
            and(
              eq(quotaConfigsTable.orgId, orgId),
              eq(quotaConfigsTable.isActive, true),
              eq(quotaConfigsTable.periodType, 'month'),
              eq(quotaConfigsTable.product, 'platform'),
            ),
          );

        const savedMap = Object.fromEntries(
          saved.map((r) => [r.featureKey, r.hardLimit != null ? Number(r.hardLimit) : null]),
        );

        sendSuccess(res, {
          orgId,
          limits: {
            apiCalls: savedMap[QUOTA_FEATURE_KEYS.apiCalls] ?? null,
            members: savedMap[QUOTA_FEATURE_KEYS.members] ?? null,
            storageMB: savedMap[QUOTA_FEATURE_KEYS.storageMB] ?? null,
          },
        });
      } catch (err) {
        handleRouteError(res, err, 'Failed to update quota limits');
      }
    },
  );
}
