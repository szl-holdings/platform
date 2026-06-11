/**
 * Precision Evolution Runtime (PER) — Database Schema
 *
 * Adds governance-first tables for: candidate policy registration, decoupled
 * evaluation runs, weighted reward breakdowns, calibration runs, per-candidate
 * drift reports, evidence-gated promotion decisions, rollout job tracking, and
 * runtime health snapshots.
 *
 * Design principles:
 * - Extends existing patterns (governance.ts, drift_snapshots.ts, approvals.ts)
 *   rather than duplicating them.
 * - Every promotion decision links to the audit_chain_events table so it is
 *   immutable and hash-chained.
 * - Simulation mode records carry simulated=true and are never mixed with real data.
 */

import { boolean, index, integer, jsonb, numeric, pgTable, real, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { organizationsTable } from './organizations.js';
import { usersTable } from './auth.js';

// ─── 1. Candidate Policies ─────────────────────────────────────────────────

/**
 * Registered candidate policies pending evaluation.
 * State machine: draft → shadow → review → active → rolled_back → archived
 */
export const perCandidatePoliciesTable = pgTable(
  'per_candidate_policies',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    candidateId: text('candidate_id').notNull().unique(),
    displayName: text('display_name').notNull(),
    description: text('description'),
    baseModelRef: text('base_model_ref'),
    candidateModelRef: text('candidate_model_ref'),
    policyVersion: text('policy_version').notNull().default('0.1.0'),
    state: text('state', {
      enum: ['draft', 'shadow', 'review', 'active', 'rolled_back', 'archived'],
    })
      .notNull()
      .default('draft'),
    precisionProfile: text('precision_profile', {
      enum: [
        'cpu_safe',
        'cuda_bf16',
        'cuda_fp8_linear',
        'cuda_fp8_linear_kv',
        'remote_accelerated',
        'future_blackwell_path',
      ],
    })
      .notNull()
      .default('cpu_safe'),
    inferenceBackend: text('inference_backend').notNull().default('local_safe'),
    trainingBackend: text('training_backend').notNull().default('local_safe'),
    evaluationBackend: text('evaluation_backend').notNull().default('local_safe'),
    simulated: boolean('simulated').notNull().default(false),
    registeredById: integer('registered_by_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    activatedAt: timestamp('activated_at'),
    rolledBackAt: timestamp('rolled_back_at'),
    rollbackReason: text('rollback_reason'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('per_candidates_org_idx').on(t.orgId),
    index('per_candidates_state_idx').on(t.state),
    index('per_candidates_profile_idx').on(t.precisionProfile),
    index('per_candidates_created_idx').on(t.createdAt),
  ],
);

// ─── 2. Evaluation Runs ────────────────────────────────────────────────────

/**
 * Decoupled evaluation runs — executed separately from active-policy serving.
 * Each run targets a candidate policy and captures aggregate outcomes.
 */
export const perEvaluationRunsTable = pgTable(
  'per_evaluation_runs',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    runId: text('run_id').notNull().unique(),
    candidateId: text('candidate_id').notNull(),
    suiteId: text('suite_id'),
    suiteName: text('suite_name'),
    status: text('status', {
      enum: ['queued', 'running', 'completed', 'failed', 'cancelled'],
    })
      .notNull()
      .default('queued'),
    triggeredBy: text('triggered_by', {
      enum: ['api', 'scheduled', 'promotion_gate', 'manual', 'simulation'],
    })
      .notNull()
      .default('api'),
    totalCases: integer('total_cases').notNull().default(0),
    passed: integer('passed').notNull().default(0),
    failed: integer('failed').notNull().default(0),
    passRate: real('pass_rate'),
    avgScoreTotal: real('avg_score_total'),
    avgLatencyMs: real('avg_latency_ms'),
    totalCostUsd: numeric('total_cost_usd', { precision: 10, scale: 6 }),
    hasRegression: boolean('has_regression').notNull().default(false),
    regressionSeverity: text('regression_severity', {
      enum: ['none', 'minor', 'major', 'critical'],
    })
      .notNull()
      .default('none'),
    coverageThresholdMet: boolean('coverage_threshold_met').notNull().default(false),
    simulated: boolean('simulated').notNull().default(false),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('per_eval_runs_org_idx').on(t.orgId),
    index('per_eval_runs_candidate_idx').on(t.candidateId),
    index('per_eval_runs_status_idx').on(t.status),
    index('per_eval_runs_created_idx').on(t.createdAt),
  ],
);

// ─── 3. Evaluation Results (per-case) ──────────────────────────────────────

export const perEvaluationResultsTable = pgTable(
  'per_evaluation_results',
  {
    id: serial('id').primaryKey(),
    runId: text('run_id').notNull(),
    candidateId: text('candidate_id').notNull(),
    caseId: text('case_id').notNull(),
    category: text('category').notNull(),
    passed: boolean('passed').notNull().default(false),
    scoreTotal: real('score_total'),
    latencyMs: integer('latency_ms'),
    costUsd: numeric('cost_usd', { precision: 10, scale: 6 }),
    inputHash: text('input_hash'),
    outputSummary: text('output_summary'),
    failureReason: text('failure_reason'),
    traceId: text('trace_id'),
    simulated: boolean('simulated').notNull().default(false),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('per_eval_results_run_idx').on(t.runId),
    index('per_eval_results_candidate_idx').on(t.candidateId),
    index('per_eval_results_category_idx').on(t.category),
  ],
);

// ─── 4. Reward Breakdowns ──────────────────────────────────────────────────

/**
 * Weighted reward scores per evaluation run.
 * Components: correctness, citation_fidelity, policy_compliance,
 * structured_output_validity, latency_score, cost_score, user_utility,
 * refusal_quality, audit_completeness, hallucination_penalty, failure_penalty.
 */
export const perRewardBreakdownsTable = pgTable(
  'per_reward_breakdowns',
  {
    id: serial('id').primaryKey(),
    runId: text('run_id').notNull().unique(),
    candidateId: text('candidate_id').notNull(),
    scoreTotal: real('score_total').notNull(),
    scoreCorrectness: real('score_correctness'),
    scoreCitationFidelity: real('score_citation_fidelity'),
    scorePolicyCompliance: real('score_policy_compliance'),
    scoreStructuredOutput: real('score_structured_output'),
    scoreLatency: real('score_latency'),
    scoreCost: real('score_cost'),
    scoreUserUtility: real('score_user_utility'),
    scoreRefusalQuality: real('score_refusal_quality'),
    scoreAuditCompleteness: real('score_audit_completeness'),
    penaltyHallucination: real('penalty_hallucination'),
    penaltyFailure: real('penalty_failure'),
    governanceFindings: jsonb('governance_findings').default([]),
    recommendation: text('recommendation', {
      enum: ['promote', 'review', 'reject', 'hold'],
    })
      .notNull()
      .default('review'),
    promotionEligible: boolean('promotion_eligible').notNull().default(false),
    simulated: boolean('simulated').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('per_reward_run_idx').on(t.runId),
    index('per_reward_candidate_idx').on(t.candidateId),
    index('per_reward_recommendation_idx').on(t.recommendation),
  ],
);

// ─── 5. Calibration Runs ──────────────────────────────────────────────────

export const perCalibrationRunsTable = pgTable(
  'per_calibration_runs',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    runId: text('run_id').notNull().unique(),
    candidateId: text('candidate_id').notNull(),
    runType: text('run_type', {
      enum: ['warmup', 'dataset', 'post_update'],
    })
      .notNull()
      .default('dataset'),
    status: text('status', {
      enum: ['queued', 'running', 'completed', 'failed'],
    })
      .notNull()
      .default('queued'),
    datasetId: text('dataset_id'),
    datasetName: text('dataset_name'),
    calibrationSamples: integer('calibration_samples').notNull().default(0),
    preBias: real('pre_bias'),
    postBias: real('post_bias'),
    biasReduction: real('bias_reduction'),
    confidenceAlignment: real('confidence_alignment'),
    safeFallbackTriggered: boolean('safe_fallback_triggered').notNull().default(false),
    safeFallbackReason: text('safe_fallback_reason'),
    simulated: boolean('simulated').notNull().default(false),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('per_calibration_org_idx').on(t.orgId),
    index('per_calibration_candidate_idx').on(t.candidateId),
    index('per_calibration_type_idx').on(t.runType),
    index('per_calibration_created_idx').on(t.createdAt),
  ],
);

