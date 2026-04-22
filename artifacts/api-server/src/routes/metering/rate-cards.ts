import { bodyShape } from '@szl-holdings/contracts/common';
import {
  db,
  meteringEventsTable,
  organizationsTable,
  quotaConfigsTable,
  quotaViolationsTable,
  rateCardAssignmentsTable,
  rateCardsTable,
  rateCardTiersTable,
  subscriptionsTable,
  usageAggregatesTable,
} from '@szl-holdings/db';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  lte,
  sql,
} from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendNotFound,
  sendSuccess,
} from '../../lib/api-response';
import { listQuerySchema, validateBody, validateQuery } from '../../lib/validation';
import { authMiddleware, parseIdParam, requireRole } from '../../middlewares/auth';
import { assertTenantAccess, } from '../../middlewares/tenant-scope';
import { periodBounds } from './shared';

const router: IRouter = Router();
const ADMIN_ROLES = ['admin', 'super_admin', 'ops'] as const;
const READ_ROLES = ['admin', 'super_admin', 'ops', 'analyst'] as const;

// ─────────────────────────────────────────────────────────────────────────────
// 2. USAGE AGGREGATION & PROJECTIONS
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/metering/usage',
  authMiddleware(),
  requireRole(...READ_ROLES),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const period = (req.query.period as string) || 'month';
      const product = req.query.product as string | undefined;
      const now = new Date();
      const { start, end } = periodBounds(period as 'month' | 'day' | 'year', now);

      const conditions = [
        gte(usageAggregatesTable.periodStart, start),
        lte(usageAggregatesTable.periodStart, end),
        eq(
          usageAggregatesTable.periodType,
          period === 'year' ? 'month' : (period as 'day' | 'month' | 'billing_cycle'),
        ),
      ];
      if (product) conditions.push(eq(usageAggregatesTable.product, product));

      const rows = await db
        .select({
          orgId: usageAggregatesTable.orgId,
          featureKey: usageAggregatesTable.featureKey,
          product: usageAggregatesTable.product,
          totalQuantity: usageAggregatesTable.totalQuantity,
          eventCount: usageAggregatesTable.eventCount,
          uniqueUsers: usageAggregatesTable.uniqueUsers,
          periodStart: usageAggregatesTable.periodStart,
          periodEnd: usageAggregatesTable.periodEnd,
        })
        .from(usageAggregatesTable)
        .where(and(...conditions))
        .orderBy(desc(usageAggregatesTable.totalQuantity));

      sendSuccess(res, { period, periodStart: start, periodEnd: end, usage: rows });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get usage aggregates');
    }
  },
);

