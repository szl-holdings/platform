/**
 * Tenant Health Scorecard Seed
 *
 * Populates `tenant_health_scorecards` with three months of realistic
 * per-org rows so the scorecard dashboard and benchmark view show a
 * meaningful tier distribution (critical / at_risk / healthy / champion).
 *
 * - Idempotent via the (orgId, periodStart) unique index — safe to re-run.
 * - Uses the same scoring weights as artifacts/api-server/src/routes/tenant-health.ts
 *   so seeded scores agree with what a force-recompute would produce given
 *   the same raw signals.
 * - Distributes orgs deterministically across all four tiers based on their
 *   id, so the dashboard always renders a varied distribution regardless of
 *   how many orgs exist.
 *
 * Run: pnpm --filter @workspace/scripts run seed:tenant-health
 */

import {
  db,
  organizationsTable,
  orgMembersTable,
  tenantHealthScorecardsTable,
} from '@szl-holdings/db';
import { count, eq } from 'drizzle-orm';

type Tier = 'critical' | 'at_risk' | 'healthy' | 'champion';

interface RawSignals {
  activeUsers: number;
  totalUsers: number;
  featureAdoptionPct: number;
  slaAdherencePct: number;
  errorRatePct: number;
  billingStatus: 'current' | 'overdue' | 'churned' | 'trial' | 'unknown';
}

const TIER_PROFILES: Record<Tier, () => RawSignals> = {
  champion: () => ({
    activeUsers: 0,
    totalUsers: 0,
    featureAdoptionPct: rand(82, 97),
    slaAdherencePct: rand(98, 100),
    errorRatePct: rand(0, 1),
    billingStatus: 'current',
  }),
  healthy: () => ({
    activeUsers: 0,
    totalUsers: 0,
    featureAdoptionPct: rand(58, 78),
    slaAdherencePct: rand(94, 99),
    errorRatePct: rand(1, 3),
    billingStatus: 'current',
  }),
  at_risk: () => ({
    activeUsers: 0,
    totalUsers: 0,
    featureAdoptionPct: rand(28, 50),
    slaAdherencePct: rand(82, 92),
    errorRatePct: rand(4, 9),
    billingStatus: pick(['current', 'overdue', 'trial']),
  }),
  critical: () => ({
    activeUsers: 0,
    totalUsers: 0,
    featureAdoptionPct: rand(5, 22),
    slaAdherencePct: rand(60, 78),
    errorRatePct: rand(10, 18),
    billingStatus: pick(['overdue', 'churned', 'unknown']),
  }),
};

function rand(lo: number, hi: number): number {
  return Math.round((lo + Math.random() * (hi - lo)) * 10) / 10;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function userRatioForTier(tier: Tier): number {
  switch (tier) {
    case 'champion':
      return rand(0.78, 0.95);
    case 'healthy':
      return rand(0.55, 0.78);
    case 'at_risk':
      return rand(0.25, 0.45);
    case 'critical':
      return rand(0.05, 0.2);
  }
}

function tierForOrgIdAndOffset(orgId: number, monthsAgo: number): Tier {
  const order: Tier[] = ['champion', 'healthy', 'at_risk', 'critical'];
  const base = order[orgId % 4]!;
  if (monthsAgo === 0) return base;
  // Older periods drift one notch healthier or sicker for visible deltas
  const drift = (orgId + monthsAgo) % 3;
  if (drift === 0) return base;
  const idx = order.indexOf(base);
  const next = drift === 1 ? Math.max(0, idx - 1) : Math.min(order.length - 1, idx + 1);
  return order[next]!;
}

function computeHealthScore(signals: RawSignals): { score: number; tier: Tier } {
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
    userScore * 0.3 +
    adoptionScore * 0.25 +
    slaScore * 0.2 +
    errorScore * 0.15 +
    billingScore * 0.1;
  const rounded = Math.round(score * 10) / 10;
  const tier: Tier =
    rounded >= 80 ? 'champion' : rounded >= 60 ? 'healthy' : rounded >= 40 ? 'at_risk' : 'critical';
  return { score: rounded, tier };
}

function periodStart(monthsAgo: number, ref = new Date()): Date {
  return new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() - monthsAgo, 1));
}

function periodEnd(monthsAgo: number, ref = new Date()): Date {
  return new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() - monthsAgo + 1, 1));
}

async function buildSignalsFor(
  orgId: number,
  monthsAgo: number,
  totalMembers: number,
): Promise<RawSignals> {
  const tier = tierForOrgIdAndOffset(orgId, monthsAgo);
  const profile = TIER_PROFILES[tier]();
  const totalUsers = Math.max(totalMembers, tier === 'champion' ? 8 : tier === 'healthy' ? 5 : 3);
  const ratio = userRatioForTier(tier);
  return {
    ...profile,
    totalUsers,
    activeUsers: Math.max(1, Math.round(totalUsers * ratio)),
  };
}

