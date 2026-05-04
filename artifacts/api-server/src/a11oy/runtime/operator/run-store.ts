import { randomUUID } from 'node:crypto';

export type StepStatus = 'pending' | 'awaiting_approval' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed' | 'skipped';
export type RunStatus = 'planning' | 'awaiting_approval' | 'executing' | 'completed' | 'failed' | 'cancelled';

export interface PlanStep {
  stepId: string;
  stepNumber: number;
  title: string;
  description: string;
  toolId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  sideEffects: string[];
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  status: StepStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedReason?: string;
  result?: Record<string, unknown>;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}

export interface AuditEntry {
  entryId: string;
  runId: string;
  stepId?: string;
  eventType: 'run_created' | 'plan_generated' | 'step_approved' | 'step_rejected' | 'step_executing' | 'step_completed' | 'step_failed' | 'run_completed' | 'run_failed' | 'run_cancelled';
  actor: string;
  detail: string;
  payload?: Record<string, unknown>;
  timestamp: string;
}

export interface OperatorRun {
  runId: string;
  intent: string;
  vertical: string;
  requestedBy: string;
  status: RunStatus;
  plan: PlanStep[];
  auditLog: AuditEntry[];
  currentStepIndex: number;
  planSummary: string;
  estimatedSideEffects: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
}

const runs = new Map<string, OperatorRun>();

function now(): string {
  return new Date().toISOString();
}

function auditEntry(
  runId: string,
  eventType: AuditEntry['eventType'],
  actor: string,
  detail: string,
  stepId?: string,
  payload?: Record<string, unknown>,
): AuditEntry {
  return {
    entryId: `audit-${randomUUID().slice(0, 8)}`,
    runId,
    stepId,
    eventType,
    actor,
    detail,
    payload,
    timestamp: now(),
  };
}

async function persistRun(run: OperatorRun): Promise<void> {
  try {
    const { db } = await import('@szl-holdings/db');
    const { a11oyOperatorRunsTable } = await import('@szl-holdings/db/schema');
    await db.insert(a11oyOperatorRunsTable).values({
      runId: run.runId,
      intent: run.intent,
      vertical: run.vertical,
      requestedBy: run.requestedBy,
      status: run.status,
      plan: run.plan as unknown as Record<string, unknown>[],
      auditLog: run.auditLog as unknown as Record<string, unknown>[],
      currentStepIndex: run.currentStepIndex,
      planSummary: run.planSummary,
      estimatedSideEffects: run.estimatedSideEffects,
      error: run.error ?? null,
      createdAt: new Date(run.createdAt),
      updatedAt: new Date(run.updatedAt),
      completedAt: run.completedAt ? new Date(run.completedAt) : null,
    }).onConflictDoUpdate({
      target: a11oyOperatorRunsTable.runId,
      set: {
        status: run.status,
        plan: run.plan as unknown as Record<string, unknown>[],
        auditLog: run.auditLog as unknown as Record<string, unknown>[],
        currentStepIndex: run.currentStepIndex,
        error: run.error ?? null,
        updatedAt: new Date(run.updatedAt),
        completedAt: run.completedAt ? new Date(run.completedAt) : null,
      },
    });
  } catch { /* non-fatal */ }
}

export function createRun(opts: {
  intent: string;
  vertical: string;
  requestedBy: string;
  plan: Omit<PlanStep, 'stepId' | 'status'>[];
  planSummary: string;
  estimatedSideEffects: string[];
}): OperatorRun {
  const runId = `op-run-${randomUUID().slice(0, 8)}`;
  const ts = now();

  const steps: PlanStep[] = opts.plan.map((s) => ({
    ...s,
    stepId: `step-${randomUUID().slice(0, 8)}`,
    status: s.requiresApproval ? 'awaiting_approval' : 'pending',
  }));

  const run: OperatorRun = {
    runId,
    intent: opts.intent,
    vertical: opts.vertical,
    requestedBy: opts.requestedBy,
    status: 'awaiting_approval',
    plan: steps,
    auditLog: [
      auditEntry(runId, 'run_created', opts.requestedBy, `Run created for intent: "${opts.intent.slice(0, 120)}"`),
      auditEntry(runId, 'plan_generated', 'a11oy-planner', `Plan generated with ${steps.length} steps. Summary: ${opts.planSummary.slice(0, 200)}`, undefined, {
        stepCount: steps.length,
        estimatedSideEffects: opts.estimatedSideEffects,
      }),
    ],
    currentStepIndex: 0,
    planSummary: opts.planSummary,
    estimatedSideEffects: opts.estimatedSideEffects,
    createdAt: ts,
    updatedAt: ts,
  };

  runs.set(runId, run);
  void persistRun(run);
  return run;
}

export function getRun(runId: string): OperatorRun | undefined {
  return runs.get(runId);
}

export async function fetchRun(runId: string): Promise<OperatorRun | undefined> {
  const cached = runs.get(runId);
  if (cached) return cached;
  try {
    const { db } = await import('@szl-holdings/db');
    const { a11oyOperatorRunsTable } = await import('@szl-holdings/db/schema');
    const { eq } = await import('drizzle-orm');
    const rows = await db.select().from(a11oyOperatorRunsTable).where(eq(a11oyOperatorRunsTable.runId, runId)).limit(1);
    if (rows.length === 0) return undefined;
    const r = rows[0];
    const run: OperatorRun = {
      runId: r.runId,
      intent: r.intent,
      vertical: r.vertical,
      requestedBy: r.requestedBy,
      status: r.status as RunStatus,
      plan: (r.plan as PlanStep[]) ?? [],
      auditLog: (r.auditLog as AuditEntry[]) ?? [],
      currentStepIndex: r.currentStepIndex,
      planSummary: r.planSummary,
      estimatedSideEffects: (r.estimatedSideEffects as string[]) ?? [],
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      completedAt: r.completedAt?.toISOString(),
      error: r.error ?? undefined,
    };
    runs.set(run.runId, run);
    return run;
  } catch { return undefined; }
}

