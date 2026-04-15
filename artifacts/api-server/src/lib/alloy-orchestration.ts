import { db } from "@szl-holdings/db";
import {
  alloySignals,
  alloyWorkflows,
  alloyWorkflowRuns,
  alloyApprovals,
  alloyActions,
  alloyArtifacts,
  alloyAuditLog,
  type InsertAlloyWorkflow,
  type InsertAlloyWorkflowRun,
  type InsertAlloyArtifact,
  type AlloyWorkflow,
  type AlloySignal,
  type AlloyWorkflowRun,
} from "@szl-holdings/db";
import { eq, desc } from "drizzle-orm";
import { logger } from "./logger";
import { durableJobQueue } from "@szl-holdings/forge-runtime";

// ─── Job Types for Alloy Workflow Engine ──────────────────────────────────────

export const ALLOY_JOB_TYPES = {
  PROCESS_SIGNAL: "alloy:process_signal",
  RUN_WORKFLOW: "alloy:run_workflow",
  EXECUTE_ACTION: "alloy:execute_action",
  GENERATE_ARTIFACT: "alloy:generate_artifact",
  SCHEDULED_REVIEW: "alloy:scheduled_review",
  RETRY_WORKFLOW: "alloy:retry_workflow",
} as const;

// ─── Retry Policy ─────────────────────────────────────────────────────────────

const MAX_RETRIES = 3;

function retryDelayMs(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 30_000);
}

// ─── Step State Machine ───────────────────────────────────────────────────────

