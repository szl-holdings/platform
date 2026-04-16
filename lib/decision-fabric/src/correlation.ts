/**
 * Cross-signal correlation layer.
 *
 * The fabric does not own primitive event storage. Instead it maintains a
 * thin index — `decision_fabric_correlation_links` — mapping a single
 * correlationId (or entity reference) to events that occurred in any
 * primitive (Prism Bus, Proof Chain, Outcome Graph, Covenant Policy,
 * Workflow Engine, Monte Carlo, Approvals).
 *
 * Primitives call `linkEvent` whenever they emit a fabric-relevant event;
 * fabric query APIs (Workflow 360, Entity Investigation, Traceability) read
 * from this index to assemble end-to-end timelines without bespoke joins.
 */

import {
  db,
  correlationLinksTable,
  type CorrelationLink,
  type InsertCorrelationLink,
} from "@szl-holdings/db";
import { and, desc, eq } from "drizzle-orm";

export type Primitive = InsertCorrelationLink["primitive"];
export type FabricDomain = InsertCorrelationLink["domain"];

export interface LinkEventParams {
  correlationId: string;
  primitive: Primitive;
  primitiveId: string;
  orgId?: number | null;
  entityType?: string | null;
  entityId?: string | null;
  workflowRunId?: string | null;
  domain?: FabricDomain;
  metadata?: Record<string, unknown>;
}

/** Record a single primitive event under a correlationId. Idempotent caller-side. */
export async function linkEvent(params: LinkEventParams): Promise<CorrelationLink> {
  const [row] = await db
    .insert(correlationLinksTable)
    .values({
      orgId: params.orgId ?? null,
      correlationId: params.correlationId,
      primitive: params.primitive,
      primitiveId: params.primitiveId,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
      workflowRunId: params.workflowRunId ?? null,
      domain: params.domain ?? "general",
      metadata: params.metadata ?? {},
    })
    .returning();
  return row;
}

export interface QueryCorrelationOptions {
  orgId?: number | null;
  primitive?: Primitive;
  limit?: number;
}

/** Fetch every primitive event sharing a correlationId, oldest-first. */
export async function getCorrelatedEvents(
  correlationId: string,
  options: QueryCorrelationOptions = {},
): Promise<CorrelationLink[]> {
  const conditions = [eq(correlationLinksTable.correlationId, correlationId)];
  if (options.orgId != null) conditions.push(eq(correlationLinksTable.orgId, options.orgId));
  if (options.primitive) conditions.push(eq(correlationLinksTable.primitive, options.primitive));

  return db
    .select()
    .from(correlationLinksTable)
    .where(and(...conditions))
    .orderBy(correlationLinksTable.occurredAt)
    .limit(options.limit ?? 500);
}

/** Fetch every event linked to a workflow run across primitives. */
export async function getEventsForWorkflowRun(
  workflowRunId: string,
  options: QueryCorrelationOptions = {},
): Promise<CorrelationLink[]> {
  const conditions = [eq(correlationLinksTable.workflowRunId, workflowRunId)];
  if (options.orgId != null) conditions.push(eq(correlationLinksTable.orgId, options.orgId));
  return db
    .select()
    .from(correlationLinksTable)
    .where(and(...conditions))
    .orderBy(correlationLinksTable.occurredAt)
    .limit(options.limit ?? 500);
}

/** Fetch every event linked to an entity across primitives. */
export async function getEventsForEntity(
  entityType: string,
  entityId: string,
  options: QueryCorrelationOptions = {},
): Promise<CorrelationLink[]> {
  const conditions = [
    eq(correlationLinksTable.entityType, entityType),
    eq(correlationLinksTable.entityId, entityId),
  ];
  if (options.orgId != null) conditions.push(eq(correlationLinksTable.orgId, options.orgId));
  return db
    .select()
    .from(correlationLinksTable)
    .where(and(...conditions))
    .orderBy(desc(correlationLinksTable.occurredAt))
    .limit(options.limit ?? 200);
}