export function listRuns(limit = 50): OperatorRun[] {
  return [...runs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export async function listRunsFromDb(limit = 50): Promise<OperatorRun[]> {
  try {
    const { db } = await import('@szl-holdings/db');
    const { a11oyOperatorRunsTable } = await import('@szl-holdings/db/schema');
    const { desc: descOp } = await import('drizzle-orm');
    const rows = await db
      .select()
      .from(a11oyOperatorRunsTable)
      .orderBy(descOp(a11oyOperatorRunsTable.createdAt))
      .limit(limit);
    const result: OperatorRun[] = rows.map((r) => ({
      runId: r.runId,
      intent: r.intent,
      vertical: r.vertical,
      requestedBy: r.requestedBy,
      status: r.status as RunStatus,
      plan: (r.plan as PlanStep[]) ?? [],
      auditLog: (r.auditLog as AuditEntry[]) ?? [],
      currentStepIndex: r.currentStepIndex,
      planSummary: r.planSummary,
      estimatedSideEffects: (r.estimatedSideEffects as string[]) ?? [],
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      completedAt: r.completedAt?.toISOString(),
      error: r.error ?? undefined,
    }));
    // Warm the in-memory cache from DB results
    for (const run of result) {
      if (!runs.has(run.runId)) runs.set(run.runId, run);
    }
    return result;
  } catch {
    return listRuns(limit);
  }
}

export function approveStep(runId: string, stepId: string, approvedBy: string): OperatorRun | null {
  const run = runs.get(runId);
  if (!run) return null;
  const step = run.plan.find((s) => s.stepId === stepId);
  if (!step) return null;
  if (step.status !== 'awaiting_approval') return null;

  step.status = 'approved';
  step.approvedBy = approvedBy;
  step.approvedAt = now();
  run.auditLog.push(auditEntry(runId, 'step_approved', approvedBy, `Step "${step.title}" approved.`, stepId, { toolId: step.toolId }));
  run.updatedAt = now();

  const allApprovedOrDone = run.plan.every((s) => ['approved', 'pending', 'completed', 'failed', 'skipped'].includes(s.status));
  if (allApprovedOrDone) {
    run.status = 'executing';
  }

  runs.set(runId, run);
  void persistRun(run);
  return run;
}

export function rejectStep(runId: string, stepId: string, rejectedBy: string, reason: string): OperatorRun | null {
  const run = runs.get(runId);
  if (!run) return null;
  const step = run.plan.find((s) => s.stepId === stepId);
  if (!step) return null;

  step.status = 'rejected';
  step.rejectedBy = rejectedBy;
  step.rejectedReason = reason;
  run.auditLog.push(auditEntry(runId, 'step_rejected', rejectedBy, `Step "${step.title}" rejected. Reason: ${reason}`, stepId));
  run.updatedAt = now();
  runs.set(runId, run);
  void persistRun(run);
  return run;
}

export function recordStepExecution(
  runId: string,
  stepId: string,
  result: Record<string, unknown> | null,
  error: string | null,
  durationMs: number,
): OperatorRun | null {
  const run = runs.get(runId);
  if (!run) return null;
  const step = run.plan.find((s) => s.stepId === stepId);
  if (!step) return null;

  const ts = now();
  if (error) {
    step.status = 'failed';
    step.error = error;
    step.completedAt = ts;
    step.durationMs = durationMs;
    run.auditLog.push(auditEntry(runId, 'step_failed', 'a11oy-executor', `Step "${step.title}" failed: ${error}`, stepId, { durationMs }));
  } else {
    step.status = 'completed';
    step.result = result ?? {};
    step.completedAt = ts;
    step.durationMs = durationMs;
    run.auditLog.push(auditEntry(runId, 'step_completed', 'a11oy-executor', `Step "${step.title}" completed successfully.`, stepId, { durationMs, output: result }));
  }

  run.updatedAt = ts;

  const allDone = run.plan.every((s) => ['completed', 'failed', 'rejected', 'skipped'].includes(s.status));
  if (allDone) {
    const anyFailed = run.plan.some((s) => s.status === 'failed');
    run.status = anyFailed ? 'failed' : 'completed';
    run.completedAt = ts;
    run.auditLog.push(auditEntry(runId, anyFailed ? 'run_failed' : 'run_completed', 'a11oy-executor', `Run ${anyFailed ? 'completed with failures' : 'completed successfully'}.`));
  }

  runs.set(runId, run);
  void persistRun(run);
  return run;
}

export function getReplayData(runId: string): {
  runId: string;
  intent: string;
  auditLog: AuditEntry[];
  steps: PlanStep[];
  timeline: Array<{ timestamp: string; event: string; actor: string; stepId?: string }>;
} | null {
  const run = runs.get(runId);
  if (!run) return null;

  const timeline = run.auditLog.map((e) => ({
    timestamp: e.timestamp,
    event: e.detail,
    actor: e.actor,
    stepId: e.stepId,
  }));

  return {
    runId: run.runId,
    intent: run.intent,
    auditLog: run.auditLog,
    steps: run.plan,
    timeline,
  };
}

export function hydrateRunStore(loaded: OperatorRun[]): void {
  for (const run of loaded) {
    if (!runs.has(run.runId)) runs.set(run.runId, run);
  }
}