export type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface WorkflowStep {
  step: number;
  name: string;
  description: string;
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export function advanceStep(steps: WorkflowStep[], stepNumber: number, result: "completed" | "failed", error?: string): WorkflowStep[] {
  return steps.map(s => {
    if (s.step !== stepNumber) return s;
    return {
      ...s,
      status: result,
      completedAt: new Date().toISOString(),
      ...(error ? { error } : {}),
    };
  });
}

export function startStep(steps: WorkflowStep[], stepNumber: number): WorkflowStep[] {
  return steps.map(s => {
    if (s.step !== stepNumber) return s;
    return { ...s, status: "running", startedAt: new Date().toISOString() };
  });
}

function nextPendingStep(steps: WorkflowStep[]): WorkflowStep | undefined {
  return steps.find(s => s.status === "pending");
}

// ─── Audit Helper ─────────────────────────────────────────────────────────────

export async function writeAuditLog(params: {
  entityType: "signal" | "workflow" | "action" | "artifact" | "approval" | "owner";
  entityId: number;
  action: string;
  actorUserId?: number;
  actorType?: "user" | "system" | "agent";
  previousState?: unknown;
  newState?: unknown;
  notes?: string;
  correlationId?: string;
}): Promise<void> {
  try {
    await db.insert(alloyAuditLog).values({
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      actorUserId: params.actorUserId,
      actorType: params.actorType ?? "system",
      previousState: params.previousState as Record<string, unknown>,
      newState: params.newState as Record<string, unknown>,
      notes: params.notes,
      correlationId: params.correlationId,
    });
  } catch (err) {
    logger.error({ err, params }, "Failed to write audit log");
  }
}

// ─── Signal Processing ────────────────────────────────────────────────────────

export async function processSignalIntoWorkflow(
  signalId: number,
  options: {
    workflowType?: InsertAlloyWorkflow["type"];
    priority?: InsertAlloyWorkflow["priority"];
    requiresApproval?: boolean;
    actorUserId?: number;
    correlationId?: string;
  } = {},
): Promise<AlloyWorkflow | null> {
  const [signal] = await db
    .select()
    .from(alloySignals)
    .where(eq(alloySignals.id, signalId))
    .limit(1);

  if (!signal) {
    logger.warn({ signalId }, "Signal not found for workflow creation");
    return null;
  }

  const workflowType = options.workflowType ?? "investigation";
  const priority = options.priority ?? (signal.severity === "critical" ? "critical" : signal.severity === "high" ? "high" : "medium");
  const requiresApproval = options.requiresApproval ?? (signal.severity === "critical" || signal.severity === "high");

  const steps = buildDefaultSteps(workflowType, signal);

  const ownerUserId = options.actorUserId ?? signal.ownerUserId ?? undefined;

  const [workflow] = await db
    .insert(alloyWorkflows)
    .values({
      name: `${workflowType.charAt(0).toUpperCase() + workflowType.slice(1)}: ${signal.title}`,
      type: workflowType,
      domain: signal.domain,
      triggerId: signal.id,
      triggerType: "signal",
      status: "pending",
      priority,
      requiresApproval,
      approvalState: "none",
      confidenceScore: signal.confidence,
      steps: steps as unknown as Record<string, unknown>[],
      inputs: { signalId, signalTitle: signal.title, severity: signal.severity },
      environment: signal.environment ?? "production",
      ownerUserId,
    })
    .returning();

  await writeAuditLog({
    entityType: "workflow",
    entityId: workflow.id,
    action: "created",
    actorType: "system",
    actorUserId: options.actorUserId,
    newState: { status: "pending", signalId, workflowType },
    notes: `Workflow created from signal ${signalId}`,
    correlationId: options.correlationId,
  });

  logger.info({ workflowId: workflow.id, signalId, workflowType }, "Workflow created from signal");

  if (requiresApproval) {
    await requestApproval(workflow.id, {
      requestedByUserId: options.actorUserId,
      reason: `Auto-approval required for ${signal.severity} signal: ${signal.title}`,
    });
    logger.info({ workflowId: workflow.id, signalId }, "Approval record created automatically for high/critical signal workflow");
  }

  await db.update(alloySignals)
    .set({ status: "triaged", updatedAt: new Date() })
    .where(eq(alloySignals.id, signalId));

  return workflow;
}

function buildDefaultSteps(type: string, _signal: AlloySignal): WorkflowStep[] {
  const base: WorkflowStep[] = [
    { step: 1, name: "intake", description: "Signal intake and validation", status: "pending" },
    { step: 2, name: "analysis", description: "Signal analysis and classification", status: "pending" },
  ];

  if (type === "escalation") {
    return [
      ...base,
      { step: 3, name: "escalation", description: "Escalate to responsible owner", status: "pending" },
      { step: 4, name: "approval", description: "Approval gate", status: "pending" },
      { step: 5, name: "resolution", description: "Confirm resolution", status: "pending" },
    ];
  }

  if (type === "remediation") {
    return [
      ...base,
      { step: 3, name: "planning", description: "Build remediation plan", status: "pending" },
      { step: 4, name: "execution", description: "Execute remediation steps", status: "pending" },
      { step: 5, name: "verification", description: "Verify remediation success", status: "pending" },
    ];
  }

  return [
    ...base,
    { step: 3, name: "recommendation", description: "Generate recommendations", status: "pending" },
    { step: 4, name: "output", description: "Generate output artifact", status: "pending" },
  ];
}

// ─── Workflow Execution with Step State Machine ────────────────────────────────

export async function startWorkflowRun(
  workflowId: number,
  options: { actorUserId?: number; correlationId?: string; overrideApproval?: boolean } = {},
): Promise<AlloyWorkflowRun> {
  const [workflow] = await db
    .select()
    .from(alloyWorkflows)
    .where(eq(alloyWorkflows.id, workflowId))
    .limit(1);

  if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);

  if (workflow.requiresApproval && workflow.approvalState !== "approved" && !options.overrideApproval) {
    throw new Error(
      `Workflow ${workflowId} requires approval before it can run (approvalState=${workflow.approvalState}). ` +
      `Submit an approval request and wait for it to be reviewed.`,
    );
  }

  const existingRuns = await db
    .select()
    .from(alloyWorkflowRuns)
    .where(eq(alloyWorkflowRuns.workflowId, workflowId))
    .orderBy(desc(alloyWorkflowRuns.runNumber))
    .limit(1);

  const runNumber = (existingRuns[0]?.runNumber ?? 0) + 1;

  const steps = (workflow.steps ?? []) as WorkflowStep[];
  const updatedSteps = steps.length > 0 ? startStep(steps, steps[0]!.step) : steps;

  const [run] = await db
    .insert(alloyWorkflowRuns)
    .values({
      workflowId,
      runNumber,
      status: "started",
      trigger: workflow.triggerType,
      inputs: workflow.inputs as Record<string, unknown>,
      ownerUserId: options.actorUserId,
      approvalState: workflow.requiresApproval ? "pending" : "none",
      startedAt: new Date(),
      stepsExecuted: updatedSteps as unknown as Record<string, unknown>[],
    })
    .returning();

  await db.update(alloyWorkflows)
    .set({ status: "running", startedAt: new Date(), updatedAt: new Date(), steps: updatedSteps as unknown as Record<string, unknown>[], currentStep: updatedSteps[0]?.step ?? 1 })
    .where(eq(alloyWorkflows.id, workflowId));

  await writeAuditLog({
    entityType: "workflow",
    entityId: workflowId,
    action: "run_started",
    actorType: options.actorUserId ? "user" : "system",
    actorUserId: options.actorUserId,
    newState: { runId: run.id, runNumber, status: "running", currentStep: updatedSteps[0]?.step ?? 1 },
    correlationId: options.correlationId,
  });

  return run;
}

