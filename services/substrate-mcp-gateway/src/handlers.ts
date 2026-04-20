/**
 * Substrate MCP Gateway — Tool and Resource Handlers
 *
 * Every handler is a pure transport translation layer:
 *   1. Validate the incoming MCP params via Zod (reject on schema error)
 *   2. Call the appropriate @szl/substrate API
 *   3. Return a structured MCP tool result
 *
 * No business logic lives here. Policy evaluation, approval gating, and
 * evidence-chain writes happen inside the substrate runtime itself.
 */

import { z } from "zod";
import {
  defaultRuntime,
  defaultRunStore,
  replay,
  lookupWorkflow,
  listWorkflows,
  SUBSTRATE_VERSION,
} from "@szl/substrate";
import type { RuntimeStartOptions, WorkflowDefinition } from "@szl/substrate/types";
import {
  submitApprovalAction,
  getApprovalActions,
  getInboxByVerdict,
  type ApprovalVerdict,
} from "@workspace/approvals-inbox";
import {
  storeRun,
  updateRun,
  getRun,
  getAllRuns,
} from "./run-store.js";
import { globalCollector } from "@workspace/cognitive-observability";
import { emitRunEvent } from "./run-events.js";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const SubmitRunSchema = z.object({
  workflowId: z.string().min(1),
  input: z.record(z.unknown()).default({}),
  mode: z.enum(["live", "dry-run"]).default("live"),
  metadata: z.record(z.unknown()).optional(),
});

const GetRunSchema = z.object({
  runId: z.string().uuid("runId must be a UUID"),
});

const ReplaySchema = z.object({
  runId: z.string().min(1),
  workflowId: z.string().min(1),
});

const CounterfactualSchema = z.object({
  runId: z.string().min(1),
  workflowId: z.string().min(1),
  modelAdapterId: z.string().optional(),
  policyId: z.string().optional(),
});

const ListApprovalsSchema = z.object({
  verdict: z.enum(["approved", "rejected", "escalated"]).optional(),
  domain: z.string().optional(),
});

const ApproveSchema = z.object({
  recommendationId: z.string().min(1),
  actor: z.string().default("mcp-gateway"),
  note: z.string().optional(),
  domain: z.string().default("substrate"),
});

const RejectSchema = z.object({
  recommendationId: z.string().min(1),
  note: z.string().min(1, "A rejection note is required"),
  actor: z.string().default("mcp-gateway"),
  domain: z.string().default("substrate"),
});

const ListWorkflowsSchema = z.object({});

// ─── Registered workflows cache ───────────────────────────────────────────────
// Since WorkflowRegistry in the substrate is module-local, we maintain our own
// copy of known workflow definitions from submit calls.

const knownWorkflows = new Map<string, WorkflowDefinition>();

function cacheWorkflow(def: WorkflowDefinition): void {
  knownWorkflows.set(def.id, def);
}

// ─── Telemetry helper ─────────────────────────────────────────────────────────

function recordTool(toolName: string, success: boolean, latencyMs: number): void {
  try {
    globalCollector.recordKnown(
      success ? "token_count" : "agent_reliability_score",
      latencyMs,
      { tool: toolName, gateway: "substrate-mcp", success: String(success) },
    );
  } catch {
    // telemetry must not throw
  }
}

// ─── Tool Handlers ────────────────────────────────────────────────────────────

export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function err(message: string, data?: unknown): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify({ error: message, ...(data ? { details: data } : {}) }, null, 2) }],
    isError: true,
  };
}

export async function handleToolCall(
  toolName: string,
  rawParams: unknown,
  actorId: string,
): Promise<ToolResult> {
  const t0 = Date.now();
  let success = false;
  try {
    const result = await dispatchTool(toolName, rawParams, actorId);
    success = !result.isError;
    return result;
  } finally {
    recordTool(toolName, success, Date.now() - t0);
  }
}

