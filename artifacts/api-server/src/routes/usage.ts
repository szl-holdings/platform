/**
 * Per-Tenant Usage Dashboard API
 *
 * GET /api/orgs/:orgSlug/usage         — usage summary (active users, API calls, storage, features)
 * GET /api/orgs/:orgSlug/usage/history — time-series usage data
 * POST /api/orgs/:orgSlug/usage/events — record a usage event
 */

import { Router } from "express";
import { z } from "zod";
import {
  db,
  organizationsTable,
  orgMembersTable,
  usageEventsTable,
  usersTable,
  sessionsTable,
} from "@szl-holdings/db";
import { pool } from "@szl-holdings/db";
import { eq, and, gte, lte, desc, sql, count, sum } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { writeLimiter, readLimiter } from "../middlewares/rate-limiters";
import { validateBody, validateQuery, listQuerySchema } from "../lib/validation";
import { sendSuccess, sendNotFound, sendBadRequest, handleRouteError, sendForbidden } from "../lib/api-response";
import type { Request, Response } from "express";

const router = Router();

const ORG_ROLE_HIERARCHY: Record<string, number> = { owner: 4, admin: 3, member: 2, viewer: 1 };

function isElevated(req: Request): boolean {
  return (req.user?.roles.includes("super_admin") || req.user?.roles.includes("admin")) ?? false;
}

async function resolveOrgAndCheckMembership(orgSlug: string, userId: number) {
  const [org] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.slug, orgSlug))
    .limit(1);

  if (!org) return { org: null, membership: null };

  const [membership] = await db
    .select()
    .from(orgMembersTable)
    .where(and(eq(orgMembersTable.orgId, org.id), eq(orgMembersTable.userId, userId)))
    .limit(1);

  return { org, membership };
}

const recordUsageSchema = z.object({
  featureKey: z.string().min(1).max(100),
  quantity: z.number().int().positive().default(1),
  metadata: z.record(z.unknown()).optional(),
});

router.get("/orgs/:orgSlug/usage", readLimiter, authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const orgSlug = req.params["orgSlug"] as string;
    const { from, to } = req.query as { from?: string; to?: string };

    const { org, membership } = await resolveOrgAndCheckMembership(orgSlug, req.user!.id);

    if (!org) {
      sendNotFound(res, "Organization");
      return;
    }

    if (!isElevated(req) && !membership) {
      sendForbidden(res, "Not a member of this organization");
      return;
    }

    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const [memberCount] = await db
      .select({ count: count() })
      .from(orgMembersTable)
      .where(eq(orgMembersTable.orgId, org.id));

    const [activeUserCount] = await db
      .select({ count: count() })
      .from(orgMembersTable)
      .innerJoin(usersTable, eq(orgMembersTable.userId, usersTable.id))
      .where(and(
        eq(orgMembersTable.orgId, org.id),
        eq(usersTable.isActive, true),
        gte(usersTable.lastLoginAt, fromDate),
      ));

    const usageByFeature = await db
      .select({
        featureKey: usageEventsTable.featureKey,
        totalQuantity: sql<number>`COALESCE(SUM(${usageEventsTable.quantity}), 0)::int`,
        eventCount: sql<number>`COUNT(*)::int`,
      })
      .from(usageEventsTable)
      .where(and(
        eq(usageEventsTable.orgId, org.id),
        gte(usageEventsTable.recordedAt, fromDate),
        lte(usageEventsTable.recordedAt, toDate),
      ))
      .groupBy(usageEventsTable.featureKey)
      .orderBy(desc(sql`SUM(${usageEventsTable.quantity})`));

    const totalApiCalls = usageByFeature
      .filter((u) => u.featureKey.startsWith("api."))
      .reduce((acc, u) => acc + (u.totalQuantity ?? 0), 0);

    let storageBytes = 0;
    let storageDataAvailable = true;
    try {
      const storageResult = await pool.query(`
        SELECT COALESCE(SUM(size_bytes), 0)::bigint as total
        FROM files
        WHERE org_id = $1
      `, [org.id]);
      storageBytes = Number(storageResult.rows[0]?.total ?? 0);
    } catch {
      storageDataAvailable = false;
    }

    const featureUtilization = usageByFeature.map((u) => ({
      feature: u.featureKey,
      quantity: u.totalQuantity,
      events: u.eventCount,
    }));

    sendSuccess(res, {
      org: { id: org.id, name: org.name, slug: org.slug, plan: org.plan },
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      summary: {
        totalMembers: Number(memberCount?.count ?? 0),
        activeUsers: Number(activeUserCount?.count ?? 0),
        apiCalls: totalApiCalls,
        storageBytes,
        storageMB: Math.round(storageBytes / (1024 * 1024)),
        storageDataAvailable,
      },
      featureUtilization,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get usage data");
  }
});

