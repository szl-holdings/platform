/**
 * @szl/substrate — Core types and Zod schemas
 *
 * TypeScript interfaces are defined explicitly alongside Zod schemas.
 * Zod is used for runtime validation at API boundaries only.
 * The TypeScript interfaces are the primary type source for compiler/engine use.
 */

import { z } from "zod";

// ─── Execution Modes ──────────────────────────────────────────────────────────

export const ExecutionModeSchema = z.enum(["live", "dry-run", "replay", "counterfactual"]);
export type ExecutionMode = "live" | "dry-run" | "replay" | "counterfactual";

// ─── Side Effect Categories ───────────────────────────────────────────────────

export const SideEffectCategorySchema = z.enum([
  "read-only",
  "write-internal",
  "write-external",
  "financial",
  "notification",
  "deletion",
  "escalation",
  "infrastructure",
]);
export type SideEffectCategory =
  | "read-only"
  | "write-internal"
  | "write-external"
  | "financial"
  | "notification"
  | "deletion"
  | "escalation"
  | "infrastructure";

// ─── Stage Type / Runtime / Priority ─────────────────────────────────────────

export type StageType = "Reason" | "Retrieve" | "ToolCall" | "Verify" | "Decide" | "ApprovalGate";
export const StageTypeSchema = z.enum(["Reason", "Retrieve", "ToolCall", "Verify", "Decide", "ApprovalGate"]);

export type StageRuntime = "typescript" | "python";
export const StageRuntimeSchema = z.enum(["typescript", "python"]);

export type StagePriority = "critical" | "high" | "normal" | "low";
export const StagePrioritySchema = z.enum(["critical", "high", "normal", "low"]);

// ─── Base Stage ───────────────────────────────────────────────────────────────

export interface BaseStage {
  id: string;
  name: string;
  type: StageType;
  description?: string;
  dependsOn: string[];
  timeoutMs: number;
  maxRetries: number;
  runtime: StageRuntime;
  otelTags: Record<string, string>;
  requiredEvidence: string[];
  rollbackHook?: string;
  priority: StagePriority;
}

const BaseStageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: StageTypeSchema,
  description: z.string().optional(),
  dependsOn: z.array(z.string()).default([]),
  timeoutMs: z.number().int().positive().default(30_000),
  maxRetries: z.number().int().nonnegative().default(2),
  runtime: StageRuntimeSchema.default("typescript"),
  otelTags: z.record(z.string()).default({}),
  requiredEvidence: z.array(z.string()).default([]),
  rollbackHook: z.string().optional(),
  priority: StagePrioritySchema.default("normal"),
});

// ─── Stage Interfaces ─────────────────────────────────────────────────────────

export interface ReasonStage extends BaseStage {
  type: "Reason";
  modelAdapterId: string;
  promptId?: string;
  inputSchema?: unknown;
  outputSchema?: unknown;
}

export interface RetrieveStage extends BaseStage {
  type: "Retrieve";
  retrieverAdapterId: string;
  topK: number;
  minRelevanceScore: number;
}

export interface ToolCallStage extends BaseStage {
  type: "ToolCall";
  toolId: string;
  sideEffects: SideEffectCategory[];
  requiresApprovalFor: SideEffectCategory[];
}

export interface VerifyStage extends BaseStage {
  type: "Verify";
  minConfidence: number;
  modelAdapterId: string;
  allowRevision: boolean;
}

export interface DecideStage extends BaseStage {
  type: "Decide";
  sideEffects: SideEffectCategory[];
  highRiskSideEffects: SideEffectCategory[];
  approvalPolicy: "auto" | "operator" | "manager" | "executive" | "board";
  modelAdapterId: string;
}

export interface ApprovalGate extends BaseStage {
  type: "ApprovalGate";
  requiredTier: "operator" | "manager" | "executive" | "board";
  inboxPattern: string;
  approvalTimeoutMs: number;
}

export type AnyStage = ReasonStage | RetrieveStage | ToolCallStage | VerifyStage | DecideStage | ApprovalGate;

// ─── Zod Schemas for AnyStage (runtime validation only) ──────────────────────

