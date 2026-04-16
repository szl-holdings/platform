/**
 * Usage Metering & Multi-Tenant Billing Engine
 *
 * Covers:
 *  1. Event-driven metering  — POST /metering/events
 *  2. Usage aggregation      — GET  /metering/usage, GET /metering/usage/:orgId
 *  3. Rate card management   — CRUD /metering/rate-cards
 *  4. Real-time dashboards   — GET  /metering/dashboard/:orgId
 *  5. Cost allocation        — GET  /metering/cost-allocation
 *  6. Invoice generation     — POST /metering/invoices/generate
 *  7. Quota enforcement      — GET/PUT /metering/quotas, POST /metering/check-quota
 *  8. Billing analytics      — GET  /metering/analytics
 */

import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  meteringEventsTable,
  usageAggregatesTable,
  rateCardsTable,
  rateCardTiersTable,
  rateCardAssignmentsTable,
  quotaConfigsTable,
  quotaViolationsTable,
  costAllocationsTable,
  billingLineItemsTable,
  organizationsTable,
  invoicesTable,
  subscriptionsTable,
  revenueEventsTable,
} from "@szl-holdings/db";
import {
  eq, desc, asc, and, gte, lte, sql, sum, count, avg, isNull, ne, inArray,
} from "drizzle-orm";
import {
  sendSuccess, sendNotFound, sendError, sendBadRequest, handleRouteError,
} from "../../lib/api-response";
import { authMiddleware, requireRole, parseIdParam } from "../../middlewares/auth";
import { tenantScope, assertTenantAccess } from "../../middlewares/tenant-scope";
import { logger } from "../../lib/logger";

const router: IRouter = Router();

const ADMIN_ROLES = ["admin", "super_admin", "ops"] as const;
const READ_ROLES = ["admin", "super_admin", "ops", "analyst"] as const;

function periodBounds(period: "month" | "day" | "year" = "month", refDate = new Date()) {
  const y = refDate.getUTCFullYear();
  const m = refDate.getUTCMonth();
  const d = refDate.getUTCDate();

  if (period === "day") {
    return {
      start: new Date(Date.UTC(y, m, d)),
      end: new Date(Date.UTC(y, m, d + 1)),
    };
  }
  if (period === "year") {
    return {
      start: new Date(Date.UTC(y, 0, 1)),
      end: new Date(Date.UTC(y + 1, 0, 1)),
    };
  }
  return {
    start: new Date(Date.UTC(y, m, 1)),
    end: new Date(Date.UTC(y, m + 1, 1)),
  };
}

function computeCharge(
  quantity: number,
  card: { pricingModel: string; unitAmount: string | null; flatAmount: string | null; freeUnits: number },
  tiers: Array<{ fromUnit: number; toUnit: number | null; unitAmount: string; flatAmount: string | null; order: number }>,
): number {
  const ua = parseFloat(card.unitAmount ?? "0");
  const fa = parseFloat(card.flatAmount ?? "0");
  const free = card.freeUnits ?? 0;
  const billable = Math.max(0, quantity - free);

  switch (card.pricingModel) {
    case "flat_rate":
      return fa;

    case "per_unit":
      return billable * ua;

    case "tiered": {
      let total = fa;
      let remaining = billable;
      for (const tier of tiers.sort((a, b) => a.order - b.order)) {
        if (remaining <= 0) break;
        const tierFrom = Math.max(0, tier.fromUnit - free);
        const tierTo = tier.toUnit ? tier.toUnit - free : Infinity;
        const tierSize = tierTo - tierFrom;
        const units = Math.min(remaining, tierSize);
        total += units * parseFloat(tier.unitAmount);
        if (tier.flatAmount) total += parseFloat(tier.flatAmount);
        remaining -= units;
      }
      return total;
    }

    case "volume": {
      const sorted = tiers.sort((a, b) => a.order - b.order);
      const applicableTier = [...sorted].reverse().find((t) => billable >= t.fromUnit);
      if (!applicableTier) return fa;
      const tierUa = parseFloat(applicableTier.unitAmount);
      const tierFa = applicableTier.flatAmount ? parseFloat(applicableTier.flatAmount) : 0;
      return fa + tierFa + billable * tierUa;
    }

    case "package": {
      const packageSize = free || 1;
      const packages = Math.ceil(billable / packageSize);
      return fa + packages * ua;
    }

    case "commitment":
      return fa;

    default:
      return billable * ua;
  }
}

