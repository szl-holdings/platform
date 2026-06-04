/**
 * @szl-holdings/shared-contracts — Eval Types
 *
 * Open Evaluation Layer contracts: YAML schemas, Zod validators, and TypeScript
 * types for the platform-wide evaluation and scoring fabric.
 *
 * Mirrors the Hugging Face Evaluation Results pattern, adapted for the SZL
 * agentic platform: every agent, model, workflow, or intelligence product can
 * declare evaluation results in a versioned YAML format and have them
 * automatically appear as scored badges on its detail page.
 */

import { z } from 'zod';

// ─── Framework Registry ───────────────────────────────────────────────────────

export const EVAL_FRAMEWORK_ENUM = [
  'inspect-ai',
  'math-arena',
  'szl-native',
  'lm-evaluation-harness',
  'eleuther-ai',
  'helm',
  'openai-evals',
  'custom',
] as const;

export type EvalFramework = (typeof EVAL_FRAMEWORK_ENUM)[number];

export const EvalFrameworkSchema = z.enum(EVAL_FRAMEWORK_ENUM);

// ─── Badge States ─────────────────────────────────────────────────────────────

export const EVAL_BADGE_STATE_ENUM = [
  'verified',    // Cryptographic proof from a sandboxed eval run
  'community',   // Open PR, not yet merged / re-run
  'leaderboard', // Published on the benchmark leaderboard
  'source',      // Links to traces or paper; self-reported
] as const;

export type EvalBadgeState = (typeof EVAL_BADGE_STATE_ENUM)[number];

export const EvalBadgeStateSchema = z.enum(EVAL_BADGE_STATE_ENUM);

// ─── Entity Types (what can carry results) ────────────────────────────────────

export const EVAL_ENTITY_TYPE_ENUM = [
  'agent',
  'model',
  'workflow',
  'intelligence-product',
  'dataset',
  'tool',
] as const;

export type EvalEntityType = (typeof EVAL_ENTITY_TYPE_ENUM)[number];

export const EvalEntityTypeSchema = z.enum(EVAL_ENTITY_TYPE_ENUM);

// ─── Task Types ───────────────────────────────────────────────────────────────

export const EVAL_TASK_TYPE_ENUM = [
  'text-classification',
  'text-generation',
  'question-answering',
  'summarization',
  'information-extraction',
  'decision-making',
  'threat-detection',
  'risk-scoring',
  'contract-analysis',
  'property-valuation',
  'briefing-generation',
  'latency-benchmark',
  'cost-efficiency',
  'hallucination-rate',
  'citation-fidelity',
  'planning-quality',
  'tool-reliability',
  'policy-adherence',
  'autonomy-safety',
] as const;

export type EvalTaskType = (typeof EVAL_TASK_TYPE_ENUM)[number];

export const EvalTaskTypeSchema = z.enum(EVAL_TASK_TYPE_ENUM);

// ─── eval_results.yaml schema ─────────────────────────────────────────────────
// Mirrors HF eval results: one result per dataset×task×metric combination.
// A single YAML file can carry N results for the same entity.

export const EvalResultEntrySchema = z.object({
  /** Dataset (benchmark) id — matches a row in eval_benchmarks */
  datasetId: z.string().min(1).max(256),
  /** Discriminator for the task evaluated within the benchmark */
  taskId: z.string().min(1).max(256),
  /** Task category */
  taskType: EvalTaskTypeSchema.optional(),
  /** Primary metric name (e.g. "accuracy", "f1", "pass_rate", "latency_p95_ms") */
  metric: z.string().min(1).max(128),
  /** The result value. Numeric for scored metrics; boolean for pass/fail; string for qualitative. */
  value: z.union([z.number(), z.boolean(), z.string()]),
  /** Optional human-readable unit (e.g. "%" or "ms" or "USD/call") */
  unit: z.string().max(32).optional(),
  /** Higher-is-better flag. Defaults to true for most metrics; false for latency/cost. */
  higherIsBetter: z.boolean().default(true),
  /** Framework used to generate this result */
  evaluationFramework: EvalFrameworkSchema.optional(),
  /** Opaque token used by the verification pipeline to re-run and sign the result */
  verifyToken: z.string().max(512).optional(),
  /** ISO-8601 date the eval was run */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
  /** Trace or paper URL — sourced evidence */
  sourceUrl: z.string().url().optional(),
  /** Free-text notes, caveats, or model config details */
  notes: z.string().max(4096).optional(),
  /** Tags for grouping / filtering */
  tags: z.array(z.string().max(64)).default([]),
});

export type EvalResultEntry = z.infer<typeof EvalResultEntrySchema>;

/**
 * Top-level eval_results.yaml shape.
 * Lives in .eval_results/<entity-id>.yaml in a repo or submitted via API.
 */
export const EvalResultsYamlSchema = z.object({
  /** Spec version — always "1" for now */
  version: z.literal('1').default('1'),
  /** Entity that produced these results */
  entityId: z.string().min(1).max(256),
  entityType: EvalEntityTypeSchema,
  /** Human display name */
  entityLabel: z.string().min(1).max(512),
  /** Domain context (maritime, legal, terra, cyber, executive, decision) */
  domain: z.string().min(1).max(128),
  /** The individual result entries */
  results: z.array(EvalResultEntrySchema).min(1),
  /** Submitter metadata */
  submittedBy: z.string().max(256).optional(),
  submittedAt: z.string().optional(),
});