async function dispatchTool(
  toolName: string,
  rawParams: unknown,
  actorId: string,
): Promise<ToolResult> {
  switch (toolName) {
    case "substrate_submit_run":
      return handleSubmitRun(rawParams, actorId);
    case "substrate_get_run":
      return handleGetRun(rawParams);
    case "substrate_replay":
      return handleReplay(rawParams);
    case "substrate_counterfactual":
      return handleCounterfactual(rawParams);
    case "substrate_list_approvals":
      return handleListApprovals(rawParams);
    case "substrate_approve":
      return handleApprove(rawParams, actorId);
    case "substrate_reject":
      return handleReject(rawParams, actorId);
    case "substrate_list_workflows":
      return handleListWorkflows();
    default:
      return err(`Unknown tool: ${toolName}`);
  }
}

// ── substrate_submit_run ──────────────────────────────────────────────────────

async function handleSubmitRun(rawParams: unknown, actorId: string): Promise<ToolResult> {
  const parsed = SubmitRunSchema.safeParse(rawParams);
  if (!parsed.success) {
    return err("Invalid parameters", parsed.error.flatten());
  }

  const { workflowId, input, mode, metadata } = parsed.data;
  const workflow = lookupWorkflow(workflowId);

  if (!workflow) {
    const registered = listWorkflows();
    if (registered.length === 0) {
      return err(
        `Workflow '${workflowId}' cannot be resolved: the workflow registry is empty. ` +
        "No workflows have been registered in this gateway process via registerWorkflow(). " +
        "Register at least one workflow before submitting runs.",
        { code: "REGISTRY_EMPTY", workflowId, registeredCount: 0 },
      );
    }
    return err(
      `Workflow '${workflowId}' is not registered. ` +
      "Call substrate_list_workflows to see available workflows.",
      {
        code: "WORKFLOW_NOT_FOUND",
        workflowId,
        registeredCount: registered.length,
        availableWorkflowIds: registered.map((w) => w.id),
      },
    );
  }

  cacheWorkflow(workflow);

  const opts: RuntimeStartOptions = {
    mode,
    metadata: {
      ...metadata,
      submittedBy: actorId,
      submittedVia: "substrate-mcp-gateway",
    },
  };

  const pipelineRun = await defaultRuntime.start(workflow, input, opts);
  storeRun(pipelineRun);

  // Fan-out run lifecycle events to any connected SSE clients
  emitRunEvent({ type: "run_started", runId: pipelineRun.runId, workflowId: pipelineRun.workflowId, workflowName: pipelineRun.workflowName, timestamp: Date.now() });
  if (pipelineRun.status === "pending-approval") {
    emitRunEvent({ type: "approval_required", runId: pipelineRun.runId, workflowId: pipelineRun.workflowId, status: pipelineRun.status, timestamp: Date.now() });
  } else if (pipelineRun.status === "completed" || pipelineRun.status === "dry-run-complete") {
    emitRunEvent({ type: "run_complete", runId: pipelineRun.runId, workflowId: pipelineRun.workflowId, status: pipelineRun.status, timestamp: Date.now() });
  } else if (pipelineRun.status === "failed") {
    emitRunEvent({ type: "run_failed", runId: pipelineRun.runId, workflowId: pipelineRun.workflowId, status: pipelineRun.status, ...(pipelineRun.error ? { error: pipelineRun.error } : {}), timestamp: Date.now() });
  }

  return ok({
    runId: pipelineRun.runId,
    status: pipelineRun.status,
    workflowId: pipelineRun.workflowId,
    workflowName: pipelineRun.workflowName,
    mode: pipelineRun.mode,
    traceId: pipelineRun.traceId,
    startedAt: pipelineRun.startedAt,
    currentStageId: pipelineRun.currentStageId,
    stageCount: pipelineRun.stageResults.length,
    finalConfidence: pipelineRun.finalConfidence,
    error: pipelineRun.error,
  });
}

// ── substrate_get_run ─────────────────────────────────────────────────────────

