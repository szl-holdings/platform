/**
 * Workflow 360 — assemble a single chronological timeline for a workflow run
 * by joining correlation-link entries with decision records and embellishing
 * each entry with primitive metadata.
 */

import {
  type CorrelationLink,
  type DecisionRecord,
  db,
  decisionRecordsTable,
} from '@szl-holdings/db';
import { and, eq } from 'drizzle-orm';
import { getEventsForWorkflowRun } from './correlation';

export interface Workflow360TimelineEntry {
  occurredAt: Date;
  primitive: CorrelationLink['primitive'];
  primitiveId: string;
  domain: CorrelationLink['domain'];
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
}

export interface Workflow360View {
  workflowRunId: string;
  /**
   * The most-recent decision record for the workflow run, kept for
   * backwards compatibility. New consumers should use `decisionRecords`
   * which lists every decision in chronological order.
   */
  decisionRecord: DecisionRecord | null;
  /** All decision records associated with this workflow run, oldest-first. */
  decisionRecords: DecisionRecord[];
  totalEvents: number;
  primitivesTouched: CorrelationLink['primitive'][];
  timeline: Workflow360TimelineEntry[];
}

export interface GetWorkflow360Options {
  orgId?: number | null;
  limit?: number;
}

export async function getWorkflow360(
  workflowRunId: string,
  options: GetWorkflow360Options = {},
): Promise<Workflow360View> {
  const events = await getEventsForWorkflowRun(workflowRunId, {
    orgId: options.orgId ?? null,
    limit: options.limit ?? 500,
  });

  const drConditions = [eq(decisionRecordsTable.workflowRunId, workflowRunId)];
  if (options.orgId != null) drConditions.push(eq(decisionRecordsTable.orgId, options.orgId));
  const decisionRows = await db
    .select()
    .from(decisionRecordsTable)
    .where(and(...drConditions))
    .orderBy(decisionRecordsTable.createdAt);

  const primitives = Array.from(new Set(events.map((e) => e.primitive)));

  return {
    workflowRunId,
    decisionRecord: decisionRows[decisionRows.length - 1] ?? null,
    decisionRecords: decisionRows,
    totalEvents: events.length,
    primitivesTouched: primitives,
    timeline: events.map((e) => ({
      occurredAt: e.occurredAt,
      primitive: e.primitive,
      primitiveId: e.primitiveId,
      domain: e.domain,
      entityType: e.entityType,
      entityId: e.entityId,
      metadata: (e.metadata as Record<string, unknown>) ?? null,
    })),
  };
}
