import { z } from "zod";
import { PolicyEvaluationSchema } from "@szl-holdings/policy-engine";

export const ExecutionModeSchema = z.enum(["manual", "semi_auto", "autonomous"]);
export type ExecutionMode = z.infer<typeof ExecutionModeSchema>;

export const WorkflowStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  executionMode: ExecutionModeSchema.default("manual"),
  requiresApproval: z.boolean().default(false),
  approverRole: z.string().optional(),
  handler: z.string(),
  parameters: z.record(z.unknown()).optional(),
  rollbackHandler: z.string().optional(),
  timeoutMs: z.number().int().positive().optional(),
  retryCount: z.number().int().min(0).max(5).default(0),
});
export type WorkflowStep = z.input<typeof WorkflowStepSchema>;

export const WorkflowDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  domain: z.string(),
  steps: z.array(WorkflowStepSchema),
  executionMode: ExecutionModeSchema.default("manual"),
  isDryRunCapable: z.boolean().default(true),
  isSimulationCapable: z.boolean().default(true),
  requiresExplicitApproval: z.boolean().default(true),
  estimatedCostUsd: z.number().min(0).optional(),
  rollbackPolicy: z.enum(["none", "step", "full"]).default("step"),
  metadata: z.record(z.unknown()).optional(),
});
export type WorkflowDefinition = z.input<typeof WorkflowDefinitionSchema>;

export const StepExecutionRecordSchema = z.object({
  stepId: z.string(),
  stepName: z.string(),
  startedAt: z.number(),
  completedAt: z.number().optional(),
  status: z.enum(["pending", "running", "completed", "failed", "skipped", "rolled_back"]),
  inputs: z.record(z.unknown()).optional(),
  outputs: z.record(z.unknown()).optional(),
  error: z.string().optional(),
  rollbackedAt: z.number().optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.number().optional(),
});
export type StepExecutionRecord = z.infer<typeof StepExecutionRecordSchema>;

export const WorkflowRunSchema = z.object({
  runId: z.string(),
  workflowId: z.string(),
  workflowName: z.string(),
  recommendationId: z.string().optional(),
  tenantId: z.string().optional(),
  initiatedBy: z.string().optional(),
  executionMode: ExecutionModeSchema,
  isDryRun: z.boolean().default(false),
  isSimulation: z.boolean().default(false),
  status: z.enum(["pending_approval", "approved", "running", "completed", "failed", "rolled_back", "cancelled"]),
  currentStepIndex: z.number().int().min(0).default(0),
  steps: z.array(StepExecutionRecordSchema),
  approvalState: z.enum(["none", "pending", "approved", "rejected"]).default("none"),
  approvedBy: z.string().optional(),
  approvedAt: z.number().optional(),
  rejectionReason: z.string().optional(),
  policyEvaluation: PolicyEvaluationSchema.optional(),
  auditTrail: z.array(z.object({
    at: z.number(),
    actor: z.string().optional(),
    action: z.string(),
    detail: z.string().optional(),
    immutable: z.boolean().default(true),
  })),
  startedAt: z.number(),
  completedAt: z.number().optional(),
  estimatedCostUsd: z.number().optional(),
  actualCostUsd: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type WorkflowRun = z.infer<typeof WorkflowRunSchema>;

export interface ActionEngineResult {
  run: WorkflowRun;
  requiresApproval: boolean;
  approvalRequest?: {
    approverRole: string;
    reason: string;
  };
  dryRunSummary?: string;
  simulationSummary?: string;
}
