import { z } from 'zod';

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
  operation: z.enum(['read', 'write', 'evict']),
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
  outcome: z.enum(['pass', 'block', 'warn', 'require-approval']),
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
  status: z.enum(['ok', 'error', 'pending']).default('ok'),
  errorMessage: z.string().optional(),
});

export const PlanNodeSchema = z.object({
  nodeId: z.string(),
  label: z.string(),
  nodeType: z.enum(['task', 'decision', 'tool', 'model', 'memory', 'output']).default('task'),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'skipped']).default('pending'),
  dependsOn: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export const PlanGraphSchema = z.object({
  nodes: z.array(PlanNodeSchema).default([]),
  edges: z
    .array(z.object({ from: z.string(), to: z.string(), label: z.string().optional() }))
    .default([]),
  version: z.string().default('1.0'),
  createdAt: z.string().datetime().optional(),
});

export const VerifierDecisionSchema = z.object({
  verifierId: z.string(),
  step: z.string(),
  outcome: z.enum(['pass', 'fail', 'warn', 'abstain']),
  score: z.number().min(0).max(1).optional(),
  reason: z.string().optional(),
  timestamp: z.string().datetime(),
});

export const ReflectionEntrySchema = z.object({
  reflectionId: z.string(),
  trigger: z.string(),
  content: z.string(),
  actionTaken: z.string().optional(),
  timestamp: z.string().datetime(),
});

export const RollbackPointSchema = z.object({
  rollbackId: z.string(),
  spanId: z.string().optional(),
  snapshotRef: z.string().optional(),
  label: z.string().optional(),
  createdAt: z.string().datetime(),
  activatedAt: z.string().datetime().optional(),
});

export const OperatorCommentSchema = z.object({
  commentId: z.string(),
  operatorId: z.string(),
  spanId: z.string().optional(),
  content: z.string(),
  createdAt: z.string().datetime(),
  tags: z.array(z.string()).default([]),
});

export const RunGradeSchema = z.object({
  gradeId: z.string(),
  gradedBy: z.string(),
  score: z.number().min(0).max(1),
  rubric: z.record(z.number()).default({}),
  notes: z.string().optional(),
  gradedAt: z.string().datetime(),
});

export const TraceRecordSchema = z.object({
  traceId: z.string(),
  runId: z.string().optional(),
  requestId: z.string().optional(),
  sessionId: z.string().optional(),
  workflowId: z.string().optional(),
  agentId: z.string().optional(),

  objective: z.string().optional(),
  selfModelSnapshot: z.record(z.unknown()).optional(),
  worldModelSnapshotRef: z.string().optional(),
  planGraph: PlanGraphSchema.optional(),

  model: z.string().optional(),
  modelsUsed: z.array(z.string()).default([]),
  promptVersion: z.string().optional(),
  promptVersions: z.array(z.string()).default([]),

  toolCalls: z.array(ToolCallRecordSchema).default([]),
  retrieval: z.array(RetrievalRecordSchema).default([]),
  memoryIO: z.array(MemoryIORecordSchema).default([]),
  citations: z.array(CitationRecordSchema).default([]),
  guardrailResults: z.array(GuardrailResultSchema).default([]),
  verifierDecisions: z.array(VerifierDecisionSchema).default([]),
  reflections: z.array(ReflectionEntrySchema).default([]),
  rollbackPoints: z.array(RollbackPointSchema).default([]),
  spans: z.array(TraceSpanSchema).default([]),

  latencyMs: z.number().optional(),
  totalTokens: z.number().int().optional(),
  promptTokens: z.number().int().optional(),
  completionTokens: z.number().int().optional(),
  costUsd: z.number().optional(),

  approvals: z
    .array(
      z.object({
        approvalId: z.string(),
        approver: z.string(),
        decision: z.enum(['approved', 'denied', 'pending']),
        timestamp: z.string().datetime(),
      }),
    )
    .default([]),

  errors: z
    .array(
      z.object({
        code: z.string(),
        message: z.string(),
        timestamp: z.string().datetime(),
      }),
    )
    .default([]),

  retries: z.number().int().default(0),
  rollbackId: z.string().optional(),

  output: z.record(z.unknown()).optional(),

  operatorComments: z.array(OperatorCommentSchema).default([]),
  grade: RunGradeSchema.optional(),

  businessImpact: z
    .object({
      valueCreatedUsd: z.number().optional(),
      valueAtRiskUsd: z.number().optional(),
      description: z.string().optional(),
    })
    .optional(),

  status: z.enum(['running', 'completed', 'failed', 'rolled-back']).default('running'),
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
export type PlanNode = z.infer<typeof PlanNodeSchema>;
export type PlanGraph = z.infer<typeof PlanGraphSchema>;
export type VerifierDecision = z.infer<typeof VerifierDecisionSchema>;
export type ReflectionEntry = z.infer<typeof ReflectionEntrySchema>;
export type RollbackPoint = z.infer<typeof RollbackPointSchema>;
export type OperatorComment = z.infer<typeof OperatorCommentSchema>;
export type RunGrade = z.infer<typeof RunGradeSchema>;
export type TraceRecord = z.infer<typeof TraceRecordSchema>;
