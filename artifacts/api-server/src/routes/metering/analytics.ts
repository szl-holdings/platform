import {
  db,
  invoicesTable,
  meteringEventsTable,
  organizationsTable,
  subscriptionsTable,
} from '@szl-holdings/db';
import {
  and,
  eq,
  gte,
  lte,
  sql,
} from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import {
  handleRouteError,
  sendSuccess,
} from '../../lib/api-response';
import { listQuerySchema, validateQuery } from '../../lib/validation.js';
import { authMiddleware, requireRole } from '../../middlewares/auth';
import { periodBounds } from './shared';

const router: IRouter = Router();
const _ADMIN_ROLES = ['admin', 'super_admin', 'ops'] as const;
const READ_ROLES = ['admin', 'super_admin', 'ops', 'analyst'] as const;

// ─────────────────────────────────────────────────────────────────────────────
// 8. BILLING ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/metering/analytics/overview',
  authMiddleware(),
  requireRole(...READ_ROLES),
  async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const { start: monthStart } = periodBounds('month', now);
      const { start: prevMonthStart, end: prevMonthEnd } = periodBounds(
        'month',
        new Date(now.getFullYear(), now.getMonth() - 1, 1),
      );
      const { start: yearStart } = periodBounds('year', now);

      const [invoiceStats] = await db
        .select({
          totalRevenue: sql<string>`COALESCE(SUM(${invoicesTable.amount}::numeric), 0)`,
          invoiceCount: sql<number>`COUNT(*)::int`,
          avgInvoice: sql<string>`COALESCE(AVG(${invoicesTable.amount}::numeric), 0)`,
        })
        .from(invoicesTable)
        .where(eq(invoicesTable.status, 'paid'));

      const [mrrRow] = await db
        .select({
          mrr: sql<string>`COALESCE(SUM(${invoicesTable.amount}::numeric), 0)`,
        })
        .from(invoicesTable)
        .where(and(eq(invoicesTable.status, 'paid'), gte(invoicesTable.createdAt, monthStart)));

      const [prevMrrRow] = await db
        .select({
          mrr: sql<string>`COALESCE(SUM(${invoicesTable.amount}::numeric), 0)`,
        })
        .from(invoicesTable)
        .where(
          and(
            eq(invoicesTable.status, 'paid'),
            gte(invoicesTable.createdAt, prevMonthStart),
            lte(invoicesTable.createdAt, prevMonthEnd),
          ),
        );

      const [arrRow] = await db
        .select({
          arr: sql<string>`COALESCE(SUM(${invoicesTable.amount}::numeric), 0)`,
        })
        .from(invoicesTable)
        .where(and(eq(invoicesTable.status, 'paid'), gte(invoicesTable.createdAt, yearStart)));

      const [activeSubsRow] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.status, 'active'));

      const [canceledRow] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(subscriptionsTable)
        .where(
          and(
            eq(subscriptionsTable.status, 'canceled'),
            gte(subscriptionsTable.canceledAt!, monthStart),
          ),
        );

      const currentMrr = parseFloat(mrrRow?.mrr ?? '0');
      const prevMrr = parseFloat(prevMrrRow?.mrr ?? '0');
      const mrrGrowth =
        prevMrr > 0 ? Math.round(((currentMrr - prevMrr) / prevMrr) * 10000) / 100 : null;

      const eventVolumeRows = await db
        .select({
          featureKey: meteringEventsTable.featureKey,
          product: meteringEventsTable.product,
          totalQty: sql<string>`SUM(${meteringEventsTable.quantity}::numeric)`,
          eventCount: sql<number>`COUNT(*)::int`,
        })
        .from(meteringEventsTable)
        .where(gte(meteringEventsTable.occurredAt, monthStart))
        .groupBy(meteringEventsTable.featureKey, meteringEventsTable.product)
        .orderBy(sql`COUNT(*) DESC`)
        .limit(20);

      sendSuccess(res, {
        mrr: {
          current: Math.round(currentMrr * 100) / 100,
          previous: Math.round(prevMrr * 100) / 100,
          growth: mrrGrowth,
        },
        arr: Math.round(parseFloat(arrRow?.arr ?? '0') * 100) / 100,
        revenue: {
          total: Math.round(parseFloat(invoiceStats?.totalRevenue ?? '0') * 100) / 100,
          invoiceCount: invoiceStats?.invoiceCount ?? 0,
          avgInvoice: Math.round(parseFloat(invoiceStats?.avgInvoice ?? '0') * 100) / 100,
        },
        subscriptions: {
          active: activeSubsRow?.count ?? 0,
          canceledThisMonth: canceledRow?.count ?? 0,
        },
        topFeaturesByVolume: eventVolumeRows.map((r) => ({
          featureKey: r.featureKey,
          product: r.product,
          totalQuantity: parseFloat(r.totalQty),
          eventCount: r.eventCount,
        })),
        asOf: now.toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get billing analytics');
    }
  },
);