router.get("/orgs/:orgSlug/usage/history", readLimiter, authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const orgSlug = req.params["orgSlug"] as string;
    const { days = "30" } = req.query as { days?: string };
    const daysNum = Math.min(parseInt(days, 10) || 30, 90);

    const { org, membership } = await resolveOrgAndCheckMembership(orgSlug, req.user!.id);

    if (!org) {
      sendNotFound(res, "Organization");
      return;
    }

    if (!isElevated(req) && !membership) {
      sendForbidden(res, "Not a member of this organization");
      return;
    }

    const fromDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

    const dailyUsage = await pool.query(`
      SELECT
        DATE(recorded_at) as date,
        feature_key,
        COALESCE(SUM(quantity), 0)::int as total_quantity,
        COUNT(*)::int as event_count
      FROM usage_events
      WHERE org_id = $1 AND recorded_at >= $2
      GROUP BY DATE(recorded_at), feature_key
      ORDER BY date DESC, total_quantity DESC
    `, [org.id, fromDate]);

    const dailyActiveUsers = await pool.query(`
      SELECT
        DATE(last_login_at) as date,
        COUNT(DISTINCT om.user_id)::int as active_users
      FROM org_members om
      JOIN users u ON om.user_id = u.id
      WHERE om.org_id = $1
        AND u.last_login_at >= $2
        AND u.is_active = true
      GROUP BY DATE(last_login_at)
      ORDER BY date DESC
    `, [org.id, fromDate]);

    sendSuccess(res, {
      period: { days: daysNum, from: fromDate.toISOString() },
      usageByDay: dailyUsage.rows,
      activeUsersByDay: dailyActiveUsers.rows,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get usage history");
  }
});

/**
 * Trusted service token (set USAGE_EVENT_SERVICE_TOKEN in env) — allows
 * server-to-server callers (background jobs, internal collectors) to record
 * usage events without an authenticated session. The token must be sent in
 * `x-service-token` and a constant-time compare is used.
 */
function hasValidServiceToken(req: Request): boolean {
  const expected = process.env.USAGE_EVENT_SERVICE_TOKEN;
  if (!expected) return false;
  const provided = req.header("x-service-token");
  if (!provided || provided.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return mismatch === 0;
}

router.post(
  "/orgs/:orgSlug/usage/events",
  writeLimiter,
  authMiddleware({ required: false }),
  validateBody(recordUsageSchema),
  async (req: Request, res: Response) => {
    try {
      const orgSlug = req.params["orgSlug"] as string;
      const { featureKey, quantity, metadata } = req.body as z.infer<typeof recordUsageSchema>;

      // Allow trusted server-to-server callers (background jobs, collectors)
      // even without a user session.
      const serviceToken = hasValidServiceToken(req);

      if (!serviceToken && !req.user) {
        sendForbidden(res, "Authentication required");
        return;
      }

      // Resolve org. For service-token callers we still need to ensure the
      // org exists, but skip membership checks.
      const [org] = await db
        .select()
        .from(organizationsTable)
        .where(eq(organizationsTable.slug, orgSlug))
        .limit(1);

      if (!org) {
        sendNotFound(res, "Organization");
        return;
      }

      if (!serviceToken) {
        const { membership } = await resolveOrgAndCheckMembership(orgSlug, req.user!.id);

        // Restrict member-driven writes to org admins/owners (or platform
        // elevated roles). Without this, any org member could spam usage
        // events and skew tenant metrics.
        if (!isElevated(req)) {
          if (!membership) {
            sendForbidden(res, "Not a member of this organization");
            return;
          }
          if ((ORG_ROLE_HIERARCHY[membership.role] ?? 0) < ORG_ROLE_HIERARCHY["admin"]) {
            sendForbidden(res, "Org admin role required to record usage events");
            return;
          }
        }
      }

      await db.insert(usageEventsTable).values({
        orgId: org.id,
        featureKey,
        quantity: quantity ?? 1,
        metadata: metadata ?? null,
      });

      sendSuccess(res, { recorded: true, featureKey, quantity: quantity ?? 1 });
    } catch (err) {
      handleRouteError(res, err, "Failed to record usage event");
    }
  },
);

export default router;
