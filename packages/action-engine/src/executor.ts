import { randomUUID } from "crypto";
import type {
  WorkflowDefinition,
  WorkflowRun,
  WorkflowStep,
  StepExecutionRecord,
  ActionEngineResult,
} from "./types.js";
import type { PolicyEvaluation } from "@szl-holdings/policy-engine";
import { PolicyEvaluationSchema } from "@szl-holdings/policy-engine";

export type StepHandler = (
  parameters: Record<string, unknown>,
  context: { runId: string; stepId: string; isDryRun: boolean; isSimulation: boolean }
) => Promise<Record<string, unknown>>;

export type RollbackHandler = (
  outputs: Record<string, unknown>,
  context: { runId: string; stepId: string }
) => Promise<void>;

const registeredHandlers = new Map<string, StepHandler>();
const registeredRollbackHandlers = new Map<string, RollbackHandler>();

export function registerStepHandler(name: string, handler: StepHandler): void {
  registeredHandlers.set(name, handler);
}

export function registerRollbackHandler(name: string, handler: RollbackHandler): void {
  registeredRollbackHandlers.set(name, handler);
}

function appendAudit(run: WorkflowRun, actor: string | undefined, action: string, detail?: string): void {
  run.auditTrail.push({
    at: Date.now(),
    actor,
    action,
    detail,
    immutable: true,
  });
}

/**
 * Every call to executeWorkflow MUST supply either:
 *   (a) a fully-formed PolicyEvaluation produced by buildPolicyEvaluation(), or
 *   (b) explicitly set policyEvaluationOverride = true to bypass (test/demo only).
 *
 * If neither is provided the call will throw immediately — there is no silent fallback.
 */
