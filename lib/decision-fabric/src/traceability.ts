/**
 * Recommendation → Outcome traceability.
 *
 * For any recommendationId emitted by the decision engine, return the full
 * downstream chain: correlated primitive events, the matching decision
 * record, predicted vs. actual outcome, and any rollback or supersession.
 */

import {
  type CorrelationLink,
  type DecisionRecord,
  db,
  decisionRecordsTable,
} from '@szl-holdings/db';
import { and, desc, eq } from 'drizzle-orm';
import { getCorrelatedEvents } from './correlation';
import { listDecisions } from './decision-records';

export interface RecommendationTrace {
  recommendationId: string;
  decisions: DecisionRecord[];
  events: CorrelationLink[];
  predictedOutcome: Record<string, unknown> | null;
  actualOutcome: Record<string, unknown> | null;
  predictionError: number | null;
  status: DecisionRecord['status'] | null;
}

export interface TraceOptions {
  orgId?: number | null;
}

export async function traceRecommendation(
  recommendationId: string,
  options: TraceOptions = {},
): Promise<RecommendationTrace> {
  const decisions = await listDecisions({
    orgId: options.orgId ?? null,
    recommendationId,
    limit: 50,
  });

  // If decisions carry correlationIds, gather all linked primitive events.
  const correlationIds = Array.from(
    new Set(decisions.map((d) => d.correlationId).filter((c): c is string => Boolean(c))),
  );

  const eventLists = await Promise.all(
    correlationIds.map((cid) => getCorrelatedEvents(cid, { orgId: options.orgId ?? null })),
  );
  const events = eventLists.flat();

  const latest = decisions[0] ?? null;

  return {
    recommendationId,
    decisions,
    events,
    predictedOutcome: (latest?.predictedOutcome as Record<string, unknown>) ?? null,
    actualOutcome: (latest?.actualOutcome as Record<string, unknown>) ?? null,
    predictionError: latest?.predictionError ?? null,
    status: latest?.status ?? null,
  };
}

/**
 * Walk forward from a single decision record id, returning everything
 * downstream that shares its correlationId or workflow run id.
 */
export async function traceDecisionDownstream(
  decisionId: number,
  options: TraceOptions = {},
): Promise<{ decision: DecisionRecord | null; events: CorrelationLink[] }> {
  const conditions: any[] = [eq(decisionRecordsTable.id, decisionId)];
  if (options.orgId != null) conditions.push(eq(decisionRecordsTable.orgId, options.orgId));
  const [decision] = await db
    .select()
    .from(decisionRecordsTable)
    .where(and(...conditions))
    .orderBy(desc(decisionRecordsTable.decidedAt))
    .limit(1);
  if (!decision) return { decision: null, events: [] };

  const events: CorrelationLink[] = [];
  if (decision.correlationId) {
    events.push(
      ...(await getCorrelatedEvents(decision.correlationId, { orgId: options.orgId ?? null })),
    );
  }
  return { decision, events };
}
