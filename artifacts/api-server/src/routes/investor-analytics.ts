/**
 * Investor Analytics — Business Metrics Engine
 * Computes MRR/ARR trajectory, customer metrics, churn, NRR, LTV/CAC,
 * funnel conversion, and cohort retention from billing + usage data.
 *
 * Metric definitions:
 *
 * MRR  — Sum of priceMonthly for all subscriptions that were active
 *         (status=active or trialing, or were not yet canceled) in a given month,
 *         derived from createdAt and canceledAt on the subscriptions table.
 *
 * ARR  — MRR × 12.
 *
 * MRR Growth — ((currentMRR - prevMonthMRR) / prevMonthMRR) × 100.
 *              Returns null when prevMonthMRR = 0 (no baseline to compare).
 *
 * Total Customers — Count of organizations with status = 'active'.
 *
 * Customer Growth — ((currentCount - prevMonthCount) / prevMonthCount) × 100.
 *                   Returns null when prevMonthCount = 0.
 *
 * Churn Rate — (subscriptions canceled in month / cumulative active customers
 *               at start of month) × 100.  Returns 0 when no customers exist.
 *
 * NRR (Net Revenue Retention) — (currentMRR / prevMonthMRR) × 100.
 *   This is a simplified single-period NRR proxy using plan revenue,
 *   not a full expansion/contraction/churn decomposition.
 *   Returns null when prevMonthMRR = 0 (no billing baseline).
 *
 * LTV — (avgMRR per customer) / avgMonthlyChurnRate.
 *   avgMonthlyChurnRate = (totalCanceledSubs / totalSubs) / 12.
 *   Returns null when either input is zero or no customers exist.
 *
 * CAC Proxy — Average priceMonthly of subscriptions created in the last 12 months.
 *   This is a billing-data proxy for acquisition cost, not a true marketing-spend CAC.
 *   Returns null when no recent subscriptions exist.
 *
 * LTV/CAC — LTV / CACProxy.  Returns null when either is null/zero.
 *
 * CAC Payback — CACProxy / avgMRRPerCustomer (months to recoup).
 *               Returns null when either is null/zero.
 *
 * Churned subscription — any subscription row where canceledAt IS NOT NULL.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import { validateQuery, listQuerySchema } from "../lib/validation.js";
import {
  db,
  subscriptionsTable,
  invoicesTable,
  billingPlansTable,
  organizationsTable,
  usersTable,
  revenueEventsTable,
  auditEventsTable,
  pageViewEventsTable,
} from "@szl-holdings/db";
import { desc, asc, and, gte, lte, eq, sql, or, isNotNull, inArray } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { handleRouteError, sendSuccess } from "../lib/api-response";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Platform-level roles only — these endpoints aggregate across ALL orgs (cross-tenant by design).
// Only global internal operators should access this data.
const ALLOWED_ROLES = ["admin", "ops"] as const;

function monthStart(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function monthKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
function addMonths(d: Date, n: number) {
  const next = new Date(d);
  next.setUTCMonth(next.getUTCMonth() + n);
  return next;
}

/** ISO week number (1-53) for a given date */
function isoWeek(d: Date): number {
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayOfWeek = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayOfWeek);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
function weekKey(d: Date): string {
  return `${d.getUTCFullYear()}-W${String(isoWeek(d)).padStart(2, "0")}`;
}
function addWeeks(d: Date, n: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + n * 7);
  return next;
}
function weekStart(d: Date): Date {
  const tmp = new Date(d);
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() - (day - 1));
  tmp.setUTCHours(0, 0, 0, 0);
  return tmp;
}