export async function advanceWorkflowStep(
  runId: number,
  stepNumber: number,
  result: "completed" | "failed",
  options: { actorUserId?: number; error?: string; outputs?: Record<string, unknown>; correlationId?: string } = {},
): Promise<void> {
  const [run] = await db.select().from(alloyWorkflowRuns).where(eq(alloyWorkflowRuns.id, runId)).limit(1);
  if (!run) return;

  const steps = (run.stepsExecuted ?? []) as WorkflowStep[];
  const updatedSteps = advanceStep(steps, stepNumber, result, options.error);

  const next = nextPendingStep(updatedSteps);
  const nextStarted = next ? startStep(updatedSteps, next.step) : updatedSteps;
  const allDone = !next;

  await db.update(alloyWorkflowRuns).set({
    stepsExecuted: nextStarted as unknown as Record<string, unknown>[],
    ...(options.outputs ? { outputs: options.outputs } : {}),
  }).where(eq(alloyWorkflowRuns.id, runId));

  await db.update(alloyWorkflows).set({
    steps: nextStarted as unknown as Record<string, unknown>[],
    updatedAt: new Date(),
  }).where(eq(alloyWorkflows.id, run.workflowId));

  await writeAuditLog({
    entityType: "workflow",
    entityId: run.workflowId,
    action: `step_${stepNumber}_${result}`,
    actorType: options.actorUserId ? "user" : "system",
    actorUserId: options.actorUserId,
    newState: { runId, stepNumber, result, nextStep: next?.step },
    notes: options.error,
    correlationId: options.correlationId,
  });

  if (allDone) {
    await completeWorkflowRun(runId, options.outputs ?? {}, { actorUserId: options.actorUserId, correlationId: options.correlationId });
  }
}