async function handleGetRun(rawParams: unknown): Promise<ToolResult> {
  const parsed = GetRunSchema.safeParse(rawParams);
  if (!parsed.success) {
    return err("Invalid parameters", parsed.error.flatten());
  }

  const { runId } = parsed.data;

  // Try in-process store first, then fall back to the substrate journal
  let run = getRun(runId);

  if (!run) {
    const stored = await defaultRunStore.get(runId);
    if (stored) {
      run = stored;
      storeRun(run);
    }
  }

  if (!run) {
    return err(`Run '${runId}' not found. The gateway only tracks runs submitted in this process session.`);
  }

  return ok({
    runId: run.runId,
    workflowId: run.workflowId,
    workflowName: run.workflowName,
    mode: run.mode,
    status: run.status,
    currentStageId: run.currentStageId,
    stageResults: run.stageResults.map((sr) => ({
      stageId: sr.stageId,
      stageType: sr.stageType,
      status: sr.status,
      confidence: sr.confidence,
      error: sr.error,
    })),
    finalConfidence: run.finalConfidence,
    output: run.output,
    error: run.error,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    durationMs: run.durationMs,
    traceId: run.traceId,
    replaySourceRunId: run.replaySourceRunId,
    metadata: run.metadata,
  });
}

// ── substrate_replay ──────────────────────────────────────────────────────────

async function handleReplay(rawParams: unknown): Promise<ToolResult> {
  const parsed = ReplaySchema.safeParse(rawParams);
  if (!parsed.success) {
    return err("Invalid parameters", parsed.error.flatten());
  }

  const { runId, workflowId } = parsed.data;
  const workflow = lookupWorkflow(workflowId) ?? knownWorkflows.get(workflowId);

  if (!workflow) {
    return err(
      `Workflow '${workflowId}' is not registered. Submit a run with this workflow first.`,
    );
  }

  const result = await replay({ runId, workflow });

  if (result.replayRun.status === "failed") {
    return err("Replay run failed", {
      replayRunId: result.replayRun.runId,
      error: result.replayRun.error,
    });
  }

  storeRun(result.replayRun);

  return ok({
    sourceRunId: result.sourceRun.runId,
    replayRunId: result.replayRun.runId,
    status: result.replayRun.status,
    finalConfidence: result.replayRun.finalConfidence,
    stageCount: result.replayRun.stageResults.length,
    startedAt: result.replayRun.startedAt,
    completedAt: result.replayRun.completedAt,
    durationMs: result.replayRun.durationMs,
  });
}

// ── substrate_counterfactual ──────────────────────────────────────────────────

async function handleCounterfactual(rawParams: unknown): Promise<ToolResult> {
  const parsed = CounterfactualSchema.safeParse(rawParams);
  if (!parsed.success) {
    return err("Invalid parameters", parsed.error.flatten());
  }

  const { runId, workflowId, modelAdapterId, policyId } = parsed.data;
  const workflow = lookupWorkflow(workflowId) ?? knownWorkflows.get(workflowId);

  if (!workflow) {
    return err(`Workflow '${workflowId}' is not registered.`);
  }

  let policyProfile: import("@szl/substrate/types").PolicyProfile | undefined;
  if (policyId) {
    const { resolvePolicyProfileById } = await import("@szl/substrate");
    try {
      policyProfile = await resolvePolicyProfileById(policyId);
    } catch {
      // ignore — policy not found, use default
    }
    if (!policyProfile) {
      return err(`Policy '${policyId}' is not registered in the policy-engine.`);
    }
  }

  const result = await replay({
    runId,
    counterfactual: true,
    ...(modelAdapterId ? { model: modelAdapterId } : {}),
    ...(policyProfile ? { policy: policyProfile } : {}),
    workflow,
  });

  storeRun(result.replayRun);

  return ok({
    baselineRunId: result.sourceRun.runId,
    counterfactualRunId: result.replayRun.runId,
    diff: result.diff ?? null,
    outcomeChanged: result.diff?.outcomeChanged ?? false,
    finalConfidenceDelta: result.diff?.finalConfidenceDelta ?? 0,
    stageDiffCount: result.diff?.stageDiffs.length ?? 0,
    substitutions: {
      modelAdapterId: modelAdapterId ?? null,
      policyId: policyId ?? null,
    },
    generatedAt: result.diff?.generatedAt ?? new Date().toISOString(),
  });
}

