import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const agentMemoryFacts = pgTable('agent_memory_facts', {
  id: serial('id').primaryKey(),
  agentId: text('agent_id').notNull(),
  domain: text('domain').notNull(),
  factType: text('fact_type').notNull(),
  content: text('content').notNull(),
  importance: integer('importance').notNull().default(5),
  tags: text('tags').array().notNull().default([]),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  retrievalCount: integer('retrieval_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const agentUsageStats = pgTable('agent_usage_stats', {
  id: serial('id').primaryKey(),
  agentId: text('agent_id').notNull(),
  agentName: text('agent_name').notNull(),
  domain: text('domain').notNull(),
  tokensUsed: integer('tokens_used').notNull().default(0),
  latencyMs: integer('latency_ms').notNull().default(0),
  success: boolean('success').notNull().default(true),
  model: text('model').notNull(),
  provider: text('provider').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
});

export const agentToolCalls = pgTable('agent_tool_calls', {
  id: serial('id').primaryKey(),
  agentId: text('agent_id').notNull(),
  toolName: text('tool_name').notNull(),
  input: text('input').notNull(),
  output: text('output'),
  success: boolean('success').notNull().default(true),
  latencyMs: integer('latency_ms').notNull().default(0),
  calledAt: timestamp('called_at', { withTimezone: true }).defaultNow().notNull(),
});

export const advisoryFindings = pgTable('advisory_findings', {
  id: serial('id').primaryKey(),
  agentId: text('agent_id').notNull(),
  agentName: text('agent_name').notNull(),
  analysisType: text('analysis_type').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  severity: text('severity').notNull().default('info'),
  score: integer('score').notNull().default(75),
  tags: text('tags').array().notNull().default([]),
  acknowledged: boolean('acknowledged').notNull().default(false),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const aiSafetyEvents = pgTable('ai_safety_events', {
  id: serial('id').primaryKey(),
  eventType: text('event_type').notNull(),
  agentId: text('agent_id'),
  severity: text('severity').notNull().default('low'),
  description: text('description').notNull(),
  blocked: boolean('blocked').notNull().default(false),
  inputSample: text('input_sample'),
  detectedAt: timestamp('detected_at', { withTimezone: true }).defaultNow().notNull(),
});

export const agentModelAssignments = pgTable('agent_model_assignments', {
  id: serial('id').primaryKey(),
  agentId: text('agent_id').notNull().unique(),
  agentName: text('agent_name').notNull(),
  model: text('model').notNull(),
  provider: text('provider').notNull(),
  tokenBudget: integer('token_budget').notNull().default(100000),
  tokensUsedPeriod: integer('tokens_used_period').notNull().default(0),
  periodResetAt: timestamp('period_reset_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const alloyEvidenceIndex = pgTable('alloy_evidence_index', {
  id: text('id').primaryKey(),
  caseId: text('case_id'),
  incidentId: text('incident_id'),
  source: text('source').notNull(),
  sourceType: text('source_type').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  tags: text('tags').array().notNull().default([]),
  freshness: text('freshness').notNull().default('current'),
  entryTimestamp: text('entry_timestamp'),
  objectId: text('object_id'),
  relevanceBoost: real('relevance_boost').notNull().default(1.0),
  embedding: jsonb('embedding'),
});

export const agentKernelAuditLog = pgTable('agent_kernel_audit_log', {
  id: serial('id').primaryKey(),
  entryId: text('entry_id').notNull().unique(),
  previousHash: text('previous_hash').notNull(),
  currentHash: text('current_hash').notNull(),
  idempotencyKey: text('idempotency_key').notNull(),
  agentId: text('agent_id').notNull(),
  toolName: text('tool_name').notNull(),
  arguments: jsonb('arguments').notNull().default({}),
  validationResult: text('validation_result').notNull(),
  validationErrors: text('validation_errors').array().notNull().default([]),
  authorizationResult: text('authorization_result').notNull(),
  authorizationReason: text('authorization_reason').notNull(),
  executionResult: text('execution_result').notNull(),
  compensationApplied: boolean('compensation_applied').notNull().default(false),
  compensationSteps: text('compensation_steps').array().notNull().default([]),
  durationMs: integer('duration_ms').notNull().default(0),
  calledBy: text('called_by').notNull(),
  tenantId: text('tenant_id'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
});

export const agentScopeCertificates = pgTable('agent_scope_certificates', {
  id: serial('id').primaryKey(),
  agentId: text('agent_id').notNull(),
  allowedTools: text('allowed_tools').array().notNull().default([]),
  maxRiskLevel: text('max_risk_level').notNull().default('medium'),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  issuerSignature: text('issuer_signature').notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const agentTrajectories = pgTable('agent_trajectories', {
  id: serial('id').primaryKey(),
  trajectoryId: text('trajectory_id').notNull().unique(),
  contentHash: text('content_hash').notNull(),
  query: text('query').notNull(),
  agentRouting: jsonb('agent_routing').notNull().default([]),
  toolCalls: jsonb('tool_calls').notNull().default([]),
  finalSynthesis: text('final_synthesis').notNull(),
  averageConfidence: doublePrecision('average_confidence').notNull().default(0),
  totalTokens: integer('total_tokens').notNull().default(0),
  totalLatencyMs: integer('total_latency_ms').notNull().default(0),
  isHighStakes: boolean('is_high_stakes').notNull().default(false),
  validationPassed: boolean('validation_passed').notNull().default(true),
  userFeedbackScore: doublePrecision('user_feedback_score'),
  qualityScore: doublePrecision('quality_score'),
  qualityDimensions: jsonb('quality_dimensions'),
  status: text('status').notNull().default('captured'),
  goldenRunRank: integer('golden_run_rank'),
  fewShotExample: text('few_shot_example'),
  orgId: integer('org_id'),
  capturedAt: timestamp('captured_at', { withTimezone: true }).defaultNow().notNull(),
});

export const agentDecisionTraces = pgTable('agent_decision_traces', {
  id: serial('id').primaryKey(),
  traceId: text('trace_id').notNull().unique(),
  runId: text('run_id').notNull(),
  query: text('query').notNull(),
  orgId: integer('org_id'),
  forks: jsonb('forks').notNull().default([]),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }),
  totalLatencyMs: integer('total_latency_ms').notNull().default(0),
  status: text('status').notNull().default('in_progress'),
  judgeEvaluation: jsonb('judge_evaluation'),
  decisionTree: jsonb('decision_tree'),
  regressionFlags: text('regression_flags').array().notNull().default([]),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workflowBudgets = pgTable('workflow_budgets', {
  id: serial('id').primaryKey(),
  workflowId: text('workflow_id').notNull().unique(),
  orgId: integer('org_id'),
  budgetUsd: doublePrecision('budget_usd').notNull().default(5.0),
  warningThreshold: doublePrecision('warning_threshold').notNull().default(0.8),
  hardCapThreshold: doublePrecision('hard_cap_threshold').notNull().default(1.0),
  allowModelDowngrade: boolean('allow_model_downgrade').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const alloyCaseMemory = pgTable('alloy_case_memory', {
  id: serial('id').primaryKey(),
  caseId: text('case_id').notNull().unique(),
  snapshot: jsonb('snapshot').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const alloyConversationSummaries = pgTable('alloy_conversation_summaries', {
  id: serial('id').primaryKey(),
  conversationId: text('conversation_id').notNull().unique(),
  agentId: text('agent_id').notNull(),
  summary: text('summary').notNull(),
  topics: text('topics').array().notNull().default([]),
  messageCount: integer('message_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const alloyOutcomeLearning = pgTable('alloy_outcome_learning', {
  id: serial('id').primaryKey(),
  decisionId: text('decision_id').notNull(),
  agentId: text('agent_id').notNull(),
  orgId: integer('org_id'),
  outcome: text('outcome').notNull(),
  originalAction: text('original_action').notNull(),
  finalAction: text('final_action'),
  originalConfidence: real('original_confidence').notNull(),
  topic: text('topic').notNull(),
  topicKeywords: text('topic_keywords').array().notNull().default([]),
  overrideReason: text('override_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const alloyAgentCorrections = pgTable('alloy_agent_corrections', {
  id: serial('id').primaryKey(),
  sourceAgentId: text('source_agent_id').notNull(),
  validatorAgentId: text('validator_agent_id').notNull(),
  orgId: integer('org_id'),
  originalOutput: text('original_output').notNull(),
  correctedOutput: text('corrected_output').notNull(),
  validationNotes: text('validation_notes'),
  validationStatus: text('validation_status').notNull(),
  topicKeywords: text('topic_keywords').array().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const evalRuns = pgTable('eval_runs', {
  id: serial('id').primaryKey(),
  runId: text('run_id').notNull().unique(),
  model: text('model').notNull(),
  totalTests: integer('total_tests').notNull(),
  passed: integer('passed').notNull(),
  failed: integer('failed').notNull(),
  passRate: text('pass_rate').notNull(),
  avgLatencyMs: integer('avg_latency_ms').notNull(),
  byCategory: jsonb('by_category').notNull(),
  results: jsonb('results').notNull(),
  triggeredBy: text('triggered_by').notNull().default('scheduled'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const agentSpendRecords = pgTable('agent_spend_records', {
  id: serial('id').primaryKey(),
  workflowId: text('workflow_id').notNull(),
  orgId: integer('org_id'),
  model: text('model').notNull(),
  provider: text('provider').notNull(),
  tokensUsed: integer('tokens_used').notNull().default(0),
  costUsd: doublePrecision('cost_usd').notNull().default(0),
  agentId: text('agent_id').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
});

export const a2aTaskLog = pgTable('a2a_task_log', {
  id: serial('id').primaryKey(),
  taskId: text('task_id').notNull().unique(),
  agentId: text('agent_id').notNull(),
  inputQuery: text('input_query').notNull(),
  inputContext: jsonb('input_context'),
  status: text('status').notNull().default('pending'),
  output: text('output'),
  error: text('error'),
  callerAgentId: text('caller_agent_id'),
  callerPlatform: text('caller_platform'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const orchestrationTelemetryTable = pgTable(
  'orchestration_telemetry',
  {
    id: serial('id').primaryKey(),
    orchestrationId: text('orchestration_id').notNull().unique(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    selectedAgents: text('selected_agents').array().notNull().default([]),
    routingScores: jsonb('routing_scores'),
    agentPerformance: jsonb('agent_performance').notNull().default({}),
    causalChains: jsonb('causal_chains').notNull().default([]),
    conflicts: jsonb('conflicts').notNull().default([]),
    proactiveActivations: jsonb('proactive_activations').notNull().default([]),
    totalLatencyMs: integer('total_latency_ms').notNull().default(0),
    tokensBurned: integer('tokens_burned').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('orch_telemetry_timestamp_idx').on(table.timestamp),
    index('orch_telemetry_id_idx').on(table.orchestrationId),
  ],
);

export const multiHypothesisSessionsTable = pgTable(
  'multi_hypothesis_sessions',
  {
    id: serial('id').primaryKey(),
    query: text('query').notNull(),
    hypothesisCount: integer('hypothesis_count').notNull().default(0),
    clusterCount: integer('cluster_count').notNull().default(0),
    topCluster: jsonb('top_cluster'),
    allClusters: jsonb('all_clusters').notNull().default([]),
    recommendation: text('recommendation').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('multi_hyp_created_idx').on(table.createdAt)],
);

export const redTeamFindingsTable = pgTable(
  'red_team_findings',
  {
    id: serial('id').primaryKey(),
    orchestrationId: text('orchestration_id').notNull(),
    query: text('query').notNull(),
    findings: jsonb('findings').notNull().default([]),
    overallAssessment: text('overall_assessment').notNull().default(''),
    challengesRaised: integer('challenges_raised').notNull().default(0),
    criticalIssues: integer('critical_issues').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('red_team_orch_idx').on(table.orchestrationId),
    index('red_team_created_idx').on(table.createdAt),
  ],
);

export const agentPromptEvolutionTable = pgTable(
  'agent_prompt_evolution',
  {
    id: serial('id').primaryKey(),
    agentId: text('agent_id').notNull(),
    agentName: text('agent_name').notNull(),
    currentPromptHash: text('current_prompt_hash').notNull(),
    refinementType: text('refinement_type').notNull(),
    proposedAddition: text('proposed_addition').notNull().default(''),
    proposedRemoval: text('proposed_removal'),
    rationale: text('rationale').notNull().default(''),
    riskLevel: text('risk_level').notNull().default('medium'),
    expectedConfidenceImpact: real('expected_confidence_impact').notNull().default(0),
    requiresHumanReview: boolean('requires_human_review').notNull().default(true),
    avgConfidenceBefore: real('avg_confidence_before').notNull().default(0),
    successRateBefore: real('success_rate_before').notNull().default(0),
    totalInvocations: integer('total_invocations').notNull().default(0),
    status: text('status').notNull().default('proposed'),
    appliedAt: timestamp('applied_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('prompt_evolution_agent_idx').on(table.agentId),
    index('prompt_evolution_status_idx').on(table.status),
    index('prompt_evolution_created_idx').on(table.createdAt),
  ],
);

export const predictivePrecomputeCacheTable = pgTable(
  'predictive_precompute_cache',
  {
    id: serial('id').primaryKey(),
    cacheKey: text('cache_key').notNull().unique(),
    originalQuery: text('original_query').notNull(),
    predictedQuery: text('predicted_query').notNull(),
    likelihood: integer('likelihood').notNull().default(50),
    domains: text('domains').array().notNull().default([]),
    synthesis: text('synthesis').notNull().default(''),
    agentCount: integer('agent_count').notNull().default(0),
    avgConfidence: integer('avg_confidence').notNull().default(0),
    hitCount: integer('hit_count').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('precompute_expires_idx').on(table.expiresAt),
    index('precompute_key_idx').on(table.cacheKey),
  ],
);
