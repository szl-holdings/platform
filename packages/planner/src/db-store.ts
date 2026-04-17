import { eq, and, desc, sql } from "drizzle-orm";
import type { PgDatabase, PgTable } from "drizzle-orm/pg-core";
import type { PlanGraph, PlanStatus, PlanStepStatus } from "./types.js";
import { PlanGraphSchema, PlanNotFoundError } from "./types.js";
import type { PlanStore, PlanStoreQuery } from "./store.js";

type Drizzle = PgDatabase<any, any, any>;
type AnyTable = PgTable<any> & Record<string, any>;

export interface DbPlanStoreOptions {
  db: Drizzle;
  plansTable: AnyTable;
  planStepsTable: AnyTable;
}

type DbPlanStatus =
  | "draft"
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "aborted"
  | "rolled-back";

type DbStepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

const PLAN_STATUS_TO_DB: Record<PlanStatus, DbPlanStatus> = {
  draft: "draft",
  ready: "pending",
  executing: "running",
  completed: "completed",
  failed: "failed",
  cancelled: "aborted",
};

const STEP_STATUS_TO_DB: Record<PlanStepStatus, DbStepStatus> = {
  pending: "pending",
  ready: "pending",
  running: "running",
  blocked: "pending",
  completed: "completed",
  failed: "failed",
  skipped: "skipped",
};

/**
 * Postgres-backed PlanStore that writes plan graphs to the existing
 * `plans` and `plan_steps` tables. Status enums are mapped onto the DB
 * vocabulary; the original planner status is preserved in metadata so
 * round-tripping is lossless.
 */
export class DbPlanStore implements PlanStore {
  private readonly db: Drizzle;
  private readonly plansTable: AnyTable;
  private readonly planStepsTable: AnyTable;

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
    if (!planRowId) throw new Error("Failed to upsert plan row");

    // Replace step set on every put (plans are immutable in our flow).
    await this.db
      .delete(this.planStepsTable)
      .where(eq(this.planStepsTable.planId, planRowId));

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
    const planRows = await this.db
      .select()
      .from(this.plansTable)
      .where(eq(this.plansTable.planId, planId))
      .limit(1);
    const row = planRows[0];
    if (!row) return undefined;

    const stepRows = await this.db
      .select()
      .from(this.planStepsTable)
      .where(eq(this.planStepsTable.planId, row.id))
      .orderBy(this.planStepsTable.stepIndex);

    return rowToPlan(row, stepRows);
  }

  async list(query: PlanStoreQuery = {}): Promise<{ items: PlanGraph[]; total: number }> {
    const filters = this.buildFilters(query);
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const planRows = await this.db
      .select()
      .from(this.plansTable)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(this.plansTable.createdAt))
      .limit(limit)
      .offset(offset);

    const totalRows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.plansTable)
      .where(filters.length > 0 ? and(...filters) : undefined);
    const total = Number(totalRows[0]?.count ?? 0);

    if (planRows.length === 0) return { items: [], total };

    const planIds = planRows.map((r) => r.id);
    const stepRows = await this.db
      .select()
      .from(this.planStepsTable)
      .where(sql`${this.planStepsTable.planId} = ANY(${planIds}::uuid[])`)
      .orderBy(this.planStepsTable.stepIndex);

    const stepsByPlan = new Map<string, typeof stepRows>();
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
    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.plansTable);
    return Number(rows[0]?.count ?? 0);
  }

  private buildFilters(query: PlanStoreQuery) {
    const filters: any[] = [];
    if (query.agentId) filters.push(eq(this.plansTable.agentId, query.agentId));
    if (query.sessionId) filters.push(eq(this.plansTable.sessionId, query.sessionId));
    if (query.workflowId) filters.push(eq(this.plansTable.workflowId, query.workflowId));
    if (query.parentPlanId) filters.push(eq(this.plansTable.parentPlanId, query.parentPlanId));
    if (query.status) {
      const dbStatus = PLAN_STATUS_TO_DB[query.status];
      if (dbStatus) filters.push(eq(this.plansTable.status, dbStatus));
    }
    return filters;
  }
}

function rowToPlan(row: any, stepRows: any[]): PlanGraph {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  const planner = (meta.__planner ?? {}) as Record<string, unknown>;
  const userMeta: Record<string, unknown> = { ...meta };
  delete userMeta.__planner;

  const steps = stepRows.map((s) => stepRowToStep(s));
  const executionOrder =
    (planner.executionOrder as string[] | undefined) ?? steps.map((s) => s.stepId);

  const candidate = {
    planId: row.planId,
    parentPlanId: row.parentPlanId ?? undefined,
    fallbackOf: (planner.fallbackOf as string | undefined) ?? undefined,
    rank: (planner.rank as number | undefined) ?? 0,
    title: row.title,
    objective: row.description ?? row.title,
    status: (planner.originalStatus as PlanStatus | undefined) ?? "draft",
    steps,
    executionOrder,
    estimatedCostUsd: (planner.estimatedCostUsd as number | undefined) ?? 0,
    estimatedValue: (planner.estimatedValue as number | undefined) ?? 0.5,
    estimatedRisk: (planner.estimatedRisk as number | undefined) ?? 0.1,
    riskLevel: (planner.riskLevel as PlanGraph["riskLevel"] | undefined) ?? "low",
    confidence: row.confidence ?? 0.7,
    fallbacks: (planner.fallbacks as string[] | undefined) ?? [],
    context: (planner.context as Record<string, unknown> | undefined) ?? {},
    metadata: userMeta,
    createdAt: new Date(row.createdAt).getTime(),
    updatedAt: new Date(row.updatedAt).getTime(),
  };

  return PlanGraphSchema.parse(candidate);
}

function stepRowToStep(s: any) {
  const meta = (s.metadata ?? {}) as Record<string, unknown>;
  const planner = (meta.__planner ?? {}) as Record<string, unknown>;
  const userMeta: Record<string, unknown> = { ...meta };
  delete userMeta.__planner;
  return {
    stepId: (planner.stepId as string | undefined) ?? s.id,
    index: (planner.index as number | undefined) ?? s.stepIndex,
    title: s.title,
    description: s.description ?? "",
    dependsOn: (s.dependsOnStepIds as string[] | undefined) ?? [],
    status: (planner.originalStatus as PlanStepStatus | undefined) ?? s.status,
    route:
      (planner.route as any) ?? {
        routeClass: "generation",
        estimatedCostUsd: 0,
        selectedBy: "priority",
        fallbackChain: [],
      },
    estimatedValue: (planner.estimatedValue as number | undefined) ?? 0.5,
    estimatedRisk: (planner.estimatedRisk as number | undefined) ?? 0.1,
    riskLevel: (planner.riskLevel as any) ?? "low",
    requiredEvidence: (planner.requiredEvidence as string[] | undefined) ?? [],
    requiredApproval: !!s.approvalRequired,
    approvalReason: (planner.approvalReason as string | undefined) ?? undefined,
    rollbackPoints: (planner.rollbackPoints as any[] | undefined) ?? [],
    inputs: (s.inputs ?? {}) as Record<string, unknown>,
    metadata: userMeta,
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