// ── substrate_list_approvals ──────────────────────────────────────────────────

function handleListApprovals(rawParams: unknown): ToolResult {
  const parsed = ListApprovalsSchema.safeParse(rawParams);
  if (!parsed.success) {
    return err("Invalid parameters", parsed.error.flatten());
  }

  const { verdict, domain } = parsed.data;

  let actions = verdict
    ? getInboxByVerdict(verdict as ApprovalVerdict)
    : getApprovalActions();

  if (domain) {
    actions = actions.filter((a) => a.domain === domain);
  }

  return ok({
    count: actions.length,
    approvals: actions.map((a) => ({
      id: a.id,
      recommendationId: a.recommendationId,
      verdict: a.verdict,
      actor: a.actor,
      timestamp: a.timestamp,
      proofRef: a.proofRef,
      simulationId: a.simulationId,
      note: a.note,
      domain: a.domain,
      surface: a.surface,
    })),
  });
}

// ── substrate_approve ─────────────────────────────────────────────────────────

async function handleApprove(rawParams: unknown, actorId: string): Promise<ToolResult> {
  const parsed = ApproveSchema.safeParse(rawParams);
  if (!parsed.success) {
    return err("Invalid parameters", parsed.error.flatten());
  }

  const { recommendationId, actor, note, domain } = parsed.data;
  const resolvedActor = actor !== "mcp-gateway" ? actor : actorId;

  // Record approval in the approvals-inbox audit trail
  const action = submitApprovalAction(recommendationId, "approved", {
    actor: resolvedActor,
    ...(note ? { note } : {}),
    domain,
    surface: "substrate-mcp-gateway",
  });

  // Route the approval through the substrate runtime — this resumes the paused
  // run, writes an HMAC-signed evidence bundle, and continues graph execution.
  const resumedRun = await defaultRuntime.resume(recommendationId, resolvedActor);
  if (resumedRun) {
    updateRun(resumedRun);

    // Fan-out the approval and final run status to SSE clients
    emitRunEvent({ type: "approval_granted", runId: resumedRun.runId, actor: resolvedActor, status: resumedRun.status, timestamp: Date.now() });
    if (resumedRun.status === "completed") {
      emitRunEvent({ type: "run_complete", runId: resumedRun.runId, workflowId: resumedRun.workflowId, status: resumedRun.status, timestamp: Date.now() });
    } else if (resumedRun.status === "failed") {
      emitRunEvent({ type: "run_failed", runId: resumedRun.runId, workflowId: resumedRun.workflowId, status: resumedRun.status, ...(resumedRun.error ? { error: resumedRun.error } : {}), timestamp: Date.now() });
    }
  }

  return ok({
    approvalId: action.id,
    recommendationId: action.recommendationId,
    verdict: action.verdict,
    actor: action.actor,
    proofRef: action.proofRef,
    timestamp: action.timestamp,
    runStatus: resumedRun?.status ?? "unknown",
  });
}

// ── substrate_reject ──────────────────────────────────────────────────────────