async function recomputeAggregate(orgId: number, featureKey: string, product: string) {
  const now = new Date();
  const { start, end } = periodBounds("month", now);

  const [row] = await db
    .select({
      totalQty: sql<string>`COALESCE(SUM(${meteringEventsTable.quantity}::numeric), 0)`,
      eventCount: sql<number>`COUNT(*)::int`,
      uniqueUsers: sql<number>`COUNT(DISTINCT ${meteringEventsTable.userId})::int`,
    })
    .from(meteringEventsTable)
    .where(
      and(
        eq(meteringEventsTable.orgId, orgId),
        eq(meteringEventsTable.featureKey, featureKey),
        gte(meteringEventsTable.occurredAt, start),
        lte(meteringEventsTable.occurredAt, end),
      ),
    );

  await db
    .insert(usageAggregatesTable)
    .values({
      orgId,
      featureKey,
      product,
      periodType: "month",
      periodStart: start,
      periodEnd: end,
      totalQuantity: row?.totalQty ?? "0",
      eventCount: row?.eventCount ?? 0,
      uniqueUsers: row?.uniqueUsers ?? 0,
    })
    .onConflictDoUpdate({
      target: [
        usageAggregatesTable.orgId,
        usageAggregatesTable.featureKey,
        usageAggregatesTable.periodType,
        usageAggregatesTable.periodStart,
      ],
      set: {
        totalQuantity: row?.totalQty ?? "0",
        eventCount: row?.eventCount ?? 0,
        uniqueUsers: row?.uniqueUsers ?? 0,
        computedAt: new Date(),
      },
    });
}