export const ReasonStageSchema = BaseStageSchema.extend({
  type: z.literal("Reason"),
  modelAdapterId: z.string().default("default"),
  promptId: z.string().optional(),
  inputSchema: z.unknown().optional(),
  outputSchema: z.unknown().optional(),
});

export const RetrieveStageSchema = BaseStageSchema.extend({
  type: z.literal("Retrieve"),
  retrieverAdapterId: z.string().default("default"),
  topK: z.number().int().positive().default(10),
  minRelevanceScore: z.number().min(0).max(1).default(0.5),
});

export const ToolCallStageSchema = BaseStageSchema.extend({
  type: z.literal("ToolCall"),
  toolId: z.string(),
  sideEffects: z.array(SideEffectCategorySchema).default([]),
  requiresApprovalFor: z.array(SideEffectCategorySchema).default([
    "financial",
    "deletion",
    "write-external",
    "infrastructure",
  ]),
});

export const VerifyStageSchema = BaseStageSchema.extend({
  type: z.literal("Verify"),
  minConfidence: z.number().min(0).max(1).default(0.7),
  modelAdapterId: z.string().default("verifier"),
  allowRevision: z.boolean().default(true),
});

export const DecideStageSchema = BaseStageSchema.extend({
  type: z.literal("Decide"),
  sideEffects: z.array(SideEffectCategorySchema).default([]),
  highRiskSideEffects: z.array(SideEffectCategorySchema).default([]),
  approvalPolicy: z.enum(["auto", "operator", "manager", "executive", "board"]).default("operator"),
  modelAdapterId: z.string().default("default"),
});

export const ApprovalGateSchema = BaseStageSchema.extend({
  type: z.literal("ApprovalGate"),
  requiredTier: z.enum(["operator", "manager", "executive", "board"]).default("operator"),
  inboxPattern: z.string().default("substrate-approval"),
  approvalTimeoutMs: z.number().int().nonnegative().default(0),
});

export const AnyStageSchema = z.discriminatedUnion("type", [
  ReasonStageSchema,
  RetrieveStageSchema,
  ToolCallStageSchema,
  VerifyStageSchema,
  DecideStageSchema,
  ApprovalGateSchema,
]);

// ─── Confidence Budget ────────────────────────────────────────────────────────

export interface ConfidenceBudget {
  escalateAt: number;
  requireHumanBelow: number;
  minFinalConfidence: number;
  escalationModelAdapterId: string;
  verifierAdapterId: string;
}

export const ConfidenceBudgetSchema = z.object({
  escalateAt: z.number().min(0).max(1).default(0.5),
  requireHumanBelow: z.number().min(0).max(1).default(0.3),
  minFinalConfidence: z.number().min(0).max(1).default(0.4),
  escalationModelAdapterId: z.string().default("strong"),
  verifierAdapterId: z.string().default("verifier"),
});

// ─── Policy Profile ───────────────────────────────────────────────────────────

export interface PolicyProfile {
  id: string;
  name: string;
  highRiskCategories: SideEffectCategory[];
  policyIds: string[];
  minimumApprovalTier: "operator" | "manager" | "executive" | "board";
}

export const PolicyProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  highRiskCategories: z.array(SideEffectCategorySchema).default([
    "financial",
    "deletion",
    "write-external",
    "infrastructure",
  ]),
  policyIds: z.array(z.string()).default([]),
  minimumApprovalTier: z.enum(["operator", "manager", "executive", "board"]).default("operator"),
});

// ─── Workflow Definition ──────────────────────────────────────────────────────

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  domain?: string;
  stages: AnyStage[];
  policy: PolicyProfile;
  budget: ConfidenceBudget;
  tags: Record<string, string>;
}

export const WorkflowDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  version: z.string().default("1.0.0"),
  domain: z.string().optional(),
  stages: z.array(AnyStageSchema).min(1),
  policy: PolicyProfileSchema,
  budget: ConfidenceBudgetSchema,
  tags: z.record(z.string()).default({}),
});

// ─── Compiled Graph ───────────────────────────────────────────────────────────

