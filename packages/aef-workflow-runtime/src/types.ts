import { z } from 'zod';

export type WorkflowKind =
  | 'ingest_document'
  | 'rebuild_index'
  | 'verify_index_health'
  | 'run_retrieval_eval'
  | 'rotate_profile_version';

export type WorkflowStatus =
  | 'pending'
  | 'running'
  | 'waiting_approval'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ActorRole =
  | 'IngestionPlanner'
  | 'SourceNormalizer'
  | 'ChunkPlanner'
  | 'PolicyGuard'
  | 'VectorDispatch'
  | 'IndexVerifier'
  | 'RetrievalEvaluator'
  | 'ApprovalGate';

export const WorkflowStepResultSchema = z.object({
  stepId: z.string(),
  actor: z.string(),
  status: z.enum(['success', 'failed', 'skipped', 'waiting']),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  output: z.record(z.unknown()).default({}),
  error: z.string().optional(),
});
export type WorkflowStepResult = z.infer<typeof WorkflowStepResultSchema>;

export const WorkflowCheckpointSchema = z.object({
  workflowId: z.string().min(1),
  kind: z.string(),
  currentStepIndex: z.number().int().nonnegative(),
  totalSteps: z.number().int().positive(),
  status: z.enum([
    'pending',
    'running',
    'waiting_approval',
    'approved',
    'rejected',
    'completed',
    'failed',
    'cancelled',
  ]),
  completedSteps: z.array(WorkflowStepResultSchema).default([]),
  context: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  approvalRequestId: z.string().optional(),
});
export type WorkflowCheckpoint = z.infer<typeof WorkflowCheckpointSchema>;

export const ApprovalRequestSchema = z.object({
  approvalId: z.string().min(1),
  workflowId: z.string().min(1),
  kind: z.string(),
  requestedAt: z.string().datetime(),
  resolvedAt: z.string().datetime().optional(),
  decision: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  operatorId: z.string().optional(),
  rationale: z.string().optional(),
  context: z.record(z.unknown()).default({}),
});
export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;

export const AuditEventSchema = z.object({
  auditId: z.string().min(1),
  workflowId: z.string().min(1),
  kind: z.string(),
  stepId: z.string().optional(),
  actor: z.string().optional(),
  tenantId: z.string().min(1),
  profileId: z.string().optional(),
  occurredAt: z.string().datetime(),
  outcome: z.enum(['success', 'failure', 'skipped', 'approval_requested', 'approved', 'rejected']),
  details: z.record(z.unknown()).default({}),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

export interface WorkflowContext {
  workflowId: string;
  tenantId: string;
  profileId?: string;
  requestedBy: string;
  input: Record<string, unknown>;
  approvalRequired: boolean;
}

export interface WorkflowStepDefinition {
  stepId: string;
  actor: ActorRole;
  description: string;
  requiresApproval?: boolean;
  execute(ctx: WorkflowContext, prior: WorkflowStepResult[]): Promise<Record<string, unknown>>;
}

export interface WorkflowDefinition {
  kind: WorkflowKind;
  displayName: string;
  steps: WorkflowStepDefinition[];
}

export type AuditEmitter = (event: AuditEvent) => void;