export async function completeWorkflowRun(
  runId: number,
  outputs: Record<string, unknown>,
  options: { actorUserId?: number; errorMessage?: string; correlationId?: string } = {},
): Promise<void> {
  const [run] = await db
    .select()
    .from(alloyWorkflowRuns)
    .where(eq(alloyWorkflowRuns.id, runId))
    .limit(1);

  if (!run) return;

  const now = new Date();
  const durationMs = now.getTime() - run.startedAt.getTime();
  const status = options.errorMessage ? "failed" : "completed";

  await db.update(alloyWorkflowRuns)
    .set({
      status,
      outputs,
      completedAt: now,
      durationMs,
      errorMessage: options.errorMessage,
    })
    .where(eq(alloyWorkflowRuns.id, runId));

  const prevWorkflow = await db.select().from(alloyWorkflows).where(eq(alloyWorkflows.id, run.workflowId)).limit(1);
  const retryCount = prevWorkflow[0]?.retryCount ?? 0;

  if (status === "failed" && retryCount < MAX_RETRIES) {
    const delayMs = retryDelayMs(retryCount);
    logger.warn({ runId, workflowId: run.workflowId, retryCount, delayMs }, "Scheduling workflow retry after failure");

    await db.update(alloyWorkflows)
      .set({
        status: "pending",
        retryCount: retryCount + 1,
        updatedAt: now,
        errorMessage: options.errorMessage,
      })
      .where(eq(alloyWorkflows.id, run.workflowId));

    await writeAuditLog({
      entityType: "workflow",
      entityId: run.workflowId,
      action: "retry_scheduled",
      actorType: "system",
      previousState: { status: "failed", retryCount },
      newState: { status: "pending", retryCount: retryCount + 1, delayMs },
      notes: `Retry #${retryCount + 1} of ${MAX_RETRIES} scheduled after ${delayMs}ms`,
      correlationId: options.correlationId,
    });

    await durableJobQueue.enqueue(ALLOY_JOB_TYPES.RETRY_WORKFLOW, {
      workflowId: run.workflowId,
      retryAttempt: retryCount + 1,
    }, { scheduledAt: new Date(Date.now() + delayMs) });
  } else {
    await db.update(alloyWorkflows)
      .set({
        status: status === "completed" ? "completed" : "failed",
        completedAt: now,
        outputs,
        updatedAt: now,
        errorMessage: options.errorMessage,
      })
      .where(eq(alloyWorkflows.id, run.workflowId));

    if (status === "failed" && retryCount >= MAX_RETRIES) {
      logger.error({ runId, workflowId: run.workflowId, retryCount }, "Workflow exhausted retries — terminal failure");
      await writeAuditLog({
        entityType: "workflow",
        entityId: run.workflowId,
        action: "retry_exhausted",
        actorType: "system",
        newState: { status: "failed", retryCount, maxRetries: MAX_RETRIES },
        notes: "Max retries exhausted — manual intervention required",
        correlationId: options.correlationId,
      });
    }
  }

  await writeAuditLog({
    entityType: "workflow",
    entityId: run.workflowId,
    action: status === "completed" ? "run_completed" : "run_failed",
    actorType: options.actorUserId ? "user" : "system",
    actorUserId: options.actorUserId,
    newState: { runId, status, durationMs },
    notes: options.errorMessage,
    correlationId: options.correlationId,
  });
}

// ─── Approval Management ─────────────────────────────────────────────────────

export async function requestApproval(
  workflowId: number,
  options: {
    requestedByUserId?: number;
    reviewerUserId?: number;
    reason?: string;
    requiredRoles?: string[];
    expiresInHours?: number;
  } = {},
): Promise<void> {
  const expiresAt = options.expiresInHours
    ? new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000)
    : new Date(Date.now() + 24 * 60 * 60 * 1000);

  const [approval] = await db
    .insert(alloyApprovals)
    .values({
      workflowId,
      requestedByUserId: options.requestedByUserId,
      reviewerUserId: options.reviewerUserId,
      status: "pending",
      reason: options.reason,
      requiredRoles: options.requiredRoles ?? [],
      expiresAt,
    })
    .returning();

  await db.update(alloyWorkflows)
    .set({ status: "waiting_approval", approvalState: "pending", updatedAt: new Date() })
    .where(eq(alloyWorkflows.id, workflowId));

  await writeAuditLog({
    entityType: "approval",
    entityId: approval.id,
    action: "requested",
    actorType: options.requestedByUserId ? "user" : "system",
    actorUserId: options.requestedByUserId,
    newState: { workflowId, status: "pending" },
    notes: options.reason,
  });

  await durableJobQueue.enqueue(ALLOY_JOB_TYPES.SCHEDULED_REVIEW, {
    approvalId: approval.id,
    workflowId,
    type: "expiry_check",
  }, { scheduledAt: expiresAt });
}

