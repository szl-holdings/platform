import { and, desc, eq, type SQL, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import type { PlanStore, PlanStoreQuery } from './store.js';
import type { PlanGraph, PlanStatus, PlanStepStatus } from './types.js';
import { PlanGraphSchema, PlanNotFoundError } from './types.js';

// We accept any node-pg drizzle instance — concrete schema types are owned
// by the caller, not this package.
type Drizzle = NodePgDatabase<Record<string, unknown>>;

/**
 * Structural shape of the columns this store reads/writes on the `plans`
 * table. Callers supply the actual Drizzle table; the store does not import
 * schema from `@szl-holdings/db` to avoid a hard cross-package coupling.
 */
export interface PlansTableLike extends PgTable {
  id: PgColumn;
  planId: PgColumn;
  agentId: PgColumn;
  sessionId: PgColumn;
  workflowId: PgColumn;
  parentPlanId: PgColumn;
  title: PgColumn;
  description: PgColumn;
  status: PgColumn;
  totalSteps: PgColumn;
  metadata: PgColumn;
  createdAt: PgColumn;
  updatedAt: PgColumn;
}

/** Structural shape required on the `plan_steps` table. */
export interface PlanStepsTableLike extends PgTable {
  id: PgColumn;
  planId: PgColumn;
  stepIndex: PgColumn;
  title: PgColumn;
  description: PgColumn;
  status: PgColumn;
  approvalRequired: PgColumn;
  dependsOnStepIds: PgColumn;
  inputs: PgColumn;
  metadata: PgColumn;
}

export interface DbPlanStoreOptions {
  db: Drizzle;
  plansTable: PlansTableLike;
  planStepsTable: PlanStepsTableLike;
}

interface PlanRow {
  id: string;
  planId: string;
  parentPlanId: string | null;
  title: string;
  description: string | null;
  confidence?: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PlanStepRow {
  id: string;
  planId: string;
  stepIndex: number;
  title: string;
  description: string | null;
  status: string;
  approvalRequired: boolean | null;
  dependsOnStepIds: string[] | null;
  inputs: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}

type DbPlanStatus =
  | 'draft'
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'aborted'
  | 'rolled-back';

type DbStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

const PLAN_STATUS_TO_DB: Record<PlanStatus, DbPlanStatus> = {
  draft: 'draft',
  ready: 'pending',
  executing: 'running',
  completed: 'completed',
  failed: 'failed',
  cancelled: 'aborted',
};

const STEP_STATUS_TO_DB: Record<PlanStepStatus, DbStepStatus> = {
  pending: 'pending',
  ready: 'pending',
  running: 'running',
  blocked: 'pending',
  completed: 'completed',
  failed: 'failed',
  skipped: 'skipped',
};

/**
 * Postgres-backed PlanStore that writes plan graphs to the existing
 * `plans` and `plan_steps` tables. Status enums are mapped onto the DB
 * vocabulary; the original planner status is preserved in metadata so
 * round-tripping is lossless.
 */
export class DbPlanStore implements PlanStore {
  private readonly db: Drizzle;
  private readonly plansTable: PlansTableLike;
  private readonly planStepsTable: PlanStepsTableLike;

  constructor(opts: DbPlanStoreOptions) {
    this.db = opts.db;
    this.plansTable = opts.plansTable;
    this.planStepsTable = opts.planStepsTable;
  }

  async put(plan: PlanGraph): Promise<void> {
    const dbStatus = PLAN_STATUS_TO_DB[plan.status];
    const planMetadata: Record<string, unknown> = {
      ...plan.metadata,
      __planner: {
        originalStatus: plan.status,
        rank: plan.rank,
        executionOrder: plan.executionOrder,
        estimatedCostUsd: plan.estimatedCostUsd,
        estimatedRisk: plan.estimatedRisk,
        estimatedValue: plan.estimatedValue,
        riskLevel: plan.riskLevel,
        fallbacks: plan.fallbacks,
        fallbackOf: plan.fallbackOf,
        context: plan.context,
      },
    };

    const inserted = await this.db
      .insert(this.plansTable)
      .values({
        planId: plan.planId,
        agentId: (plan.context.agentId as string | undefined) ?? null,
        sessionId: (plan.context.sessionId as string | undefined) ?? null,
        workflowId: (plan.context.workflowId as string | undefined) ?? null,
        traceId: (plan.context.traceId as string | undefined) ?? null,
        title: plan.title,
        description: plan.objective,
        goal: { objective: plan.objective },
        status: dbStatus,
        totalSteps: plan.steps.length,
        parentPlanId: plan.parentPlanId ?? null,
        confidence: plan.confidence,
        metadata: planMetadata,
        createdAt: new Date(plan.createdAt),
        updatedAt: new Date(plan.updatedAt),
      })
      .onConflictDoUpdate({
        target: this.plansTable.planId,
        set: {
          title: plan.title,
          description: plan.objective,
          status: dbStatus,
          totalSteps: plan.steps.length,
          confidence: plan.confidence,
          metadata: planMetadata,
          updatedAt: new Date(plan.updatedAt),
        },
      })
      .returning({ id: this.plansTable.id });

    const planRowId = inserted[0]?.id;
    if (!planRowId) throw new Error('Failed to upsert plan row');

    // Replace step set on every put (plans are immutable in our flow).
    await this.db.delete(this.planStepsTable).where(eq(this.planStepsTable.planId, planRowId));

    const orderIndex = new Map(plan.executionOrder.map((id, i) => [id, i] as const));
    if (plan.steps.length > 0) {
      await this.db.insert(this.planStepsTable).values(
        plan.steps.map((s) => ({
          planId: planRowId,
          stepIndex: orderIndex.get(s.stepId) ?? s.index,
          title: s.title,
          description: s.description,
          status: STEP_STATUS_TO_DB[s.status],
          dependsOnStepIds: s.dependsOn,
          inputs: s.inputs,
          approvalRequired: s.requiredApproval,
          confidence: clamp01(1 - s.estimatedRisk),
          metadata: {
            ...s.metadata,
            __planner: {
              stepId: s.stepId,
              index: s.index,
              originalStatus: s.status,
              route: s.route,
              estimatedRisk: s.estimatedRisk,
              estimatedValue: s.estimatedValue,
              riskLevel: s.riskLevel,
              requiredEvidence: s.requiredEvidence,
              approvalReason: s.approvalReason,
              rollbackPoints: s.rollbackPoints,
            },
          },
        })),
      );
    }
  }

  async get(planId: string): Promise<PlanGraph | undefined> {
    const planRows = (await this.db
      .select()
      .from(this.plansTable)
      .where(eq(this.plansTable.planId, planId))
      .limit(1)) as unknown as PlanRow[];
    const row = planRows[0];
    if (!row) return undefined;

    const stepRows = (await this.db
      .select()
      .from(this.planStepsTable)
      .where(eq(this.planStepsTable.planId, row.id))
      .orderBy(this.planStepsTable.stepIndex)) as unknown as PlanStepRow[];

    return rowToPlan(row, stepRows);
  }

  async list(query: PlanStoreQuery = {}): Promise<{ items: PlanGraph[]; total: number }> {
    const filters = this.buildFilters(query);
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const planRows = (await this.db
      .select()
      .from(this.plansTable)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(this.plansTable.createdAt))
      .limit(limit)
      .offset(offset)) as unknown as PlanRow[];

    const totalRows = (await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.plansTable)
      .where(filters.length > 0 ? and(...filters) : undefined)) as Array<{ count: number }>;
    const total = Number(totalRows[0]?.count ?? 0);

    if (planRows.length === 0) return { items: [], total };

    const planIds = planRows.map((r) => r.id);
    const stepRows = (await this.db
      .select()
      .from(this.planStepsTable)
      .where(sql`${this.planStepsTable.planId} = ANY(${planIds}::uuid[])`)
      .orderBy(this.planStepsTable.stepIndex)) as unknown as PlanStepRow[];

    const stepsByPlan = new Map<string, PlanStepRow[]>();
    for (const s of stepRows) {
      const arr = stepsByPlan.get(s.planId) ?? [];
      arr.push(s);
      stepsByPlan.set(s.planId, arr);
    }

    const items = planRows.map((r) => rowToPlan(r, stepsByPlan.get(r.id) ?? []));
    return { items, total };
  }

  async delete(planId: string): Promise<void> {
    const deleted = await this.db
      .delete(this.plansTable)
      .where(eq(this.plansTable.planId, planId))
      .returning({ id: this.plansTable.id });
    if (deleted.length === 0) throw new PlanNotFoundError(planId);
  }

  async count(): Promise<number> {
    const rows = await this.db.select({ count: sql<number>`count(*)::int` }).from(this.plansTable);
    return Number(rows[0]?.count ?? 0);
  }

  private buildFilters(query: PlanStoreQuery): SQL[] {
    const filters: SQL[] = [];
    if (query.agentId) filters.push(eq(this.plansTable.agentId, query.agentId));
    if (query.sessionId) filters.push(eq(this.plansTable.sessionId, query.sessionId));
    if (query.workflowId) filters.push(eq(this.plansTable.workflowId, query.workflowId));
    if (query.parentPlanId) filters.push(eq(this.plansTable.parentPlanId, query.parentPlanId));
    if (query.status) {
      const dbStatus = PLAN_STATUS_TO_DB[query.status];
      if (dbStatus) filters.push(eq(this.plansTable.status, dbStatus));
    }
    if (query.orgId !== undefined) {
      // Tenant scoping: filter plans by orgId stored in metadata.__planner.context.
      filters.push(
        sql`(${this.plansTable.metadata}->'__planner'->'context'->>'orgId') = ${query.orgId}`,
      );
    }
    return filters;
  }
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}
function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}
function asNumber(v: unknown): number | undefined {
  return typeof v === 'number' ? v : undefined;
}
function asStringArray(v: unknown): string[] | undefined {
  return Array.isArray(v) && v.every((x) => typeof x === 'string') ? (v as string[]) : undefined;
}

