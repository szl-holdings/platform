import { z } from "zod";

export const EvalCategorySchema = z.enum([
  "gold-dataset",
  "scenario-suite",
  "prompt-test",
  "tool-reliability",
  "citation-quality",
  "hallucination",
  "policy-adherence",
  "latency",
  "cost",
  "regression",
]);

export const GoldExampleSchema = z.object({
  id: z.string(),
  input: z.unknown(),
  expectedOutput: z.unknown(),
  context: z.record(z.unknown()).default({}),
  tags: z.array(z.string()).default([]),
  weight: z.number().default(1),
});

export const EvalScenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: EvalCategorySchema,
  examples: z.array(GoldExampleSchema).default([]),
  config: z.record(z.unknown()).default({}),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime().optional(),
});

export const EvalMetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.string().optional(),
  threshold: z.number().optional(),
  passed: z.boolean().optional(),
});

export const EvalResultSchema = z.object({
  exampleId: z.string(),
  scenarioId: z.string(),
  passed: z.boolean(),
  score: z.number().min(0).max(1),
  metrics: z.array(EvalMetricSchema).default([]),
  actualOutput: z.unknown().optional(),
  expectedOutput: z.unknown().optional(),
  latencyMs: z.number().optional(),
  costUsd: z.number().optional(),
  errorMessage: z.string().optional(),
  notes: z.string().optional(),
});

export const EvalReportSchema = z.object({
  reportId: z.string(),
  packId: z.string(),
  runAt: z.string().datetime(),
  totalExamples: z.number().int(),
  passedExamples: z.number().int(),
  failedExamples: z.number().int(),
  overallScore: z.number().min(0).max(1),
  results: z.array(EvalResultSchema).default([]),
  metrics: z.array(EvalMetricSchema).default([]),
  regressions: z.array(z.string()).default([]),
  baselineReportId: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export type EvalCategory = z.infer<typeof EvalCategorySchema>;
export type GoldExample = z.infer<typeof GoldExampleSchema>;
export type EvalScenario = z.infer<typeof EvalScenarioSchema>;
export type EvalMetric = z.infer<typeof EvalMetricSchema>;
export type EvalResult = z.infer<typeof EvalResultSchema>;
export type EvalReport = z.infer<typeof EvalReportSchema>;
