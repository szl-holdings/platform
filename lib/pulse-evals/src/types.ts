export type EvalDomain =
  | 'ranking'
  | 'routing'
  | 'decision'
  | 'artifact'
  | 'hallucination'
  | 'calibration'
  | 'approval'
  | 'retrieval'
  | 'red_team';

export type RedTeamCategory =
  | 'prompt_injection'
  | 'unsafe_tool_execution'
  | 'export_abuse'
  | 'cross_tenant_leakage'
  | 'policy_bypass'
  | 'jailbreak'
  | 'data_exfiltration';

export type AssertionOperator =
  | 'equals'
  | 'contains'
  | 'not_contains'
  | 'exists'
  | 'not_exists'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'oneOf'
  | 'notEmpty'
  | 'matches_schema'
  | 'within_range'
  | 'semantic_similarity';

export interface EvalAssertion {
  field: string;
  operator: AssertionOperator;
  value?: unknown;
  tolerancePct?: number;
  description?: string;
}

export interface GoldenDatasetCase {
  id: string;
  domain: EvalDomain;
  redTeamCategory?: RedTeamCategory;
  description: string;
  input: string | Record<string, unknown>;
  expectedOutput: Record<string, unknown>;
  assertions: EvalAssertion[];
  tags?: string[];
  weight?: number;
  isRedTeam?: boolean;
}

export interface EvalCaseResult {
  caseId: string;
  domain: EvalDomain;
  isRedTeam: boolean;
  passed: boolean;
  score: number;
  assertions: Array<{
    field: string;
    operator: string;
    expected: unknown;
    actual: unknown;
    passed: boolean;
    description?: string | undefined;
  }>;
  model: string;
  latencyMs: number;
  tokensUsed?: number | undefined;
  costUsd?: number | undefined;
  error: string | null;
  metadata?: Record<string, unknown> | undefined;
}

export interface EvalSuiteReport {
  suiteId: string;
  suiteName: string;
  domain: EvalDomain;
  timestamp: string;
  model: string;
  totalCases: number;
  passed: number;
  failed: number;
  passRate: number;
  avgLatencyMs: number;
  avgScore: number;
  totalTokensUsed: number;
  totalCostUsd: number;
  results: EvalCaseResult[];
}

export interface ComparisonEntry {
  model: string;
  report: EvalSuiteReport;
}

export interface SideBySideComparison {
  suiteId: string;
  suiteName: string;
  domain: EvalDomain;
  timestamp: string;
  entries: ComparisonEntry[];
  winner?: string | undefined;
  deltaPassRate?: number | undefined;
  deltaLatencyMs?: number | undefined;
}

export interface RegressionBaseline {
  suiteId: string;
  model: string;
  passRate: number;
  avgLatencyMs: number;
  avgScore: number;
  recordedAt: string;
}

export interface RegressionCheckResult {
  suiteId: string;
  model: string;
  baseline: RegressionBaseline;
  current: Pick<EvalSuiteReport, 'passRate' | 'avgLatencyMs' | 'avgScore'>;
  passRateDelta: number;
  latencyDelta: number;
  scoreDelta: number;
  regressionDetected: boolean;
  regressionFields: string[];
}

export interface PulseEvalConfig {
  passRateThreshold?: number | undefined;
  latencyThresholdMs?: number | undefined;
  regressionThresholdPct?: number | undefined;
  redTeamPassRequirement?: 'all_fail' | 'majority_fail' | 'none' | undefined;
}
