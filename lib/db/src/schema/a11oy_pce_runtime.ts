import { boolean, doublePrecision, index, integer, jsonb, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const a11oyPceContractsTable = pgTable(
  'a11oy_pce_contracts',
  {
    id: serial('id').primaryKey(),
    contractId: text('contract_id').notNull().unique(),
    actionId: text('action_id').notNull(),
    workcellId: text('workcell_id'),
    originSignalIds: jsonb('origin_signal_ids').$type<string[]>().default([]),
    causalChainIds: jsonb('causal_chain_ids').$type<string[]>().default([]),
    policyEvaluationId: text('policy_evaluation_id'),
    approvalRecordId: text('approval_record_id'),
    mirrorEvalId: text('mirror_eval_id'),
    executionTraceId: text('execution_trace_id'),
    proofPacketId: text('proof_packet_id'),
    mode: text('mode', { enum: ['demo', 'governed'] }).notNull().default('demo'),
    isVerified: boolean('is_verified').notNull().default(false),
    evidenceCoverage: numeric('evidence_coverage', { precision: 5, scale: 4 }).default('0'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    verifiedAt: timestamp('verified_at'),
  },
  (t) => [
    index('a11oy_pce_contracts_action_idx').on(t.actionId),
    index('a11oy_pce_contracts_workcell_idx').on(t.workcellId),
    index('a11oy_pce_contracts_created_idx').on(t.createdAt),
  ],
);

export const a11oyApprovalRecordsTable = pgTable(
  'a11oy_approval_records',
  {
    id: serial('id').primaryKey(),
    approvalId: text('approval_id').notNull().unique(),
    actionId: text('action_id').notNull(),
    tier: text('tier', { enum: ['auto', 'operator', 'executive', 'board'] }).notNull().default('operator'),
    status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
    approvedBy: text('approved_by'),
    approvedAt: timestamp('approved_at'),
    rejectedReason: text('rejected_reason'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('a11oy_approval_records_action_idx').on(t.actionId),
    index('a11oy_approval_records_status_idx').on(t.status),
    index('a11oy_approval_records_created_idx').on(t.createdAt),
  ],
);

export const a11oyProofPacketsTable = pgTable(
  'a11oy_proof_packets',
  {
    id: serial('id').primaryKey(),
    packetId: text('packet_id').notNull().unique(),
    contractId: text('contract_id').notNull(),
    actionId: text('action_id').notNull(),
    entityId: text('entity_id').notNull(),
    hash: text('hash').notNull(),
    previousHash: text('previous_hash'),
    payload: jsonb('payload').$type<Record<string, unknown>>().default({}),
    witnessedBy: jsonb('witnessed_by').$type<string[]>().default([]),
    issuedAt: timestamp('issued_at').notNull().defaultNow(),
  },
  (t) => [
    index('a11oy_proof_packets_contract_idx').on(t.contractId),
    index('a11oy_proof_packets_action_idx').on(t.actionId),
    index('a11oy_proof_packets_issued_idx').on(t.issuedAt),
  ],
);

export const a11oyPolicyEvaluationsTable = pgTable(
  'a11oy_policy_evaluations',
  {
    id: serial('id').primaryKey(),
    evalId: text('eval_id').notNull().unique(),
    policyIds: jsonb('policy_ids').$type<string[]>().default([]),
    actionId: text('action_id').notNull(),
    riskClass: text('risk_class').notNull(),
    passed: boolean('passed').notNull().default(true),
    requiresApproval: boolean('requires_approval').notNull().default(false),
    approvalTier: text('approval_tier'),
    violations: jsonb('violations').$type<string[]>().default([]),
    evaluatedAt: timestamp('evaluated_at').notNull().defaultNow(),
  },
  (t) => [
    index('a11oy_policy_evals_action_idx').on(t.actionId),
    index('a11oy_policy_evals_evaluated_idx').on(t.evaluatedAt),
  ],
);

export const a11oyMirrorEvalResultsTable = pgTable(
  'a11oy_mirror_eval_results',
  {
    id: serial('id').primaryKey(),
    evalId: text('eval_id').notNull().unique(),
    targetId: text('target_id').notNull(),
    targetType: text('target_type').notNull(),
    disposition: text('disposition', { enum: ['pass', 'pass_with_warning', 'needs_more_evidence', 'requires_human_review', 'blocked'] }).notNull(),
    overallScore: numeric('overall_score', { precision: 5, scale: 4 }).default('0'),
    scores: jsonb('scores').$type<Record<string, unknown>[]>().default([]),
    flags: jsonb('flags').$type<string[]>().default([]),
    evaluatedAt: timestamp('evaluated_at').notNull().defaultNow(),
    evaluatorVersion: text('evaluator_version').default('1.0.0'),
  },
  (t) => [
    index('a11oy_mirror_evals_target_idx').on(t.targetId),
    index('a11oy_mirror_evals_disposition_idx').on(t.disposition),
    index('a11oy_mirror_evals_evaluated_idx').on(t.evaluatedAt),
  ],
);

export const a11oyExecutionTracesTable = pgTable(
  'a11oy_execution_traces',
  {
    id: serial('id').primaryKey(),
    traceId: text('trace_id').notNull().unique(),
    runId: text('run_id').notNull(),
    entityId: text('entity_id').notNull(),
    entityType: text('entity_type').notNull(),
    entries: jsonb('entries').$type<Record<string, unknown>[]>().default([]),
    status: text('status', { enum: ['running', 'completed', 'failed'] }).notNull().default('running'),
    startedAt: timestamp('started_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
  },
  (t) => [
    index('a11oy_exec_traces_entity_idx').on(t.entityId),
    index('a11oy_exec_traces_status_idx').on(t.status),
    index('a11oy_exec_traces_started_idx').on(t.startedAt),
  ],
);

export const a11oyWorkcellsTable = pgTable(
  'a11oy_workcells',
  {
    id: serial('id').primaryKey(),
    workcellId: text('workcell_id').notNull().unique(),
    name: text('name').notNull(),
    description: text('description').default(''),
    vertical: text('vertical').notNull(),
    phase: text('phase').notNull().default('intake'),
    operatorId: text('operator_id').notNull().default('planner'),
    tools: jsonb('tools').$type<string[]>().default([]),
    approvalTier: text('approval_tier', { enum: ['auto', 'operator', 'executive'] }).notNull().default('operator'),
    riskScore: doublePrecision('risk_score'),
    maxRunDurationMs: integer('max_run_duration_ms').notNull().default(300000),
    pceContractId: text('pce_contract_id'),
    approvalRecordId: text('approval_record_id'),
    traceId: text('trace_id'),
    proofPacketId: text('proof_packet_id'),
    lastError: text('last_error'),
    originSignalIds: jsonb('origin_signal_ids').$type<string[]>().default([]),
    history: jsonb('history').$type<Array<{ phase: string; timestamp: string; note?: string }>>().default([]),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('a11oy_workcells_vertical_idx').on(t.vertical),
    index('a11oy_workcells_phase_idx').on(t.phase),
    index('a11oy_workcells_updated_idx').on(t.updatedAt),
  ],
);

export const a11oyOperatorRunsTable = pgTable(
  'a11oy_operator_runs',
  {
    id: serial('id').primaryKey(),
    runId: text('run_id').notNull().unique(),
    intent: text('intent').notNull(),
    vertical: text('vertical').notNull(),
    requestedBy: text('requested_by').notNull(),
    status: text('status').notNull().default('awaiting_approval'),
    plan: jsonb('plan').$type<Record<string, unknown>[]>().default([]),
    auditLog: jsonb('audit_log').$type<Record<string, unknown>[]>().default([]),
    currentStepIndex: integer('current_step_index').notNull().default(0),
    planSummary: text('plan_summary').notNull().default(''),
    estimatedSideEffects: jsonb('estimated_side_effects').$type<string[]>().default([]),
    error: text('error'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
  },
  (t) => [
    index('a11oy_operator_runs_status_idx').on(t.status),
    index('a11oy_operator_runs_vertical_idx').on(t.vertical),
    index('a11oy_operator_runs_created_idx').on(t.createdAt),
  ],
);

export const agentPerformanceSnapshotsTable = pgTable(
  'agent_performance_snapshots',
  {
    id: serial('id').primaryKey(),
    agentId: text('agent_id').notNull().unique(),
    domain: text('domain').notNull(),
    totalDecisions: integer('total_decisions').notNull().default(0),
    acceptedDecisions: integer('accepted_decisions').notNull().default(0),
    avgConfidence: numeric('avg_confidence', { precision: 6, scale: 4 }).notNull().default('0'),
    avgLatencyMs: numeric('avg_latency_ms', { precision: 10, scale: 2 }).notNull().default('0'),
    totalTokenCost: integer('total_token_cost').notNull().default(0),
    proposedOptimizations: jsonb('proposed_optimizations').$type<Record<string, unknown>[]>().default([]),
    lastUpdated: timestamp('last_updated').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('agent_perf_snapshots_domain_idx').on(t.domain),
    index('agent_perf_snapshots_updated_idx').on(t.lastUpdated),
  ],
);

export type A11oyPceContract = typeof a11oyPceContractsTable.$inferSelect;
export type InsertA11oyPceContract = typeof a11oyPceContractsTable.$inferInsert;
export type A11oyApprovalRecord = typeof a11oyApprovalRecordsTable.$inferSelect;
export type InsertA11oyApprovalRecord = typeof a11oyApprovalRecordsTable.$inferInsert;
export type A11oyProofPacket = typeof a11oyProofPacketsTable.$inferSelect;
export type InsertA11oyProofPacket = typeof a11oyProofPacketsTable.$inferInsert;
export type A11oyPolicyEvaluation = typeof a11oyPolicyEvaluationsTable.$inferSelect;
export type InsertA11oyPolicyEvaluation = typeof a11oyPolicyEvaluationsTable.$inferInsert;
export type A11oyMirrorEvalResult = typeof a11oyMirrorEvalResultsTable.$inferSelect;
export type InsertA11oyMirrorEvalResult = typeof a11oyMirrorEvalResultsTable.$inferInsert;
export type A11oyExecutionTrace = typeof a11oyExecutionTracesTable.$inferSelect;
export type InsertA11oyExecutionTrace = typeof a11oyExecutionTracesTable.$inferInsert;
export type A11oyWorkcell = typeof a11oyWorkcellsTable.$inferSelect;
export type InsertA11oyWorkcell = typeof a11oyWorkcellsTable.$inferInsert;
export type A11oyOperatorRun = typeof a11oyOperatorRunsTable.$inferSelect;
export type InsertA11oyOperatorRun = typeof a11oyOperatorRunsTable.$inferInsert;
export type AgentPerformanceSnapshot = typeof agentPerformanceSnapshotsTable.$inferSelect;
export type InsertAgentPerformanceSnapshot = typeof agentPerformanceSnapshotsTable.$inferInsert;
