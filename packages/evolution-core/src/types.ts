/**
 * Precision Evolution Runtime — Core Type Definitions
 *
 * All interfaces are original to this repository. No external SDK types are
 * transcribed here — only platform-native concepts.
 */

// ─── Precision Profiles ────────────────────────────────────────────────────

/**
 * Runtime precision profile detected from actual environment capabilities.
 * The detector NEVER claims FP8 support unless it can verify it. Defaults
 * to cpu_safe in all Replit environments.
 */
export type PrecisionProfile =
  | 'cpu_safe'
  | 'cuda_bf16'
  | 'cuda_fp8_linear'
  | 'cuda_fp8_linear_kv'
  | 'remote_accelerated'
  | 'future_blackwell_path';

export interface CapabilitySnapshot {
  profile: PrecisionProfile;
  environmentMode: 'local_dev' | 'simulation' | 'staging' | 'production';
  cudaAvailable: boolean;
  cudaDeviceName: string | null;
  bf16Supported: boolean;
  fp8Supported: boolean;
  remoteBackendConfigured: boolean;
  remoteBackendHealthy: boolean;
  detectedAt: string;
  simulated: boolean;
}

// ─── Policy State Machine ──────────────────────────────────────────────────

export type PolicyState =
  | 'draft'
  | 'shadow'
  | 'review'
  | 'active'
  | 'rolled_back'
  | 'archived';

export type PolicyStateTransition = {
  from: PolicyState;
  to: PolicyState;
  trigger: string;
  actorId?: string | number;
  reason?: string;
  timestamp: string;
};

export interface CandidatePolicy {
  candidateId: string;
  displayName: string;
  description?: string;
  baseModelRef?: string;
  candidateModelRef?: string;
  policyVersion: string;
  state: PolicyState;
  precisionProfile: PrecisionProfile;
  inferenceBackend: string;
  trainingBackend: string;
  evaluationBackend: string;
  simulated: boolean;
  orgId?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Evaluation ────────────────────────────────────────────────────────────

export interface EvaluationRunRequest {
  candidateId: string;
  suiteId?: string;
  suiteName?: string;
  triggeredBy?: 'api' | 'scheduled' | 'promotion_gate' | 'manual' | 'simulation';
  orgId?: number;
}

export interface EvaluationRunSummary {
  runId: string;
  candidateId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  passRate: number;
  avgScoreTotal: number;
  avgLatencyMs: number;
  totalCases: number;
  passed: number;
  failed: number;
  hasRegression: boolean;
  regressionSeverity: 'none' | 'minor' | 'major' | 'critical';
  coverageThresholdMet: boolean;
  simulated: boolean;
  completedAt?: string;
}

export interface EvaluationCaseResult {
  caseId: string;
  category: string;
  passed: boolean;
  scoreTotal: number;
  latencyMs: number;
  failureReason?: string;
  traceId?: string;
  simulated: boolean;
}

// ─── Reward Composition ────────────────────────────────────────────────────

export interface RewardComponents {
  correctness: number;
  citationFidelity: number;
  policyCompliance: number;
  structuredOutputValidity: number;
  latencyScore: number;
  costScore: number;
  userUtility: number;
  refusalQuality: number;
  auditCompleteness: number;
  hallucinationPenalty: number;
  failurePenalty: number;
}

export const REWARD_WEIGHTS: RewardComponents = {
  correctness: 0.20,
  citationFidelity: 0.10,
  policyCompliance: 0.18,
  structuredOutputValidity: 0.10,
  latencyScore: 0.06,
  costScore: 0.05,
  userUtility: 0.12,
  refusalQuality: 0.08,
  auditCompleteness: 0.07,
  hallucinationPenalty: -0.20,
  failurePenalty: -0.15,
};

export type PromotionRecommendation = 'promote' | 'review' | 'reject' | 'hold';

export interface RewardBreakdown {
  runId: string;
  candidateId: string;
  scoreTotal: number;
  components: RewardComponents;
  governanceFindings: GovernanceFinding[];
  recommendation: PromotionRecommendation;
  promotionEligible: boolean;
  simulated: boolean;
}

// ─── Governance ────────────────────────────────────────────────────────────

export type GovernanceSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface GovernanceFinding {
  findingId: string;
  severity: GovernanceSeverity;
  code: string;
  message: string;
  policyId?: string;
  blocking: boolean;
}

export interface PromotionGateResult {
  candidateId: string;
  eligible: boolean;
  reasons: string[];
  blockers: string[];
  rewardScore: number;
  driftScore: number;
  governancePassedAll: boolean;
  coverageThresholdMet: boolean;
  humanApprovalRequired: boolean;
  rollbackVerified: boolean;
}

// ─── Calibration ──────────────────────────────────────────────────────────

export type CalibrationType = 'warmup' | 'dataset' | 'post_update';

export interface CalibrationRunRequest {
  candidateId: string;
  runType: CalibrationType;
  datasetId?: string;
  datasetName?: string;
  orgId?: number;
}

export interface CalibrationRunSummary {
  runId: string;
  candidateId: string;
  runType: CalibrationType;
  status: 'queued' | 'running' | 'completed' | 'failed';
  preBias: number;
  postBias: number;
  biasReduction: number;
  confidenceAlignment: number;
  safeFallbackTriggered: boolean;
  safeFallbackReason?: string;
  simulated: boolean;
}

// ─── Drift ────────────────────────────────────────────────────────────────

export interface DriftMetrics {
  response: number;
  reward: number;
  citation: number;
  structuredOutput: number;
  latency: number;
  cost: number;
  length: number;
  failureRate: number;
  approvalRejection: number;
}

export const DRIFT_THRESHOLDS: DriftMetrics = {
  response: 0.15,
  reward: 0.10,
  citation: 0.12,
  structuredOutput: 0.10,
  latency: 0.25,
  cost: 0.30,
  length: 0.20,
  failureRate: 0.08,
  approvalRejection: 0.10,
};

export interface DriftReport {
  reportId: string;
  candidateId: string;
  overallDriftScore: number;
  status: 'healthy' | 'degraded' | 'critical';
  metrics: DriftMetrics;
  safeFallbackTriggered: boolean;
  safeFallbackReason?: string;
  simulated: boolean;
  measuredAt: string;
}

// ─── Rollout ──────────────────────────────────────────────────────────────

export interface RolloutJobRequest {
  candidateId: string;
  evaluationRunId?: string;
  batchSize?: number;
  deterministicReplay?: boolean;
  replaySeed?: string;
}

export interface RolloutJobSummary {
  jobId: string;
  candidateId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  batchSize: number;
  completedBatches: number;
  totalBatches: number;
  queueDepth: number;
  simulated: boolean;
}

// ─── Runtime Adapters ────────────────────────────────────────────────────

export interface InferenceRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  candidateId?: string;
}

