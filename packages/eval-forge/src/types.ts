import { z } from 'zod';

export const EVAL_FORGE_VERSION = '1.0.0' as const;

export type EvalType =
  | 'prompt-eval'
  | 'model-routing'
  | 'verifier'
  | 'tool-reliability'
  | 'citation-fidelity'
  | 'memory-retrieval'
  | 'planning-quality'
  | 'reflection-quality'
  | 'autonomy-safety'
  | 'end-to-end-scenario';

export const ALL_EVAL_TYPES: EvalType[] = [
  'prompt-eval',
  'model-routing',
  'verifier',
  'tool-reliability',
  'citation-fidelity',
  'memory-retrieval',
  'planning-quality',
  'reflection-quality',
  'autonomy-safety',
  'end-to-end-scenario',
];

export type GraderType =
  | 'prompt-eval'
  | 'model-routing-eval'
  | 'verifier-eval'
  | 'tool-reliability'
  | 'citation-quality'
  | 'memory-retrieval'
  | 'planning-quality'
  | 'reflection-quality'
  | 'autonomy-safety'
  | 'scenario-eval'
  | 'agent-workflow-eval'
  | 'policy-adherence'
  | 'hallucination'
  | 'bias-safety'
  | 'latency-cost'
  | 'trace-grading'
  | 'human-review'
  | 'exact-match'
  | 'semantic-similarity'
  | 'custom';

export interface EvalCase {
  id: string;
  domain: string;
  label: string;
  evalType?: EvalType;
  graderType: GraderType;
  input: Record<string, unknown>;
  groundTruth: Record<string, unknown>;
  expectedOutcome?: 'pass' | 'fail';
  policies?: string[];
  tags?: string[];
  isRedTeam?: boolean;
  weight?: number;
  traceId?: string;
}

export interface EvalSuiteDef {
  suiteId: string;
  name: string;
  description?: string;
  domain: string;
  evalType?: EvalType;
  cases: EvalCase[];
  tags?: string[];
  version?: number;
}

export type EvalExecutor = (
  input: Record<string, unknown>,
  caseId: string,
  domain: string,
) => Promise<{
  output: Record<string, unknown>;
  model?: string;
  latencyMs: number;
  tokensUsed: number;
  costUsd: number;
  traceId?: string;
  metadata?: Record<string, unknown>;
}>;

export interface EvalCaseResult {
  caseId: string;
  domain: string;
  label: string;
  evalType?: EvalType;
  graderType: GraderType;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  groundTruth: Record<string, unknown>;
  passed: boolean;
  score: number;
  expectedOutcome: 'pass' | 'fail';
  latencyMs: number;
  tokensUsed: number;
  costUsd: number;
  model?: string;
  traceId?: string;
  failureReason?: string;
  graderDetails?: Record<string, unknown>;
  tags?: string[];
}

export interface EvalForgeMetrics {
  correctness: {
    passRate: number;
    avgScore: number;
    passed: number;
    failed: number;
    total: number;
  };
  evidenceQuality: {
    citationCoverage: number;
    citationAccuracy: number;
    sourceVerified: number;
    totalCitations: number;
    score: number;
  };
  confidenceCalibration: {
    avgConfidence: number;
    calibrationError: number;
    overconfidenceRate: number;
    underconfidenceRate: number;
    brierScore: number;
    score: number;
  };
  latency: {
    avgLatencyMs: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
    maxLatencyMs: number;
  };
  cost: {
    totalCostUsd: number;
    avgCostUsd: number;
    costPerOutcome: number;
    totalTokensUsed: number;
    avgTokensUsed: number;
    p95CostUsd: number;
  };
  interventionValue: {
    interventions: number;
    totalDecisions: number;
    interventionRate: number;
    avgImprovementFromIntervention: number;
    estimatedValueSaved: number;
  };
  humanOverrideRate: {
    overrides: number;
    totalDecisions: number;
    overrideRate: number;
    acceptedRate: number;
    overrideReasons: Record<string, number>;
  };
  rollbackRate: {
    rollbacks: number;
    totalActions: number;
    rollbackRate: number;
    rollbackReasons: Record<string, number>;
    avgRollbackLatencyMs: number;
  };
  policyViolations: {
    totalChecks: number;
    violations: number;
    violationRate: number;
    criticalViolations: number;
    violationsByType: Record<string, number>;
    complianceRate: number;
  };
}

export interface EvalRunReport {
  runId: string;
  suiteId: string;
  suiteName?: string;
  domain?: string;
  evalType?: EvalType;
  model?: string;
  runAt: string;
  triggeredBy: string;
  totalCases: number;
  passed: number;
  failed: number;
  passRate: number;
  avgScore: number;
  avgLatencyMs: number;
  totalCostUsd: number;
  totalTokensUsed: number;
  metrics: EvalForgeMetrics;
  hasRegression?: boolean;
  regressionSeverity?: 'none' | 'minor' | 'major' | 'critical';
  regressionNotes?: string[];
  improvementNotes?: string[];
  baselineRunId?: string;
  caseResults: EvalCaseResult[];
  metadata?: Record<string, unknown>;
}

export const EvalRunReportSummarySchema = z.object({
  runId: z.string(),
  suiteId: z.string(),
  suiteName: z.string().optional(),
  domain: z.string().optional(),
  evalType: z.string().optional(),
  passRate: z.number(),
  avgScore: z.number(),
  totalCases: z.number(),
  passed: z.number(),
  failed: z.number(),
  hasRegression: z.boolean().optional(),
  regressionSeverity: z.enum(['none', 'minor', 'major', 'critical']).optional(),
  runAt: z.string(),
  triggeredBy: z.string(),
});
