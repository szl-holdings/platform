/**
 * @szl/substrate-client — Shared types
 *
 * These mirror the server-side types from @szl/substrate without creating
 * a runtime dependency on the substrate package. The client is intentionally
 * dependency-free (only needs zod for validation).
 */

// ─── Execution Primitives ─────────────────────────────────────────────────────

export type ExecutionMode = "live" | "dry-run" | "replay" | "counterfactual";

export type PipelineRunStatus =
  | "running"
  | "completed"
  | "failed"
  | "pending-approval"
  | "dry-run-complete"
  | "cancelled";

export type StageType =
  | "Reason"
  | "Retrieve"
  | "ToolCall"
  | "Verify"
  | "Decide"
  | "ApprovalGate";

export type StageResultStatus =
  | "completed"
  | "failed"
  | "skipped"
  | "pending-approval"
  | "timed-out"
  | "escalated";

// ─── Core Objects ─────────────────────────────────────────────────────────────

export interface StageResultSummary {
  stageId: string;
  stageType: StageType;
  status: StageResultStatus;
  confidence?: number;
  error?: string;
}

export interface PipelineRunSummary {
  runId: string;
  workflowId: string;
  workflowName: string;
  mode: ExecutionMode;
  status: PipelineRunStatus;
  stageResults: StageResultSummary[];
  currentStageId?: string;
  finalConfidence?: number;
  output?: unknown;
  error?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  traceId: string;
  replaySourceRunId?: string;
  metadata: Record<string, unknown>;
}

export interface SubmitRunResponse {
  runId: string;
  status: PipelineRunStatus;
  workflowId: string;
  workflowName: string;
  mode: ExecutionMode;
  traceId: string;
  startedAt: string;
  currentStageId?: string;
  stageCount: number;
  finalConfidence?: number;
  error?: string;
}

// ─── Approvals ────────────────────────────────────────────────────────────────

export type ApprovalVerdict = "approved" | "rejected" | "escalated";

export interface ApprovalEntry {
  id: string;
  recommendationId: string;
  verdict: ApprovalVerdict;
  actor: string;
  timestamp: number;
  proofRef: string;
  simulationId?: string;
  note?: string;
  domain: string;
  surface: string;
}

export interface ApprovalListResponse {
  count: number;
  approvals: ApprovalEntry[];
}

export interface ApprovalActionResponse {
  approvalId: string;
  recommendationId: string;
  verdict: ApprovalVerdict;
  actor: string;
  proofRef: string;
  timestamp: number;
  note?: string;
}

// ─── Replay / Counterfactual ──────────────────────────────────────────────────

export interface ReplayResponse {
  sourceRunId: string;
  replayRunId: string;
  status: PipelineRunStatus;
  finalConfidence?: number;
  stageCount: number;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}

export interface StageDiffSide {
  status: StageResultStatus;
  confidence?: number;
  output?: unknown;
}

export interface StageDiff {
  stageId: string;
  stageType: StageType;
  baseline: StageDiffSide | null;
  counterfactual: StageDiffSide | null;
  /** True when any field (status, confidence, output) differs between baseline and counterfactual */
  differ: boolean;
  /** True when the decision outcome (allow/block) changed between the two runs */
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

export interface CounterfactualResponse {
  baselineRunId: string;
  counterfactualRunId: string;
  diff: CounterfactualDiff | null;
  outcomeChanged: boolean;
  finalConfidenceDelta: number;
  stageDiffCount: number;
  substitutions: {
    modelAdapterId: string | null;
    policyId: string | null;
  };
  generatedAt: string;
}

// ─── Workflows ────────────────────────────────────────────────────────────────

export interface WorkflowSummary {
  id: string;
  name: string;
  description: string | null;
  stageCount: number;
  runCount: number;
  policyProfile: string | null;
}

export interface WorkflowListResponse {
  count: number;
  substrateVersion: string;
  workflows: WorkflowSummary[];
}

// ─── Client Options ───────────────────────────────────────────────────────────

export interface SubstrateClientOptions {
  /** Base URL of the substrate-mcp-gateway (e.g. http://localhost:3700) */
  baseUrl: string;
  /** Bearer token (SUBSTRATE_GATEWAY_API_KEY) */
  apiKey?: string;
  /** Request timeout in milliseconds. Default: 30_000 */
  timeoutMs?: number;
  /** Custom fetch implementation. Defaults to global fetch. */
  fetch?: typeof fetch;
}

// ─── Streaming ────────────────────────────────────────────────────────────────

export interface RunEvent {
  type:
    | "ready"
    | "ping"
    | "run_started"
    | "stage_complete"
    | "run_complete"
    | "run_failed"
    | "approval_required"
    // Live runtime events streamed from the substrate journal as a workflow
    // executes (stage-by-stage progress without polling).
    | "stage:start"
    | "stage:complete"
    | "stage:failed"
    | "run:started"
    | "run:complete"
    | "run:failed"
    | "run:pending-approval";
  timestamp: number;
  runId?: string;
  data?: unknown;
}

export interface StreamingOptions {
  onEvent?: (event: RunEvent) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
  signal?: AbortSignal;
}

// ─── Error ────────────────────────────────────────────────────────────────────

export class SubstrateClientError extends Error {
  readonly code: number;
  readonly data?: unknown;

  constructor(message: string, code: number, data?: unknown) {
    super(message);
    this.name = "SubstrateClientError";
    this.code = code;
    this.data = data;
  }
}