export interface InferenceResponse {
  output: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  costUsd: number;
  modelId: string;
  backend: string;
  simulated: boolean;
}

export interface BackendHealthCheck {
  healthy: boolean;
  latencyMs: number;
  backend: string;
  message?: string;
}

export interface InferenceBackendAdapter {
  readonly backendId: string;
  readonly simulated: boolean;
  infer(req: InferenceRequest): Promise<InferenceResponse>;
  healthCheck(): Promise<BackendHealthCheck>;
}

export interface TrainingBackendAdapter {
  readonly backendId: string;
  readonly simulated: boolean;
  launch(jobSpec: Record<string, unknown>): Promise<{ jobId: string }>;
  getStatus(jobId: string): Promise<{ status: string; progress: number }>;
  healthCheck(): Promise<BackendHealthCheck>;
}

export interface EvaluationBackendAdapter {
  readonly backendId: string;
  readonly simulated: boolean;
  runSuite(suiteId: string, candidateId: string): Promise<EvaluationRunSummary>;
  healthCheck(): Promise<BackendHealthCheck>;
}

// ─── Audit Events ────────────────────────────────────────────────────────

export interface PEREventType {
  type:
    | 'candidate_registered'
    | 'evaluation_launched'
    | 'evaluation_completed'
    | 'calibration_launched'
    | 'calibration_completed'
    | 'drift_measured'
    | 'promotion_requested'
    | 'promotion_approved'
    | 'promotion_rejected'
    | 'policy_activated'
    | 'policy_rolled_back'
    | 'drift_fallback_triggered'
    | 'diagnostics_snapshot';
  candidateId?: string;
  runId?: string;
  actorId?: string | number;
  metadata?: Record<string, unknown>;
  timestamp: string;
}