// ─── 6. Drift Reports ─────────────────────────────────────────────────────

/**
 * Per-candidate drift measurements. Extends the existing drift_snapshots pattern
 * with candidate-aware and metric-level detail.
 */
export const perDriftReportsTable = pgTable(
  'per_drift_reports',
  {
    id: serial('id').primaryKey(),
    reportId: text('report_id').notNull().unique(),
    candidateId: text('candidate_id').notNull(),
    baselineRunId: text('baseline_run_id'),
    candidateRunId: text('candidate_run_id'),
    overallDriftScore: real('overall_drift_score').notNull(),
    status: text('status', {
      enum: ['healthy', 'degraded', 'critical'],
    })
      .notNull()
      .default('healthy'),
    driftResponse: real('drift_response'),
    driftReward: real('drift_reward'),
    driftCitation: real('drift_citation'),
    driftStructuredOutput: real('drift_structured_output'),
    driftLatency: real('drift_latency'),
    driftCost: real('drift_cost'),
    driftLength: real('drift_length'),
    driftFailureRate: real('drift_failure_rate'),
    driftApprovalRejection: real('drift_approval_rejection'),
    safeFallbackTriggered: boolean('safe_fallback_triggered').notNull().default(false),
    safeFallbackReason: text('safe_fallback_reason'),
    thresholdConfig: jsonb('threshold_config').default({}),
    simulated: boolean('simulated').notNull().default(false),
    measuredAt: timestamp('measured_at').notNull().defaultNow(),
    metadata: jsonb('metadata').default({}),
  },
  (t) => [
    index('per_drift_candidate_idx').on(t.candidateId),
    index('per_drift_status_idx').on(t.status),
    index('per_drift_measured_idx').on(t.measuredAt),
  ],
);