async function handleReject(rawParams: unknown, actorId: string): Promise<ToolResult> {
  const parsed = RejectSchema.safeParse(rawParams);
  if (!parsed.success) {
    return err("Invalid parameters", parsed.error.flatten());
  }

  const { recommendationId, note, actor, domain } = parsed.data;
  const resolvedActor = actor !== "mcp-gateway" ? actor : actorId;

  // Record rejection in the approvals-inbox audit trail
  const action = submitApprovalAction(recommendationId, "rejected", {
    actor: resolvedActor,
    note,
    domain,
    surface: "substrate-mcp-gateway",
  });

  // Route the rejection through the substrate runtime — this marks the pending
  // approval gate as failed, writes a signed evidence bundle, sets run status to
  // "failed", and persists via the run store. No in-memory mutation needed here.
  const rejectedRun = await defaultRuntime.reject(recommendationId, resolvedActor, note);
  if (rejectedRun) {
    updateRun(rejectedRun);

    // Fan-out rejection and run-failed events to SSE clients
    emitRunEvent({ type: "approval_rejected", runId: rejectedRun.runId, actor: resolvedActor, status: rejectedRun.status, timestamp: Date.now() });
    emitRunEvent({ type: "run_failed", runId: rejectedRun.runId, workflowId: rejectedRun.workflowId, status: rejectedRun.status, ...(rejectedRun.error ? { error: rejectedRun.error } : {}), timestamp: Date.now() });
  }

  return ok({
    approvalId: action.id,
    recommendationId: action.recommendationId,
    verdict: action.verdict,
    actor: action.actor,
    proofRef: action.proofRef,
    timestamp: action.timestamp,
    note: action.note,
    runStatus: rejectedRun?.status ?? "unknown",
  });
}

// ── substrate_list_workflows ──────────────────────────────────────────────────

function handleListWorkflows(): ToolResult {
  // Primary source: the live substrate workflow registry (reflects all
  // registerWorkflow() calls made in this process — the authoritative list).
  const registered = listWorkflows();

  // Augment run counts from the in-process run store
  const runCounts = new Map<string, number>();
  for (const run of getAllRuns()) {
    runCounts.set(run.workflowId, (runCounts.get(run.workflowId) ?? 0) + 1);
  }

  const workflows = registered.map((def) => ({
    id: def.id,
    name: def.name,
    description: def.description ?? null,
    stageCount: def.stages.length,
    runCount: runCounts.get(def.id) ?? 0,
    policyProfile: def.policy?.name ?? null,
  }));

  return ok({
    count: workflows.length,
    registryEmpty: workflows.length === 0,
    substrateVersion: SUBSTRATE_VERSION,
    workflows,
    ...(workflows.length === 0
      ? {
          warning:
            "Workflow registry is empty. No workflows have been registered " +
            "in this gateway process via registerWorkflow(). substrate_submit_run " +
            "will fail with a REGISTRY_EMPTY error until at least one workflow is registered.",
        }
      : {}),
  });
}

// ─── Resource Handlers ────────────────────────────────────────────────────────

const RUN_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "PipelineRun",
  type: "object",
  properties: {
    runId: { type: "string", format: "uuid" },
    workflowId: { type: "string" },
    workflowName: { type: "string" },
    mode: { type: "string", enum: ["live", "dry-run", "replay", "counterfactual"] },
    status: { type: "string", enum: ["running", "completed", "failed", "pending-approval", "dry-run-complete", "cancelled"] },
    stageResults: { type: "array", items: { $ref: "#/$defs/StageResult" } },
    currentStageId: { type: "string" },
    output: { type: "object" },
    finalConfidence: { type: "number", minimum: 0, maximum: 1 },
    error: { type: "string" },
    startedAt: { type: "string", format: "date-time" },
    completedAt: { type: "string", format: "date-time" },
    durationMs: { type: "number" },
    traceId: { type: "string" },
    replaySourceRunId: { type: "string" },
    metadata: { type: "object" },
  },
  required: ["runId", "workflowId", "workflowName", "mode", "status", "stageResults", "startedAt", "traceId"],
  $defs: {
    StageResult: {
      type: "object",
      properties: {
        stageId: { type: "string" },
        stageType: { type: "string", enum: ["Reason", "Retrieve", "ToolCall", "Verify", "Decide", "ApprovalGate"] },
        status: { type: "string", enum: ["completed", "failed", "skipped", "pending-approval", "timed-out", "escalated"] },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        output: {},
        error: { type: "string" },
        startedAt: { type: "string", format: "date-time" },
        completedAt: { type: "string", format: "date-time" },
      },
      required: ["stageId", "stageType", "status"],
    },
  },
};

const STAGE_RESULT_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "StageResult",
  ...RUN_SCHEMA.$defs["StageResult"],
};

