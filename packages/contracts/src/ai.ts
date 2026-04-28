/**
 * AI operations contracts — request/response schemas.
 */
import { z } from 'zod';
import { paginationQuerySchema, sortQuerySchema } from './common';

export const aiDomainSchema = z.enum([
  'aegis',
  'terra',
  'vessels',
  'prism_counsel',
  'continuum',
  'lyte',
  'cortex',
  'global',
]);
export type AIDomain = z.infer<typeof aiDomainSchema>;

export const riskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
export type RiskLevel = z.infer<typeof riskLevelSchema>;

export const chatBodySchema = z.object({
  message: z.string().min(1).max(32768),
  domain: aiDomainSchema.optional(),
  sessionId: z.string().optional(),
  model: z.string().optional(),
  systemPrompt: z.string().max(8192).optional(),
  context: z.record(z.unknown()).optional(),
});
export type ChatBody = z.infer<typeof chatBodySchema>;

export const analyzeBodySchema = z.object({
  content: z.string().min(1).max(65536),
  analysisType: z.string().min(1).max(64),
  domain: aiDomainSchema.optional(),
  context: z.record(z.unknown()).optional(),
});
export type AnalyzeBody = z.infer<typeof analyzeBodySchema>;

export const recommendBodySchema = z.object({
  entityType: z.string().min(1).max(64),
  entityId: z.union([z.string(), z.number()]),
  domain: aiDomainSchema.optional(),
  context: z.record(z.unknown()).optional(),
});
export type RecommendBody = z.infer<typeof recommendBodySchema>;

export const traceListQuerySchema = z.object({
  ...paginationQuerySchema.shape,
  ...sortQuerySchema.shape,
  domain: aiDomainSchema.optional(),
  requiresReview: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  status: z.string().optional(),
  riskLevel: riskLevelSchema.optional(),
  orgId: z.coerce.number().int().positive().optional(),
});
export type TraceListQuery = z.infer<typeof traceListQuerySchema>;

export const traceStatusPatchSchema = z.object({
  status: z.enum(['pending', 'evaluated', 'reviewed', 'flagged', 'archived']),
});
export type TraceStatusPatch = z.infer<typeof traceStatusPatchSchema>;

export const traceFeedbackBodySchema = z.object({
  sentiment: z.enum(['up', 'down']),
  correction: z.string().max(4096).optional(),
  comment: z.string().max(2048).optional(),
});
export type TraceFeedbackBody = z.infer<typeof traceFeedbackBodySchema>;

export const reviewQueueListQuerySchema = z.object({
  ...paginationQuerySchema.shape,
  domain: aiDomainSchema.optional(),
  status: z.enum(['pending', 'in_review', 'resolved']).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  verdict: z.enum(['approved', 'rejected', 'flagged', 'escalated', 'deferred']).optional(),
});

export const reviewDecisionBodySchema = z.object({
  verdict: z.enum(['approved', 'rejected', 'flagged', 'escalated', 'deferred']),
  comment: z.string().max(2048).optional(),
  correction: z.string().max(4096).optional(),
});
export type ReviewDecisionBody = z.infer<typeof reviewDecisionBodySchema>;

export const traceCapturBodySchema = z.object({
  model: z.string(),
  modelProvider: z.string(),
  domain: aiDomainSchema,
  promptTokens: z.number().int().min(0),
  completionTokens: z.number().int().min(0),
  latencyMs: z.number().min(0),
  costEstimateUsd: z.number().min(0),
  confidence: z.number().min(0).max(1).optional(),
  riskLevel: riskLevelSchema.optional(),
  toolsUsed: z.array(z.string()).optional(),
  correlationId: z.string().optional(),
  orgId: z.number().int().positive().optional(),
});
