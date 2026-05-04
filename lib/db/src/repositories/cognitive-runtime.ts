/**
 * cognitive-runtime repository
 *
 * DB-backed persistence and retrieval for all eight A11oy Cognitive Runtime
 * modules: WorkerRegistry, CortexRouter, MemoryFabric, PhaseEngine, EventPlane,
 * ProofChain, Deployments, and GuidedOutputGuard rejections.
 *
 * All queries are tenant-scoped. tenantId is NEVER derived from caller-supplied
 * headers inside this module — callers must supply it from a trusted context.
 */

import { db } from '../index.js';
import {
  a11oyWorkersTable,
  a11oyRouteDecisionsTable,
  a11oyMemoryEventsTable,
  a11oyPhaseRunsTable,
  a11oyRuntimeEventsTable,
  a11oyCognitiveProofChainsTable,
  a11oyCognitiveDeploymentsTable,
  a11oyGuardrailRejectionsTable,
} from '../schema/a11oy_cognitive_runtime.js';
import type {
  A11oyWorker,
  A11oyRouteDecision,
  A11oyMemoryEvent,
  A11oyPhaseRun,
  A11oyRuntimeEvent,
  A11oyCognitiveProofChain,
  A11oyCognitiveDeployment,
  A11oyGuardrailRejection,
  InsertA11oyWorker,
  InsertA11oyRouteDecision,
  InsertA11oyMemoryEvent,
  InsertA11oyPhaseRun,
  InsertA11oyRuntimeEvent,
  InsertA11oyCognitiveProofChain,
  InsertA11oyCognitiveDeployment,
  InsertA11oyGuardrailRejection,
} from '../schema/a11oy_cognitive_runtime.js';
import { and, desc, eq, sql } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Workers
// ---------------------------------------------------------------------------

export async function dbInsertWorker(
  row: InsertA11oyWorker,
): Promise<void> {
  await db
    .insert(a11oyWorkersTable)
    .values(row)
    .onConflictDoNothing();
}

export async function dbUpdateWorkerStatus(
  workerId: string,
  tenantId: string,
  patch: Partial<Pick<A11oyWorker, 'status' | 'isDraining' | 'drainedAt' | 'uptimeSeconds' | 'requestsHandled' | 'errorsCount' | 'lastHeartbeatAt'>>,
): Promise<void> {
  await db
    .update(a11oyWorkersTable)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(a11oyWorkersTable.workerId, workerId), eq(a11oyWorkersTable.tenantId, tenantId)));
}

export async function dbListWorkers(
  tenantId: string,
  opts: { rolloutGroup?: string; status?: string; limit?: number } = {},
): Promise<A11oyWorker[]> {
  const conditions = [eq(a11oyWorkersTable.tenantId, tenantId)];
  if (opts.rolloutGroup) conditions.push(eq(a11oyWorkersTable.rolloutGroup, opts.rolloutGroup));
  if (opts.status) conditions.push(eq(a11oyWorkersTable.status, opts.status as A11oyWorker['status']));

  return db
    .select()
    .from(a11oyWorkersTable)
    .where(and(...conditions))
    .orderBy(desc(a11oyWorkersTable.registeredAt))
    .limit(opts.limit ?? 200);
}

export async function dbGetWorker(workerId: string, tenantId: string): Promise<A11oyWorker | undefined> {
  const [row] = await db
    .select()
    .from(a11oyWorkersTable)
    .where(and(eq(a11oyWorkersTable.workerId, workerId), eq(a11oyWorkersTable.tenantId, tenantId)))
    .limit(1);
  return row;
}

// ---------------------------------------------------------------------------
// Route Decisions
// ---------------------------------------------------------------------------

export async function dbInsertRouteDecision(row: InsertA11oyRouteDecision): Promise<void> {
  await db.insert(a11oyRouteDecisionsTable).values(row).onConflictDoNothing();
}

