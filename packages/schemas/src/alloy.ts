/**
 * Alloy workflow engine domain schemas.
 */
import { z } from 'zod';

export const workflowStepResultSchema = z.object({
  stepId: z.string(),
  stepType: z.string(),
  status: z.enum(['pending', 'running', 'success', 'failed', 'skipped']),
  output: z.record(z.unknown()).optional(),
  error: z.string().optional(),
  durationMs: z.number().int().min(0).optional(),
  startedAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
});
export type WorkflowStepResult = z.infer<typeof workflowStepResultSchema>;

export const agentDecisionSchema = z.object({
  id: z.number().int().positive(),
  agentId: z.string(),
  workflowRunId: z.number().int().optional(),
  decision: z.string(),
  confidence: z.number().min(0).max(1).optional(),
  reasoning: z.string().optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  requiresApproval: z.boolean(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.coerce.date(),
});
export type AgentDecision = z.infer<typeof agentDecisionSchema>;

export const approvalSchema = z.object({
  id: z.number().int().positive(),
  workflowRunId: z.number().int().optional(),
  action: z.string(),
  requestedBy: z.number().int().positive(),
  approvedBy: z.number().int().positive().nullable().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'expired']),
  comment: z.string().optional(),
  requestedAt: z.coerce.date(),
  resolvedAt: z.coerce.date().nullable().optional(),
});
export type Approval = z.infer<typeof approvalSchema>;

export const skillSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  domain: z.string(),
  inputSchema: z.record(z.unknown()).optional(),
  outputSchema: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});
export type Skill = z.infer<typeof skillSchema>;

export const jobQueuePayloadSchema = z.object({
  jobId: z.string(),
  jobType: z.string(),
  correlationId: z.string().optional(),
  orgId: z.number().int().positive().optional(),
  payload: z.record(z.unknown()),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional().default('medium'),
  attempts: z.number().int().min(0).optional().default(0),
  maxAttempts: z.number().int().positive().optional().default(3),
  scheduledAt: z.coerce.date().optional(),
});
export type JobQueuePayload = z.infer<typeof jobQueuePayloadSchema>;