const COUNTERFACTUAL_DIFF_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "CounterfactualDiff",
  type: "object",
  properties: {
    baselineRunId: { type: "string" },
    counterfactualRunId: { type: "string" },
    counterfactualModel: { type: "string" },
    counterfactualPolicy: { type: "string" },
    stageDiffs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          stageId: { type: "string" },
          stageType: { type: "string" },
          baseline: {
            oneOf: [
              { type: "null" },
              { type: "object", properties: { status: { type: "string" }, confidence: { type: "number" }, output: {} }, required: ["status"] },
            ],
          },
          counterfactual: {
            oneOf: [
              { type: "null" },
              { type: "object", properties: { status: { type: "string" }, confidence: { type: "number" }, output: {} }, required: ["status"] },
            ],
          },
          differ: { type: "boolean" },
          decisionChanged: { type: "boolean" },
        },
        required: ["stageId", "stageType", "differ", "decisionChanged"],
      },
    },
    finalConfidenceDelta: { type: "number" },
    outcomeChanged: { type: "boolean" },
    generatedAt: { type: "string", format: "date-time" },
  },
  required: ["baselineRunId", "counterfactualRunId", "stageDiffs", "finalConfidenceDelta", "outcomeChanged", "generatedAt"],
};

export async function handleResourceRead(uri: string): Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> } | { error: string }> {
  switch (uri) {
    case "substrate://schema/run":
      return { contents: [{ uri, mimeType: "application/schema+json", text: JSON.stringify(RUN_SCHEMA, null, 2) }] };
    case "substrate://schema/stage-result":
      return { contents: [{ uri, mimeType: "application/schema+json", text: JSON.stringify(STAGE_RESULT_SCHEMA, null, 2) }] };
    case "substrate://schema/counterfactual-diff":
      return { contents: [{ uri, mimeType: "application/schema+json", text: JSON.stringify(COUNTERFACTUAL_DIFF_SCHEMA, null, 2) }] };
    case "substrate://policy/active": {
      let policies: unknown[] = [];
      try {
        const policyMod = await import("@szl-holdings/policy-engine");
        const fn = (policyMod as Record<string, unknown>)["getRegisteredPolicies"];
        if (typeof fn === "function") {
          policies = (fn() as Array<{ id: string; name: string }>).map((p) => ({
            id: p.id,
            name: p.name,
          }));
        }
      } catch {
        policies = [];
      }
      return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ policies }, null, 2) }] };
    }
    default:
      return { error: `Unknown resource URI: ${uri}` };
  }
}

// ─── Prompt Handlers ──────────────────────────────────────────────────────────

export function handlePromptGet(
  name: string,
  args: Record<string, string>,
): { messages: Array<{ role: string; content: { type: string; text: string } }> } | { error: string } {
  switch (name) {
    case "substrate_run_summary": {
      const { runId } = args;
      if (!runId) return { error: "Missing required argument: runId" };
      const run = getRun(runId);
      if (!run) return { error: `Run '${runId}' not found` };

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                `Summarise the following substrate run in 2–3 sentences. Focus on:\n` +
                `1. What decision was made (check the Decide stage output)\n` +
                `2. Overall confidence score (${run.finalConfidence ?? "unknown"})\n` +
                `3. Whether any approval gate was triggered (status: ${run.status})\n\n` +
                `Run data:\n${JSON.stringify(run, null, 2)}`,
            },
          },
        ],
      };
    }
    case "substrate_counterfactual_analysis": {
      const { diffJson } = args;
      if (!diffJson) return { error: "Missing required argument: diffJson" };

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                `Interpret this counterfactual diff and explain:\n` +
                `1. Which model or policy substitution caused the outcome to change\n` +
                `2. Which specific stages changed and why\n` +
                `3. Whether the overall governance posture improved or degraded\n\n` +
                `Diff:\n${diffJson}`,
            },
          },
        ],
      };
    }
    default:
      return { error: `Unknown prompt: ${name}` };
  }
}
