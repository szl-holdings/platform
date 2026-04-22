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

import {
  db,
  meteringEventsTable,
  quotaConfigsTable,
  quotaViolationsTable,
  usageAggregatesTable,
} from '@szl-holdings/db';
import {
  and,
  eq,
  gte,
  lte,
  sql,
} from 'drizzle-orm';
import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';

export const meteringRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Metering rate limit exceeded.' },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const _ADMIN_ROLES = ['admin', 'super_admin', 'ops'] as const;
const _READ_ROLES = ['admin', 'super_admin', 'ops', 'analyst'] as const;

export function periodBounds(period: 'month' | 'day' | 'year' = 'month', refDate = new Date()) {
  const y = refDate.getUTCFullYear();
  const m = refDate.getUTCMonth();
  const d = refDate.getUTCDate();

  if (period === 'day') {
    return {
      start: new Date(Date.UTC(y, m, d)),
      end: new Date(Date.UTC(y, m, d + 1)),
    };
  }
  if (period === 'year') {
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

export function computeCharge(
  quantity: number,
  card: {
    pricingModel: string;
    unitAmount: string | null;
    flatAmount: string | null;
    freeUnits: number;
  },
  tiers: Array<{
    fromUnit: number;
    toUnit: number | null;
    unitAmount: string;
    flatAmount: string | null;
    order: number;
  }>,
): number {
  const ua = parseFloat(card.unitAmount ?? '0');
  const fa = parseFloat(card.flatAmount ?? '0');
  const free = card.freeUnits ?? 0;
  const billable = Math.max(0, quantity - free);

  switch (card.pricingModel) {
    case 'flat_rate':
      return fa;

    case 'per_unit':
      return billable * ua;

    case 'tiered': {
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

    case 'volume': {
      const sorted = tiers.sort((a, b) => a.order - b.order);
      const applicableTier = [...sorted].reverse().find((t) => billable >= t.fromUnit);
      if (!applicableTier) return fa;
      const tierUa = parseFloat(applicableTier.unitAmount);
      const tierFa = applicableTier.flatAmount ? parseFloat(applicableTier.flatAmount) : 0;
      return fa + tierFa + billable * tierUa;
    }

    case 'package': {
      const packageSize = free || 1;
      const packages = Math.ceil(billable / packageSize);
      return fa + packages * ua;
    }

    case 'commitment':
      return fa;

    default:
      return billable * ua;
  }
}

export async function recomputeAggregate(orgId: number, featureKey: string, product: string) {
  const now = new Date();
  const { start, end } = periodBounds('month', now);

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
      periodType: 'month',
      periodStart: start,
      periodEnd: end,
      totalQuantity: row?.totalQty ?? '0',
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
        totalQuantity: row?.totalQty ?? '0',
        eventCount: row?.eventCount ?? 0,
        uniqueUsers: row?.uniqueUsers ?? 0,
        computedAt: new Date(),
      },
    });
}

export async function checkAndEnforceQuota(
  orgId: number,
  featureKey: string,
  quantity: number,
): Promise<{ allowed: boolean; reason?: string; violation?: string }> {
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
  const period =
    quota.periodType === 'billing_cycle' ? 'month' : (quota.periodType as 'day' | 'month');
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

  const currentUsage = parseFloat(agg?.total ?? '0');
  const projected = currentUsage + quantity;

  if (quota.hardLimit !== null) {
    const hard = parseFloat(quota.hardLimit);
    if (projected > hard) {
      await db.insert(quotaViolationsTable).values({
        orgId,
        featureKey,
        violationType: 'hard',
        action: quota.hardLimitAction,
        currentUsage: String(currentUsage),
        limitValue: quota.hardLimit,
        metadata: { quantity, projected },
      });

      if (quota.hardLimitAction === 'block') {
        return {
          allowed: false,
          reason: `Hard usage limit reached for '${featureKey}'. Current: ${currentUsage}, Limit: ${hard}.`,
          violation: 'hard',
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
        violationType: 'soft',
        action: quota.softLimitAction,
        currentUsage: String(currentUsage),
        limitValue: quota.softLimit,
        metadata: { quantity, projected },
      });
    }
  }

  return { allowed: true };
}
