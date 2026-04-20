/**
 * Alloy workflow engine contracts — request/response schemas.
 */
import { z } from "zod";
import { paginationQuerySchema, idParamSchema, sortQuerySchema } from "./common";

export const workflowStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "cancelled",
  "blocked",
  "failed",
]);
export type WorkflowStatus = z.infer<typeof workflowStatusSchema>;

export const workflowPrioritySchema = z.enum(["critical", "high", "medium", "low"]);
export type WorkflowPriority = z.infer<typeof workflowPrioritySchema>;

export const createWorkflowBodySchema = z.object({
  title: z.string().min(1).max(256),
  type: z.string().min(1).max(128),
  priority: workflowPrioritySchema.optional().default("medium"),
  assignedTo: z.number().int().positive().optional(),
  dueAt: z.coerce.date().optional(),
  metadata: z.record(z.unknown()).optional(),
  orgId: z.number().int().positive().optional(),
});
export type CreateWorkflowBody = z.infer<typeof createWorkflowBodySchema>;

export const workflowListQuerySchema = z.object({
  ...paginationQuerySchema.shape,
  ...sortQuerySchema.shape,
  status: workflowStatusSchema.optional(),
  priority: workflowPrioritySchema.optional(),
  orgId: z.coerce.number().int().positive().optional(),
  assignedTo: z.coerce.number().int().positive().optional(),
});
export type WorkflowListQuery = z.infer<typeof workflowListQuerySchema>;

export const workflowIdParamSchema = idParamSchema;

export const approveWorkflowBodySchema = z.object({
  comment: z.string().max(1024).optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type ApproveWorkflowBody = z.infer<typeof approveWorkflowBodySchema>;

export const rejectWorkflowBodySchema = z.object({
  reason: z.string().min(1).max(1024),
  metadata: z.record(z.unknown()).optional(),
});
export type RejectWorkflowBody = z.infer<typeof rejectWorkflowBodySchema>;

export const actionListQuerySchema = z.object({
  ...paginationQuerySchema.shape,
  ...sortQuerySchema.shape,
  workflowId: z.coerce.number().int().positive().optional(),
  orgId: z.coerce.number().int().positive().optional(),
  status: z.string().optional(),
});

export const agentListQuerySchema = z.object({
  ...paginationQuerySchema.shape,
  orgId: z.coerce.number().int().positive().optional(),
  domain: z.string().optional(),
});
