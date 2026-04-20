/**
 * AI & agent infrastructure schemas — used by trace capture, review queue,
 * job payloads, and LLM structured output parsing.
 */
import { z } from 'zod';

export const aiTraceSchema = z.object({
  traceId: z.string().min(1),
  correlationId: z.string().optional(),
  orgId: z.number().int().positive().optional(),
  model: z.string(),
  modelProvider: z.string(),
  modelVersion: z.string().optional(),
  routeClass: z.enum(['critical', 'standard', 'economy']).optional(),
  domain: z.string().optional(),
  recommendationType: z.string().optional(),
  promptHash: z.string().optional(),
  promptTokens: z.number().int().min(0),
  completionTokens: z.number().int().min(0),
  latencyMs: z.number().min(0),
  costEstimateUsd: z.number().min(0),
  confidence: z.number().min(0).max(1).optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  toolsUsed: z.array(z.string()).optional(),
  requiresReview: z.boolean().optional(),
  reviewReason: z.string().optional(),
  evalScore: z.number().min(0).max(1).optional(),
  evalPassed: z.boolean().optional(),
  status: z.enum(['pending', 'evaluated', 'reviewed', 'flagged', 'archived']).optional(),
  capturedAt: z.coerce.date(),
});
export type AITrace = z.infer<typeof aiTraceSchema>;

export const toolCallSchema = z.object({
  toolName: z.string().min(1),
  toolArgs: z.record(z.unknown()).optional(),
  toolResult: z.record(z.unknown()).optional(),
  success: z.boolean(),
  errorMessage: z.string().optional(),
  durationMs: z.number().min(0).optional(),
  spanId: z.string().optional(),
  correlationId: z.string().optional(),
  orgId: z.number().int().positive().optional(),
  invokedAt: z.coerce.date(),
});
export type ToolCall = z.infer<typeof toolCallSchema>;

export const llmStructuredOutputSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    content: schema,
    confidence: z.number().min(0).max(1).optional(),
    model: z.string().optional(),
    promptTokens: z.number().int().min(0).optional(),
    completionTokens: z.number().int().min(0).optional(),
  });

export const aiOpsMetricSchema = z.object({
  totalTraces: z.number().int().min(0),
  reviewRequired: z.number().int().min(0),
  reviewRate: z.number().min(0).max(1),
  avgLatencyMs: z.number().min(0),
  p50LatencyMs: z.number().min(0),
  p95LatencyMs: z.number().min(0),
  avgConfidence: z.number().min(0).max(1).optional(),
  totalCostUsd: z.number().min(0),
  evalPassRate: z.number().min(0).max(1).optional(),
});
export type AIOpMetric = z.infer<typeof aiOpsMetricSchema>;