export async function reviewApproval(
  approvalId: number,
  decision: "approved" | "rejected",
  options: {
    reviewerUserId: number;
    reviewNote?: string;
    correlationId?: string;
  },
): Promise<void> {
  const [approval] = await db
    .select()
    .from(alloyApprovals)
    .where(eq(alloyApprovals.id, approvalId))
    .limit(1);

  if (!approval) throw new Error(`Approval not found: ${approvalId}`);

  const now = new Date();
  await db.update(alloyApprovals)
    .set({
      status: decision,
      reviewerUserId: options.reviewerUserId,
      reviewNote: options.reviewNote,
      reviewedAt: now,
      updatedAt: now,
    })
    .where(eq(alloyApprovals.id, approvalId));

  const workflowStatus = decision === "approved" ? "approved" : "rejected";
  await db.update(alloyWorkflows)
    .set({ status: workflowStatus, approvalState: decision, updatedAt: now })
    .where(eq(alloyWorkflows.id, approval.workflowId));

  await writeAuditLog({
    entityType: "approval",
    entityId: approvalId,
    action: `approval_${decision}`,
    actorType: "user",
    actorUserId: options.reviewerUserId,
    previousState: { status: "pending" },
    newState: { status: decision },
    notes: options.reviewNote,
    correlationId: options.correlationId,
  });

  if (decision === "approved") {
    await durableJobQueue.enqueue(ALLOY_JOB_TYPES.RUN_WORKFLOW, {
      workflowId: approval.workflowId,
      actorUserId: options.reviewerUserId,
    });
  }
}

// ─── Output Generation ────────────────────────────────────────────────────────

export async function generateArtifact(params: {
  workflowId?: number;
  signalId?: number;
  type: InsertAlloyArtifact["type"];
  title: string;
  content: string;
  domain: string;
  format?: InsertAlloyArtifact["format"];
  confidenceScore?: number;
  requiresApproval?: boolean;
  tags?: string[];
  ownerId?: number;
  ownerUserId?: number;
  actorUserId?: number;
  correlationId?: string;
}): Promise<{ id: number } & InsertAlloyArtifact> {
  const [artifact] = await db
    .insert(alloyArtifacts)
    .values({
      workflowId: params.workflowId,
      signalId: params.signalId,
      type: params.type,
      title: params.title,
      content: params.content,
      domain: params.domain,
      format: params.format ?? "markdown",
      confidenceScore: params.confidenceScore ?? 0.8,
      requiresApproval: params.requiresApproval ?? false,
      approvalState: params.requiresApproval ? "pending" : "none",
      tags: params.tags ?? [],
      ownerId: params.ownerId,
      ownerUserId: params.ownerUserId,
      publishedAt: params.requiresApproval ? null : new Date(),
    })
    .returning();

  await writeAuditLog({
    entityType: "artifact",
    entityId: artifact.id,
    action: "created",
    actorType: params.actorUserId ? "user" : "system",
    actorUserId: params.actorUserId,
    newState: { type: params.type, domain: params.domain },
    correlationId: params.correlationId,
  });

  return artifact as { id: number } & InsertAlloyArtifact;
}

// ─── Register Alloy Job Handlers ──────────────────────────────────────────────

durableJobQueue.register(ALLOY_JOB_TYPES.PROCESS_SIGNAL, async (job) => {
  const { signalId, workflowType, priority, actorUserId } = job.payload as {
    signalId: number;
    workflowType?: InsertAlloyWorkflow["type"];
    priority?: InsertAlloyWorkflow["priority"];
    actorUserId?: number;
  };
  logger.info({ jobId: job.id, signalId }, "Processing signal into workflow");
  await processSignalIntoWorkflow(signalId, { workflowType, priority, actorUserId, correlationId: job.id });
});

