import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import { executeSkill, type SkillExecutionRequest } from "./skill-runtime";
import { emitActivityEvent } from "./agent-activity";
import { getComposition, saveSkillComposition, listCompositions } from "./skills-registry";
import type { AgentExecutionContext } from "./types";

export interface CompositionStep {
  stepId: string;
  skillId: string;
  label?: string;
  config?: Record<string, unknown>;
  dependsOn?: string[];
  approvalRequired?: boolean;
  timeoutMs?: number;
  retries?: number;
  onSuccess?: string;
  onFailure?: string;
  inputMapping?: Record<string, string>;
}

export interface CompositionApprovalGate {
  afterStep: string;
  reason: string;
}

export interface SkillComposition {
  compositionId: string;
  name: string;
  description?: string;
  steps: CompositionStep[];
  approvalGates: CompositionApprovalGate[];
  creatorId?: string;
  orgId?: string;
}

export interface CompositionRunResult {
  compositionId: string;
  runId: string;
  status: "completed" | "failed" | "awaiting_approval" | "cancelled";
  stepResults: Record<string, { success: boolean; output?: unknown; error?: string; latencyMs: number }>;
  totalLatencyMs: number;
  stepsCompleted: number;
  stepsTotal: number;
  pendingApprovalStep?: string;
  error?: string;
}

function resolveInput(
  inputMapping: Record<string, string> | undefined,
  stepResults: Record<string, { output?: unknown }>,
  baseInput: Record<string, unknown>
): Record<string, unknown> {
  if (!inputMapping) return baseInput;
  const resolved: Record<string, unknown> = { ...baseInput };
  for (const [key, path] of Object.entries(inputMapping)) {
    const parts = path.split(".");
    let value: any = stepResults;
    for (const part of parts) {
      value = value?.[part];
    }
    if (value !== undefined) resolved[key] = value;
  }
  return resolved;
}