// ─────────────────────────────────────────────────────────────────────────────
// MRR / ARR + Customer + Churn + NRR Metrics
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/investor-analytics/metrics",
  authMiddleware(),
  requireRole(...ALLOWED_ROLES),
  async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const twelveMonthsAgo = new Date(now);
      twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 12);

      // ── Subscriptions ────────────────────────────────────────────────────
      const allSubs = await db
        .select({
          id: subscriptionsTable.id,
          orgId: subscriptionsTable.orgId,
          status: subscriptionsTable.status,
          planId: subscriptionsTable.planId,
          createdAt: subscriptionsTable.createdAt,
          canceledAt: subscriptionsTable.canceledAt,
          currentPeriodStart: subscriptionsTable.currentPeriodStart,
          currentPeriodEnd: subscriptionsTable.currentPeriodEnd,
          priceMonthly: billingPlansTable.priceMonthly,
          planName: billingPlansTable.name,
        })
        .from(subscriptionsTable)
        .leftJoin(billingPlansTable, eq(subscriptionsTable.planId, billingPlansTable.id))
        .orderBy(asc(subscriptionsTable.createdAt));

      // ── Revenue Events (paid invoices) ───────────────────────────────────
      const revenueEvents = await db
        .select({
          amount: revenueEventsTable.amount,
          occurredAt: revenueEventsTable.occurredAt,
          eventType: revenueEventsTable.eventType,
        })
        .from(revenueEventsTable)
        .where(
          and(
            eq(revenueEventsTable.eventType, "invoice.paid"),
            gte(revenueEventsTable.occurredAt, twelveMonthsAgo),
          )
        )
        .orderBy(asc(revenueEventsTable.occurredAt));

      // ── Organizations (customers) ────────────────────────────────────────
      const orgs = await db
        .select({
          id: organizationsTable.id,
          status: organizationsTable.status,
          plan: organizationsTable.plan,
          createdAt: organizationsTable.createdAt,
        })
        .from(organizationsTable)
        .orderBy(asc(organizationsTable.createdAt));

      // ── Users ────────────────────────────────────────────────────────────
      const userStats = await db
        .select({
          total: sql<number>`count(*)::int`,
          active30d: sql<number>`count(*) filter (where last_login_at >= now() - interval '30 days')::int`,
          active7d: sql<number>`count(*) filter (where last_login_at >= now() - interval '7 days')::int`,
          newThisMonth: sql<number>`count(*) filter (where created_at >= date_trunc('month', now()))::int`,
        })
        .from(usersTable);

      // ── Compute monthly time series ──────────────────────────────────────
      const months: string[] = [];
      let cur = monthStart(twelveMonthsAgo);
      while (cur <= monthStart(now)) {
        months.push(monthKey(cur));
        cur = addMonths(cur, 1);
      }

      // MRR time series: sum monthly plan revenue for active subs per month
      const mrrByMonth: Record<string, number> = {};
      months.forEach(m => { mrrByMonth[m] = 0; });

      // MRR history uses period dates, not current status — a canceled subscription
      // was still generating revenue in the months before it was canceled.
      for (const sub of allSubs) {
        const monthlyRevenue = sub.priceMonthly ? parseFloat(String(sub.priceMonthly)) : 0;
        if (monthlyRevenue <= 0) continue;
        const startMonth = monthKey(sub.createdAt || now);
        // Use canceledAt for historical end; for currently active, use "now" as end
        const endMonth = sub.canceledAt ? monthKey(sub.canceledAt) : monthKey(now);
        for (const m of months) {
          // Include in historical MRR based on period dates only, not current status
          if (m >= startMonth && m <= endMonth) {
            mrrByMonth[m] = (mrrByMonth[m] || 0) + monthlyRevenue;
          }
        }
      }

      // Revenue by month (actual invoices paid)
      const revenueByMonth: Record<string, number> = {};
      months.forEach(m => { revenueByMonth[m] = 0; });
      for (const ev of revenueEvents) {
        const m = monthKey(ev.occurredAt || now);
        if (m in revenueByMonth) {
          revenueByMonth[m] = (revenueByMonth[m] || 0) + parseFloat(String(ev.amount || 0));
        }
      }

      // Customer count by month (cumulative active orgs)
      const customersByMonth: Record<string, number> = {};
      months.forEach(m => { customersByMonth[m] = 0; });
      for (const org of orgs) {
        const joinMonth = monthKey(org.createdAt || now);
        for (const m of months) {
          if (m >= joinMonth && org.status !== "suspended") {
            customersByMonth[m] = (customersByMonth[m] || 0) + 1;
          }
        }
      }

      // New customers per month
      const newCustomersByMonth: Record<string, number> = {};
      months.forEach(m => { newCustomersByMonth[m] = 0; });
      for (const org of orgs) {
        const m = monthKey(org.createdAt || now);
        if (m in newCustomersByMonth) {
          newCustomersByMonth[m]++;
        }
      }

      // Churn: canceled subs per month / active subs at start of month
      const churnByMonth: Record<string, number> = {};
      months.forEach(m => { churnByMonth[m] = 0; });
      const canceledByMonth: Record<string, number> = {};
      months.forEach(m => { canceledByMonth[m] = 0; });
      for (const sub of allSubs) {
        if (sub.canceledAt) {
          const m = monthKey(sub.canceledAt);
          if (m in canceledByMonth) canceledByMonth[m]++;
        }
      }
      for (const m of months) {
        const active = customersByMonth[m] || 1;
        churnByMonth[m] = active > 0 ? parseFloat(((canceledByMonth[m] || 0) / active * 100).toFixed(2)) : 0;
      }

      // Current MRR & ARR
      const currentMrr = mrrByMonth[monthKey(now)] || 0;
      const currentArr = currentMrr * 12;

      // Previous month MRR for growth
      const prevMonth = monthKey(addMonths(now, -1));
      const prevMrr = mrrByMonth[prevMonth] || 0;
      // null = no prior billing baseline (not the same as 0% growth)
      const mrrGrowth: number | null = prevMrr > 0
        ? parseFloat(((currentMrr - prevMrr) / prevMrr * 100).toFixed(1))
        : null;

      // Total customers (active orgs)
      const totalCustomers = orgs.filter(o => o.status === "active").length;
      const prevMonthCustomers = customersByMonth[prevMonth] || 0;
      // null = no prior customer baseline
      const customerGrowth: number | null = prevMonthCustomers > 0
        ? parseFloat(((totalCustomers - prevMonthCustomers) / prevMonthCustomers * 100).toFixed(1))
        : null;

      // Churn rate (current month)
      const currentChurn = churnByMonth[monthKey(now)] || 0;

      // NRR (Net Revenue Retention): simplified single-period proxy.
      // = (currentMRR / prevMonthMRR) × 100.
      // null = no prior billing baseline (avoids a misleading "100%" when no data exists)
      const nrr: number | null = prevMrr > 0
        ? parseFloat(((currentMrr / prevMrr) * 100).toFixed(1))
        : null;

      // LTV: avgMrrPerCustomer / monthlyChurnRate (standard SaaS formula using real billing data)
      const avgMrrPerCustomer = totalCustomers > 0 ? currentMrr / totalCustomers : 0;
      // Avg monthly churn rate: total canceled subs / (total historical subs × 12 months)
      const totalCanceledSubs = allSubs.filter(s => s.canceledAt).length;
      const avgMonthlyChurnRate = allSubs.length > 0 ? (totalCanceledSubs / allSubs.length) / 12 : 0;
      const ltv = avgMrrPerCustomer > 0 && avgMonthlyChurnRate > 0
        ? parseFloat((avgMrrPerCustomer / avgMonthlyChurnRate).toFixed(2))
        : null;

      // CAC proxy: average plan price of subscriptions started in the last 12 months.
      // This is computable from billing data: represents the initial monthly revenue
      // per newly acquired customer — a standard billing-data-based CAC estimate.
      const recentSubs = allSubs.filter(s => {
        const m = monthKey(s.createdAt || now);
        return m >= monthKey(twelveMonthsAgo);
      });
      const cacProxy = recentSubs.length > 0
        ? parseFloat((recentSubs.reduce((sum, s) => sum + parseFloat(String(s.priceMonthly || 0)), 0) / recentSubs.length).toFixed(2))
        : null;

      const ltv_cac = ltv && cacProxy && cacProxy > 0
        ? parseFloat((ltv / cacProxy).toFixed(2))
        : null;
      const cacPayback = cacProxy && avgMrrPerCustomer > 0
        ? parseFloat((cacProxy / avgMrrPerCustomer).toFixed(1))
        : null;

      // Build time series array
      const timeSeries = months.map(m => ({
        month: m,
        mrr: Math.round((mrrByMonth[m] || 0) * 100) / 100,
        revenue: Math.round((revenueByMonth[m] || 0) * 100) / 100,
        customers: customersByMonth[m] || 0,
        newCustomers: newCustomersByMonth[m] || 0,
        churnRate: churnByMonth[m] || 0,
        canceledSubs: canceledByMonth[m] || 0,
      }));

      const result = {
        summary: {
          mrr: Math.round(currentMrr * 100) / 100,
          arr: Math.round(currentArr * 100) / 100,
          mrrGrowth,
          totalCustomers,
          customerGrowth,
          churnRate: currentChurn,
          nrr,
          cacPayback,
          ltvCacRatio: ltv_cac,
          activeUsers30d: userStats[0]?.active30d ?? 0,
          activeUsers7d: userStats[0]?.active7d ?? 0,
          totalUsers: userStats[0]?.total ?? 0,
          newUsersThisMonth: userStats[0]?.newThisMonth ?? 0,
        },
        timeSeries,
        activeSubscriptions: allSubs.filter(s => s.status === "active" || s.status === "trialing").length,
        planDistribution: Object.entries(
          allSubs.reduce((acc, s) => {
            if (s.status === "active" || s.status === "trialing") {
              const plan = s.planName || "unknown";
              acc[plan] = (acc[plan] || 0) + 1;
            }
            return acc;
          }, {} as Record<string, number>)
        ).map(([plan, count]) => ({ plan, count })),
      };

      logger.info({ mrr: result.summary.mrr, customers: result.summary.totalCustomers }, "[investor-analytics] Metrics computed");
      sendSuccess(res, result, 200, { computedAt: new Date().toISOString() });
    } catch (err) {
      handleRouteError(res, err, "Failed to compute investor metrics");
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Funnel Analytics
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/investor-analytics/funnel",
  authMiddleware(),
  requireRole(...ALLOWED_ROLES),
  async (_req: Request, res: Response) => {
    try {
      // Compute from real data: visitors (unique IPs) → signups → activation → trial → paid

      // Visitor count: distinct session IDs in page_view_events = real anonymous visitor sessions.
      // Falls back to audit-events unique IPs when no page_view_events exist (e.g. fresh env).
      const [pageViewStats] = await db
        .select({
          uniqueSessions: sql<number>`count(distinct session_id)::int`,
        })
        .from(pageViewEventsTable);

      const pageViewVisitors = pageViewStats?.uniqueSessions ?? 0;

      // Fallback: distinct IPs in audit events (authenticated sessions only)
      let auditVisitors = 0;
      if (pageViewVisitors === 0) {
        const [visitorStats] = await db
          .select({
            uniqueIps: sql<number>`count(distinct ip_address) filter (where ip_address is not null)::int`,
          })
          .from(auditEventsTable);
        auditVisitors = visitorStats?.uniqueIps ?? 0;
      }

      const [userCounts] = await db
        .select({
          total: sql<number>`count(*)::int`,
          // Activated = users who have ever logged in (lastLoginAt not null)
          activated: sql<number>`count(*) filter (where last_login_at is not null)::int`,
        })
        .from(usersTable);

      // Active paid subs (non-trialing), trialing subs separately
      const [subsStats] = await db
        .select({
          totalActiveOrTrialing: sql<number>`count(*)::int`,
          trialingOnly: sql<number>`count(*) filter (where status = 'trialing')::int`,
        })
        .from(subscriptionsTable)
        .where(or(eq(subscriptionsTable.status, "active"), eq(subscriptionsTable.status, "trialing")));

      // Resolve final visitor count: prefer page_view_events, fall back to audit_events IPs, then signups
      const visitors = pageViewVisitors > 0 ? pageViewVisitors : auditVisitors;
      const visitorDataSource = pageViewVisitors > 0 ? "visitor_events" : auditVisitors > 0 ? "audit_events" : "signups_fallback";

      const totalUsers = userCounts?.total ?? 0;
      const activatedCount = userCounts?.activated ?? 0;
      // Paid = active but NOT trialing
      const trialingCount = subsStats?.trialingOnly ?? 0;
      const paidPlusTrialing = subsStats?.totalActiveOrTrialing ?? 0;
      const paidCount = paidPlusTrialing - trialingCount;
      const trials = paidPlusTrialing; // all active/trialing subscriptions = in-trial or paid

      // Signups = all registered users (real DB count)
      const signups = totalUsers;
      // Funnel top: visitor count from page_view_events (or fallback), or signups if no visitor data
      const funnelTop = Math.max(visitors, signups);

      const stages = [
        { stage: "Visitor", count: funnelTop, rate: 100, dropOff: 0, dataSource: visitorDataSource },
        { stage: "Signup", count: signups, rate: parseFloat((signups / Math.max(funnelTop, 1) * 100).toFixed(1)), dropOff: funnelTop - signups },
        { stage: "Activated", count: activatedCount, rate: parseFloat((activatedCount / Math.max(signups, 1) * 100).toFixed(1)), dropOff: signups - activatedCount },
        { stage: "Trial / Active", count: trials, rate: parseFloat((trials / Math.max(activatedCount, 1) * 100).toFixed(1)), dropOff: activatedCount - trials },
        { stage: "Paid", count: paidCount, rate: parseFloat((paidCount / Math.max(trials, 1) * 100).toFixed(1)), dropOff: trials - paidCount },
      ];

      // Monthly funnel for last 6 months — all from real DB data
      const monthlyFunnel: Array<{ month: string; signups: number; activations: number; paid: number }> = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setUTCMonth(d.getUTCMonth() - i);
        const start = monthStart(d);
        const end = addMonths(start, 1);

        const [monthUsers] = await db
          .select({
            signupsCount: sql<number>`count(*)::int`,
            activatedCount: sql<number>`count(*) filter (where last_login_at is not null)::int`,
          })
          .from(usersTable)
          .where(and(gte(usersTable.createdAt, start), lte(usersTable.createdAt, end)));

        const [monthPaid] = await db
          .select({ count: sql<number>`count(*) filter (where status = 'active' and status != 'trialing')::int` })
          .from(subscriptionsTable)
          .where(and(gte(subscriptionsTable.createdAt, start), lte(subscriptionsTable.createdAt, end)));

        monthlyFunnel.push({
          month: monthKey(d),
          signups: monthUsers?.signupsCount ?? 0,
          activations: monthUsers?.activatedCount ?? 0,
          paid: monthPaid?.count ?? 0,
        });
      }

      sendSuccess(res, {
        funnel: {
          // visitor-to-paid conversion rate using real audit event IPs as visitor proxy
          overallConversionRate: parseFloat((paidCount / Math.max(funnelTop, 1) * 100).toFixed(2)),
          stages,
        },
        monthlyFunnel,
      }, 200, { computedAt: new Date().toISOString() });
    } catch (err) {
      handleRouteError(res, err, "Failed to compute funnel analytics");
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Cohort Retention Analysis
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/investor-analytics/cohort",
  authMiddleware(),
  requireRole(...ALLOWED_ROLES),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const granularity = (req.query["granularity"] as string) || "month";
      const periods = Math.min(parseInt(req.query["periods"] as string ?? "6", 10), 12);

      const isWeekly = granularity === "week";
      const now = new Date();

      // Step 1: Get all users to build cohorts
      const users = await db
        .select({
          id: usersTable.id,
          createdAt: usersTable.createdAt,
        })
        .from(usersTable)
        .orderBy(asc(usersTable.createdAt));

      // Step 2: Build cohorts using the requested granularity key
      const cohorts: Record<string, { userIds: number[]; cohortKey: string; cohortDate: Date }> = {};
      for (const user of users) {
        if (!user.id || !user.createdAt) continue;
        const key = isWeekly
          ? weekKey(user.createdAt)
          : monthKey(user.createdAt);

        if (!cohorts[key]) {
          // Derive cohort start date from the key
          let cohortDate: Date;
          if (isWeekly) {
            const [y, w] = key.split("-W").map(Number);
            const janFour = new Date(Date.UTC(y!, 0, 4));
            const dayOfWeek = janFour.getUTCDay() || 7;
            cohortDate = new Date(janFour.getTime() - (dayOfWeek - 1) * 86400000 + ((w! - 1) * 7) * 86400000);
          } else {
            cohortDate = new Date(key + "-01T00:00:00Z");
          }
          cohorts[key] = { userIds: [], cohortKey: key, cohortDate };
        }
        cohorts[key].userIds.push(user.id);
      }

      // Step 3: Restrict to the most-recent N cohorts with enough history for at least 1 period
      const cohortKeys = Object.keys(cohorts).sort().slice(-periods);

      // Step 4: Fetch audit events for ALL cohort users as activity signal.
      // Using audit events (not lastLoginAt snapshot) gives event-per-period accuracy —
      // a user can show up in any period where they had activity, not just their most-recent.
      const allCohortUserIds = cohortKeys.flatMap(ck => cohorts[ck]!.userIds);
      let userActivityByPeriod = new Map<number, Set<string>>(); // userId → Set<periodKey>

      if (allCohortUserIds.length > 0) {
        // Earliest cohort date to bound the query range
        const earliestCohortKey = cohortKeys[0]!;
        const earliestCohort = cohorts[earliestCohortKey]!;
        const queryStart = isWeekly ? addWeeks(earliestCohort.cohortDate, 1) : addMonths(earliestCohort.cohortDate, 1);

        const BATCH = 200; // Avoid inArray limit issues
        for (let i = 0; i < allCohortUserIds.length; i += BATCH) {
          const batch = allCohortUserIds.slice(i, i + BATCH);
          const events = await db
            .select({ userId: auditEventsTable.userId, createdAt: auditEventsTable.createdAt })
            .from(auditEventsTable)
            .where(
              and(
                inArray(auditEventsTable.userId, batch),
                gte(auditEventsTable.createdAt, queryStart),
                lte(auditEventsTable.createdAt, now),
              )
            );

          for (const ev of events) {
            if (!ev.userId || !ev.createdAt) continue;
            const pk = isWeekly ? weekKey(ev.createdAt) : monthKey(ev.createdAt);
            if (!userActivityByPeriod.has(ev.userId)) userActivityByPeriod.set(ev.userId, new Set());
            userActivityByPeriod.get(ev.userId)!.add(pk);
          }
        }
      }

      // Step 5: Compute retention matrix.
      // Period 0 = signup period (always 100%).
      // Period p (p ≥ 1) = the p-th period AFTER signup: [cohortDate + p, cohortDate + p+1).
      // A user is retained in period p if they had ≥1 audit event in that period.
      const retentionMatrix: Array<{
        cohort: string;
        size: number;
        retention: number[];
      }> = [];

      for (const ck of cohortKeys) {
        const cohort = cohorts[ck];
        if (!cohort) continue;

        const retention: number[] = [100]; // period 0 = signup cohort = 100%

        for (let p = 1; p <= periods; p++) {
          // Period p starts at cohortDate + p periods (NOT p-1 — that was the off-by-one bug)
          const periodStart = isWeekly ? addWeeks(cohort.cohortDate, p) : addMonths(cohort.cohortDate, p);
          const periodEnd = isWeekly ? addWeeks(cohort.cohortDate, p + 1) : addMonths(cohort.cohortDate, p + 1);
          if (periodEnd > now) break; // don't include incomplete future periods

          // Period key for the interval starting at periodStart
          const pk = isWeekly ? weekKey(periodStart) : monthKey(periodStart);

          const activeInPeriod = cohort.userIds.filter(uid =>
            userActivityByPeriod.get(uid)?.has(pk)
          ).length;

          const rate = cohort.userIds.length > 0
            ? parseFloat((activeInPeriod / cohort.userIds.length * 100).toFixed(1))
            : 0;
          retention.push(rate);
        }

        retentionMatrix.push({
          cohort: ck,
          size: cohort.userIds.length,
          retention,
        });
      }

      // Average retention curve
      const maxPeriods = Math.max(0, ...retentionMatrix.map(c => c.retention.length));
      const avgRetention: number[] = [];
      for (let p = 0; p < maxPeriods; p++) {
        const values = retentionMatrix
          .filter(c => c.retention[p] !== undefined)
          .map(c => c.retention[p] ?? 0);
        avgRetention.push(
          values.length > 0
            ? parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1))
            : 0
        );
      }

      const periodUnit = isWeekly ? "Week" : "Month";
      sendSuccess(res, {
        granularity,
        cohorts: retentionMatrix,
        averageRetentionCurve: avgRetention,
        periodLabels: avgRetention.map((_, i) => (i === 0 ? `${periodUnit} 0` : `${periodUnit} ${i}`)),
      }, 200, { computedAt: new Date().toISOString() });
    } catch (err) {
      handleRouteError(res, err, "Failed to compute cohort retention");
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Audit Change Diff — before/after values for audit events
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/investor-analytics/audit-diffs",
  authMiddleware(),
  requireRole("admin", "ops", "compliance"),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { limit = "50", offset = "0", entityType, dateFrom, dateTo } = req.query as Record<string, string>;

      const conditions = [isNotNull(auditEventsTable.oldValues)];
      if (entityType) conditions.push(eq(auditEventsTable.entityType, entityType));
      if (dateFrom) conditions.push(gte(auditEventsTable.createdAt, new Date(dateFrom)));
      if (dateTo) conditions.push(lte(auditEventsTable.createdAt, new Date(dateTo)));

      const rows = await db
        .select({
          id: auditEventsTable.id,
          action: auditEventsTable.action,
          entityType: auditEventsTable.entityType,
          entityId: auditEventsTable.entityId,
          oldValues: auditEventsTable.oldValues,
          newValues: auditEventsTable.newValues,
          userEmail: usersTable.email,
          userName: usersTable.displayName,
          createdAt: auditEventsTable.createdAt,
        })
        .from(auditEventsTable)
        .leftJoin(usersTable, eq(auditEventsTable.userId, usersTable.id))
        .where(and(...conditions))
        .orderBy(desc(auditEventsTable.createdAt))
        .limit(Math.min(parseInt(limit, 10), 200))
        .offset(parseInt(offset, 10));

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditEventsTable)
        .where(and(...conditions));

      sendSuccess(res, { diffs: rows }, 200, { total: count });
    } catch (err) {
      handleRouteError(res, err, "Failed to load audit diffs");
    }
  }
);

export default router;
