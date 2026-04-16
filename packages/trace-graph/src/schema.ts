import { z } from "zod";

export const ToolCallRecordSchema = z.object({
  toolId: z.string(),
  toolName: z.string(),
  inputHash: z.string().optional(),
  outputHash: z.string().optional(),
  latencyMs: z.number().optional(),
  tokens: z.number().optional(),
  costUsd: z.number().optional(),
  success: z.boolean(),
  errorCode: z.string().optional(),
  retries: z.number().int().default(0),
  approvalRequired: z.boolean().default(false),
  approvalId: z.string().optional(),
});

export const RetrievalRecordSchema = z.object({
  source: z.string(),
  query: z.string().optional(),
  hitCount: z.number().int(),
  missCount: z.number().int().default(0),
  latencyMs: z.number().optional(),
  qualityScore: z.number().min(0).max(1).optional(),
});

export const MemoryIORecordSchema = z.object({
  tier: z.string(),
  operation: z.enum(["read", "write", "evict"]),
  key: z.string().optional(),
  hit: z.boolean(),
  latencyMs: z.number().optional(),
});

export const CitationRecordSchema = z.object({
  sourceId: z.string(),
  sourceType: z.string(),
  snippet: z.string().optional(),
  coverageScore: z.number().min(0).max(1).optional(),
});

export const GuardrailResultSchema = z.object({
  guardId: z.string(),
  tier: z.string(),
  outcome: z.enum(["pass", "block", "warn", "require-approval"]),
  reason: z.string().optional(),
});

export const TraceSpanSchema = z.object({
  spanId: z.string(),
  parentSpanId: z.string().optional(),
  name: z.string(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  latencyMs: z.number().optional(),
  attributes: z.record(z.unknown()).default({}),
  status: z.enum(["ok", "error", "pending"]).default("ok"),
  errorMessage: z.string().optional(),
});

export const TraceRecordSchema = z.object({
  traceId: z.string(),
  requestId: z.string().optional(),
  sessionId: z.string().optional(),
  workflowId: z.string().optional(),
  agentId: z.string().optional(),
  model: z.string().optional(),
  promptVersion: z.string().optional(),
  toolCalls: z.array(ToolCallRecordSchema).default([]),
  retrieval: z.array(RetrievalRecordSchema).default([]),
  memoryIO: z.array(MemoryIORecordSchema).default([]),
  citations: z.array(CitationRecordSchema).default([]),
  guardrailResults: z.array(GuardrailResultSchema).default([]),
  spans: z.array(TraceSpanSchema).default([]),
  latencyMs: z.number().optional(),
  totalTokens: z.number().int().optional(),
  promptTokens: z.number().int().optional(),
  completionTokens: z.number().int().optional(),
  costUsd: z.number().optional(),
  approvals: z.array(z.object({ approvalId: z.string(), approver: z.string(), decision: z.enum(["approved", "denied", "pending"]), timestamp: z.string().datetime() })).default([]),
  errors: z.array(z.object({ code: z.string(), message: z.string(), timestamp: z.string().datetime() })).default([]),
  retries: z.number().int().default(0),
  rollbackId: z.string().optional(),
  businessImpact: z.object({ valueCreatedUsd: z.number().optional(), valueAtRiskUsd: z.number().optional(), description: z.string().optional() }).optional(),
  status: z.enum(["running", "completed", "failed", "rolled-back"]).default("running"),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export type ToolCallRecord = z.infer<typeof ToolCallRecordSchema>;
export type RetrievalRecord = z.infer<typeof RetrievalRecordSchema>;
export type MemoryIORecord = z.infer<typeof MemoryIORecordSchema>;
export type CitationRecord = z.infer<typeof CitationRecordSchema>;
export type GuardrailResult = z.infer<typeof GuardrailResultSchema>;
export type TraceSpan = z.infer<typeof TraceSpanSchema>;
export type TraceRecord = z.infer<typeof TraceRecordSchema>;
