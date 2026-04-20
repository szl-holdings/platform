import { z } from "zod";
import { TenantIdSchema } from "./tenant.js";

export const EvalQuerySchema = z.object({
  queryId: z.string(),
  query: z.string().min(1),
  relevantChunkIds: z.array(z.string()).min(1),
  metadata: z.record(z.unknown()).default({}),
});
export type EvalQuery = z.infer<typeof EvalQuerySchema>;

export const EvalRunRequestSchema = z.object({
  requestId: z.string().min(1),
  tenantId: TenantIdSchema,
  profileId: z.string(),
  datasetId: z.string(),
  queries: z.array(EvalQuerySchema).min(1),
  topK: z.number().int().positive().default(10),
  metrics: z.array(z.enum(["ndcg", "recall", "precision", "mrr"])).default(["ndcg", "recall"]),
  metadata: z.record(z.unknown()).default({}),
});
export type EvalRunRequest = z.infer<typeof EvalRunRequestSchema>;

export const EvalMetricResultSchema = z.object({
  metric: z.string(),
  value: z.number(),
  atK: z.number().int().positive(),
});
export type EvalMetricResult = z.infer<typeof EvalMetricResultSchema>;

export const EvalRunResponseSchema = z.object({
  requestId: z.string(),
  tenantId: TenantIdSchema,
  profileId: z.string(),
  datasetId: z.string(),
  queryCount: z.number().int().nonnegative(),
  metrics: z.array(EvalMetricResultSchema),
  completedAt: z.string().datetime(),
  processingMs: z.number().nonnegative().optional(),
});
export type EvalRunResponse = z.infer<typeof EvalRunResponseSchema>;
