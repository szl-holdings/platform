/**
 * Decision Records — explicit, durable artifacts that capture every
 * consequential decision with backlinks into the Outcome Graph, Proof Chain,
 * Covenant Policy version, simulation snapshot, approval, and workflow run.
 *
 * A decision record is the canonical "decision memory" entity. It can be
 * queried later to answer: who decided, why, on what evidence, what was
 * predicted, what actually happened, and what we learned.
 */

import {
  db,
  decisionRecordsTable,
  policyVersionsTable,
  fabricSimulationSnapshotsTable,
  type DecisionRecord,
  type InsertDecisionRecord,
  type PolicyVersion,
  type FabricSimulationSnapshot,
} from "@szl-holdings/db";
import { and, desc, eq } from "drizzle-orm";
import { linkEvent } from "./correlation";

export type { DecisionRecord, PolicyVersion, FabricSimulationSnapshot };
export type SimulationSnapshot = FabricSimulationSnapshot;

export interface RecordDecisionParams extends Omit<InsertDecisionRecord, "id"> {}

/**
 * Persist a decision record. If the caller supplies a `correlationId` and/or
 * `workflowRunId`, the fabric automatically emits a corresponding
 * `decision_record` correlation link so Workflow 360 / Entity Investigation
 * timelines surface the decision without callers having to remember to call
 * `linkEvent` separately.
 *
 * The auto-emit is best-effort: a link-emit failure is logged but does not
 * roll back the decision insert, since the decision record is the canonical
 * artifact and the correlation index is a derived view.
 */
export async function recordDecision(params: RecordDecisionParams): Promise<DecisionRecord> {
  const [row] = await db.insert(decisionRecordsTable).values(params).returning();
  if (row.correlationId || row.workflowRunId) {
    try {
      await linkEvent({
        correlationId: row.correlationId ?? `decision:${row.id}`,
        primitive: "decision_record",
        primitiveId: String(row.id),
        orgId: row.orgId,
        entityType: row.entityType ?? null,
        entityId: row.entityId ?? null,
        workflowRunId: row.workflowRunId ?? null,
        domain: row.domain,
        metadata: { title: row.title, status: row.status },
      });
    } catch {
      // Derived index; intentional best-effort.
    }
  }
  return row;
}

export interface SnapshotPolicyParams {
  orgId?: number | null;
  policyId: string;
  version: string;
  policyName: string;
  effect: "allow" | "deny";
  body: Record<string, unknown>;
  authoredByUserId?: number | null;
}

/** Freeze a policy at a specific version so a decision can be replayed. */
export async function snapshotPolicy(params: SnapshotPolicyParams): Promise<PolicyVersion> {
  const [row] = await db
    .insert(policyVersionsTable)
    .values({
      orgId: params.orgId ?? null,
      policyId: params.policyId,
      version: params.version,
      policyName: params.policyName,
      effect: params.effect,
      body: params.body,
      authoredByUserId: params.authoredByUserId ?? null,
    })
    .returning();
  return row;
}

export interface SnapshotSimulationParams {
  orgId?: number | null;
  domain?: FabricSimulationSnapshot["domain"];
  scenarioId: string;
  scenarioName: string;
  inputs?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  results?: Record<string, unknown>;
  confidenceInterval?: Record<string, unknown>;
  iterations?: number | null;
  seed?: string | null;
}

export async function snapshotSimulation(params: SnapshotSimulationParams): Promise<FabricSimulationSnapshot> {
  const [row] = await db
    .insert(fabricSimulationSnapshotsTable)
    .values({
      orgId: params.orgId ?? null,
      domain: params.domain ?? "general",
      scenarioId: params.scenarioId,
      scenarioName: params.scenarioName,
      inputs: params.inputs ?? {},
      parameters: params.parameters ?? {},
      results: params.results ?? {},
      confidenceInterval: params.confidenceInterval ?? {},
      iterations: params.iterations ?? null,
      seed: params.seed ?? null,
    })
    .returning();
  return row;
}

export interface RecordActualOutcomeParams {
  decisionId: number;
  /** Caller's authenticated org. Pass `null` only for platform-admin contexts. */
  orgId: number | null;
  actualOutcome: Record<string, unknown>;
  predictionError?: number | null;
  status?: DecisionRecord["status"];
}

/**
 * Record the realized outcome and optional prediction error against a
 * decision. Enforces tenant isolation: callers MUST pass their org id and
 * the update only succeeds if the record belongs to that org (or the row
 * is platform-scoped and the caller is platform-admin, signaled by orgId
 * `null`).
 */
export async function recordActualOutcome(params: RecordActualOutcomeParams): Promise<DecisionRecord | null> {
  const conditions: any[] = [eq(decisionRecordsTable.id, params.decisionId)];
  if (params.orgId != null) conditions.push(eq(decisionRecordsTable.orgId, params.orgId));
  const [row] = await db
    .update(decisionRecordsTable)
    .set({
      actualOutcome: params.actualOutcome,
      predictionError: params.predictionError ?? null,
      status: params.status ?? "executed",
      updatedAt: new Date(),
    })
    .where(and(...conditions))
    .returning();
  return row ?? null;
}

/**
 * Fetch a single decision by id. Org isolation: pass the caller's org id;
 * the row is returned only if it belongs to that org (or is platform-scoped
 * and the caller is platform-admin, signaled by orgId `null`).
 */
export async function getDecision(id: number, orgId: number | null): Promise<DecisionRecord | null> {
  const conditions: any[] = [eq(decisionRecordsTable.id, id)];
  if (orgId != null) conditions.push(eq(decisionRecordsTable.orgId, orgId));
  const [row] = await db
    .select()
    .from(decisionRecordsTable)
    .where(and(...conditions))
    .limit(1);
  return row ?? null;
}

export interface ListDecisionsOptions {
  orgId?: number | null;
  domain?: DecisionRecord["domain"];
  entityType?: string;
  entityId?: string;
  ownerUserId?: number;
  workflowRunId?: string;
  recommendationId?: string;
  correlationId?: string;
  limit?: number;
}

export async function listDecisions(options: ListDecisionsOptions = {}): Promise<DecisionRecord[]> {
  const conditions: any[] = [];
  if (options.orgId != null) conditions.push(eq(decisionRecordsTable.orgId, options.orgId));
  if (options.domain) conditions.push(eq(decisionRecordsTable.domain, options.domain));
  if (options.entityType) conditions.push(eq(decisionRecordsTable.entityType, options.entityType));
  if (options.entityId) conditions.push(eq(decisionRecordsTable.entityId, options.entityId));
  if (options.ownerUserId != null) conditions.push(eq(decisionRecordsTable.ownerUserId, options.ownerUserId));
  if (options.workflowRunId) conditions.push(eq(decisionRecordsTable.workflowRunId, options.workflowRunId));
  if (options.recommendationId) conditions.push(eq(decisionRecordsTable.recommendationId, options.recommendationId));
  if (options.correlationId) conditions.push(eq(decisionRecordsTable.correlationId, options.correlationId));

  const q = db.select().from(decisionRecordsTable).orderBy(desc(decisionRecordsTable.decidedAt)).limit(options.limit ?? 100);
  return conditions.length > 0 ? await q.where(and(...conditions)) : await q;
}
