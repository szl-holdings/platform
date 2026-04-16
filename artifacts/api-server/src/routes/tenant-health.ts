/**
 * Tenant Health Scorecard API
 *
 * Computes and caches per-tenant health scores from:
 *  - Usage metering (active users, API calls, feature adoption)
 *  - Billing signals (billing status, plan)
 *  - Support signals (quota violations used as proxy for ticket volume)
 *  - Error rates (from usage aggregate event counts)
 *
 * Routes:
 *   GET  /tenant-health              — all tenant scorecards (admin)
 *   GET  /tenant-health/benchmarks   — platform-wide averages for benchmarking
 *   GET  /tenant-health/:orgId       — single tenant scorecard
 *   POST /tenant-health/:orgId/compute — force recompute for org
 */

import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  tenantHealthScorecardsTable,
  organizationsTable,
  orgMembersTable,
  usageAggregatesTable,
  meteringEventsTable,
  quotaViolationsTable,
  subscriptionsTable,
} from "@szl-holdings/db";
import { eq, desc, asc, and, gte, lte, sql, count, avg } from "drizzle-orm";
import { sendSuccess, sendNotFound, handleRouteError } from "../lib/api-response";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";
import { assertTenantAccess } from "../middlewares/tenant-scope";

const router: IRouter = Router();
const ADMIN_ROLES = ["admin", "super_admin", "ops"] as const;

function periodBounds(refDate = new Date()) {
  const y = refDate.getUTCFullYear();
  const m = refDate.getUTCMonth();
  return {
    start: new Date(Date.UTC(y, m, 1)),
    end: new Date(Date.UTC(y, m + 1, 1)),
  };
}

function prevPeriodBounds(refDate = new Date()) {
  const y = refDate.getUTCFullYear();
  const m = refDate.getUTCMonth();
  return {
    start: new Date(Date.UTC(y, m - 1, 1)),
    end: new Date(Date.UTC(y, m, 1)),
  };
}

/**
 * Compute health score (0–100) from raw signals.
 * Weights:
 *   - Active user ratio        30%
 *   - Feature adoption %       25%
 *   - SLA adherence %          20%
 *   - Low error rate           15%
 *   - Billing current           10%
 */
function computeHealthScore(signals: {
  activeUsers: number;
  totalUsers: number;
  featureAdoptionPct: number;
  slaAdherencePct: number;
  errorRatePct: number;
  billingStatus: string;
}): { score: number; tier: "critical" | "at_risk" | "healthy" | "champion" } {
  const userRatio = signals.totalUsers > 0 ? signals.activeUsers / signals.totalUsers : 0;
  const userScore = Math.min(userRatio * 100, 100);

  const adoptionScore = Math.min(signals.featureAdoptionPct, 100);

  const slaScore = Math.min(signals.slaAdherencePct, 100);

  const errorScore = Math.max(0, 100 - signals.errorRatePct * 5);

  const billingScoreMap: Record<string, number> = {
    current: 100,
    trial: 80,
    overdue: 30,
    churned: 0,
    unknown: 60,
  };
  const billingScore = billingScoreMap[signals.billingStatus] ?? 60;

  const score =
    userScore * 0.30 +
    adoptionScore * 0.25 +
    slaScore * 0.20 +
    errorScore * 0.15 +
    billingScore * 0.10;

  const rounded = Math.round(score * 10) / 10;

  const tier =
    rounded >= 80 ? "champion"
    : rounded >= 60 ? "healthy"
    : rounded >= 40 ? "at_risk"
    : "critical";

  return { score: rounded, tier };
}