async function checkAndEnforceQuota(orgId: number, featureKey: string, quantity: number): Promise<{ allowed: boolean; reason?: string; violation?: string }> {
  const [quota] = await db
    .select()
    .from(quotaConfigsTable)
    .where(
      and(
        eq(quotaConfigsTable.orgId, orgId),
        eq(quotaConfigsTable.featureKey, featureKey),
        eq(quotaConfigsTable.isActive, true),
      ),
    )
    .limit(1);

  if (!quota) return { allowed: true };

  const now = new Date();
  const period = quota.periodType === "billing_cycle" ? "month" : quota.periodType as "day" | "month";
  const { start } = periodBounds(period, now);

  const [agg] = await db
    .select({ total: sql<string>`COALESCE(SUM(${meteringEventsTable.quantity}::numeric), 0)` })
    .from(meteringEventsTable)
    .where(
      and(
        eq(meteringEventsTable.orgId, orgId),
        eq(meteringEventsTable.featureKey, featureKey),
        gte(meteringEventsTable.occurredAt, start),
      ),
    );

  const currentUsage = parseFloat(agg?.total ?? "0");
  const projected = currentUsage + quantity;

  if (quota.hardLimit !== null) {
    const hard = parseFloat(quota.hardLimit);
    if (projected > hard) {
      await db.insert(quotaViolationsTable).values({
        orgId,
        featureKey,
        violationType: "hard",
        action: quota.hardLimitAction,
        currentUsage: String(currentUsage),
        limitValue: quota.hardLimit,
        metadata: { quantity, projected },
      });

      if (quota.hardLimitAction === "block") {
        return {
          allowed: false,
          reason: `Hard usage limit reached for '${featureKey}'. Current: ${currentUsage}, Limit: ${hard}.`,
          violation: "hard",
        };
      }
    }
  }

  if (quota.softLimit !== null) {
    const soft = parseFloat(quota.softLimit);
    if (projected > soft && currentUsage <= soft) {
      await db.insert(quotaViolationsTable).values({
        orgId,
        featureKey,
        violationType: "soft",
        action: quota.softLimitAction,
        currentUsage: String(currentUsage),
        limitValue: quota.softLimit,
        metadata: { quantity, projected },
      });
    }
  }

  return { allowed: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. METERING EVENTS
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  "/metering/events",
  authMiddleware({ required: false }),
  async (req: Request, res: Response) => {
    try {
      const {
        orgId,
        userId,
        eventType,
        featureKey,
        product,
        quantity,
        unitLabel,
        dimensions,
        idempotencyKey,
        occurredAt,
        metadata,
      } = req.body as {
        orgId: number;
        userId?: number;
        eventType: string;
        featureKey: string;
        product?: string;
        quantity?: number;
        unitLabel?: string;
        dimensions?: Record<string, unknown>;
        idempotencyKey?: string;
        occurredAt?: string;
        metadata?: Record<string, unknown>;
      };

      if (!orgId || !eventType || !featureKey) {
        sendBadRequest(res, "orgId, eventType, and featureKey are required");
        return;
      }

      const qty = quantity ?? 1;

      const quotaCheck = await checkAndEnforceQuota(orgId, featureKey, qty);
      if (!quotaCheck.allowed) {
        res.status(429).json({
          error: "quota_exceeded",
          message: quotaCheck.reason,
          violation: quotaCheck.violation,
          featureKey,
        });
        return;
      }

      const [event] = await db
        .insert(meteringEventsTable)
        .values({
          orgId,
          userId: userId ?? null,
          eventType,
          featureKey,
          product: product ?? "platform",
          quantity: String(qty),
          unitLabel: unitLabel ?? "unit",
          dimensions: dimensions ?? null,
          idempotencyKey: idempotencyKey ?? null,
          occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
          metadata: metadata ?? null,
        })
        .onConflictDoNothing()
        .returning();

      await recomputeAggregate(orgId, featureKey, product ?? "platform");

      if (!event) {
        sendSuccess(res, { status: "deduplicated", idempotencyKey });
        return;
      }

      sendSuccess(res, { status: "recorded", event });
    } catch (err) {
      handleRouteError(res, err, "Failed to record metering event");
    }
  },
);

router.post(
  "/metering/events/batch",
  authMiddleware({ required: false }),
  async (req: Request, res: Response) => {
    try {
      const { events } = req.body as {
        events: Array<{
          orgId: number;
          userId?: number;
          eventType: string;
          featureKey: string;
          product?: string;
          quantity?: number;
          unitLabel?: string;
          dimensions?: Record<string, unknown>;
          idempotencyKey?: string;
          occurredAt?: string;
          metadata?: Record<string, unknown>;
        }>;
      };

      if (!Array.isArray(events) || events.length === 0) {
        sendBadRequest(res, "events array is required and must not be empty");
        return;
      }

      if (events.length > 500) {
        sendBadRequest(res, "Batch size exceeds maximum of 500 events");
        return;
      }

      const rows = events.map((e) => ({
        orgId: e.orgId,
        userId: e.userId ?? null,
        eventType: e.eventType,
        featureKey: e.featureKey,
        product: e.product ?? "platform",
        quantity: String(e.quantity ?? 1),
        unitLabel: e.unitLabel ?? "unit",
        dimensions: e.dimensions ?? null,
        idempotencyKey: e.idempotencyKey ?? null,
        occurredAt: e.occurredAt ? new Date(e.occurredAt) : new Date(),
        metadata: e.metadata ?? null,
      }));

      const inserted = await db
        .insert(meteringEventsTable)
        .values(rows)
        .onConflictDoNothing()
        .returning({ id: meteringEventsTable.id });

      const touched = new Set<string>();
      for (const e of events) {
        touched.add(`${e.orgId}:${e.featureKey}:${e.product ?? "platform"}`);
      }
      await Promise.all(
        [...touched].map((k) => {
          const [orgId, featureKey, product] = k.split(":");
          return recomputeAggregate(parseInt(orgId!, 10), featureKey!, product!);
        }),
      );

      sendSuccess(res, {
        recorded: inserted.length,
        deduplicated: events.length - inserted.length,
        total: events.length,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to batch record metering events");
    }
  },
);

router.get(
  "/metering/events",
  authMiddleware(),
  requireRole(...READ_ROLES),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : undefined;
      const featureKey = req.query.featureKey as string | undefined;
      const product = req.query.product as string | undefined;
      const since = req.query.since ? new Date(req.query.since as string) : undefined;
      const until = req.query.until ? new Date(req.query.until as string) : undefined;
      const limit = Math.min(parseInt(String(req.query.limit ?? "100"), 10), 1000);

      const conditions = [];
      if (orgId) conditions.push(eq(meteringEventsTable.orgId, orgId));
      if (featureKey) conditions.push(eq(meteringEventsTable.featureKey, featureKey));
      if (product) conditions.push(eq(meteringEventsTable.product, product));
      if (since) conditions.push(gte(meteringEventsTable.occurredAt, since));
      if (until) conditions.push(lte(meteringEventsTable.occurredAt, until));

      const events = await db
        .select()
        .from(meteringEventsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(meteringEventsTable.occurredAt))
        .limit(limit);

      sendSuccess(res, events);
    } catch (err) {
      handleRouteError(res, err, "Failed to list metering events");
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. USAGE AGGREGATION & PROJECTIONS
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/metering/usage",
  authMiddleware(),
  requireRole(...READ_ROLES),
  async (req: Request, res: Response) => {
    try {
      const period = (req.query.period as string) || "month";
      const product = req.query.product as string | undefined;
      const now = new Date();
      const { start, end } = periodBounds(period as "month" | "day" | "year", now);

      const conditions = [
        gte(usageAggregatesTable.periodStart, start),
        lte(usageAggregatesTable.periodStart, end),
        eq(usageAggregatesTable.periodType, period === "year" ? "month" : period as "day" | "month" | "billing_cycle"),
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
      handleRouteError(res, err, "Failed to get usage aggregates");
    }
  },
);

router.get(
  "/metering/usage/:orgId",
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const orgId = parseIdParam(req.params.orgId);
      if (!assertTenantAccess(req, res, orgId)) return;

      const period = (req.query.period as string) || "month";
      const now = new Date();
      const { start, end } = periodBounds(period as "month" | "day" | "year", now);

      const aggs = await db
        .select()
        .from(usageAggregatesTable)
        .where(
          and(
            eq(usageAggregatesTable.orgId, orgId),
            gte(usageAggregatesTable.periodStart, start),
            eq(usageAggregatesTable.periodType, period === "year" ? "month" : period as "day" | "month" | "billing_cycle"),
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
          alert: hardPct !== null && hardPct >= 80
            ? (hardPct >= 100 ? "exceeded" : hardPct >= 90 ? "critical" : "warning")
            : softPct !== null && softPct >= 80
              ? (softPct >= 100 ? "soft_exceeded" : "approaching")
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
      handleRouteError(res, err, "Failed to get tenant usage");
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. RATE CARDS
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/metering/rate-cards",
  authMiddleware(),
  requireRole(...READ_ROLES),
  async (req: Request, res: Response) => {
    try {
      const featureKey = req.query.featureKey as string | undefined;
      const product = req.query.product as string | undefined;
      const activeOnly = req.query.active !== "false";

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
      const tiers = cardIds.length > 0
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

      sendSuccess(res, cards.map((c) => ({ ...c, tiers: tiersByCard[c.id] ?? [] })));
    } catch (err) {
      handleRouteError(res, err, "Failed to list rate cards");
    }
  },
);

router.get(
  "/metering/rate-cards/:id",
  authMiddleware(),
  requireRole(...READ_ROLES),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const [card] = await db.select().from(rateCardsTable).where(eq(rateCardsTable.id, id));
      if (!card) { sendNotFound(res, "Rate card"); return; }

      const tiers = await db
        .select()
        .from(rateCardTiersTable)
        .where(eq(rateCardTiersTable.rateCardId, id))
        .orderBy(asc(rateCardTiersTable.order));

      sendSuccess(res, { ...card, tiers });
    } catch (err) {
      handleRouteError(res, err, "Failed to get rate card");
    }
  },
);

router.post(
  "/metering/rate-cards",
  authMiddleware(),
  requireRole(...ADMIN_ROLES),
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
        tiers?: Array<{ fromUnit: number; toUnit?: number; unitAmount: string; flatAmount?: string; order: number }>;
      };

      if (!body.name || !body.slug || !body.featureKey || !body.pricingModel) {
        sendBadRequest(res, "name, slug, featureKey, and pricingModel are required");
        return;
      }

      const [card] = await db
        .insert(rateCardsTable)
        .values({
          name: body.name,
          slug: body.slug,
          featureKey: body.featureKey,
          product: body.product ?? "platform",
          pricingModel: body.pricingModel as typeof rateCardsTable.$inferInsert["pricingModel"],
          unitLabel: body.unitLabel ?? "unit",
          flatAmount: body.flatAmount ?? null,
          unitAmount: body.unitAmount ?? null,
          freeUnits: body.freeUnits ?? 0,
          billingInterval: (body.billingInterval ?? "monthly") as typeof rateCardsTable.$inferInsert["billingInterval"],
          currency: body.currency ?? "usd",
          description: body.description ?? null,
        })
        .returning();

      if (tiers && tiers.length > 0 && card) {
        await db.insert(rateCardTiersTable).values(
          tiers.map((t) => ({ ...t, rateCardId: card.id })),
        );
      }

      sendSuccess(res, card, 201);
    } catch (err) {
      handleRouteError(res, err, "Failed to create rate card");
    }
  },
);

router.put(
  "/metering/rate-cards/:id",
  authMiddleware(),
  requireRole(...ADMIN_ROLES),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const { tiers, ...updates } = req.body as Record<string, unknown> & {
        tiers?: Array<{ fromUnit: number; toUnit?: number; unitAmount: string; flatAmount?: string; order: number }>;
      };

      const [existing] = await db.select().from(rateCardsTable).where(eq(rateCardsTable.id, id));
      if (!existing) { sendNotFound(res, "Rate card"); return; }

      const [updated] = await db
        .update(rateCardsTable)
        .set({ ...updates as Partial<typeof rateCardsTable.$inferInsert>, updatedAt: new Date() })
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
      handleRouteError(res, err, "Failed to update rate card");
    }
  },
);

