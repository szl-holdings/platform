import { z } from "zod";

export const SkillCategorySchema = z.enum([
  "graph-query",
  "research",
  "synthesis",
  "workflow",
  "reporting",
  "analysis",
  "remediation",
  "executive-brief",
]);

export type SkillCategory = z.infer<typeof SkillCategorySchema>;

export const SkillStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  handler: z.string(),
  parameters: z.record(z.unknown()).default({}),
  toolsUsed: z.array(z.string()).default([]),
  expectedOutput: z.string().optional(),
  timeoutMs: z.number().int().positive().optional(),
});

export type SkillStep = z.infer<typeof SkillStepSchema>;

export const FailureConditionSchema = z.object({
  condition: z.string(),
  description: z.string(),
  recoveryHint: z.string().optional(),
});

export type FailureCondition = z.infer<typeof FailureConditionSchema>;

export const SuccessCriterionSchema = z.object({
  criterion: z.string(),
  description: z.string(),
});

export type SuccessCriterion = z.infer<typeof SuccessCriterionSchema>;

export const SkillPerformanceSchema = z.object({
  totalRuns: z.number().int().default(0),
  successfulRuns: z.number().int().default(0),
  failedRuns: z.number().int().default(0),
  successRate: z.number().min(0).max(1).default(0),
  avgLatencyMs: z.number().default(0),
  lastRunAt: z.string().datetime().optional(),
  lastFailureAt: z.string().datetime().optional(),
  lastFailureReason: z.string().optional(),
});

export type SkillPerformance = z.infer<typeof SkillPerformanceSchema>;

export const SkillDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: SkillCategorySchema,
  objective: z.string(),
  inputFields: z.array(z.string()).default([]),
  steps: z.array(SkillStepSchema).default([]),
  toolsUsed: z.array(z.string()).default([]),
  expectedOutputs: z.array(z.string()).default([]),
  successCriteria: z.array(SuccessCriterionSchema).default([]),
  failureConditions: z.array(FailureConditionSchema).default([]),
  performance: SkillPerformanceSchema.default({}),
  isBuiltin: z.boolean().default(false),
  enabled: z.boolean().default(true),
  version: z.string().default("1.0.0"),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type SkillDefinition = z.infer<typeof SkillDefinitionSchema>;

export const SkillRunStatusSchema = z.enum(["running", "completed", "failed"]);

export type SkillRunStatus = z.infer<typeof SkillRunStatusSchema>;

export const SkillRunStepRecordSchema = z.object({
  stepId: z.string(),
  stepName: z.string(),
  status: z.enum(["pending", "running", "completed", "failed"]),
  startedAt: z.number(),
  completedAt: z.number().optional(),
  inputs: z.record(z.unknown()).optional(),
  outputs: z.record(z.unknown()).optional(),
  error: z.string().optional(),
});

export type SkillRunStepRecord = z.infer<typeof SkillRunStepRecordSchema>;

export const SkillRunSchema = z.object({
  runId: z.string(),
  skillId: z.string(),
  skillName: z.string(),
  status: SkillRunStatusSchema,
  inputs: z.record(z.unknown()).default({}),
  outputs: z.record(z.unknown()).optional(),
  steps: z.array(SkillRunStepRecordSchema).default([]),
  error: z.string().optional(),
  startedAt: z.number(),
  completedAt: z.number().optional(),
  latencyMs: z.number().optional(),
});

export type SkillRun = z.infer<typeof SkillRunSchema>;

export interface SkillRegistryQuery {
  category?: SkillCategory;
  enabled?: boolean;
  isBuiltin?: boolean;
  tag?: string;
  limit?: number;
  offset?: number;
}

export interface SkillRunQuery {
  skillId?: string;
  status?: SkillRunStatus;
  limit?: number;
  offset?: number;
}

export type StepHandlerFn = (
  parameters: Record<string, unknown>,
  inputs: Record<string, unknown>,
  context: { runId: string; stepId: string; skillId: string }
) => Promise<Record<string, unknown>>;