export interface CompiledStageNode {
  stage: AnyStage;
  depth: number;
  ancestors: Set<string>;
  descendants: Set<string>;
  hasApprovalGateAncestor: boolean;
}

export interface CompiledGraph {
  workflowId: string;
  workflowName: string;
  policyProfileId: string;
  nodes: Map<string, CompiledStageNode>;
  executionOrder: string[];
  compiledAt: string;
  warnings: string[];
}

// ─── Evidence Bundle ──────────────────────────────────────────────────────────

export interface EvidenceBundle {
  bundleId: string;
  runId: string;
  stageId: string;
  stageType: StageType;
  workflowId: string;
  promptVersion?: string;
  toolId?: string;
  toolArgs?: unknown;
  toolResult?: unknown;
  citations: string[];
  confidence: number;
  policyOutcome?: "allowed" | "blocked" | "escalated" | "pending-approval";
  inputHash: string;
  outputHash: string;
  parentHash?: string;
  bundleHash: string;
  /** HMAC-SHA256 signature of bundleHash using the substrate signing key */
  signature: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export const EvidenceBundleSchema = z.object({
  bundleId: z.string(),
  runId: z.string(),
  stageId: z.string(),
  stageType: StageTypeSchema,
  workflowId: z.string(),
  promptVersion: z.string().optional(),
  toolId: z.string().optional(),
  toolArgs: z.unknown().optional(),
  toolResult: z.unknown().optional(),
  citations: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  policyOutcome: z.enum(["allowed", "blocked", "escalated", "pending-approval"]).optional(),
  inputHash: z.string(),
  outputHash: z.string(),
  parentHash: z.string().optional(),
  bundleHash: z.string(),
  signature: z.string(),
  createdAt: z.string(),
  metadata: z.record(z.unknown()).default({}),
});

// ─── Stage Result ─────────────────────────────────────────────────────────────

export type StageResultStatus =
  | "completed"
  | "failed"
  | "skipped"
  | "pending-approval"
  | "timed-out"
  | "escalated";

export interface StageResult {
  stageId: string;
  stageType: StageType;
  status: StageResultStatus;
  confidence?: number;
  output?: unknown;
  error?: string;
  evidenceBundleId?: string;
  durationMs: number;
  attempt: number;
  routingDecision?: "accepted" | "escalated-model" | "escalated-human" | "verified";
  approvalId?: string;
  createdAt: string;
}

export const StageResultSchema = z.object({
  stageId: z.string(),
  stageType: StageTypeSchema,
  status: z.enum(["completed", "failed", "skipped", "pending-approval", "timed-out", "escalated"]),
  confidence: z.number().min(0).max(1).optional(),
  output: z.unknown().optional(),
  error: z.string().optional(),
  evidenceBundleId: z.string().optional(),
  durationMs: z.number().nonnegative(),
  attempt: z.number().int().positive().default(1),
  routingDecision: z.enum(["accepted", "escalated-model", "escalated-human", "verified"]).optional(),
  approvalId: z.string().optional(),
  createdAt: z.string(),
});

// ─── Pipeline Run ─────────────────────────────────────────────────────────────

export type PipelineRunStatus =
  | "running"
  | "completed"
  | "failed"
  | "pending-approval"
  | "dry-run-complete"
  | "cancelled";

export interface PipelineRun {
  runId: string;
  workflowId: string;
  workflowName: string;
  mode: ExecutionMode;
  status: PipelineRunStatus;
  stageResults: StageResult[];
  currentStageId?: string;
  input: unknown;
  output?: unknown;
  finalConfidence?: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  replaySourceRunId?: string;
  counterfactualModelAdapter?: string;
  counterfactualPolicyProfile?: string;
  traceId: string;
  metadata: Record<string, unknown>;
}

export const PipelineRunSchema = z.object({
  runId: z.string(),
  workflowId: z.string(),
  workflowName: z.string(),
  mode: ExecutionModeSchema,
  status: z.enum(["running", "completed", "failed", "pending-approval", "dry-run-complete", "cancelled"]),
  stageResults: z.array(StageResultSchema).default([]),
  currentStageId: z.string().optional(),
  input: z.unknown(),
  output: z.unknown().optional(),
  finalConfidence: z.number().min(0).max(1).optional(),
  error: z.string().optional(),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  durationMs: z.number().nonnegative().optional(),
  replaySourceRunId: z.string().optional(),
  counterfactualModelAdapter: z.string().optional(),
  counterfactualPolicyProfile: z.string().optional(),
  traceId: z.string(),
  metadata: z.record(z.unknown()).default({}),
});

// ─── Runtime Start Options ────────────────────────────────────────────────────

export interface RuntimeStartOptions {
  mode?: ExecutionMode;
  sourceRunId?: string;
  counterfactualModel?: string;
  counterfactualPolicy?: PolicyProfile;
  replayDiffOnly?: boolean;
  traceId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export const RuntimeStartOptionsSchema = z.object({
  mode: ExecutionModeSchema.default("live"),
  sourceRunId: z.string().optional(),
  counterfactualModel: z.string().optional(),
  counterfactualPolicy: PolicyProfileSchema.optional(),
  replayDiffOnly: z.boolean().default(false),
  traceId: z.string().optional(),
  sessionId: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
});

// ─── Hook Set ─────────────────────────────────────────────────────────────────

export interface SubstrateHooks {
  before_pipeline?: (run: PipelineRun) => Promise<void>;
  after_pipeline?: (run: PipelineRun) => Promise<void>;
  before_stage?: (run: PipelineRun, stage: AnyStage) => Promise<void>;
  after_stage?: (run: PipelineRun, stage: AnyStage, result: StageResult) => Promise<void>;
  on_validation_error?: (run: PipelineRun, stage: AnyStage, error: Error) => Promise<void>;
  on_policy_violation?: (run: PipelineRun, stage: AnyStage, reason: string) => Promise<void>;
  on_low_confidence?: (run: PipelineRun, stage: AnyStage, confidence: number) => Promise<void>;
  before_tool_call?: (run: PipelineRun, stage: ToolCallStage, toolArgs: unknown) => Promise<void>;
  after_tool_call?: (run: PipelineRun, stage: ToolCallStage, result: unknown) => Promise<void>;
  before_side_effect?: (run: PipelineRun, stage: AnyStage, effect: SideEffectCategory) => Promise<void>;
  after_side_effect?: (run: PipelineRun, stage: AnyStage, effect: SideEffectCategory) => Promise<void>;
  before_finalize?: (run: PipelineRun) => Promise<void>;
  after_finalize?: (run: PipelineRun) => Promise<void>;
}

// ─── Stage Executor ───────────────────────────────────────────────────────────

export interface StageExecutorContext {
  runId: string;
  workflowId: string;
  mode: ExecutionMode;
  stageId: string;
  budget: ConfidenceBudget;
  policy: PolicyProfile;
  priorEvidence: EvidenceBundle[];
  graph: CompiledGraph;
  /**
   * Counterfactual override: when set, Reason/Verify/Decide stages use this
   * adapter ID instead of stage.modelAdapterId. This is how counterfactual
   * model substitution is applied at execution time.
   */
  counterfactualModelAdapterId?: string;
}

export type StageExecutorFn = (
  stage: AnyStage,
  input: unknown,
  ctx: StageExecutorContext,
) => Promise<{ output: unknown; confidence: number }>;

// ─── Counterfactual Diff ──────────────────────────────────────────────────────

export interface StageDiff {
  stageId: string;
  stageType: StageType;
  baseline: { status: StageResultStatus; confidence?: number; output?: unknown } | null;
  counterfactual: { status: StageResultStatus; confidence?: number; output?: unknown } | null;
  differ: boolean;
  decisionChanged: boolean;
}

export interface CounterfactualDiff {
  baselineRunId: string;
  counterfactualRunId: string;
  counterfactualModel?: string;
  counterfactualPolicy?: string;
  stageDiffs: StageDiff[];
  finalConfidenceDelta: number;
  outcomeChanged: boolean;
  generatedAt: string;
}
