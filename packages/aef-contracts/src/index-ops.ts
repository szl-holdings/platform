import { z } from "zod";
import { TenantIdSchema } from "./tenant.js";

export const IndexRebuildRequestSchema = z.object({
  requestId: z.string().min(1),
  tenantId: TenantIdSchema,
  profileId: z.string().optional(),
  fullRebuild: z.boolean().default(false),
  sourceIds: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).default({}),
});
export type IndexRebuildRequest = z.infer<typeof IndexRebuildRequestSchema>;

export const IndexRebuildResponseSchema = z.object({
  requestId: z.string(),
  tenantId: TenantIdSchema,
  jobId: z.string(),
  status: z.enum(["queued", "running", "completed", "failed", "waiting_approval"]),
  startedAt: z.string().datetime().optional(),
});
export type IndexRebuildResponse = z.infer<typeof IndexRebuildResponseSchema>;

export const IndexVerifyRequestSchema = z.object({
  requestId: z.string().min(1),
  tenantId: TenantIdSchema,
  profileId: z.string().optional(),
  sourceIds: z.array(z.string()).optional(),
});
export type IndexVerifyRequest = z.infer<typeof IndexVerifyRequestSchema>;

export const IndexVerifyResponseSchema = z.object({
  requestId: z.string(),
  tenantId: TenantIdSchema,
  chunksVerified: z.number().int().nonnegative(),
  missingChunks: z.array(z.string()).default([]),
  corruptChunks: z.array(z.string()).default([]),
  verified: z.boolean(),
});
export type IndexVerifyResponse = z.infer<typeof IndexVerifyResponseSchema>;