export async function runComposition(
  compositionId: string,
  initialInput: Record<string, unknown>,
  context: AgentExecutionContext,
  options?: {
    userId?: string;
    orgId?: string;
    autonomyOverride?: "observer" | "advisor" | "operator";
  }
): Promise<CompositionRunResult> {
  const startTime = Date.now();
  const runId = `comp_run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const compositionRow = await getComposition(compositionId);
  if (!compositionRow) {
    return {
      compositionId,
      runId,
      status: "failed",
      stepResults: {},
      totalLatencyMs: Date.now() - startTime,
      stepsCompleted: 0,
      stepsTotal: 0,
      error: `Composition "${compositionId}" not found`,
    };
  }

  const composition: SkillComposition = {
    compositionId: compositionRow.composition_id,
    name: compositionRow.name,
    description: compositionRow.description,
    steps: compositionRow.steps,
    approvalGates: compositionRow.approval_gates ?? [],
    creatorId: compositionRow.creator_id,
    orgId: compositionRow.org_id,
  };

  const startEventId = await emitActivityEvent({
    eventType: "composition_started",
    agentId: context.agentId,
    domain: context.domain,
    userId: options?.userId,
    runId,
    compositionId,
    input: { compositionName: composition.name, stepsCount: composition.steps.length, ...initialInput },
    metadata: { compositionName: composition.name },
  });

  const stepResults: Record<string, { success: boolean; output?: unknown; error?: string; latencyMs: number }> = {};
  const completed = new Set<string>();
  const failed = new Set<string>();

  const steps = composition.steps;
  let iterations = 0;
  const maxIterations = steps.length * 3;
  let pendingApprovalStep: string | undefined;

  while (completed.size + failed.size < steps.length && iterations < maxIterations) {
    iterations++;

    const readySteps = steps.filter(step => {
      if (completed.has(step.stepId) || failed.has(step.stepId)) return false;
      if (!step.dependsOn?.length) return true;
      return step.dependsOn.every(d => completed.has(d));
    });

    if (readySteps.length === 0) break;

    const approvalGateBeforeStep = composition.approvalGates.find(g =>
      readySteps.some(s => {
        const precedingStepIdx = steps.findIndex(ss => ss.stepId === g.afterStep);
        const currentStepIdx = steps.findIndex(ss => ss.stepId === s.stepId);
        return precedingStepIdx !== -1 && currentStepIdx > precedingStepIdx && completed.has(g.afterStep);
      })
    );

    if (approvalGateBeforeStep && !completed.has(`gate_${approvalGateBeforeStep.afterStep}`)) {
      pendingApprovalStep = approvalGateBeforeStep.afterStep;
      await emitActivityEvent({
        eventType: "approval_requested",
        agentId: context.agentId,
        compositionId,
        domain: context.domain,
        userId: options?.userId,
        runId,
        parentEventId: startEventId,
        requiresApproval: true,
        approvalStatus: "pending",
        metadata: {
          compositionName: composition.name,
          gateReason: approvalGateBeforeStep.reason,
          afterStep: approvalGateBeforeStep.afterStep,
        },
      });
      break;
    }

    const parallelReady = readySteps;

    const stepRunResults = await Promise.allSettled(
      parallelReady.map(async (step) => {
        const resolvedInput = resolveInput(step.inputMapping, stepResults, {
          ...initialInput,
          ...Object.fromEntries(
            Object.entries(stepResults).map(([k, v]) => [`step_${k}`, v.output])
          ),
        });

        const skillRequest: SkillExecutionRequest = {
          skillId: step.skillId,
          input: resolvedInput,
          agentId: context.agentId,
          userId: options?.userId,
          orgId: options?.orgId,
          domain: context.domain,
          runId,
          parentEventId: startEventId,
          autonomyOverride: options?.autonomyOverride,
        };

        const result = await executeSkill(skillRequest, context);

        await emitActivityEvent({
          eventType: result.success ? "composition_step_completed" : "skill_failed",
          agentId: context.agentId,
          skillId: step.skillId,
          compositionId,
          domain: context.domain,
          userId: options?.userId,
          runId,
          parentEventId: startEventId,
          output: result.output as Record<string, unknown> | undefined,
          latencyMs: result.latencyMs,
          metadata: { stepId: step.stepId, stepLabel: step.label, success: result.success },
        });

        return { stepId: step.stepId, result };
      })
    );

    for (const settled of stepRunResults) {
      if (settled.status === "fulfilled") {
        const { stepId, result } = settled.value;
        if (result.success && !result.requiresApproval) {
          completed.add(stepId);
          stepResults[stepId] = {
            success: true,
            output: result.output,
            latencyMs: result.latencyMs,
          };
        } else if (result.requiresApproval) {
          pendingApprovalStep = stepId;
          stepResults[stepId] = {
            success: false,
            output: result.output,
            latencyMs: result.latencyMs,
            error: "Awaiting approval",
          };
          break;
        } else {
          failed.add(stepId);
          stepResults[stepId] = {
            success: false,
            error: result.error,
            latencyMs: result.latencyMs,
          };
        }
      } else {
        const step = parallelReady[stepRunResults.indexOf(settled)];
        if (step) {
          failed.add(step.stepId);
          stepResults[step.stepId] = {
            success: false,
            error: (settled.reason as Error)?.message ?? "Unknown error",
            latencyMs: Date.now() - startTime,
          };
        }
      }
    }

    if (pendingApprovalStep) break;
  }

  const totalLatencyMs = Date.now() - startTime;
  const status: CompositionRunResult["status"] = pendingApprovalStep
    ? "awaiting_approval"
    : failed.size > 0
    ? "failed"
    : "completed";

  if (status === "completed" || status === "failed") {
    await emitActivityEvent({
      eventType: status === "completed" ? "composition_completed" : "composition_failed",
      agentId: context.agentId,
      compositionId,
      domain: context.domain,
      userId: options?.userId,
      runId,
      parentEventId: startEventId,
      latencyMs: totalLatencyMs,
      metadata: {
        compositionName: composition.name,
        stepsCompleted: completed.size,
        stepsFailed: failed.size,
        stepsTotal: steps.length,
      },
    });
  }

  return {
    compositionId,
    runId,
    status,
    stepResults,
    totalLatencyMs,
    stepsCompleted: completed.size,
    stepsTotal: steps.length,
    pendingApprovalStep,
    error: failed.size > 0 ? `${failed.size} step(s) failed: ${Array.from(failed).join(", ")}` : undefined,
  };
}

export async function buildCompositionFromTemplate(
  templateName: "research-draft-send" | "analyze-visualize-brief" | "meet-extract-schedule",
  options?: { name?: string; creatorId?: string; orgId?: string }
): Promise<SkillComposition> {
  const templates: Record<string, SkillComposition> = {
    "research-draft-send": {
      compositionId: `comp_${templateName}_${Date.now()}`,
      name: options?.name ?? "Research → Draft → Send",
      description: "Pull knowledge, draft an email, and queue for delivery approval",
      creatorId: options?.creatorId,
      orgId: options?.orgId,
      steps: [
        {
          stepId: "research",
          skillId: "knowledge-vault",
          label: "Research from knowledge vault",
          dependsOn: [],
          timeoutMs: 30000,
        },
        {
          stepId: "draft",
          skillId: "email-composer",
          label: "Draft email",
          dependsOn: ["research"],
          inputMapping: { content: "research.output" },
          timeoutMs: 30000,
        },
        {
          stepId: "send",
          skillId: "email-composer",
          label: "Send email",
          dependsOn: ["draft"],
          approvalRequired: true,
          inputMapping: { content: "draft.output" },
          timeoutMs: 10000,
        },
      ],
      approvalGates: [{ afterStep: "draft", reason: "Review drafted email before sending" }],
    },
    "analyze-visualize-brief": {
      compositionId: `comp_${templateName}_${Date.now()}`,
      name: options?.name ?? "Analyze → Visualize → Brief",
      description: "Analyze data, create visualization, generate executive brief",
      creatorId: options?.creatorId,
      orgId: options?.orgId,
      steps: [
        {
          stepId: "analyze",
          skillId: "smart-spreadsheet",
          label: "Analyze data",
          dependsOn: [],
          timeoutMs: 30000,
        },
        {
          stepId: "visualize",
          skillId: "viz-engine",
          label: "Create visualization",
          dependsOn: ["analyze"],
          inputMapping: { query: "analyze.output.title" },
          timeoutMs: 20000,
        },
        {
          stepId: "brief",
          skillId: "content-engine",
          label: "Generate executive brief",
          dependsOn: ["analyze", "visualize"],
          timeoutMs: 30000,
        },
      ],
      approvalGates: [],
    },
    "meet-extract-schedule": {
      compositionId: `comp_${templateName}_${Date.now()}`,
      name: options?.name ?? "Meeting → Extract → Schedule",
      description: "Process meeting, extract actions, schedule follow-ups",
      creatorId: options?.creatorId,
      orgId: options?.orgId,
      steps: [
        {
          stepId: "meeting-intel",
          skillId: "meeting-intel",
          label: "Process meeting transcript",
          dependsOn: [],
          timeoutMs: 30000,
        },
        {
          stepId: "schedule",
          skillId: "scheduling-engine",
          label: "Schedule follow-ups",
          dependsOn: ["meeting-intel"],
          timeoutMs: 20000,
        },
        {
          stepId: "notify",
          skillId: "email-composer",
          label: "Draft action item emails",
          dependsOn: ["meeting-intel", "schedule"],
          approvalRequired: true,
          timeoutMs: 20000,
        },
      ],
      approvalGates: [{ afterStep: "schedule", reason: "Confirm follow-up schedule before notifying" }],
    },
  };

  return templates[templateName] ?? templates["analyze-visualize-brief"];
}

export { saveSkillComposition, listCompositions, getComposition };