router.post(
  "/metering/rate-cards/:id/assign",
  authMiddleware(),
  requireRole(...ADMIN_ROLES),
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
        sendBadRequest(res, "orgId and featureKey are required");
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
      handleRouteError(res, err, "Failed to assign rate card");
    }
  },
);

router.get(
  "/metering/rate-cards/assignments/:orgId",
  authMiddleware(),
  requireRole(...READ_ROLES),
  async (req: Request, res: Response) => {
    try {
      const orgId = parseIdParam(req.params.orgId);
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
      handleRouteError(res, err, "Failed to get rate card assignments");
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. REAL-TIME USAGE DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/metering/dashboard/:orgId",
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const orgId = parseIdParam(req.params.orgId);
      if (!assertTenantAccess(req, res, orgId)) return;

      const now = new Date();
      const { start: monthStart, end: monthEnd } = periodBounds("month", now);
      const { start: dayStart } = periodBounds("day", now);

      const [org] = await db
        .select()
        .from(organizationsTable)
        .where(eq(organizationsTable.id, orgId))
        .limit(1);

      if (!org) { sendNotFound(res, "Organization"); return; }

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
            eq(usageAggregatesTable.periodType, "month"),
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
          and(
            eq(meteringEventsTable.orgId, orgId),
            gte(meteringEventsTable.occurredAt, dayStart),
          ),
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
          alertLevel: hardPct !== null && hardPct >= 100
            ? "exceeded"
            : hardPct !== null && hardPct >= 90
              ? "critical"
              : hardPct !== null && hardPct >= 80
                ? "warning"
                : softPct !== null && softPct >= 90
                  ? "approaching"
                  : null,
        };
      });

      const todayByFeature = Object.fromEntries(
        dailyUsage.map((d) => [d.featureKey, parseFloat(d.qty ?? "0")]),
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
      handleRouteError(res, err, "Failed to get usage dashboard");
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. COST ALLOCATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/metering/cost-allocation",
  authMiddleware(),
  requireRole(...READ_ROLES),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : undefined;
      const product = req.query.product as string | undefined;
      const since = req.query.since ? new Date(req.query.since as string) : undefined;
      const until = req.query.until ? new Date(req.query.until as string) : undefined;

      const conditions = [];
      if (orgId) conditions.push(eq(costAllocationsTable.orgId, orgId));
      if (product) conditions.push(eq(costAllocationsTable.product, product));
      if (since) conditions.push(gte(costAllocationsTable.periodStart, since));
      if (until) conditions.push(lte(costAllocationsTable.periodEnd, until));

      const allocations = await db
        .select({
          allocation: costAllocationsTable,
          orgName: organizationsTable.name,
          orgSlug: organizationsTable.slug,
        })
        .from(costAllocationsTable)
        .innerJoin(organizationsTable, eq(costAllocationsTable.orgId, organizationsTable.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(costAllocationsTable.periodStart));

      const summary = allocations.reduce(
        (acc, { allocation }) => {
          const infra = parseFloat(allocation.infraCost);
          const billed = parseFloat(allocation.billedAmount);
          acc.totalInfraCost += infra;
          acc.totalBilled += billed;
          return acc;
        },
        { totalInfraCost: 0, totalBilled: 0 },
      );

      const margin = summary.totalBilled > 0
        ? Math.round(((summary.totalBilled - summary.totalInfraCost) / summary.totalBilled) * 10000) / 100
        : null;

      sendSuccess(res, {
        summary: {
          ...summary,
          margin,
          profit: Math.round((summary.totalBilled - summary.totalInfraCost) * 100) / 100,
        },
        allocations,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to get cost allocations");
    }
  },
);

router.post(
  "/metering/cost-allocation",
  authMiddleware(),
  requireRole(...ADMIN_ROLES),
  async (req: Request, res: Response) => {
    try {
      const { orgId, featureKey, product, periodStart, periodEnd, infraCost, billedAmount, currency, costDriver, notes } = req.body as {
        orgId: number;
        featureKey: string;
        product?: string;
        periodStart: string;
        periodEnd: string;
        infraCost: string;
        billedAmount?: string;
        currency?: string;
        costDriver?: string;
        notes?: string;
      };

      if (!orgId || !featureKey || !periodStart || !periodEnd || infraCost === undefined) {
        sendBadRequest(res, "orgId, featureKey, periodStart, periodEnd, and infraCost are required");
        return;
      }

      const [row] = await db
        .insert(costAllocationsTable)
        .values({
          orgId,
          featureKey,
          product: product ?? "platform",
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          infraCost,
          billedAmount: billedAmount ?? "0",
          currency: currency ?? "usd",
          costDriver: costDriver ?? null,
          notes: notes ?? null,
        })
        .returning();

      sendSuccess(res, row, 201);
    } catch (err) {
      handleRouteError(res, err, "Failed to record cost allocation");
    }
  },
);

router.get(
  "/metering/margin-analysis",
  authMiddleware(),
  requireRole(...READ_ROLES),
  async (req: Request, res: Response) => {
    try {
      const product = req.query.product as string | undefined;
      const since = req.query.since ? new Date(req.query.since as string) : undefined;

      const conditions = [];
      if (product) conditions.push(eq(costAllocationsTable.product, product));
      if (since) conditions.push(gte(costAllocationsTable.periodStart, since));

      const rows = await db
        .select({
          orgId: costAllocationsTable.orgId,
          orgName: organizationsTable.name,
          orgSlug: organizationsTable.slug,
          totalInfraCost: sql<string>`SUM(${costAllocationsTable.infraCost}::numeric)`,
          totalBilled: sql<string>`SUM(${costAllocationsTable.billedAmount}::numeric)`,
        })
        .from(costAllocationsTable)
        .innerJoin(organizationsTable, eq(costAllocationsTable.orgId, organizationsTable.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(costAllocationsTable.orgId, organizationsTable.name, organizationsTable.slug)
        .orderBy(sql`SUM(${costAllocationsTable.billedAmount}::numeric) DESC`);

      const enriched = rows.map((r) => {
        const infra = parseFloat(r.totalInfraCost);
        const billed = parseFloat(r.totalBilled);
        const margin = billed > 0 ? Math.round(((billed - infra) / billed) * 10000) / 100 : null;
        const profit = Math.round((billed - infra) * 100) / 100;
        const unprofitable = profit < 0;
        return {
          orgId: r.orgId,
          orgName: r.orgName,
          orgSlug: r.orgSlug,
          totalInfraCost: Math.round(infra * 100) / 100,
          totalBilled: Math.round(billed * 100) / 100,
          margin,
          profit,
          unprofitable,
        };
      });

      sendSuccess(res, {
        tenants: enriched,
        unprofitableCount: enriched.filter((t) => t.unprofitable).length,
        avgMargin: enriched.length > 0
          ? Math.round(enriched.reduce((s, t) => s + (t.margin ?? 0), 0) / enriched.length * 100) / 100
          : null,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to get margin analysis");
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. INVOICE GENERATION
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  "/metering/invoices/generate",
  authMiddleware(),
  requireRole(...ADMIN_ROLES),
  async (req: Request, res: Response) => {
    try {
      const { orgId, periodStart, periodEnd, dryRun } = req.body as {
        orgId: number;
        periodStart?: string;
        periodEnd?: string;
        dryRun?: boolean;
      };

      if (!orgId) {
        sendBadRequest(res, "orgId is required");
        return;
      }

      const now = new Date();
      const { start, end } = periodBounds("month", now);
      const pStart = periodStart ? new Date(periodStart) : start;
      const pEnd = periodEnd ? new Date(periodEnd) : end;

      const aggs = await db
        .select()
        .from(usageAggregatesTable)
        .where(
          and(
            eq(usageAggregatesTable.orgId, orgId),
            eq(usageAggregatesTable.periodType, "month"),
            gte(usageAggregatesTable.periodStart, pStart),
            lte(usageAggregatesTable.periodEnd, pEnd),
          ),
        );

      const assignments = await db
        .select({ assignment: rateCardAssignmentsTable, card: rateCardsTable })
        .from(rateCardAssignmentsTable)
        .innerJoin(rateCardsTable, eq(rateCardAssignmentsTable.rateCardId, rateCardsTable.id))
        .where(
          and(
            eq(rateCardAssignmentsTable.orgId, orgId),
            eq(rateCardAssignmentsTable.isActive, true),
          ),
        );

      const cardMap = Object.fromEntries(assignments.map((a) => [a.assignment.featureKey, a]));

      const lineItems: Array<{
        featureKey: string;
        description: string;
        quantity: number;
        unitAmount: number;
        totalAmount: number;
        rateCardId?: number;
        pricingModel?: string;
      }> = [];

      for (const agg of aggs) {
        const cardEntry = cardMap[agg.featureKey];
        if (!cardEntry) continue;

        const { card } = cardEntry;
        const qty = parseFloat(agg.totalQuantity);

        const tiers = await db
          .select()
          .from(rateCardTiersTable)
          .where(eq(rateCardTiersTable.rateCardId, card.id))
          .orderBy(asc(rateCardTiersTable.order));

        const total = computeCharge(qty, {
          pricingModel: card.pricingModel,
          unitAmount: card.unitAmount,
          flatAmount: card.flatAmount,
          freeUnits: card.freeUnits,
        }, tiers);

        lineItems.push({
          featureKey: agg.featureKey,
          description: `${card.name} — ${qty.toLocaleString()} ${card.unitLabel}`,
          quantity: qty,
          unitAmount: total > 0 && qty > 0 ? Math.round((total / qty) * 1_000_000) / 1_000_000 : 0,
          totalAmount: Math.round(total * 100) / 100,
          rateCardId: card.id,
          pricingModel: card.pricingModel,
        });
      }

      const grandTotal = lineItems.reduce((s, li) => s + li.totalAmount, 0);

      if (dryRun) {
        sendSuccess(res, {
          dryRun: true,
          orgId,
          periodStart: pStart,
          periodEnd: pEnd,
          lineItems,
          grandTotal: Math.round(grandTotal * 100) / 100,
          currency: "usd",
        });
        return;
      }

      const [invoice] = await db
        .insert(invoicesTable)
        .values({
          orgId,
          amount: String(Math.round(grandTotal * 100) / 100),
          currency: "usd",
          status: "draft",
          dueDate: new Date(pEnd.getTime() + 30 * 86_400_000),
        })
        .returning();

      if (lineItems.length > 0 && invoice) {
        await db.insert(billingLineItemsTable).values(
          lineItems.map((li) => ({
            orgId,
            invoiceId: invoice.id,
            featureKey: li.featureKey,
            description: li.description,
            quantity: String(li.quantity),
            unitAmount: String(li.unitAmount),
            totalAmount: String(li.totalAmount),
            currency: "usd",
            periodStart: pStart,
            periodEnd: pEnd,
            rateCardId: li.rateCardId ?? null,
            status: "finalized" as const,
          })),
        );
      }

      sendSuccess(res, {
        invoice,
        lineItems,
        grandTotal: Math.round(grandTotal * 100) / 100,
        currency: "usd",
      }, 201);
    } catch (err) {
      handleRouteError(res, err, "Failed to generate invoice");
    }
  },
);

router.get(
  "/metering/line-items",
  authMiddleware(),
  requireRole(...READ_ROLES),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : undefined;
      const invoiceId = req.query.invoiceId ? parseInt(req.query.invoiceId as string, 10) : undefined;
      const limit = Math.min(parseInt(String(req.query.limit ?? "100"), 10), 500);

      const conditions = [];
      if (orgId) conditions.push(eq(billingLineItemsTable.orgId, orgId));
      if (invoiceId) conditions.push(eq(billingLineItemsTable.invoiceId, invoiceId));

      const items = await db
        .select()
        .from(billingLineItemsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(billingLineItemsTable.createdAt))
        .limit(limit);

      sendSuccess(res, items);
    } catch (err) {
      handleRouteError(res, err, "Failed to list billing line items");
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. QUOTA MANAGEMENT & ENFORCEMENT
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/metering/quotas",
  authMiddleware(),
  requireRole(...READ_ROLES),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : undefined;
      const featureKey = req.query.featureKey as string | undefined;

      const conditions = [];
      if (orgId) conditions.push(eq(quotaConfigsTable.orgId, orgId));
      if (featureKey) conditions.push(eq(quotaConfigsTable.featureKey, featureKey));

      const quotas = await db
        .select()
        .from(quotaConfigsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(quotaConfigsTable.featureKey));

      sendSuccess(res, quotas);
    } catch (err) {
      handleRouteError(res, err, "Failed to list quotas");
    }
  },
);

router.post(
  "/metering/quotas",
  authMiddleware(),
  requireRole(...ADMIN_ROLES),
  async (req: Request, res: Response) => {
    try {
      const {
        orgId, featureKey, product, periodType,
        softLimit, hardLimit, softLimitAction, hardLimitAction,
        overageUnitAmount,
      } = req.body as {
        orgId?: number;
        featureKey: string;
        product?: string;
        periodType?: string;
        softLimit?: string;
        hardLimit?: string;
        softLimitAction?: string;
        hardLimitAction?: string;
        overageUnitAmount?: string;
      };

      if (!featureKey) {
        sendBadRequest(res, "featureKey is required");
        return;
      }

      const [quota] = await db
        .insert(quotaConfigsTable)
        .values({
          orgId: orgId ?? null,
          featureKey,
          product: product ?? "platform",
          periodType: (periodType ?? "month") as typeof quotaConfigsTable.$inferInsert["periodType"],
          softLimit: softLimit ?? null,
          hardLimit: hardLimit ?? null,
          softLimitAction: (softLimitAction ?? "notify") as typeof quotaConfigsTable.$inferInsert["softLimitAction"],
          hardLimitAction: (hardLimitAction ?? "block") as typeof quotaConfigsTable.$inferInsert["hardLimitAction"],
          overageUnitAmount: overageUnitAmount ?? null,
        })
        .onConflictDoUpdate({
          target: [quotaConfigsTable.orgId, quotaConfigsTable.featureKey, quotaConfigsTable.periodType],
          set: {
            softLimit: softLimit ?? null,
            hardLimit: hardLimit ?? null,
            softLimitAction: (softLimitAction ?? "notify") as typeof quotaConfigsTable.$inferInsert["softLimitAction"],
            hardLimitAction: (hardLimitAction ?? "block") as typeof quotaConfigsTable.$inferInsert["hardLimitAction"],
            overageUnitAmount: overageUnitAmount ?? null,
            updatedAt: new Date(),
          },
        })
        .returning();

      sendSuccess(res, quota, 201);
    } catch (err) {
      handleRouteError(res, err, "Failed to set quota");
    }
  },
);

router.post(
  "/metering/check-quota",
  authMiddleware({ required: false }),
  async (req: Request, res: Response) => {
    try {
      const { orgId, featureKey, quantity } = req.body as {
        orgId: number;
        featureKey: string;
        quantity?: number;
      };

      if (!orgId || !featureKey) {
        sendBadRequest(res, "orgId and featureKey are required");
        return;
      }

      const result = await checkAndEnforceQuota(orgId, featureKey, quantity ?? 1);
      sendSuccess(res, {
        orgId,
        featureKey,
        allowed: result.allowed,
        reason: result.reason ?? null,
        violation: result.violation ?? null,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to check quota");
    }
  },
);

router.get(
  "/metering/quota-violations",
  authMiddleware(),
  requireRole(...READ_ROLES),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : undefined;
      const since = req.query.since ? new Date(req.query.since as string) : undefined;
      const limit = Math.min(parseInt(String(req.query.limit ?? "100"), 10), 500);

      const conditions = [];
      if (orgId) conditions.push(eq(quotaViolationsTable.orgId, orgId));
      if (since) conditions.push(gte(quotaViolationsTable.occurredAt, since));

      const violations = await db
        .select({
          violation: quotaViolationsTable,
          orgName: organizationsTable.name,
        })
        .from(quotaViolationsTable)
        .innerJoin(organizationsTable, eq(quotaViolationsTable.orgId, organizationsTable.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(quotaViolationsTable.occurredAt))
        .limit(limit);

      sendSuccess(res, violations);
    } catch (err) {
      handleRouteError(res, err, "Failed to list quota violations");
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 8. BILLING ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/metering/analytics/overview",
  authMiddleware(),
  requireRole(...READ_ROLES),
  async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const { start: monthStart } = periodBounds("month", now);
      const { start: prevMonthStart, end: prevMonthEnd } = periodBounds(
        "month",
        new Date(now.getFullYear(), now.getMonth() - 1, 1),
      );
      const { start: yearStart } = periodBounds("year", now);

      const [invoiceStats] = await db
        .select({
          totalRevenue: sql<string>`COALESCE(SUM(${invoicesTable.amount}::numeric), 0)`,
          invoiceCount: sql<number>`COUNT(*)::int`,
          avgInvoice: sql<string>`COALESCE(AVG(${invoicesTable.amount}::numeric), 0)`,
        })
        .from(invoicesTable)
        .where(eq(invoicesTable.status, "paid"));

      const [mrrRow] = await db
        .select({
          mrr: sql<string>`COALESCE(SUM(${invoicesTable.amount}::numeric), 0)`,
        })
        .from(invoicesTable)
        .where(
          and(
            eq(invoicesTable.status, "paid"),
            gte(invoicesTable.createdAt, monthStart),
          ),
        );

      const [prevMrrRow] = await db
        .select({
          mrr: sql<string>`COALESCE(SUM(${invoicesTable.amount}::numeric), 0)`,
        })
        .from(invoicesTable)
        .where(
          and(
            eq(invoicesTable.status, "paid"),
            gte(invoicesTable.createdAt, prevMonthStart),
            lte(invoicesTable.createdAt, prevMonthEnd),
          ),
        );

      const [arrRow] = await db
        .select({
          arr: sql<string>`COALESCE(SUM(${invoicesTable.amount}::numeric), 0)`,
        })
        .from(invoicesTable)
        .where(
          and(
            eq(invoicesTable.status, "paid"),
            gte(invoicesTable.createdAt, yearStart),
          ),
        );

      const [activeSubsRow] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.status, "active"));

      const [canceledRow] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(subscriptionsTable)
        .where(
          and(
            eq(subscriptionsTable.status, "canceled"),
            gte(subscriptionsTable.canceledAt!, monthStart),
          ),
        );

      const currentMrr = parseFloat(mrrRow?.mrr ?? "0");
      const prevMrr = parseFloat(prevMrrRow?.mrr ?? "0");
      const mrrGrowth = prevMrr > 0 ? Math.round(((currentMrr - prevMrr) / prevMrr) * 10000) / 100 : null;

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
        mrr: { current: Math.round(currentMrr * 100) / 100, previous: Math.round(prevMrr * 100) / 100, growth: mrrGrowth },
        arr: Math.round(parseFloat(arrRow?.arr ?? "0") * 100) / 100,
        revenue: {
          total: Math.round(parseFloat(invoiceStats?.totalRevenue ?? "0") * 100) / 100,
          invoiceCount: invoiceStats?.invoiceCount ?? 0,
          avgInvoice: Math.round(parseFloat(invoiceStats?.avgInvoice ?? "0") * 100) / 100,
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
      handleRouteError(res, err, "Failed to get billing analytics");
    }
  },
);

router.get(
  "/metering/analytics/revenue-trend",
  authMiddleware(),
  requireRole(...READ_ROLES),
  async (req: Request, res: Response) => {
    try {
      const months = Math.min(parseInt(String(req.query.months ?? "12"), 10), 24);
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
        const { start, end } = periodBounds("month", d);

        const [row] = await db
          .select({
            revenue: sql<string>`COALESCE(SUM(${invoicesTable.amount}::numeric), 0)`,
            invoiceCount: sql<number>`COUNT(*)::int`,
          })
          .from(invoicesTable)
          .where(
            and(
              eq(invoicesTable.status, "paid"),
              gte(invoicesTable.createdAt, start),
              lte(invoicesTable.createdAt, end),
            ),
          );

        trend.push({
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          label: d.toLocaleString("en-US", { month: "short", year: "numeric" }),
          revenue: Math.round(parseFloat(row?.revenue ?? "0") * 100) / 100,
          invoiceCount: row?.invoiceCount ?? 0,
        });
      }

      sendSuccess(res, { months, trend });
    } catch (err) {
      handleRouteError(res, err, "Failed to get revenue trend");
    }
  },
);

router.get(
  "/metering/analytics/tenant-leaderboard",
  authMiddleware(),
  requireRole(...READ_ROLES),
  async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);
      const since = req.query.since ? new Date(req.query.since as string) : new Date(new Date().getFullYear(), 0, 1);

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
        .where(
          and(
            eq(invoicesTable.status, "paid"),
            gte(invoicesTable.createdAt, since),
          ),
        )
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
      handleRouteError(res, err, "Failed to get tenant leaderboard");
    }
  },
);

router.get(
  "/metering/analytics/cohort",
  authMiddleware(),
  requireRole(...READ_ROLES),
  async (req: Request, res: Response) => {
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

      const cohorts = rows.reduce<Record<string, {
        cohortMonth: string;
        total: number;
        active: number;
        churned: number;
        avgMonthsActive: number;
        tenants: Array<{ orgId: number; orgName: string; status: string; monthsActive: number }>;
      }>>((acc, r) => {
        const cm = r.cohortMonth;
        if (!acc[cm]) {
          acc[cm] = { cohortMonth: cm, total: 0, active: 0, churned: 0, avgMonthsActive: 0, tenants: [] };
        }
        acc[cm]!.total++;
        if (r.status === "active") acc[cm]!.active++;
        if (r.status === "canceled") acc[cm]!.churned++;
        acc[cm]!.tenants.push({ orgId: r.orgId, orgName: r.orgName, status: r.status, monthsActive: r.monthsActive });
        return acc;
      }, {});

      for (const cohort of Object.values(cohorts)) {
        cohort.avgMonthsActive = cohort.tenants.length > 0
          ? Math.round(cohort.tenants.reduce((s, t) => s + t.monthsActive, 0) / cohort.tenants.length * 10) / 10
          : 0;
      }

      sendSuccess(res, {
        cohorts: Object.values(cohorts).sort((a, b) => a.cohortMonth.localeCompare(b.cohortMonth)),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to get cohort analysis");
    }
  },
);

export default router;