// ─── 7. Promotion Decisions ───────────────────────────────────────────────

/**
 * Evidence-gated promotion records. Every production promotion requires human
 * approval (linked to approvalRequestsTable). Chain integrity is verified via
 * audit_chain_events.
 */
export const perPromotionDecisionsTable = pgTable(
  'per_promotion_decisions',
  {
    id: serial('id').primaryKey(),
    decisionId: text('decision_id').notNull().unique(),
    candidateId: text('candidate_id').notNull(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    outcome: text('outcome', {
      enum: ['approved', 'rejected', 'pending_review', 'rolled_back'],
    })
      .notNull()
      .default('pending_review'),
    fromState: text('from_state').notNull(),
    toState: text('to_state').notNull(),
    evaluationRunId: text('evaluation_run_id'),
    rewardScore: real('reward_score'),
    driftScore: real('drift_score'),
    governancePassedAll: boolean('governance_passed_all').notNull().default(false),
    coverageThresholdMet: boolean('coverage_threshold_met').notNull().default(false),
    humanApprovalRequired: boolean('human_approval_required').notNull().default(true),
    approvalRequestId: integer('approval_request_id'),
    approvedById: integer('approved_by_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    approvedAt: timestamp('approved_at'),
    rejectionReason: text('rejection_reason'),
    rollbackPath: text('rollback_path'),
    rollbackVerified: boolean('rollback_verified').notNull().default(false),
    auditChainEventId: integer('audit_chain_event_id'),
    proofContentId: text('proof_content_id'),
    simulated: boolean('simulated').notNull().default(false),
    evidenceBundle: jsonb('evidence_bundle').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('per_promo_candidate_idx').on(t.candidateId),
    index('per_promo_org_idx').on(t.orgId),
    index('per_promo_outcome_idx').on(t.outcome),
    index('per_promo_created_idx').on(t.createdAt),
  ],
);

// ─── 8. Rollout Jobs ──────────────────────────────────────────────────────

/**
 * Rollout worker jobs — execute prompt/tool suites against a candidate policy
 * independently from active-policy serving.
 */
export const perRolloutJobsTable = pgTable(
  'per_rollout_jobs',
  {
    id: serial('id').primaryKey(),
    jobId: text('job_id').notNull().unique(),
    candidateId: text('candidate_id').notNull(),
    evaluationRunId: text('evaluation_run_id'),
    status: text('status', {
      enum: ['queued', 'running', 'completed', 'failed', 'cancelled'],
    })
      .notNull()
      .default('queued'),
    batchSize: integer('batch_size').notNull().default(10),
    completedBatches: integer('completed_batches').notNull().default(0),
    totalBatches: integer('total_batches').notNull().default(0),
    deterministicReplay: boolean('deterministic_replay').notNull().default(false),
    replaySeed: text('replay_seed'),
    workerNode: text('worker_node'),
    queueDepth: integer('queue_depth').notNull().default(0),
    simulated: boolean('simulated').notNull().default(false),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    errorMessage: text('error_message'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('per_rollout_candidate_idx').on(t.candidateId),
    index('per_rollout_status_idx').on(t.status),
    index('per_rollout_created_idx').on(t.createdAt),
  ],
);

// ─── 9. Rollout Traces ────────────────────────────────────────────────────

export const perRolloutTracesTable = pgTable(
  'per_rollout_traces',
  {
    id: serial('id').primaryKey(),
    traceId: text('trace_id').notNull().unique(),
    jobId: text('job_id').notNull(),
    candidateId: text('candidate_id').notNull(),
    caseId: text('case_id').notNull(),
    inputHash: text('input_hash'),
    outputHash: text('output_hash'),
    toolCalls: jsonb('tool_calls').default([]),
    latencyMs: integer('latency_ms'),
    tokensIn: integer('tokens_in').default(0),
    tokensOut: integer('tokens_out').default(0),
    costUsd: numeric('cost_usd', { precision: 10, scale: 6 }),
    passed: boolean('passed').notNull().default(false),
    scoreTotal: real('score_total'),
    simulated: boolean('simulated').notNull().default(false),
    replayable: boolean('replayable').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('per_traces_job_idx').on(t.jobId),
    index('per_traces_candidate_idx').on(t.candidateId),
    index('per_traces_created_idx').on(t.createdAt),
  ],
);

// ─── 10. Runtime Health Snapshots ─────────────────────────────────────────

/**
 * Device capability and runtime diagnostic snapshots.
 * The precision profile is detected at startup and never falsely claims
 * capabilities (e.g. FP8) that the runtime cannot verify.
 */
export const perRuntimeHealthSnapshotsTable = pgTable(
  'per_runtime_health_snapshots',
  {
    id: serial('id').primaryKey(),
    snapshotId: text('snapshot_id').notNull().unique(),
    precisionProfile: text('precision_profile', {
      enum: [
        'cpu_safe',
        'cuda_bf16',
        'cuda_fp8_linear',
        'cuda_fp8_linear_kv',
        'remote_accelerated',
        'future_blackwell_path',
      ],
    })
      .notNull()
      .default('cpu_safe'),
    environmentMode: text('environment_mode', {
      enum: ['local_dev', 'simulation', 'staging', 'production'],
    })
      .notNull()
      .default('simulation'),
    inferenceBackend: text('inference_backend').notNull().default('local_safe'),
    trainingBackend: text('training_backend').notNull().default('local_safe'),
    evaluationBackend: text('evaluation_backend').notNull().default('local_safe'),
    deviceInfo: jsonb('device_info').default({}),
    throughputTokensPerSec: real('throughput_tokens_per_sec'),
    avgLatencyMs: real('avg_latency_ms'),
    cacheStrategy: text('cache_strategy'),
    activeJobCount: integer('active_job_count').notNull().default(0),
    queueDepth: integer('queue_depth').notNull().default(0),
    remoteBackendHealthy: boolean('remote_backend_healthy'),
    driftGuardActive: boolean('drift_guard_active').notNull().default(true),
    simulated: boolean('simulated').notNull().default(true),
    measuredAt: timestamp('measured_at').notNull().defaultNow(),
    metadata: jsonb('metadata').default({}),
  },
  (t) => [
    index('per_health_profile_idx').on(t.precisionProfile),
    index('per_health_env_idx').on(t.environmentMode),
    index('per_health_measured_idx').on(t.measuredAt),
  ],
);