async function seedOrg(orgId: number, _orgName: string) {
  const [memberRow] = await db
    .select({ total: count() })
    .from(orgMembersTable)
    .where(eq(orgMembersTable.orgId, orgId));
  const memberTotal = memberRow?.total ?? 0;

  // Compute oldest -> newest so we can chain deltas correctly.
  let prev: { score: number; activeUsers: number } | null = null;
  for (let m = 2; m >= 0; m--) {
    const start = periodStart(m);
    const end = periodEnd(m);
    const signals = await buildSignalsFor(orgId, m, memberTotal);
    const { score: healthScore, tier: healthTier } = computeHealthScore(signals);

    const sessionCount = Math.max(
      0,
      Math.round(
        signals.activeUsers *
          (healthTier === 'champion'
            ? 280
            : healthTier === 'healthy'
              ? 180
              : healthTier === 'at_risk'
                ? 90
                : 30),
      ),
    );
    const apiCallCount = Math.round(sessionCount * (3 + Math.random() * 4));
    const supportTicketVolume =
      healthTier === 'critical'
        ? Math.round(rand(8, 22))
        : healthTier === 'at_risk'
          ? Math.round(rand(3, 9))
          : Math.round(rand(0, 3));

    const healthScoreDelta = prev ? Math.round((healthScore - prev.score) * 10) / 10 : null;
    const activeUsersDelta = prev ? signals.activeUsers - prev.activeUsers : null;

    const signalBreakdown = {
      userActivity: {
        activeUsers: signals.activeUsers,
        totalUsers: signals.totalUsers,
        userRatio:
          signals.totalUsers > 0 ? Math.round((signals.activeUsers / signals.totalUsers) * 100) : 0,
      },
      featureAdoption: {
        used: Math.round((signals.featureAdoptionPct / 100) * 24),
        total: 24,
        pct: Math.round(signals.featureAdoptionPct),
      },
      support: {
        ticketVolume: supportTicketVolume,
        hardViolations: Math.round(supportTicketVolume * 0.4),
      },
      sla: { adherencePct: Math.round(signals.slaAdherencePct) },
      billing: { status: signals.billingStatus },
      errors: { ratePct: Math.round(signals.errorRatePct * 10) / 10, totalEvents: sessionCount },
      seedSource: 'seed-tenant-health-scorecards',
    };

    await db
      .insert(tenantHealthScorecardsTable)
      .values({
        orgId,
        computedAt: new Date(),
        periodStart: start,
        periodEnd: end,
        activeUsers: signals.activeUsers,
        totalUsers: signals.totalUsers,
        sessionCount,
        featureAdoptionPct: Math.round(signals.featureAdoptionPct),
        supportTicketVolume,
        slaAdherencePct: Math.round(signals.slaAdherencePct),
        billingStatus: signals.billingStatus,
        apiCallCount,
        errorRatePct: Math.round(signals.errorRatePct * 10) / 10,
        avgResponseTimeMs: Math.round(rand(80, 480)),
        healthScore,
        healthTier,
        healthScoreDelta,
        activeUsersDelta,
        signalBreakdown,
      })
      .onConflictDoUpdate({
        target: [tenantHealthScorecardsTable.orgId, tenantHealthScorecardsTable.periodStart],
        set: {
          computedAt: new Date(),
          activeUsers: signals.activeUsers,
          totalUsers: signals.totalUsers,
          sessionCount,
          featureAdoptionPct: Math.round(signals.featureAdoptionPct),
          supportTicketVolume,
          slaAdherencePct: Math.round(signals.slaAdherencePct),
          billingStatus: signals.billingStatus,
          apiCallCount,
          errorRatePct: Math.round(signals.errorRatePct * 10) / 10,
          avgResponseTimeMs: Math.round(rand(80, 480)),
          healthScore,
          healthTier,
          healthScoreDelta,
          activeUsersDelta,
          signalBreakdown,
        },
      });

    prev = { score: healthScore, activeUsers: signals.activeUsers };
  }
}

async function main() {
  const orgs = await db
    .select({ id: organizationsTable.id, name: organizationsTable.name })
    .from(organizationsTable);
  if (orgs.length === 0) {
    process.exit(0);
  }

  for (const org of orgs) {
    await seedOrg(org.id, org.name);
  }

  // Tally actual persisted tiers for the current period rather than the
  // deterministic base assignment, so the summary always matches the DB.
  const currentStart = periodStart(0);
  const persisted = await db
    .select({ tier: tenantHealthScorecardsTable.healthTier, cnt: count() })
    .from(tenantHealthScorecardsTable)
    .where(eq(tenantHealthScorecardsTable.periodStart, currentStart))
    .groupBy(tenantHealthScorecardsTable.healthTier);
  const tally: Record<Tier, number> = { critical: 0, at_risk: 0, healthy: 0, champion: 0 };
  for (const row of persisted) tally[row.tier as Tier] = row.cnt;
  process.exit(0);
}

main().catch((_err) => {
  process.exit(1);
});