function rowToPlan(row: PlanRow, stepRows: PlanStepRow[]): PlanGraph {
  const meta = asRecord(row.metadata);
  const planner = asRecord(meta['__planner']);
  const userMeta: Record<string, unknown> = { ...meta };
  delete userMeta['__planner'];

  const steps = stepRows.map((s) => stepRowToStep(s));
  const executionOrder = asStringArray(planner['executionOrder']) ?? steps.map((s) => s.stepId);
  const status = (asString(planner['originalStatus']) ?? 'draft') as PlanStatus;
  const riskLevel = (asString(planner['riskLevel']) ?? 'low') as PlanGraph['riskLevel'];

  const candidate = {
    planId: row.planId,
    parentPlanId: row.parentPlanId ?? undefined,
    fallbackOf: asString(planner['fallbackOf']),
    rank: asNumber(planner['rank']) ?? 0,
    title: row.title,
    objective: row.description ?? row.title,
    status,
    steps,
    executionOrder,
    estimatedCostUsd: asNumber(planner['estimatedCostUsd']) ?? 0,
    estimatedValue: asNumber(planner['estimatedValue']) ?? 0.5,
    estimatedRisk: asNumber(planner['estimatedRisk']) ?? 0.1,
    riskLevel,
    confidence: asNumber(row.confidence) ?? 0.7,
    fallbacks: asStringArray(planner['fallbacks']) ?? [],
    context: asRecord(planner['context']),
    metadata: userMeta,
    createdAt: new Date(row.createdAt).getTime(),
    updatedAt: new Date(row.updatedAt).getTime(),
  };

  return PlanGraphSchema.parse(candidate);
}