durableJobQueue.register(ALLOY_JOB_TYPES.RUN_WORKFLOW, async (job) => {
  const { workflowId, actorUserId } = job.payload as { workflowId: number; actorUserId?: number };
  logger.info({ jobId: job.id, workflowId }, "Running workflow");
  const run = await startWorkflowRun(workflowId, { actorUserId, correlationId: job.id });

  try {
    const [workflow] = await db.select().from(alloyWorkflows).where(eq(alloyWorkflows.id, workflowId)).limit(1);
    if (!workflow) throw new Error("Workflow not found");

    let currentSteps = (workflow.steps ?? []) as WorkflowStep[];
    const outputs: Record<string, unknown> = { processedAt: new Date().toISOString(), runId: run.id };

    for (const step of currentSteps) {
      logger.info({ workflowId, runId: run.id, step: step.step, name: step.name }, "Executing workflow step");

      const runningSteps = startStep(currentSteps, step.step);
      await db.update(alloyWorkflowRuns)
        .set({ stepsExecuted: runningSteps as unknown as Record<string, unknown>[] })
        .where(eq(alloyWorkflowRuns.id, run.id));

      await db.update(alloyWorkflows)
        .set({ steps: runningSteps as unknown as Record<string, unknown>[], currentStep: step.step, updatedAt: new Date() })
        .where(eq(alloyWorkflows.id, workflowId));

      const completedSteps = advanceStep(runningSteps, step.step, "completed");
      await db.update(alloyWorkflowRuns)
        .set({ stepsExecuted: completedSteps as unknown as Record<string, unknown>[] })
        .where(eq(alloyWorkflowRuns.id, run.id));

      await db.update(alloyWorkflows)
        .set({ steps: completedSteps as unknown as Record<string, unknown>[], updatedAt: new Date() })
        .where(eq(alloyWorkflows.id, workflowId));

      currentSteps = completedSteps;
      outputs[`step_${step.step}_${step.name}`] = { status: "completed", timestamp: new Date().toISOString() };
    }

    await completeWorkflowRun(run.id, outputs, { actorUserId, correlationId: job.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await completeWorkflowRun(run.id, {}, { errorMessage: msg, correlationId: job.id });
    throw err;
  }
});

durableJobQueue.register(ALLOY_JOB_TYPES.RETRY_WORKFLOW, async (job) => {
  const { workflowId, retryAttempt, actorUserId } = job.payload as {
    workflowId: number;
    retryAttempt: number;
    actorUserId?: number;
  };
  logger.info({ jobId: job.id, workflowId, retryAttempt }, "Retrying workflow");

  const [workflow] = await db.select().from(alloyWorkflows).where(eq(alloyWorkflows.id, workflowId)).limit(1);
  if (!workflow) {
    logger.warn({ workflowId }, "Workflow not found for retry — skipping");
    return;
  }

  if (workflow.status !== "pending") {
    logger.info({ workflowId, status: workflow.status }, "Workflow retry skipped — not in pending state");
    return;
  }

  await durableJobQueue.enqueue(ALLOY_JOB_TYPES.RUN_WORKFLOW, { workflowId, actorUserId });
});

durableJobQueue.register(ALLOY_JOB_TYPES.GENERATE_ARTIFACT, async (job) => {
  const params = job.payload as Parameters<typeof generateArtifact>[0];
  logger.info({ jobId: job.id, type: params.type, domain: params.domain }, "Generating artifact");
  await generateArtifact({ ...params, correlationId: job.id });
});

durableJobQueue.register(ALLOY_JOB_TYPES.SCHEDULED_REVIEW, async (job) => {
  const { approvalId, workflowId, type } = job.payload as {
    approvalId: number;
    workflowId: number;
    type: "expiry_check" | "scheduled_follow_up";
  };
  logger.info({ jobId: job.id, approvalId, workflowId, type }, "Running scheduled review");

  if (type === "expiry_check") {
    const [approval] = await db.select().from(alloyApprovals).where(eq(alloyApprovals.id, approvalId)).limit(1);
    if (!approval || approval.status !== "pending") return;

    const now = new Date();
    if (approval.expiresAt && approval.expiresAt <= now) {
      await db.update(alloyApprovals)
        .set({ status: "expired", updatedAt: now })
        .where(eq(alloyApprovals.id, approvalId));

      await db.update(alloyWorkflows)
        .set({ status: "failed", approvalState: "none", updatedAt: now, errorMessage: "Approval expired without review" })
        .where(eq(alloyWorkflows.id, workflowId));

      await writeAuditLog({
        entityType: "approval",
        entityId: approvalId,
        action: "approval_expired",
        actorType: "system",
        previousState: { status: "pending" },
        newState: { status: "expired" },
        notes: "Approval expired — no reviewer action within deadline",
        correlationId: job.id,
      });

      logger.warn({ approvalId, workflowId }, "Approval expired — workflow set to failed");
    }
  }
});
