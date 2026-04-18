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
import { periodBounds, checkAndEnforceQuota, meteringRateLimit } from "./shared";
import {validateBody, jsonObjectBodySchema, validateQuery, listQuerySchema} from "../../lib/validation";

const router: IRouter = Router();
const ADMIN_ROLES = ["admin", "super_admin", "ops"] as const;
const READ_ROLES = ["admin", "super_admin", "ops", "analyst"] as const;

// ─────────────────────────────────────────────────────────────────────────────
// 5. COST ALLOCATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/metering/cost-allocation",
  authMiddleware(),
  requireRole(...READ_ROLES),
  validateQuery(listQuerySchema),
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
  validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
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
  validateQuery(listQuerySchema),
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
  validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
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
  validateQuery(listQuerySchema),
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
  validateQuery(listQuerySchema),
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
  validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
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
  validateBody(jsonObjectBodySchema),
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
  validateQuery(listQuerySchema),
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



export function register(r: IRouter): void { r.use(router); }