export async function executeWorkflow(params: {
  definition: WorkflowDefinition;
  initiatedBy?: string;
  tenantId?: string;
  recommendationId?: string;
  isDryRun?: boolean;
  isSimulation?: boolean;
  approvedBy?: string;
  /** Structured PolicyEvaluation — required for live execution */
  policyEvaluation?: PolicyEvaluation;
  /** Set true in tests/demos to bypass the policy-evaluation requirement */
  policyEvaluationOverride?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<ActionEngineResult> {
  const {
    definition,
    initiatedBy,
    tenantId,
    recommendationId,
    isDryRun = false,
    isSimulation = false,
    approvedBy,
    policyEvaluation,
    policyEvaluationOverride = false,
    metadata,
  } = params;

  if (!policyEvaluation && !policyEvaluationOverride && !isDryRun && !isSimulation) {
    throw new Error(
      `executeWorkflow: policyEvaluation is required for workflow '${definition.id}'. ` +
      `Call buildPolicyEvaluation() from @workspace/policy-engine and pass the result, ` +
      `or set policyEvaluationOverride=true for test/demo usage.`
    );
  }

  if (policyEvaluation && !isDryRun && !isSimulation) {
    const parsed = PolicyEvaluationSchema.safeParse(policyEvaluation);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(
        `executeWorkflow: policyEvaluation for workflow '${definition.id}' failed schema validation. ` +
        `Use buildPolicyEvaluation() from @workspace/policy-engine to construct a valid PolicyEvaluation. ` +
        `Validation errors: ${issues}`
      );
    }
  }

  const pe = policyEvaluation;

  if (pe && pe.blockedReason && !isDryRun && !isSimulation) {
    const blockedRun: WorkflowRun = {
      runId: randomUUID(),
      workflowId: definition.id,
      workflowName: definition.name,
      recommendationId,
      tenantId,
      initiatedBy,
      executionMode: definition.executionMode ?? "manual",
      isDryRun,
      isSimulation,
      status: "cancelled",
      currentStepIndex: 0,
      steps: definition.steps.map((s: WorkflowStep) => ({ stepId: s.id, stepName: s.name, startedAt: 0, status: "pending" })),
      approvalState: "none",
      policyEvaluation,
      auditTrail: [{
        at: Date.now(),
        actor: initiatedBy,
        action: "workflow.policy_blocked",
        detail: pe.blockedReason,
        immutable: true,
      }],
      startedAt: Date.now(),
      completedAt: Date.now(),
      metadata,
    };
    return { run: blockedRun, requiresApproval: false };
  }

  const runId = randomUUID();
  const needsApproval =
    (definition.requiresExplicitApproval || pe?.mode === "approval-required") &&
    !approvedBy &&
    !isDryRun &&
    !isSimulation;
  const executionMode = definition.executionMode ?? "manual";

  const initialStatus: WorkflowRun["status"] = needsApproval ? "pending_approval" : "running";

  const run: WorkflowRun = {
    runId,
    workflowId: definition.id,
    workflowName: definition.name,
    recommendationId,
    tenantId,
    initiatedBy,
    executionMode,
    isDryRun,
    isSimulation,
    status: initialStatus,
    currentStepIndex: 0,
    steps: definition.steps.map((s: WorkflowStep) => ({
      stepId: s.id,
      stepName: s.name,
      startedAt: 0,
      status: "pending",
    })),
    approvalState: needsApproval ? "pending" : approvedBy ? "approved" : "none",
    approvedBy,
    approvedAt: approvedBy ? Date.now() : undefined,
    policyEvaluation,
    auditTrail: [],
    startedAt: Date.now(),
    estimatedCostUsd: definition.estimatedCostUsd,
    metadata,
  };

  appendAudit(run, initiatedBy, "workflow.initiated", `Mode: ${executionMode}${isDryRun ? " (dry-run)" : ""}${isSimulation ? " (simulation)" : ""}`);

  if (needsApproval) {
    appendAudit(run, undefined, "workflow.awaiting_approval", "Execution paused pending human approval.");
    const approvalStep = definition.steps.find((s: WorkflowStep) => s.requiresApproval);
    return {
      run,
      requiresApproval: true,
      approvalRequest: {
        approverRole: approvalStep?.approverRole ?? "admin",
        reason: `Workflow '${definition.name}' requires explicit approval before execution.`,
      },
    };
  }

  if (isDryRun) {
    appendAudit(run, initiatedBy, "workflow.dry_run", "Simulating execution without side effects.");
    run.status = "completed";
    run.completedAt = Date.now();
    return {
      run,
      requiresApproval: false,
      dryRunSummary: buildDryRunSummary(definition),
    };
  }

  if (isSimulation) {
    appendAudit(run, initiatedBy, "workflow.simulation", "Simulation mode: predicting outcomes.");
    run.status = "completed";
    run.completedAt = Date.now();
    return {
      run,
      requiresApproval: false,
      simulationSummary: buildSimulationSummary(definition),
    };
  }

  const completedOutputs: Map<string, Record<string, unknown>> = new Map();

  for (let i = 0; i < definition.steps.length; i++) {
    const stepDef = definition.steps[i];
    const stepRecord = run.steps[i];

    run.currentStepIndex = i;
    stepRecord.startedAt = Date.now();
    stepRecord.status = "running";
    stepRecord.inputs = stepDef.parameters ?? {};

    appendAudit(run, initiatedBy, `step.started`, `Step '${stepDef.name}'`);

    const handler = registeredHandlers.get(stepDef.handler);

    try {
      let outputs: Record<string, unknown> = {};

      if (handler) {
        outputs = await handler(stepDef.parameters ?? {}, {
          runId,
          stepId: stepDef.id,
          isDryRun,
          isSimulation,
        });
      } else {
        outputs = { result: `Handler '${stepDef.handler}' not registered — step acknowledged.` };
      }

      stepRecord.outputs = outputs;
      stepRecord.status = "completed";
      stepRecord.completedAt = Date.now();
      completedOutputs.set(stepDef.id, outputs);

      appendAudit(run, initiatedBy, `step.completed`, `Step '${stepDef.name}' succeeded.`);
    } catch (err) {
      stepRecord.status = "failed";
      stepRecord.error = err instanceof Error ? err.message : String(err);
      stepRecord.completedAt = Date.now();

      appendAudit(run, initiatedBy, `step.failed`, `Step '${stepDef.name}' failed: ${stepRecord.error}`);

      if (definition.rollbackPolicy !== "none") {
        await performRollback(run, definition, completedOutputs, i, initiatedBy);
      }

      run.status = "failed";
      run.completedAt = Date.now();

      return { run, requiresApproval: false };
    }
  }

  run.status = "completed";
  run.completedAt = Date.now();
  appendAudit(run, initiatedBy, "workflow.completed", `All ${definition.steps.length} steps completed successfully.`);

  return { run, requiresApproval: false };
}

async function performRollback(
  run: WorkflowRun,
  definition: WorkflowDefinition,
  completedOutputs: Map<string, Record<string, unknown>>,
  failedStepIndex: number,
  actor?: string
): Promise<void> {
  const stepsToRollback = definition.steps.slice(0, failedStepIndex).reverse();

  for (const stepDef of stepsToRollback) {
    if (!stepDef.rollbackHandler) continue;

    const outputs = completedOutputs.get(stepDef.id) ?? {};
    const rollbackHandler = registeredRollbackHandlers.get(stepDef.rollbackHandler);

    const stepRecord = run.steps.find((s: StepExecutionRecord) => s.stepId === stepDef.id);
    if (stepRecord) {
      stepRecord.rollbackedAt = Date.now();
      stepRecord.status = "rolled_back";
    }

    try {
      if (rollbackHandler) {
        await rollbackHandler(outputs, { runId: run.runId, stepId: stepDef.id });
      }
      run.auditTrail.push({
        at: Date.now(),
        actor,
        action: `step.rolled_back`,
        detail: `Step '${stepDef.name}' rolled back.`,
        immutable: true,
      });
    } catch {
      run.auditTrail.push({
        at: Date.now(),
        actor,
        action: `step.rollback_failed`,
        detail: `Rollback for step '${stepDef.name}' failed.`,
        immutable: true,
      });
    }
  }

  run.status = "rolled_back";
  run.auditTrail.push({
    at: Date.now(),
    actor,
    action: "workflow.rolled_back",
    detail: "Rollback sequence completed.",
    immutable: true,
  });
}

function buildDryRunSummary(def: WorkflowDefinition): string {
  const lines = [
    `Dry run for workflow '${def.name}' (${def.id}).`,
    `Steps: ${def.steps.map((s: WorkflowStep) => s.name).join(" → ")}`,
    `Execution mode: ${def.executionMode}`,
  ];
  if (def.estimatedCostUsd !== undefined) {
    lines.push(`Estimated cost: $${def.estimatedCostUsd.toFixed(2)}`);
  }
  return lines.join("\n");
}

function buildSimulationSummary(def: WorkflowDefinition): string {
  return [
    `Simulation for '${def.name}':`,
    `${def.steps.length} step(s) would execute.`,
    def.estimatedCostUsd !== undefined ? `Projected cost: $${def.estimatedCostUsd.toFixed(2)}` : "",
    `Rollback policy: ${def.rollbackPolicy}`,
  ].filter(Boolean).join(" | ");
}