export async function dbListRouteDecisions(
  tenantId: string,
  opts: { requestId?: string; limit?: number; offset?: number } = {},
): Promise<{ records: A11oyRouteDecision[]; total: number }> {
  const conditions = [eq(a11oyRouteDecisionsTable.tenantId, tenantId)];
  if (opts.requestId) conditions.push(eq(a11oyRouteDecisionsTable.requestId, opts.requestId));

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(a11oyRouteDecisionsTable)
    .where(and(...conditions));
  const total = countRow?.count ?? 0;

  const records = await db
    .select()
    .from(a11oyRouteDecisionsTable)
    .where(and(...conditions))
    .orderBy(desc(a11oyRouteDecisionsTable.decidedAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);

  return { records, total };
}

// ---------------------------------------------------------------------------
// Memory Events
// ---------------------------------------------------------------------------

export async function dbInsertMemoryEvent(row: InsertA11oyMemoryEvent): Promise<void> {
  await db.insert(a11oyMemoryEventsTable).values(row).onConflictDoNothing();
}

export async function dbListMemoryEvents(
  tenantId: string,
  opts: { memoryKey?: string; eventType?: string; limit?: number; offset?: number } = {},
): Promise<{ records: A11oyMemoryEvent[]; total: number }> {
  const conditions = [eq(a11oyMemoryEventsTable.tenantId, tenantId)];
  if (opts.memoryKey) conditions.push(eq(a11oyMemoryEventsTable.memoryKey, opts.memoryKey));
  if (opts.eventType) conditions.push(eq(a11oyMemoryEventsTable.eventType, opts.eventType as A11oyMemoryEvent['eventType']));

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(a11oyMemoryEventsTable)
    .where(and(...conditions));
  const total = countRow?.count ?? 0;

  const records = await db
    .select()
    .from(a11oyMemoryEventsTable)
    .where(and(...conditions))
    .orderBy(desc(a11oyMemoryEventsTable.occurredAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);

  return { records, total };
}

// ---------------------------------------------------------------------------
// Phase Runs
// ---------------------------------------------------------------------------

export async function dbInsertPhaseRun(row: InsertA11oyPhaseRun): Promise<void> {
  await db.insert(a11oyPhaseRunsTable).values(row).onConflictDoNothing();
}

export async function dbGetPhaseRun(phaseRunId: string, tenantId: string): Promise<A11oyPhaseRun | undefined> {
  const [row] = await db
    .select()
    .from(a11oyPhaseRunsTable)
    .where(and(eq(a11oyPhaseRunsTable.phaseRunId, phaseRunId), eq(a11oyPhaseRunsTable.tenantId, tenantId)))
    .limit(1);
  return row;
}

export async function dbListPhaseRuns(
  tenantId: string,
  opts: { requestId?: string; proofChainId?: string; phase?: string; limit?: number; offset?: number } = {},
): Promise<{ records: A11oyPhaseRun[]; total: number }> {
  const conditions = [eq(a11oyPhaseRunsTable.tenantId, tenantId)];
  if (opts.requestId) conditions.push(eq(a11oyPhaseRunsTable.requestId, opts.requestId));
  if (opts.proofChainId) conditions.push(eq(a11oyPhaseRunsTable.proofChainId, opts.proofChainId));
  if (opts.phase) conditions.push(eq(a11oyPhaseRunsTable.phase, opts.phase as A11oyPhaseRun['phase']));

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(a11oyPhaseRunsTable)
    .where(and(...conditions));
  const total = countRow?.count ?? 0;

  const records = await db
    .select()
    .from(a11oyPhaseRunsTable)
    .where(and(...conditions))
    .orderBy(desc(a11oyPhaseRunsTable.createdAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);

  return { records, total };
}

// ---------------------------------------------------------------------------
// Runtime Events (Event Plane)
// ---------------------------------------------------------------------------

export async function dbInsertRuntimeEvent(row: InsertA11oyRuntimeEvent): Promise<void> {
  await db.insert(a11oyRuntimeEventsTable).values(row).onConflictDoNothing();
}

export async function dbListRuntimeEvents(
  tenantId: string,
  opts: {
    eventType?: string;
    requestId?: string;
    routeDecisionId?: string;
    proofChainId?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<{ records: A11oyRuntimeEvent[]; total: number }> {
  const conditions = [eq(a11oyRuntimeEventsTable.tenantId, tenantId)];
  if (opts.eventType) conditions.push(eq(a11oyRuntimeEventsTable.eventType, opts.eventType as A11oyRuntimeEvent['eventType']));
  if (opts.requestId) conditions.push(eq(a11oyRuntimeEventsTable.requestId, opts.requestId));
  if (opts.routeDecisionId) conditions.push(eq(a11oyRuntimeEventsTable.routeDecisionId, opts.routeDecisionId));
  if (opts.proofChainId) conditions.push(eq(a11oyRuntimeEventsTable.proofChainId, opts.proofChainId));

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(a11oyRuntimeEventsTable)
    .where(and(...conditions));
  const total = countRow?.count ?? 0;

  const records = await db
    .select()
    .from(a11oyRuntimeEventsTable)
    .where(and(...conditions))
    .orderBy(desc(a11oyRuntimeEventsTable.occurredAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);

  return { records, total };
}

export async function dbGetRuntimeEventStats(
  tenantId: string,
): Promise<Record<string, number>> {
  const rows = await db
    .select({
      eventType: a11oyRuntimeEventsTable.eventType,
      count: sql<number>`count(*)::int`,
    })
    .from(a11oyRuntimeEventsTable)
    .where(eq(a11oyRuntimeEventsTable.tenantId, tenantId))
    .groupBy(a11oyRuntimeEventsTable.eventType);

  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.eventType] = row.count;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Proof Chains
// ---------------------------------------------------------------------------

export async function dbInsertProofChain(row: InsertA11oyCognitiveProofChain): Promise<void> {
  await db.insert(a11oyCognitiveProofChainsTable).values(row).onConflictDoNothing();
}

export async function dbGetProofChain(
  proofChainId: string,
  tenantId: string,
): Promise<A11oyCognitiveProofChain | undefined> {
  const [row] = await db
    .select()
    .from(a11oyCognitiveProofChainsTable)
    .where(
      and(
        eq(a11oyCognitiveProofChainsTable.proofChainId, proofChainId),
        eq(a11oyCognitiveProofChainsTable.tenantId, tenantId),
      ),
    )
    .limit(1);
  return row;
}

export async function dbListProofChains(
  tenantId: string,
  opts: { requestId?: string; limit?: number; offset?: number } = {},
): Promise<{ records: A11oyCognitiveProofChain[]; total: number }> {
  const conditions = [eq(a11oyCognitiveProofChainsTable.tenantId, tenantId)];
  if (opts.requestId) conditions.push(eq(a11oyCognitiveProofChainsTable.requestId, opts.requestId));

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(a11oyCognitiveProofChainsTable)
    .where(and(...conditions));
  const total = countRow?.count ?? 0;

  const records = await db
    .select()
    .from(a11oyCognitiveProofChainsTable)
    .where(and(...conditions))
    .orderBy(desc(a11oyCognitiveProofChainsTable.createdAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);

  return { records, total };
}

// ---------------------------------------------------------------------------
// Deployments
// ---------------------------------------------------------------------------

export async function dbInsertDeployment(row: InsertA11oyCognitiveDeployment): Promise<void> {
  await db.insert(a11oyCognitiveDeploymentsTable).values(row).onConflictDoNothing();
}

export async function dbUpdateDeploymentStatus(
  deploymentId: string,
  tenantId: string,
  patch: Partial<Pick<A11oyCognitiveDeployment, 'status' | 'approvedAt' | 'approvedBy' | 'activatedAt' | 'rolledBackAt' | 'rollbackReason' | 'validationResults'>>,
): Promise<void> {
  await db
    .update(a11oyCognitiveDeploymentsTable)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(a11oyCognitiveDeploymentsTable.deploymentId, deploymentId), eq(a11oyCognitiveDeploymentsTable.tenantId, tenantId)));
}

export async function dbGetDeployment(
  deploymentId: string,
  tenantId: string,
): Promise<A11oyCognitiveDeployment | undefined> {
  const [row] = await db
    .select()
    .from(a11oyCognitiveDeploymentsTable)
    .where(
      and(
        eq(a11oyCognitiveDeploymentsTable.deploymentId, deploymentId),
        eq(a11oyCognitiveDeploymentsTable.tenantId, tenantId),
      ),
    )
    .limit(1);
  return row;
}

export async function dbListDeployments(
  tenantId: string,
  opts: { status?: string; limit?: number; offset?: number } = {},
): Promise<{ records: A11oyCognitiveDeployment[]; total: number }> {
  const conditions = [eq(a11oyCognitiveDeploymentsTable.tenantId, tenantId)];
  if (opts.status) conditions.push(eq(a11oyCognitiveDeploymentsTable.status, opts.status as A11oyCognitiveDeployment['status']));

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(a11oyCognitiveDeploymentsTable)
    .where(and(...conditions));
  const total = countRow?.count ?? 0;

  const records = await db
    .select()
    .from(a11oyCognitiveDeploymentsTable)
    .where(and(...conditions))
    .orderBy(desc(a11oyCognitiveDeploymentsTable.createdAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);

  return { records, total };
}

// ---------------------------------------------------------------------------
// Guardrail Rejections
// ---------------------------------------------------------------------------

export async function dbInsertGuardrailRejection(row: InsertA11oyGuardrailRejection): Promise<void> {
  await db.insert(a11oyGuardrailRejectionsTable).values(row).onConflictDoNothing();
}

export async function dbListGuardrailRejections(
  tenantId: string,
  opts: { requestId?: string; guardRule?: string; limit?: number; offset?: number } = {},
): Promise<{ records: A11oyGuardrailRejection[]; total: number }> {
  const conditions = [eq(a11oyGuardrailRejectionsTable.tenantId, tenantId)];
  if (opts.requestId) conditions.push(eq(a11oyGuardrailRejectionsTable.requestId, opts.requestId));
  if (opts.guardRule) conditions.push(eq(a11oyGuardrailRejectionsTable.guardRule, opts.guardRule as A11oyGuardrailRejection['guardRule']));

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(a11oyGuardrailRejectionsTable)
    .where(and(...conditions));
  const total = countRow?.count ?? 0;

  const records = await db
    .select()
    .from(a11oyGuardrailRejectionsTable)
    .where(and(...conditions))
    .orderBy(desc(a11oyGuardrailRejectionsTable.rejectedAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);

  return { records, total };
}

