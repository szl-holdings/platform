/**
 * AEF Ingestion Orchestrator — Core Types
 *
 * Workflow run model: deterministic graphs of named actors.
 * Actors are deterministic functions over typed inputs/outputs.
 * Runs are durable: state is checkpointed after each step.
 */

import { z } from 'zod';

// ─── Run Status ───────────────────────────────────────────────────────────────

export type WorkflowRunStatus =
  | 'queued'
  | 'running'
  | 'pending-approval'
  | 'completed'
  | 'failed'
  | 'cancelled';

// ─── Step Status ──────────────────────────────────────────────────────────────

export type StepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'pending-approval';

// ─── Actor Types (the 7 deterministic workflow actors) ───────────────────────

export type ActorName =
  | 'IngestionPlanner'
  | 'SchemaMapper'
  | 'PolicyGuard'
  | 'EmbedDispatcher'
  | 'IndexVerifier'
  | 'RetrievalEvaluator'
  | 'HumanApprovalGate';

// ─── Workflow Step ────────────────────────────────────────────────────────────

export interface WorkflowStep {
  stepId: string;
  name: string;
  actor: ActorName;
  input: unknown;
  requiresApproval?: boolean;
  approvalPattern?: string;
}

// ─── Step Result ──────────────────────────────────────────────────────────────

export interface StepResult {
  stepId: string;
  actor: ActorName;
  status: StepStatus;
  output?: unknown;
  error?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  attempt: number;
  approvalRequestId?: string;
}

// ─── Checkpoint ───────────────────────────────────────────────────────────────

export interface WorkflowCheckpoint {
  checkpointId: string;
  runId: string;
  stepIndex: number;
  completedStepResults: StepResult[];
  savedAt: string;
}

// ─── Run State ────────────────────────────────────────────────────────────────

export interface WorkflowRun {
  runId: string;
  workflowId: string;
  workflowName: string;
  tenantId: string;
  profileId: string;
  status: WorkflowRunStatus;
  input: unknown;
  stepResults: StepResult[];
  currentStepIndex: number;
  latestCheckpointId?: string;
  approvalRequestId?: string;
  error?: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  metadata: Record<string, unknown>;
}

// ─── Audit Event ──────────────────────────────────────────────────────────────

export interface OrchestratorAuditEvent {
  eventId: string;
  runId: string;
  workflowId: string;
  tenantId: string;
  profileId: string;
  kind:
    | 'run.started'
    | 'run.completed'
    | 'run.failed'
    | 'run.cancelled'
    | 'step.started'
    | 'step.completed'
    | 'step.failed'
    | 'step.retrying'
    | 'approval.requested'
    | 'approval.granted'
    | 'approval.rejected'
    | 'checkpoint.saved';
  payload: Record<string, unknown>;
  occurredAt: string;
}

// ─── Retry Policy ─────────────────────────────────────────────────────────────

export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  backoffMs: 200,
};

// ─── Workflow Definition ──────────────────────────────────────────────────────

export interface WorkflowDefinition {
  workflowId: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  retryPolicy?: RetryPolicy;
}

// ─── Submit Run Request/Response ──────────────────────────────────────────────

export const SubmitRunRequestSchema = z.object({
  workflowId: z.string().min(1),
  tenantId: z.string().min(1),
  profileId: z.string().default('default'),
  input: z.unknown(),
  metadata: z.record(z.unknown()).default({}),
});
export type SubmitRunRequest = z.infer<typeof SubmitRunRequestSchema>;

export interface SubmitRunResponse {
  runId: string;
  workflowId: string;
  tenantId: string;
  status: WorkflowRunStatus;
  statusUrl: string;
  startedAt: string;
}

// ─── List Runs Filter ─────────────────────────────────────────────────────────

export interface ListRunsFilter {
  tenantId?: string;
  profileId?: string;
  status?: WorkflowRunStatus;
  workflowId?: string;
  limit?: number;
  offset?: number;
}

// ─── Approval Request/Response ────────────────────────────────────────────────

export const ApprovalDecisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  actorId: z.string().optional(),
  note: z.string().optional(),
});
export type ApprovalDecision = z.infer<typeof ApprovalDecisionSchema>;
