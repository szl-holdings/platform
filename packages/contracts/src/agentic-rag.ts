/**
 * Alloy Agentic RAG — public contract schemas.
 *
 * Every request and response crossing the alloy-agentic-rag boundary is
 * typed here. Types are inferred from Zod schemas — never hand-written
 * separately.
 */
import { z } from 'zod';

// ─── Planner Mode ────────────────────────────────────────────────────────────

export const plannerModeSchema = z.enum(['react', 'cot-decompose']);
export type PlannerMode = z.infer<typeof plannerModeSchema>;

// ─── MCP Server Classes ───────────────────────────────────────────────────────

export const mcpClassSchema = z.enum(['local-data', 'search-engine', 'cloud-engine']);
export type MCPClass = z.infer<typeof mcpClassSchema>;

// ─── Memory Tier ──────────────────────────────────────────────────────────────

export const memoryTierSchema = z.enum(['short-term', 'long-term']);
export type MemoryTier = z.infer<typeof memoryTierSchema>;

// ─── Evidence Bundle ──────────────────────────────────────────────────────────

export const evidenceChunkSchema = z.object({
  chunkId: z.string(),
  content: z.string(),
  source: z.string(),
  score: z.number().min(0).max(1),
  mcpClass: mcpClassSchema,
  specialistAgent: z.string(),
  retrievedAt: z.string(),
  metadata: z.record(z.unknown()).optional(),
});
export type EvidenceChunk = z.infer<typeof evidenceChunkSchema>;

export const evidenceBundleSchema = z.object({
  bundleId: z.string(),
  runId: z.string(),
  chunks: z.array(evidenceChunkSchema),
  fusionMethod: z.enum(['rrf', 'cross-encoder', 'rrf+cross-encoder']),
  topK: z.number().int().positive(),
  createdAt: z.string(),
});
export type EvidenceBundle = z.infer<typeof evidenceBundleSchema>;

// ─── Aggregator Trace ─────────────────────────────────────────────────────────

export const traceStepSchema = z.object({
  stepId: z.string(),
  phase: z.enum(['perceive', 'orient', 'plan', 'execute', 'verify', 'reflect']),
  name: z.string(),
  startedAt: z.string(),
  endedAt: z.string().optional(),
  durationMs: z.number().optional(),
  status: z.enum(['ok', 'error', 'skipped', 'blocked']),
  attributes: z.record(z.unknown()).optional(),
});
export type TraceStep = z.infer<typeof traceStepSchema>;

export const mcpCallRecordSchema = z.object({
  callId: z.string(),
  mcpClass: mcpClassSchema,
  serverName: z.string(),
  toolName: z.string(),
  specialistAgent: z.string(),
  durationMs: z.number(),
  success: z.boolean(),
  chunksReturned: z.number().int(),
  error: z.string().optional(),
});
export type MCPCallRecord = z.infer<typeof mcpCallRecordSchema>;

export const generationRecordSchema = z.object({
  provider: z.string(),
  model: z.string(),
  promptTokens: z.number().int(),
  completionTokens: z.number().int(),
  totalTokens: z.number().int(),
  estimatedCostUsd: z.number(),
  latencyMs: z.number(),
  fallbackUsed: z.boolean(),
  fallbackReason: z.string().optional(),
});
export type GenerationRecord = z.infer<typeof generationRecordSchema>;

export const aggregatorTraceSchema = z.object({
  traceId: z.string(),
  runId: z.string(),
  plannerMode: plannerModeSchema,
  steps: z.array(traceStepSchema),
  mcpCalls: z.array(mcpCallRecordSchema),
  generation: generationRecordSchema.optional(),
  memoryReadsShortTerm: z.number().int(),
  memoryReadsLongTerm: z.number().int(),
  memoryWritesShortTerm: z.number().int(),
  memoryWritesLongTerm: z.number().int(),
  specialistsInvoked: z.array(z.string()),
  totalDurationMs: z.number(),
  createdAt: z.string(),
});
export type AggregatorTrace = z.infer<typeof aggregatorTraceSchema>;

// ─── Plan Graph (Agentic RAG edition) ────────────────────────────────────────

export const agenticPlanStepSchema = z.object({
  stepId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  specialistAgent: z.string().optional(),
  mcpClass: mcpClassSchema.optional(),
  dependencies: z.array(z.string()).default([]),
  estimatedCostUsd: z.number().default(0),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
  metadata: z.record(z.unknown()).optional(),
});
export type AgenticPlanStep = z.infer<typeof agenticPlanStepSchema>;

export const agenticPlanGraphSchema = z.object({
  planId: z.string(),
  objective: z.string(),
  plannerMode: plannerModeSchema,
  steps: z.array(agenticPlanStepSchema),
  executionOrder: z.array(z.string()),
  estimatedCostUsd: z.number(),
  confidence: z.number().min(0).max(1),
  createdAt: z.string(),
});
export type AgenticPlanGraph = z.infer<typeof agenticPlanGraphSchema>;

// ─── Request / Response ───────────────────────────────────────────────────────

export const agenticRagContextSchema = z.object({
  sessionId: z.string().optional(),
  orgId: z.number().int().positive().optional(),
  domain: z.string().optional(),
  agentId: z.string().optional(),
  userId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type AgenticRagContext = z.infer<typeof agenticRagContextSchema>;

export const agenticRagPolicySchema = z.object({
  plannerMode: plannerModeSchema.optional(),
  maxSpecialists: z.number().int().min(1).max(10).optional(),
  topK: z.number().int().min(1).max(100).optional(),
  maxBudgetUsd: z.number().positive().optional(),
  enabledMcpClasses: z.array(mcpClassSchema).optional(),
  shortTermRetentionMs: z.number().int().positive().optional(),
  longTermRetentionDays: z.number().int().positive().optional(),
  requireApprovalForHighRisk: z.boolean().optional(),
  dryRun: z.boolean().optional(),
});
export type AgenticRagPolicy = z.infer<typeof agenticRagPolicySchema>;

export const agenticRagRequestSchema = z.object({
  query: z.string().min(1).max(32768),
  context: agenticRagContextSchema.optional().default({}),
  policy: agenticRagPolicySchema.optional().default({}),
});
export type AgenticRagRequest = z.infer<typeof agenticRagRequestSchema>;

export const agenticRagResponseSchema = z.object({
  runId: z.string(),
  traceId: z.string(),
  query: z.string(),
  answer: z.string(),
  plannerMode: plannerModeSchema,
  plan: agenticPlanGraphSchema,
  evidence: evidenceBundleSchema,
  generation: generationRecordSchema,
  confidence: z.number().min(0).max(1),
  status: z.enum(['completed', 'failed', 'pending_approval']),
  error: z.string().optional(),
  completedAt: z.string(),
  totalDurationMs: z.number(),
});
export type AgenticRagResponse = z.infer<typeof agenticRagResponseSchema>;

// ─── API route schemas ────────────────────────────────────────────────────────

export const agenticRagRunParamSchema = z.object({
  id: z.string().uuid(),
});
export type AgenticRagRunParam = z.infer<typeof agenticRagRunParamSchema>;