router.get(
  '/metering/usage/:orgId',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = parseIdParam(req.params.orgId);
      if (!assertTenantAccess(req, res, orgId)) return;

      const period = (req.query.period as string) || 'month';
      const now = new Date();
      const { start, end } = periodBounds(period as 'month' | 'day' | 'year', now);

      const aggs = await db
        .select()
        .from(usageAggregatesTable)
        .where(
          and(
            eq(usageAggregatesTable.orgId, orgId),
            gte(usageAggregatesTable.periodStart, start),
            eq(
              usageAggregatesTable.periodType,
              period === 'year' ? 'month' : (period as 'day' | 'month' | 'billing_cycle'),
            ),
          ),
        )
        .orderBy(desc(usageAggregatesTable.totalQuantity));

      const quotas = await db
        .select()
        .from(quotaConfigsTable)
        .where(and(eq(quotaConfigsTable.orgId, orgId), eq(quotaConfigsTable.isActive, true)));

      const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / 86_400_000);
      const daysElapsed = Math.ceil((now.getTime() - start.getTime()) / 86_400_000);
      const projectionFactor = daysElapsed > 0 ? daysInPeriod / daysElapsed : 1;

      const enriched = aggs.map((a) => {
        const quota = quotas.find((q) => q.featureKey === a.featureKey);
        const qty = parseFloat(a.totalQuantity);
        const projected = Math.round(qty * projectionFactor);
        const softPct = quota?.softLimit ? (qty / parseFloat(quota.softLimit)) * 100 : null;
        const hardPct = quota?.hardLimit ? (qty / parseFloat(quota.hardLimit)) * 100 : null;

        return {
          ...a,
          projected,
          softLimitPct: softPct ? Math.round(softPct) : null,
          hardLimitPct: hardPct ? Math.round(hardPct) : null,
          softLimit: quota?.softLimit ?? null,
          hardLimit: quota?.hardLimit ?? null,
          softLimitAction: quota?.softLimitAction ?? null,
          hardLimitAction: quota?.hardLimitAction ?? null,
          alert:
            hardPct !== null && hardPct >= 80
              ? hardPct >= 100
                ? 'exceeded'
                : hardPct >= 90
                  ? 'critical'
                  : 'warning'
              : softPct !== null && softPct >= 80
                ? softPct >= 100
                  ? 'soft_exceeded'
                  : 'approaching'
                : null,
        };
      });

      sendSuccess(res, {
        orgId,
        period,
        periodStart: start,
        periodEnd: end,
        daysElapsed,
        daysInPeriod,
        projectionFactor: Math.round(projectionFactor * 100) / 100,
        usage: enriched,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get tenant usage');
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. RATE CARDS
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/metering/rate-cards',
  authMiddleware(),
  requireRole(...READ_ROLES),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const featureKey = req.query.featureKey as string | undefined;
      const product = req.query.product as string | undefined;
      const activeOnly = req.query.active !== 'false';

      const conditions = [];
      if (featureKey) conditions.push(eq(rateCardsTable.featureKey, featureKey));
      if (product) conditions.push(eq(rateCardsTable.product, product));
      if (activeOnly) conditions.push(eq(rateCardsTable.isActive, true));

      const cards = await db
        .select()
        .from(rateCardsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(rateCardsTable.name));

      const cardIds = cards.map((c) => c.id);
      const tiers =
        cardIds.length > 0
          ? await db
              .select()
              .from(rateCardTiersTable)
              .where(inArray(rateCardTiersTable.rateCardId, cardIds))
              .orderBy(asc(rateCardTiersTable.order))
          : [];

      const tiersByCard = tiers.reduce<Record<number, typeof tiers>>((acc, t) => {
        (acc[t.rateCardId] ??= []).push(t);
        return acc;
      }, {});

      sendSuccess(
        res,
        cards.map((c) => ({ ...c, tiers: tiersByCard[c.id] ?? [] })),
      );
    } catch (err) {
      handleRouteError(res, err, 'Failed to list rate cards');
    }
  },
);

router.get(
  '/metering/rate-cards/:id',
  authMiddleware(),
  requireRole(...READ_ROLES),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const [card] = await db.select().from(rateCardsTable).where(eq(rateCardsTable.id, id));
      if (!card) {
        sendNotFound(res, 'Rate card');
        return;
      }

      const tiers = await db
        .select()
        .from(rateCardTiersTable)
        .where(eq(rateCardTiersTable.rateCardId, id))
        .orderBy(asc(rateCardTiersTable.order));

      sendSuccess(res, { ...card, tiers });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get rate card');
    }
  },
);