async function computeForOrg(orgId: number): Promise<typeof tenantHealthScorecardsTable.$inferSelect> {
  const now = new Date();
  const { start, end } = periodBounds(now);
  const { start: prevStart, end: prevEnd } = prevPeriodBounds(now);

  const [orgRow] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, orgId)).limit(1);
  if (!orgRow) throw new Error(`Org ${orgId} not found`);

  // Total members
  const [memberCount] = await db
    .select({ total: count() })
    .from(orgMembersTable)
    .where(eq(orgMembersTable.orgId, orgId));

  const totalUsers = memberCount?.total ?? 0;

  // Active users this month (from metering events)
  const [activeUsersRow] = await db
    .select({ unique: sql<number>`COUNT(DISTINCT ${meteringEventsTable.userId})::int` })
    .from(meteringEventsTable)
    .where(and(
      eq(meteringEventsTable.orgId, orgId),
      gte(meteringEventsTable.occurredAt, start),
      lte(meteringEventsTable.occurredAt, end),
    ));
  const activeUsers = activeUsersRow?.unique ?? 0;

  // Session count (total events this month)
  const [sessionRow] = await db
    .select({ total: sql<number>`COUNT(*)::int` })
    .from(meteringEventsTable)
    .where(and(
      eq(meteringEventsTable.orgId, orgId),
      gte(meteringEventsTable.occurredAt, start),
      lte(meteringEventsTable.occurredAt, end),
    ));
  const sessionCount = sessionRow?.total ?? 0;

  // Distinct feature keys used (feature adoption)
  const distinctFeatures = await db
    .selectDistinct({ featureKey: meteringEventsTable.featureKey })
    .from(meteringEventsTable)
    .where(and(
      eq(meteringEventsTable.orgId, orgId),
      gte(meteringEventsTable.occurredAt, start),
    ));

  // Platform-wide distinct features (denominator for adoption %)
  const allPlatformFeatures = await db
    .selectDistinct({ featureKey: meteringEventsTable.featureKey })
    .from(meteringEventsTable)
    .where(gte(meteringEventsTable.occurredAt, prevStart));

  const featureAdoptionPct = allPlatformFeatures.length > 0
    ? Math.round((distinctFeatures.length / allPlatformFeatures.length) * 100)
    : 0;

  // Quota violations (proxy for support issues)
  const [violationRow] = await db
    .select({ total: count() })
    .from(quotaViolationsTable)
    .where(and(
      eq(quotaViolationsTable.orgId, orgId),
      gte(quotaViolationsTable.createdAt, start),
    ));
  const supportTicketVolume = violationRow?.total ?? 0;

  // SLA adherence: hard violations indicate SLA breaches
  const [hardViolations] = await db
    .select({ total: count() })
    .from(quotaViolationsTable)
    .where(and(
      eq(quotaViolationsTable.orgId, orgId),
      eq(quotaViolationsTable.violationType, "hard"),
      gte(quotaViolationsTable.createdAt, start),
    ));
  const hardCount = hardViolations?.total ?? 0;
  const slaAdherencePct = sessionCount > 0
    ? Math.max(0, Math.round((1 - hardCount / Math.max(sessionCount, 1)) * 100))
    : 100;

  // Billing status from org plan + subscription
  const [sub] = await db.select().from(subscriptionsTable)
    .where(eq(subscriptionsTable.orgId, orgId))
    .orderBy(desc(subscriptionsTable.createdAt))
    .limit(1);

  let billingStatus: "current" | "overdue" | "churned" | "trial" | "unknown" = "unknown";
  if (sub) {
    if (sub.status === "active") billingStatus = "current";
    else if (sub.status === "trialing") billingStatus = "trial";
    else if (sub.status === "past_due") billingStatus = "overdue";
    else if (sub.status === "canceled") billingStatus = "churned";
  } else if (orgRow.plan === "free") {
    billingStatus = "trial";
  }

  // Error rate from quota violations vs total events
  const errorRatePct = sessionCount > 0 ? Math.round((hardCount / sessionCount) * 100) : 0;

  // API call count
  const apiCallCount = sessionCount;

  // Compute health score
  const { score: healthScore, tier: healthTier } = computeHealthScore({
    activeUsers, totalUsers, featureAdoptionPct, slaAdherencePct, errorRatePct, billingStatus,
  });

  // Prior period for delta
  const [prevActiveRow] = await db
    .select({ unique: sql<number>`COUNT(DISTINCT ${meteringEventsTable.userId})::int` })
    .from(meteringEventsTable)
    .where(and(
      eq(meteringEventsTable.orgId, orgId),
      gte(meteringEventsTable.occurredAt, prevStart),
      lte(meteringEventsTable.occurredAt, prevEnd),
    ));
  const prevActiveUsers = prevActiveRow?.unique ?? 0;

  const [prevScorecard] = await db.select().from(tenantHealthScorecardsTable)
    .where(and(
      eq(tenantHealthScorecardsTable.orgId, orgId),
      eq(tenantHealthScorecardsTable.periodStart, prevStart),
    ))
    .limit(1);

  const healthScoreDelta = prevScorecard ? Math.round((healthScore - prevScorecard.healthScore) * 10) / 10 : null;
  const activeUsersDelta = activeUsers - prevActiveUsers;

  const signalBreakdown = {
    userActivity: { activeUsers, totalUsers, userRatio: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0 },
    featureAdoption: { used: distinctFeatures.length, total: allPlatformFeatures.length, pct: featureAdoptionPct },
    support: { ticketVolume: supportTicketVolume, hardViolations: hardCount },
    sla: { adherencePct: slaAdherencePct },
    billing: { status: billingStatus, plan: orgRow.plan },
    errors: { ratePct: errorRatePct, totalEvents: sessionCount },
  };

  const [scorecard] = await db.insert(tenantHealthScorecardsTable)
    .values({
      orgId,
      computedAt: now,
      periodStart: start,
      periodEnd: end,
      activeUsers,
      totalUsers,
      sessionCount,
      featureAdoptionPct,
      supportTicketVolume,
      slaAdherencePct,
      billingStatus,
      apiCallCount,
      errorRatePct,
      healthScore,
      healthTier,
      healthScoreDelta,
      activeUsersDelta,
      signalBreakdown,
    })
    .onConflictDoUpdate({
      target: [tenantHealthScorecardsTable.orgId, tenantHealthScorecardsTable.periodStart],
      set: {
        computedAt: now,
        activeUsers,
        totalUsers,
        sessionCount,
        featureAdoptionPct,
        supportTicketVolume,
        slaAdherencePct,
        billingStatus,
        apiCallCount,
        errorRatePct,
        healthScore,
        healthTier,
        healthScoreDelta,
        activeUsersDelta,
        signalBreakdown,
      },
    })
    .returning();

  return scorecard!;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /tenant-health — all scorecards (admin)
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/tenant-health",
  authMiddleware(),
  requireRole(...ADMIN_ROLES),
  async (req: Request, res: Response) => {
    try {
      const tier = req.query.tier as string | undefined;
      const sortBy = (req.query.sortBy as string) || "healthScore";
      const sortDir = (req.query.sortDir as string) === "asc" ? "asc" : "desc";
      const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10), 200);

      const { start } = periodBounds();

      const rows = await db
        .select({
          scorecard: tenantHealthScorecardsTable,
          org: {
            id: organizationsTable.id,
            name: organizationsTable.name,
            slug: organizationsTable.slug,
            plan: organizationsTable.plan,
            status: organizationsTable.status,
          },
        })
        .from(tenantHealthScorecardsTable)
        .innerJoin(organizationsTable, eq(tenantHealthScorecardsTable.orgId, organizationsTable.id))
        .where(and(
          eq(tenantHealthScorecardsTable.periodStart, start),
          tier ? eq(tenantHealthScorecardsTable.healthTier, tier as "critical" | "at_risk" | "healthy" | "champion") : undefined,
        ))
        .orderBy(
          sortDir === "asc"
            ? asc(tenantHealthScorecardsTable.healthScore)
            : desc(tenantHealthScorecardsTable.healthScore),
        )
        .limit(limit);

      const combined = rows.map(r => ({ ...r.scorecard, orgName: r.org.name, orgSlug: r.org.slug, plan: r.org.plan }));

      sendSuccess(res, {
        scorecards: combined,
        period: { start, end: periodBounds().end },
        total: combined.length,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to list tenant health scorecards");
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /tenant-health/benchmarks — platform-wide averages
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/tenant-health/benchmarks",
  authMiddleware(),
  requireRole(...ADMIN_ROLES),
  async (req: Request, res: Response) => {
    try {
      const { start } = periodBounds();

      const [aggs] = await db
        .select({
          avgHealthScore: avg(tenantHealthScorecardsTable.healthScore),
          avgActiveUsers: avg(sql<number>`${tenantHealthScorecardsTable.activeUsers}::float`),
          avgFeatureAdoption: avg(sql<number>`${tenantHealthScorecardsTable.featureAdoptionPct}::float`),
          avgSlaAdherence: avg(sql<number>`${tenantHealthScorecardsTable.slaAdherencePct}::float`),
          avgErrorRate: avg(sql<number>`${tenantHealthScorecardsTable.errorRatePct}::float`),
          totalOrgs: count(),
        })
        .from(tenantHealthScorecardsTable)
        .where(eq(tenantHealthScorecardsTable.periodStart, start));

      // Percentile distribution of health scores using PostgreSQL's percentile_cont
      const [percentiles] = await db
        .select({
          p25: sql<number>`percentile_cont(0.25) WITHIN GROUP (ORDER BY ${tenantHealthScorecardsTable.healthScore})`,
          p50: sql<number>`percentile_cont(0.50) WITHIN GROUP (ORDER BY ${tenantHealthScorecardsTable.healthScore})`,
          p75: sql<number>`percentile_cont(0.75) WITHIN GROUP (ORDER BY ${tenantHealthScorecardsTable.healthScore})`,
          p90: sql<number>`percentile_cont(0.90) WITHIN GROUP (ORDER BY ${tenantHealthScorecardsTable.healthScore})`,
          p25ActiveUsers: sql<number>`percentile_cont(0.25) WITHIN GROUP (ORDER BY ${tenantHealthScorecardsTable.activeUsers})`,
          p50ActiveUsers: sql<number>`percentile_cont(0.50) WITHIN GROUP (ORDER BY ${tenantHealthScorecardsTable.activeUsers})`,
          p75ActiveUsers: sql<number>`percentile_cont(0.75) WITHIN GROUP (ORDER BY ${tenantHealthScorecardsTable.activeUsers})`,
          p25FeatureAdoption: sql<number>`percentile_cont(0.25) WITHIN GROUP (ORDER BY ${tenantHealthScorecardsTable.featureAdoptionPct})`,
          p75FeatureAdoption: sql<number>`percentile_cont(0.75) WITHIN GROUP (ORDER BY ${tenantHealthScorecardsTable.featureAdoptionPct})`,
        })
        .from(tenantHealthScorecardsTable)
        .where(eq(tenantHealthScorecardsTable.periodStart, start));

      const tierCounts = await db
        .select({
          tier: tenantHealthScorecardsTable.healthTier,
          cnt: count(),
        })
        .from(tenantHealthScorecardsTable)
        .where(eq(tenantHealthScorecardsTable.periodStart, start))
        .groupBy(tenantHealthScorecardsTable.healthTier);

      const tierBreakdown = Object.fromEntries(tierCounts.map(r => [r.tier, r.cnt]));

      const round1 = (v: unknown) => Math.round(parseFloat(String(v ?? "0")) * 10) / 10;
      const round0 = (v: unknown) => Math.round(parseFloat(String(v ?? "0")));

      sendSuccess(res, {
        benchmarks: {
          avgHealthScore: round1(aggs?.avgHealthScore),
          avgActiveUsers: round0(aggs?.avgActiveUsers),
          avgFeatureAdoptionPct: round0(aggs?.avgFeatureAdoption),
          avgSlaAdherencePct: round0(aggs?.avgSlaAdherence),
          avgErrorRatePct: round1(aggs?.avgErrorRate),
          totalOrgs: aggs?.totalOrgs ?? 0,
        },
        percentiles: percentiles ? {
          healthScore: {
            p25: round1(percentiles.p25),
            p50: round1(percentiles.p50),
            p75: round1(percentiles.p75),
            p90: round1(percentiles.p90),
          },
          activeUsers: {
            p25: round0(percentiles.p25ActiveUsers),
            p50: round0(percentiles.p50ActiveUsers),
            p75: round0(percentiles.p75ActiveUsers),
          },
          featureAdoption: {
            p25: round0(percentiles.p25FeatureAdoption),
            p75: round0(percentiles.p75FeatureAdoption),
          },
        } : null,
        tierBreakdown,
        period: { start },
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to get benchmarks");
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /tenant-health/:orgId — single org scorecard
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/tenant-health/:orgId",
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const orgId = parseIdParam(req.params.orgId);
      if (!assertTenantAccess(req, res, orgId)) return;

      const { start } = periodBounds();

      const [existing] = await db.select().from(tenantHealthScorecardsTable)
        .where(and(
          eq(tenantHealthScorecardsTable.orgId, orgId),
          eq(tenantHealthScorecardsTable.periodStart, start),
        ))
        .limit(1);

      const scorecard = existing ?? await computeForOrg(orgId);

      const history = await db.select().from(tenantHealthScorecardsTable)
        .where(eq(tenantHealthScorecardsTable.orgId, orgId))
        .orderBy(desc(tenantHealthScorecardsTable.periodStart))
        .limit(6);

      sendSuccess(res, { scorecard, history });
    } catch (err) {
      handleRouteError(res, err, "Failed to get tenant health scorecard");
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /tenant-health/:orgId/compute — force recompute
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  "/tenant-health/:orgId/compute",
  authMiddleware(),
  requireRole(...ADMIN_ROLES),
  async (req: Request, res: Response) => {
    try {
      const orgId = parseIdParam(req.params.orgId);
      const scorecard = await computeForOrg(orgId);
      sendSuccess(res, scorecard);
    } catch (err) {
      handleRouteError(res, err, "Failed to compute tenant health");
    }
  },
);

export default router;
