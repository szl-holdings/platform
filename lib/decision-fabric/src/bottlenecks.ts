/**
 * Approval bottleneck and policy failure analytics.
 *
 * These queries operate on the existing approvals + outcome-graph tables and
 * surface where the decision pipeline is choking: approvals stuck in queue,
 * policies that deny most often, and recommendations whose actuals diverge
 * sharply from predictions.
 */

import {
  db,
  approvalRequestsTable,
  decisionRecordsTable,
  outcomeGraphTable,
} from "@szl-holdings/db";
import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";

export interface ApprovalBottleneck {
  actionClass: string | null;
  resourceType: string | null;
  pendingCount: number;
  oldestPendingAgeMs: number | null;
  averagePendingAgeMs: number | null;
}

export interface BottleneckQueryOptions {
  orgId?: number | null;
  staleAfterMs?: number;
  limit?: number;
}

/**
 * Group pending approvals by workflow and report queue depth + age.
 * Caller can treat anything above `staleAfterMs` (default 24h) as stale.
 */
export async function getApprovalBottlenecks(
  options: BottleneckQueryOptions = {},
): Promise<ApprovalBottleneck[]> {
  const conditions: any[] = [eq(approvalRequestsTable.status, "pending")];
  if (options.orgId != null) conditions.push(eq(approvalRequestsTable.orgId, options.orgId));

  const rows = await db
    .select({
      actionClass: approvalRequestsTable.actionClass,
      resourceType: approvalRequestsTable.resourceType,
      pendingCount: sql<number>`count(*)::int`,
      oldest: sql<Date | null>`min(${approvalRequestsTable.createdAt})`,
      avgAgeMs: sql<number | null>`avg(extract(epoch from (now() - ${approvalRequestsTable.createdAt})) * 1000)::float`,
    })
    .from(approvalRequestsTable)
    .where(and(...conditions))
    .groupBy(approvalRequestsTable.actionClass, approvalRequestsTable.resourceType)
    .orderBy(desc(sql`count(*)`))
    .limit(options.limit ?? 25);

  const now = Date.now();
  return rows.map((r) => ({
    actionClass: r.actionClass,
    resourceType: r.resourceType,
    pendingCount: Number(r.pendingCount ?? 0),
    oldestPendingAgeMs: r.oldest ? now - new Date(r.oldest as unknown as string).getTime() : null,
    averagePendingAgeMs: r.avgAgeMs != null ? Number(r.avgAgeMs) : null,
  }));
}

export interface PolicyFailure {
  policyName: string | null;
  denials: number;
  lastDeniedAt: Date | null;
}

/**
 * Approximate policy-failure top-list by inspecting recent decision records
 * whose status is `rolled_back` or whose actualOutcome includes a denial flag.
 * Real implementations should also tail covenant-policy decision logs; this
 * surface provides a stable API even when those logs are sparse.
 */
export async function getPolicyFailures(options: BottleneckQueryOptions = {}): Promise<PolicyFailure[]> {
  const conditions: any[] = [eq(decisionRecordsTable.status, "rolled_back")];
  if (options.orgId != null) conditions.push(eq(decisionRecordsTable.orgId, options.orgId));

  const rows = await db
    .select({
      policyName: sql<string | null>`coalesce(${decisionRecordsTable.metadata}->>'denied_policy_name', 'unknown')`,
      denials: sql<number>`count(*)::int`,
      lastDeniedAt: sql<Date | null>`max(${decisionRecordsTable.decidedAt})`,
    })
    .from(decisionRecordsTable)
    .where(and(...conditions))
    .groupBy(sql`coalesce(${decisionRecordsTable.metadata}->>'denied_policy_name', 'unknown')`)
    .orderBy(desc(sql`count(*)`))
    .limit(options.limit ?? 25);

  return rows.map((r) => ({
    policyName: r.policyName,
    denials: Number(r.denials ?? 0),
    lastDeniedAt: r.lastDeniedAt ? new Date(r.lastDeniedAt as unknown as string) : null,
  }));
}

export interface PredictionDriftRow {
  recommendationId: string | null;
  domain: string | null;
  predictionError: number;
  decidedAt: Date;
}

/** Top N decisions whose actual outcome diverged most from prediction. */
export async function getPredictionDrift(
  options: BottleneckQueryOptions = {},
): Promise<PredictionDriftRow[]> {
  const conditions: any[] = [
    isNotNull(decisionRecordsTable.predictionError),
    isNotNull(decisionRecordsTable.actualOutcome),
  ];
  if (options.orgId != null) conditions.push(eq(decisionRecordsTable.orgId, options.orgId));

  const rows = await db
    .select({
      recommendationId: decisionRecordsTable.recommendationId,
      domain: decisionRecordsTable.domain,
      predictionError: decisionRecordsTable.predictionError,
      decidedAt: decisionRecordsTable.decidedAt,
    })
    .from(decisionRecordsTable)
    .where(and(...conditions))
    .orderBy(desc(sql`abs(${decisionRecordsTable.predictionError})`))
    .limit(options.limit ?? 25);

  return rows.map((r) => ({
    recommendationId: r.recommendationId,
    domain: r.domain,
    predictionError: Number(r.predictionError ?? 0),
    decidedAt: r.decidedAt,
  }));
}

/** Recent outcome-graph rows whose realized result was negative or rolled_back. */
export async function getRecentNegativeOutcomes(options: BottleneckQueryOptions = {}) {
  const since = new Date(Date.now() - (options.staleAfterMs ?? 7 * 24 * 60 * 60 * 1000));
  const conditions: any[] = [gte(outcomeGraphTable.createdAt, since)];
  if (options.orgId != null) conditions.push(eq(outcomeGraphTable.orgId, options.orgId));
  return db
    .select()
    .from(outcomeGraphTable)
    .where(and(...conditions))
    .orderBy(desc(outcomeGraphTable.createdAt))
    .limit(options.limit ?? 50);
}
