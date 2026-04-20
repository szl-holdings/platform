import { db, entitlementsTable, subscriptionsTable, usageEventsTable } from '@szl-holdings/db';
import { and, eq, sql } from 'drizzle-orm';

export interface FeatureGateResult {
  allowed: boolean;
  reason: string;
  currentUsage?: number;
  limit?: number;
}

export async function checkFeatureAccess(
  orgId: number,
  featureKey: string,
): Promise<FeatureGateResult> {
  try {
    const sub = await db
      .select({ planId: subscriptionsTable.planId, status: subscriptionsTable.status })
      .from(subscriptionsTable)
      .where(and(eq(subscriptionsTable.orgId, orgId), eq(subscriptionsTable.status, 'active')))
      .limit(1);

    if (sub.length === 0) {
      return { allowed: false, reason: 'No active subscription' };
    }

    const entitlements = await db
      .select()
      .from(entitlementsTable)
      .where(
        and(
          eq(entitlementsTable.planId, sub[0].planId),
          eq(entitlementsTable.featureKey, featureKey),
        ),
      );

    if (entitlements.length === 0) {
      return { allowed: false, reason: `Feature "${featureKey}" not included in current plan` };
    }

    const ent = entitlements[0];

    if (ent.type === 'boolean') {
      return { allowed: true, reason: 'Feature included in plan' };
    }

    if (ent.type === 'limit' || ent.type === 'usage') {
      if (!ent.limitValue) {
        return { allowed: true, reason: 'No limit configured' };
      }

      const usageResult = await db
        .select({ total: sql<number>`COALESCE(SUM(${usageEventsTable.quantity}), 0)::int` })
        .from(usageEventsTable)
        .where(and(eq(usageEventsTable.orgId, orgId), eq(usageEventsTable.featureKey, featureKey)));

      const currentUsage = usageResult[0]?.total ?? 0;

      if (currentUsage >= ent.limitValue) {
        return {
          allowed: false,
          reason: `Usage limit reached (${currentUsage}/${ent.limitValue})`,
          currentUsage,
          limit: ent.limitValue,
        };
      }

      return {
        allowed: true,
        reason: `Within limits (${currentUsage}/${ent.limitValue})`,
        currentUsage,
        limit: ent.limitValue,
      };
    }

    return { allowed: true, reason: 'Default allow' };
  } catch {
    return { allowed: false, reason: 'Feature gate check failed — access denied for safety' };
  }
}