router.post(
  '/metering/rate-cards',
  authMiddleware(),
  requireRole(...ADMIN_ROLES),
  validateBody(
    bodyShape({
      billingInterval: z.unknown().optional(),
      currency: z.unknown().optional(),
      description: z.unknown().optional(),
      featureKey: z.unknown().optional(),
      flatAmount: z.unknown().optional(),
      freeUnits: z.unknown().optional(),
      name: z.unknown().optional(),
      pricingModel: z.unknown().optional(),
      product: z.unknown().optional(),
      slug: z.unknown().optional(),
      tiers: z.unknown().optional(),
      unitAmount: z.unknown().optional(),
      unitLabel: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { tiers, ...body } = req.body as {
        name: string;
        slug: string;
        featureKey: string;
        product?: string;
        pricingModel: string;
        unitLabel?: string;
        flatAmount?: string;
        unitAmount?: string;
        freeUnits?: number;
        billingInterval?: string;
        currency?: string;
        description?: string;
        tiers?: Array<{
          fromUnit: number;
          toUnit?: number;
          unitAmount: string;
          flatAmount?: string;
          order: number;
        }>;
      };

      if (!body.name || !body.slug || !body.featureKey || !body.pricingModel) {
        sendBadRequest(res, 'name, slug, featureKey, and pricingModel are required');
        return;
      }

      const [card] = await db
        .insert(rateCardsTable)
        .values({
          name: body.name,
          slug: body.slug,
          featureKey: body.featureKey,
          product: body.product ?? 'platform',
          pricingModel: body.pricingModel as (typeof rateCardsTable.$inferInsert)['pricingModel'],
          unitLabel: body.unitLabel ?? 'unit',
          flatAmount: body.flatAmount ?? null,
          unitAmount: body.unitAmount ?? null,
          freeUnits: body.freeUnits ?? 0,
          billingInterval: (body.billingInterval ??
            'monthly') as (typeof rateCardsTable.$inferInsert)['billingInterval'],
          currency: body.currency ?? 'usd',
          description: body.description ?? null,
        })
        .returning();

      if (tiers && tiers.length > 0 && card) {
        await db
          .insert(rateCardTiersTable)
          .values(tiers.map((t) => ({ ...t, rateCardId: card.id })));
      }

      sendSuccess(res, card, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create rate card');
    }
  },
);

router.put(
  '/metering/rate-cards/:id',
  authMiddleware(),
  requireRole(...ADMIN_ROLES),
  validateBody(
    bodyShape({
      tiers: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const { tiers, ...updates } = req.body as Record<string, unknown> & {
        tiers?: Array<{
          fromUnit: number;
          toUnit?: number;
          unitAmount: string;
          flatAmount?: string;
          order: number;
        }>;
      };

      const [existing] = await db.select().from(rateCardsTable).where(eq(rateCardsTable.id, id));
      if (!existing) {
        sendNotFound(res, 'Rate card');
        return;
      }

      const [updated] = await db
        .update(rateCardsTable)
        .set({ ...(updates as Partial<typeof rateCardsTable.$inferInsert>), updatedAt: new Date() })
        .where(eq(rateCardsTable.id, id))
        .returning();

      if (tiers) {
        await db.delete(rateCardTiersTable).where(eq(rateCardTiersTable.rateCardId, id));
        if (tiers.length > 0) {
          await db.insert(rateCardTiersTable).values(tiers.map((t) => ({ ...t, rateCardId: id })));
        }
      }

      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update rate card');
    }
  },
);

router.post(
  '/metering/rate-cards/:id/assign',
  authMiddleware(),
  requireRole(...ADMIN_ROLES),
  validateBody(
    bodyShape({
      assignedBy: z.unknown().optional(),
      expiresAt: z.unknown().optional(),
      featureKey: z.unknown().optional(),
      notes: z.unknown().optional(),
      orgId: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const rateCardId = parseIdParam(req.params.id);
      const { orgId, featureKey, expiresAt, notes, assignedBy } = req.body as {
        orgId: number;
        featureKey: string;
        expiresAt?: string;
        notes?: string;
        assignedBy?: string;
      };

      if (!orgId || !featureKey) {
        sendBadRequest(res, 'orgId and featureKey are required');
        return;
      }

      await db
        .update(rateCardAssignmentsTable)
        .set({ isActive: false })
        .where(
          and(
            eq(rateCardAssignmentsTable.orgId, orgId),
            eq(rateCardAssignmentsTable.featureKey, featureKey),
            eq(rateCardAssignmentsTable.isActive, true),
          ),
        );

      const [assignment] = await db
        .insert(rateCardAssignmentsTable)
        .values({
          orgId,
          rateCardId,
          featureKey,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          notes: notes ?? null,
          assignedBy: assignedBy ?? null,
        })
        .returning();

      sendSuccess(res, assignment, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to assign rate card');
    }
  },
);

router.get(
  '/metering/rate-cards/assignments/:orgId',
  authMiddleware(),
  requireRole(...READ_ROLES),
  async (req: Request, res: Response) => {
    try {
      const orgId = parseIdParam(req.params.orgId);
      if (!assertTenantAccess(req, res, orgId)) return;
      const assignments = await db
        .select({
          assignment: rateCardAssignmentsTable,
          card: rateCardsTable,
        })
        .from(rateCardAssignmentsTable)
        .innerJoin(rateCardsTable, eq(rateCardAssignmentsTable.rateCardId, rateCardsTable.id))
        .where(
          and(
            eq(rateCardAssignmentsTable.orgId, orgId),
            eq(rateCardAssignmentsTable.isActive, true),
          ),
        );

      sendSuccess(res, assignments);
    } catch (err) {
      handleRouteError(res, err, 'Failed to get rate card assignments');
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. REAL-TIME USAGE DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

router.get('/metering/dashboard/:orgId', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const orgId = parseIdParam(req.params.orgId);
    if (!assertTenantAccess(req, res, orgId)) return;

    const now = new Date();
    const { start: monthStart, end: monthEnd } = periodBounds('month', now);
    const { start: dayStart } = periodBounds('day', now);

    const [org] = await db
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, orgId))
      .limit(1);

    if (!org) {
      sendNotFound(res, 'Organization');
      return;
    }

    const [sub] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.orgId, orgId))
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(1);

    const monthlyAggs = await db
      .select()
      .from(usageAggregatesTable)
      .where(
        and(
          eq(usageAggregatesTable.orgId, orgId),
          eq(usageAggregatesTable.periodType, 'month'),
          eq(usageAggregatesTable.periodStart, monthStart),
        ),
      )
      .orderBy(desc(usageAggregatesTable.totalQuantity));

    const dailyUsage = await db
      .select({
        featureKey: meteringEventsTable.featureKey,
        qty: sql<string>`SUM(${meteringEventsTable.quantity}::numeric)`,
      })
      .from(meteringEventsTable)
      .where(
        and(eq(meteringEventsTable.orgId, orgId), gte(meteringEventsTable.occurredAt, dayStart)),
      )
      .groupBy(meteringEventsTable.featureKey);

    const quotas = await db
      .select()
      .from(quotaConfigsTable)
      .where(and(eq(quotaConfigsTable.orgId, orgId), eq(quotaConfigsTable.isActive, true)));

    const recentViolations = await db
      .select()
      .from(quotaViolationsTable)
      .where(
        and(
          eq(quotaViolationsTable.orgId, orgId),
          gte(quotaViolationsTable.occurredAt, monthStart),
        ),
      )
      .orderBy(desc(quotaViolationsTable.occurredAt))
      .limit(20);

    const daysInMonth = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / 86_400_000);
    const daysElapsed = Math.max(1, Math.ceil((now.getTime() - monthStart.getTime()) / 86_400_000));
    const projFactor = daysInMonth / daysElapsed;

    const usageByFeature = monthlyAggs.map((a) => {
      const quota = quotas.find((q) => q.featureKey === a.featureKey);
      const qty = parseFloat(a.totalQuantity);
      const projected = Math.round(qty * projFactor);
      const hardPct = quota?.hardLimit ? (qty / parseFloat(quota.hardLimit)) * 100 : null;
      const softPct = quota?.softLimit ? (qty / parseFloat(quota.softLimit)) * 100 : null;

      return {
        featureKey: a.featureKey,
        product: a.product,
        currentPeriodTotal: qty,
        eventCount: a.eventCount,
        uniqueUsers: a.uniqueUsers,
        projected,
        softLimit: quota?.softLimit ? parseFloat(quota.softLimit) : null,
        hardLimit: quota?.hardLimit ? parseFloat(quota.hardLimit) : null,
        softLimitPct: softPct ? Math.round(softPct) : null,
        hardLimitPct: hardPct ? Math.round(hardPct) : null,
        alertLevel:
          hardPct !== null && hardPct >= 100
            ? 'exceeded'
            : hardPct !== null && hardPct >= 90
              ? 'critical'
              : hardPct !== null && hardPct >= 80
                ? 'warning'
                : softPct !== null && softPct >= 90
                  ? 'approaching'
                  : null,
      };
    });

    const todayByFeature = Object.fromEntries(
      dailyUsage.map((d) => [d.featureKey, parseFloat(d.qty ?? '0')]),
    );

    sendSuccess(res, {
      org: { id: org.id, name: org.name, slug: org.slug, plan: org.plan },
      subscription: sub
        ? {
            status: sub.status,
            currentPeriodStart: sub.currentPeriodStart,
            currentPeriodEnd: sub.currentPeriodEnd,
          }
        : null,
      period: {
        start: monthStart,
        end: monthEnd,
        daysElapsed,
        daysInMonth,
        projectionFactor: Math.round(projFactor * 100) / 100,
      },
      usageByFeature,
      todayUsage: todayByFeature,
      recentViolations,
      totalAlerts: usageByFeature.filter((u) => u.alertLevel !== null).length,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get usage dashboard');
  }
});

export function register(r: IRouter): void {
  r.use(router);
}