interface DecodedPlanStep {
  stepId: string;
  index: number;
  title: string;
  description: string;
  dependsOn: string[];
  status: PlanStepStatus;
  route: Record<string, unknown>;
  estimatedValue: number;
  estimatedRisk: number;
  riskLevel: string;
  requiredEvidence: string[];
  requiredApproval: boolean;
  approvalReason: string | undefined;
  rollbackPoints: unknown[];
  inputs: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

function stepRowToStep(s: PlanStepRow): DecodedPlanStep {
  const meta = asRecord(s.metadata);
  const planner = asRecord(meta['__planner']);
  const userMeta: Record<string, unknown> = { ...meta };
  delete userMeta['__planner'];
  const status = (asString(planner['originalStatus']) ?? s.status) as PlanStepStatus;
  const route = asRecord(planner['route']);
  const hasRoute = Object.keys(route).length > 0;
  return {
    stepId: asString(planner['stepId']) ?? s.id,
    index: asNumber(planner['index']) ?? s.stepIndex,
    title: s.title,
    description: s.description ?? '',
    dependsOn: s.dependsOnStepIds ?? [],
    status,
    route: hasRoute
      ? route
      : {
          routeClass: 'generation',
          estimatedCostUsd: 0,
          selectedBy: 'priority',
          fallbackChain: [],
        },
    estimatedValue: asNumber(planner['estimatedValue']) ?? 0.5,
    estimatedRisk: asNumber(planner['estimatedRisk']) ?? 0.1,
    riskLevel: asString(planner['riskLevel']) ?? 'low',
    requiredEvidence: asStringArray(planner['requiredEvidence']) ?? [],
    requiredApproval: !!s.approvalRequired,
    approvalReason: asString(planner['approvalReason']),
    rollbackPoints: Array.isArray(planner['rollbackPoints']) ? planner['rollbackPoints'] : [],
    inputs: s.inputs ?? {},
    metadata: userMeta,
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