router.get(
  '/metering/analytics/revenue-trend',
  authMiddleware(),
  requireRole(...READ_ROLES),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const months = Math.min(parseInt(String(req.query.months ?? '12'), 10), 24);
      const now = new Date();

      const trend: Array<{
        year: number;
        month: number;
        label: string;
        revenue: number;
        invoiceCount: number;
      }> = [];

      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const { start, end } = periodBounds('month', d);

        const [row] = await db
          .select({
            revenue: sql<string>`COALESCE(SUM(${invoicesTable.amount}::numeric), 0)`,
            invoiceCount: sql<number>`COUNT(*)::int`,
          })
          .from(invoicesTable)
          .where(
            and(
              eq(invoicesTable.status, 'paid'),
              gte(invoicesTable.createdAt, start),
              lte(invoicesTable.createdAt, end),
            ),
          );

        trend.push({
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          label: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
          revenue: Math.round(parseFloat(row?.revenue ?? '0') * 100) / 100,
          invoiceCount: row?.invoiceCount ?? 0,
        });
      }

      sendSuccess(res, { months, trend });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get revenue trend');
    }
  },
);

router.get(
  '/metering/analytics/tenant-leaderboard',
  authMiddleware(),
  requireRole(...READ_ROLES),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(String(req.query.limit ?? '20'), 10), 100);
      const since = req.query.since
        ? new Date(req.query.since as string)
        : new Date(new Date().getFullYear(), 0, 1);

      const rows = await db
        .select({
          orgId: invoicesTable.orgId,
          orgName: organizationsTable.name,
          orgSlug: organizationsTable.slug,
          totalRevenue: sql<string>`SUM(${invoicesTable.amount}::numeric)`,
          invoiceCount: sql<number>`COUNT(*)::int`,
        })
        .from(invoicesTable)
        .innerJoin(organizationsTable, eq(invoicesTable.orgId, organizationsTable.id))
        .where(and(eq(invoicesTable.status, 'paid'), gte(invoicesTable.createdAt, since)))
        .groupBy(invoicesTable.orgId, organizationsTable.name, organizationsTable.slug)
        .orderBy(sql`SUM(${invoicesTable.amount}::numeric) DESC`)
        .limit(limit);

      sendSuccess(res, {
        since: since.toISOString(),
        tenants: rows.map((r) => ({
          orgId: r.orgId,
          orgName: r.orgName,
          orgSlug: r.orgSlug,
          totalRevenue: Math.round(parseFloat(r.totalRevenue) * 100) / 100,
          invoiceCount: r.invoiceCount,
        })),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get tenant leaderboard');
    }
  },
);

router.get(
  '/metering/analytics/cohort',
  authMiddleware(),
  requireRole(...READ_ROLES),
  async (_req: Request, res: Response) => {
    try {
      const rows = await db
        .select({
          orgId: subscriptionsTable.orgId,
          orgName: organizationsTable.name,
          cohortMonth: sql<string>`TO_CHAR(${subscriptionsTable.createdAt}, 'YYYY-MM')`,
          status: subscriptionsTable.status,
          monthsActive: sql<number>`
            EXTRACT(YEAR FROM AGE(NOW(), ${subscriptionsTable.createdAt}))::int * 12 +
            EXTRACT(MONTH FROM AGE(NOW(), ${subscriptionsTable.createdAt}))::int
          `,
        })
        .from(subscriptionsTable)
        .innerJoin(organizationsTable, eq(subscriptionsTable.orgId, organizationsTable.id))
        .orderBy(sql`TO_CHAR(${subscriptionsTable.createdAt}, 'YYYY-MM')`);

      const cohorts = rows.reduce<
        Record<
          string,
          {
            cohortMonth: string;
            total: number;
            active: number;
            churned: number;
            avgMonthsActive: number;
            tenants: Array<{
              orgId: number;
              orgName: string;
              status: string;
              monthsActive: number;
            }>;
          }
        >
      >((acc, r) => {
        const cm = r.cohortMonth;
        if (!acc[cm]) {
          acc[cm] = {
            cohortMonth: cm,
            total: 0,
            active: 0,
            churned: 0,
            avgMonthsActive: 0,
            tenants: [],
          };
        }
        acc[cm]!.total++;
        if (r.status === 'active') acc[cm]!.active++;
        if (r.status === 'canceled') acc[cm]!.churned++;
        acc[cm]?.tenants.push({
          orgId: r.orgId,
          orgName: r.orgName,
          status: r.status,
          monthsActive: r.monthsActive,
        });
        return acc;
      }, {});

      for (const cohort of Object.values(cohorts)) {
        cohort.avgMonthsActive =
          cohort.tenants.length > 0
            ? Math.round(
                (cohort.tenants.reduce((s, t) => s + t.monthsActive, 0) / cohort.tenants.length) *
                  10,
              ) / 10
            : 0;
      }

      sendSuccess(res, {
        cohorts: Object.values(cohorts).sort((a, b) => a.cohortMonth.localeCompare(b.cohortMonth)),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get cohort analysis');
    }
  },
);

export function register(r: IRouter): void {
  r.use(router);
}