export type EvalResultsYaml = z.infer<typeof EvalResultsYamlSchema>;

// ─── eval.yaml (Benchmark definition) schema ──────────────────────────────────

export const EvalBenchmarkTaskSchema = z.object({
  taskId: z.string().min(1).max(256),
  name: z.string().min(1).max(512),
  description: z.string().max(4096).optional(),
  taskType: EvalTaskTypeSchema,
  /** Primary metric to rank on */
  primaryMetric: z.string().min(1).max(128),
  higherIsBetter: z.boolean().default(true),
  /** Optional baseline value (e.g. human-level performance) */
  baseline: z.number().optional(),
  /** Optional threshold above which a result is considered "strong" */
  strongThreshold: z.number().optional(),
});

export type EvalBenchmarkTask = z.infer<typeof EvalBenchmarkTaskSchema>;

/**
 * Top-level eval.yaml shape — defines a Benchmark.
 * Lives in .eval_benchmarks/<benchmark-id>.yaml.
 */
export const EvalYamlSchema = z.object({
  version: z.literal('1').default('1'),
  /** Stable benchmark id — slugified, e.g. "maritime-threat-detection-v1" */
  benchmarkId: z.string().min(1).max(256),
  name: z.string().min(1).max(512),
  description: z.string().max(4096).optional(),
  /** Domain this benchmark primarily covers */
  domain: z.string().min(1).max(128),
  evaluationFramework: EvalFrameworkSchema,
  tasks: z.array(EvalBenchmarkTaskSchema).min(1),
  /** Tags for grouping / taxonomy */
  tags: z.array(z.string().max(64)).default([]),
  /** Public URL to benchmark paper or specification */
  paperUrl: z.string().url().optional(),
  /** Whether this is a platform-wide cross-cutting benchmark */
  isCrossCutting: z.boolean().default(false),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type EvalYaml = z.infer<typeof EvalYamlSchema>;

// ─── Leaderboard Entry ────────────────────────────────────────────────────────

export const LeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  entityId: z.string(),
  entityLabel: z.string(),
  entityType: EvalEntityTypeSchema,
  domain: z.string(),
  taskId: z.string(),
  metric: z.string(),
  value: z.union([z.number(), z.boolean(), z.string()]),
  unit: z.string().optional(),
  badgeState: EvalBadgeStateSchema,
  evaluationFramework: EvalFrameworkSchema.optional(),
  date: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  resultId: z.string(),
});

export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

// ─── Community PR submission ──────────────────────────────────────────────────

export const EvalSubmissionRequestSchema = z.object({
  yaml: EvalResultsYamlSchema,
  /** Optional PR description / motivation */
  prDescription: z.string().max(8192).optional(),
  /** GitHub branch name suggestion */
  branchSuggestion: z.string().max(256).optional(),
});

export type EvalSubmissionRequest = z.infer<typeof EvalSubmissionRequestSchema>;

// ─── Verification Request / Response ─────────────────────────────────────────

export const EvalVerificationRequestSchema = z.object({
  resultId: z.string().uuid(),
  verifyToken: z.string().min(1).max(512),
  /** Executor config to pass to the sandboxed re-run */
  executorConfig: z.record(z.unknown()).optional(),
});

export type EvalVerificationRequest = z.infer<typeof EvalVerificationRequestSchema>;

export const EvalVerificationResultSchema = z.object({
  resultId: z.string().uuid(),
  passed: z.boolean(),
  /** Signed JWT or hash of the re-run report */
  proof: z.string().optional(),
  /** Re-run score (may differ slightly from submitted due to model variance) */
  rerunValue: z.union([z.number(), z.boolean(), z.string()]).optional(),
  delta: z.number().optional(),
  verifiedAt: z.string(),
  verifiedBy: z.enum(['sandbox', 'admin', 'ci']),
  notes: z.string().max(4096).optional(),
});

export type EvalVerificationResult = z.infer<typeof EvalVerificationResultSchema>;

// ─── Seed Benchmark IDs (platform-canonical) ──────────────────────────────────

export const PLATFORM_BENCHMARK_IDS = {
  MARITIME_THREAT_DETECTION: 'maritime-threat-detection-v1',
  LEGAL_CONTRACT_ANALYSIS:   'legal-contract-analysis-v1',
  PROPERTY_RISK_SCORING:     'property-risk-scoring-v1',
  CYBER_POSTURE_ASSESSMENT:  'cyber-posture-assessment-v1',
  DECISION_LATENCY:          'decision-latency-v1',
  BRIEFING_QUALITY:          'briefing-quality-v1',
  HALLUCINATION_RATE:        'hallucination-rate-v1',
  COST_PER_DECISION:         'cost-per-decision-v1',
} as const;

export type PlatformBenchmarkId = (typeof PLATFORM_BENCHMARK_IDS)[keyof typeof PLATFORM_BENCHMARK_IDS];
