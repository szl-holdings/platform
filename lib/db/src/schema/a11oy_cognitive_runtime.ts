import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { organizationsTable } from './organizations';

// ---------------------------------------------------------------------------
// a11oy_workers — Worker Registry
// Tracks inference/execution workers, their capability checksums, rollout
// groups, drain state, and health. Incompatible checksums within a rollout
// group are rejected by the Worker Registry.
// ---------------------------------------------------------------------------

export const a11oyWorkersTable = pgTable(
  'a11oy_workers',
  {
    id: serial('id').primaryKey(),
    workerId: text('worker_id').notNull().unique(),
    tenantId: text('tenant_id').notNull(),
    name: text('name').notNull(),
    rolloutGroup: text('rollout_group').notNull().default('default'),
    configChecksum: text('config_checksum').notNull(),
    capabilities: jsonb('capabilities').default([]),
    status: text('status', {
      enum: ['active', 'draining', 'drained', 'offline', 'error'],
    })
      .notNull()
      .default('active'),
    isDraining: boolean('is_draining').notNull().default(false),
    drainedAt: timestamp('drained_at'),
    lastHeartbeatAt: timestamp('last_heartbeat_at'),
    uptimeSeconds: integer('uptime_seconds').notNull().default(0),
    requestsHandled: integer('requests_handled').notNull().default(0),
    errorsCount: integer('errors_count').notNull().default(0),
    avgLatencyMs: real('avg_latency_ms'),
    tags: jsonb('tags').default([]),
    metadata: jsonb('metadata').default({}),
    registeredAt: timestamp('registered_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('a11oy_worker_tenant_idx').on(t.tenantId),
    index('a11oy_worker_rollout_idx').on(t.rolloutGroup),
    index('a11oy_worker_checksum_idx').on(t.configChecksum),
    index('a11oy_worker_status_idx').on(t.status),
    index('a11oy_worker_created_idx').on(t.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// a11oy_route_decisions — Cortex Router
// Records every routing decision: which model/worker was selected, which
// scoring mode was used, confidence, latency estimate, cost estimate, and
// whether a fallback was applied.
// ---------------------------------------------------------------------------

export const a11oyRouteDecisionsTable = pgTable(
  'a11oy_route_decisions',
  {
    id: serial('id').primaryKey(),
    routeDecisionId: text('route_decision_id').notNull().unique(),
    requestId: text('request_id').notNull(),
    tenantId: text('tenant_id').notNull(),
    workerId: text('worker_id'),
    selectedModel: text('selected_model').notNull(),
    selectedProvider: text('selected_provider').notNull(),
    scoringMode: text('scoring_mode', {
      enum: ['latency', 'cost', 'confidence', 'balanced', 'sla'],
    })
      .notNull()
      .default('balanced'),
    latencyScore: real('latency_score'),
    costScore: real('cost_score'),
    confidenceScore: real('confidence_score'),
    compositeScore: real('composite_score'),
    isFallback: boolean('is_fallback').notNull().default(false),
    fallbackReason: text('fallback_reason'),
    candidatesEvaluated: integer('candidates_evaluated').notNull().default(0),
    estimatedLatencyMs: integer('estimated_latency_ms'),
    estimatedCostUsd: numeric('estimated_cost_usd', { precision: 10, scale: 6 }),
    domain: text('domain'),
    sensitivityTier: text('sensitivity_tier').default('internal'),
    slaConstraints: jsonb('sla_constraints').default({}),
    metadata: jsonb('metadata').default({}),
    decidedAt: timestamp('decided_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('a11oy_route_tenant_idx').on(t.tenantId),
    index('a11oy_route_request_idx').on(t.requestId),
    index('a11oy_route_worker_idx').on(t.workerId),
    index('a11oy_route_decision_id_idx').on(t.routeDecisionId),
    index('a11oy_route_model_idx').on(t.selectedModel),
    index('a11oy_route_created_idx').on(t.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// a11oy_memory_events — Memory Fabric event log
// Tracks every memory hit, miss, reuse, and invalidation event. Never leaks
// across tenants; tenantId is required and hard-checked on every query path.
// ---------------------------------------------------------------------------

export const a11oyMemoryEventsTable = pgTable(
  'a11oy_memory_events',
  {
    id: serial('id').primaryKey(),
    eventId: text('event_id').notNull().unique(),
    tenantId: text('tenant_id').notNull(),
    requestId: text('request_id'),
    memoryKey: text('memory_key').notNull(),
    eventType: text('event_type', {
      enum: ['hit', 'miss', 'reuse', 'invalidation', 'write', 'eviction'],
    }).notNull(),
    contextReuseScore: real('context_reuse_score'),
    overlapScore: real('overlap_score'),
    freshnessScore: real('freshness_score'),
    tokensSaved: integer('tokens_saved'),
    workspaceId: text('workspace_id'),
    domain: text('domain'),
    tags: jsonb('tags').default([]),
    metadata: jsonb('metadata').default({}),
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('a11oy_mem_tenant_idx').on(t.tenantId),
    index('a11oy_mem_request_idx').on(t.requestId),
    index('a11oy_mem_event_type_idx').on(t.eventType),
    index('a11oy_mem_occurred_idx').on(t.occurredAt),
    index('a11oy_mem_key_idx').on(t.memoryKey),
  ],
);

// ---------------------------------------------------------------------------
// a11oy_phase_runs — Phase Engine execution records
// One row per phase execution within a cognitive request. The ten canonical
// phases: INGEST → NORMALIZE → RETRIEVE → PLAN → REASON → APPROVE →
// EXECUTE → VERIFY → AUDIT → DELIVER.
// ---------------------------------------------------------------------------

export const a11oyPhaseRunsTable = pgTable(
  'a11oy_phase_runs',
  {
    id: serial('id').primaryKey(),
    phaseRunId: text('phase_run_id').notNull().unique(),
    requestId: text('request_id').notNull(),
    tenantId: text('tenant_id').notNull(),
    proofChainId: text('proof_chain_id'),
    phase: text('phase', {
      enum: [
        'INGEST',
        'NORMALIZE',
        'RETRIEVE',
        'PLAN',
        'REASON',
        'APPROVE',
        'EXECUTE',
        'VERIFY',
        'AUDIT',
        'DELIVER',
      ],
    }).notNull(),
    phaseIndex: integer('phase_index').notNull(),
    status: text('status', {
      enum: ['pending', 'running', 'completed', 'failed', 'skipped', 'timeout'],
    })
      .notNull()
      .default('pending'),
    latencyMs: integer('latency_ms'),
    retryCount: integer('retry_count').notNull().default(0),
    failureClass: text('failure_class', {
      enum: ['timeout', 'model_error', 'policy_block', 'guard_rejection', 'upstream_error', 'none'],
    }).default('none'),
    failureDetail: text('failure_detail'),
    inputSnapshot: jsonb('input_snapshot').default({}),
    outputSnapshot: jsonb('output_snapshot').default({}),
    telemetry: jsonb('telemetry').default({}),
    metadata: jsonb('metadata').default({}),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('a11oy_phase_tenant_idx').on(t.tenantId),
    index('a11oy_phase_request_idx').on(t.requestId),
    index('a11oy_phase_proof_idx').on(t.proofChainId),
    index('a11oy_phase_phase_idx').on(t.phase),
    index('a11oy_phase_status_idx').on(t.status),
    index('a11oy_phase_created_idx').on(t.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// a11oy_runtime_events — Event Plane
// Internal table-backed event bus. Every event type produced by any A11oy
// module lands here. The interface (emit/subscribe/replay) is designed to be
// replaced with Service Bus / NATS / Kafka / Redis Streams without touching
// callers.
// ---------------------------------------------------------------------------

export const a11oyRuntimeEventsTable = pgTable(
  'a11oy_runtime_events',
  {
    id: serial('id').primaryKey(),
    eventId: text('event_id').notNull().unique(),
    tenantId: text('tenant_id').notNull(),
    requestId: text('request_id'),
    routeDecisionId: text('route_decision_id'),
    workerId: text('worker_id'),
    proofChainId: text('proof_chain_id'),
    eventType: text('event_type', {
      enum: [
        'route.decided',
        'phase.started',
        'phase.completed',
        'phase.failed',
        'memory.hit',
        'memory.miss',
        'memory.reuse',
        'memory.invalidated',
        'guard.rejected',
        'worker.registered',
        'worker.drained',
        'worker.heartbeat',
        'proof.created',
        'proof.sealed',
        'deployment.created',
        'deployment.activated',
        'sla.breach',
        'sla.warning',
      ],
    }).notNull(),
    payload: jsonb('payload').default({}),
    correlationId: text('correlation_id'),
    causationId: text('causation_id'),
    isReplayed: boolean('is_replayed').notNull().default(false),
    metadata: jsonb('metadata').default({}),
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
    processedAt: timestamp('processed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('a11oy_evt_tenant_idx').on(t.tenantId),
    index('a11oy_evt_request_idx').on(t.requestId),
    index('a11oy_evt_event_type_idx').on(t.eventType),
    index('a11oy_evt_route_decision_idx').on(t.routeDecisionId),
    index('a11oy_evt_worker_idx').on(t.workerId),
    index('a11oy_evt_proof_idx').on(t.proofChainId),
    index('a11oy_evt_occurred_idx').on(t.occurredAt),
  ],
);

// ---------------------------------------------------------------------------
// a11oy_cognitive_proof_chains — Cognitive Proof Chain
// Immutable, append-only record of every cognitive request's full lineage.
// One row is always created — even when execution fails. The auditHash is
// computed from the full request lineage and cannot be altered after creation.
// ---------------------------------------------------------------------------

export const a11oyCognitiveProofChainsTable = pgTable(
  'a11oy_cognitive_proof_chains',
  {
    id: serial('id').primaryKey(),
    proofChainId: text('proof_chain_id').notNull().unique(),
    requestId: text('request_id').notNull(),
    tenantId: text('tenant_id').notNull(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'set null' }),
    routeDecisionId: text('route_decision_id'),
    workerId: text('worker_id'),
    model: text('model'),
    provider: text('provider'),
    approvalStatus: text('approval_status', {
      enum: ['not_required', 'pending', 'approved', 'rejected', 'auto_approved'],
    })
      .notNull()
      .default('not_required'),
    confidenceScore: real('confidence_score'),
    riskScore: real('risk_score'),
    latencyMs: integer('latency_ms'),
    costEstimateUsd: numeric('cost_estimate_usd', { precision: 10, scale: 6 }),
    sourceCount: integer('source_count').notNull().default(0),
    memoryHitCount: integer('memory_hit_count').notNull().default(0),
    phaseCount: integer('phase_count').notNull().default(0),
    completedPhases: jsonb('completed_phases').default([]),
    auditHash: text('audit_hash').notNull(),
    lineage: jsonb('lineage').default([]),
    executionSucceeded: boolean('execution_succeeded').notNull().default(true),
    failureReason: text('failure_reason'),
    sealedAt: timestamp('sealed_at'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('a11oy_cpc_tenant_idx').on(t.tenantId),
    index('a11oy_cpc_request_idx').on(t.requestId),
    index('a11oy_cpc_route_idx').on(t.routeDecisionId),
    index('a11oy_cpc_worker_idx').on(t.workerId),
    index('a11oy_cpc_proof_id_idx').on(t.proofChainId),
    index('a11oy_cpc_created_idx').on(t.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// a11oy_cognitive_deployments — Cognitive Deployment Requests
// Tracks governed rollout of new models, workers, or configuration changes.
// ---------------------------------------------------------------------------

export const a11oyCognitiveDeploymentsTable = pgTable(
  'a11oy_cognitive_deployments',
  {
    id: serial('id').primaryKey(),
    deploymentId: text('deployment_id').notNull().unique(),
    tenantId: text('tenant_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    deploymentType: text('deployment_type', {
      enum: ['model', 'worker', 'config', 'policy', 'guard', 'phase_engine'],
    }).notNull(),
    targetRolloutGroup: text('target_rollout_group').notNull().default('default'),
    newConfigChecksum: text('new_config_checksum').notNull(),
    previousConfigChecksum: text('previous_config_checksum'),
    status: text('status', {
      enum: ['pending', 'approved', 'in_progress', 'completed', 'rolled_back', 'failed'],
    })
      .notNull()
      .default('pending'),
    approvalRequired: boolean('approval_required').notNull().default(true),
    approvedAt: timestamp('approved_at'),
    approvedBy: text('approved_by'),
    activatedAt: timestamp('activated_at'),
    rolledBackAt: timestamp('rolled_back_at'),
    rollbackReason: text('rollback_reason'),
    affectedWorkerIds: jsonb('affected_worker_ids').default([]),
    validationResults: jsonb('validation_results').default({}),
    metadata: jsonb('metadata').default({}),
    scheduledAt: timestamp('scheduled_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('a11oy_deploy_tenant_idx').on(t.tenantId),
    index('a11oy_deploy_rollout_idx').on(t.targetRolloutGroup),
    index('a11oy_deploy_checksum_idx').on(t.newConfigChecksum),
    index('a11oy_deploy_status_idx').on(t.status),
    index('a11oy_deploy_created_idx').on(t.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// a11oy_guardrail_rejections — Guided Output Guard
// Every rejection logged here with redacted schema snippet, rejection reason,
// and the size/depth limit that was violated. Never stores raw unredacted content.
// ---------------------------------------------------------------------------

export const a11oyGuardrailRejectionsTable = pgTable(
  'a11oy_guardrail_rejections',
  {
    id: serial('id').primaryKey(),
    rejectionId: text('rejection_id').notNull().unique(),
    requestId: text('request_id'),
    tenantId: text('tenant_id').notNull(),
    guardRule: text('guard_rule', {
      enum: [
        'json_schema_too_large',
        'nesting_too_deep',
        'regex_too_large',
        'grammar_too_large',
        'whitespace_pattern_too_large',
        'unknown_constraint',
      ],
    }).notNull(),
    violatedLimit: text('violated_limit').notNull(),
    actualSize: integer('actual_size'),
    maxAllowed: integer('max_allowed'),
    redactedSnippet: text('redacted_snippet'),
    domain: text('domain'),
    metadata: jsonb('metadata').default({}),
    rejectedAt: timestamp('rejected_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('a11oy_guard_tenant_idx').on(t.tenantId),
    index('a11oy_guard_request_idx').on(t.requestId),
    index('a11oy_guard_rule_idx').on(t.guardRule),
    index('a11oy_guard_rejected_idx').on(t.rejectedAt),
  ],
);

// ---------------------------------------------------------------------------
// Zod insert schemas and TypeScript types
// ---------------------------------------------------------------------------

export const insertA11oyWorkerSchema = createInsertSchema(a11oyWorkersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertA11oyWorker = z.infer<typeof insertA11oyWorkerSchema>;
export type A11oyWorker = typeof a11oyWorkersTable.$inferSelect;

export const insertA11oyRouteDecisionSchema = createInsertSchema(a11oyRouteDecisionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertA11oyRouteDecision = z.infer<typeof insertA11oyRouteDecisionSchema>;
export type A11oyRouteDecision = typeof a11oyRouteDecisionsTable.$inferSelect;

export const insertA11oyMemoryEventSchema = createInsertSchema(a11oyMemoryEventsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertA11oyMemoryEvent = z.infer<typeof insertA11oyMemoryEventSchema>;
export type A11oyMemoryEvent = typeof a11oyMemoryEventsTable.$inferSelect;

export const insertA11oyPhaseRunSchema = createInsertSchema(a11oyPhaseRunsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertA11oyPhaseRun = z.infer<typeof insertA11oyPhaseRunSchema>;
export type A11oyPhaseRun = typeof a11oyPhaseRunsTable.$inferSelect;

export const insertA11oyRuntimeEventSchema = createInsertSchema(a11oyRuntimeEventsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertA11oyRuntimeEvent = z.infer<typeof insertA11oyRuntimeEventSchema>;
export type A11oyRuntimeEvent = typeof a11oyRuntimeEventsTable.$inferSelect;

export const insertA11oyCognitiveProofChainSchema = createInsertSchema(
  a11oyCognitiveProofChainsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertA11oyCognitiveProofChain = z.infer<typeof insertA11oyCognitiveProofChainSchema>;
export type A11oyCognitiveProofChain = typeof a11oyCognitiveProofChainsTable.$inferSelect;

export const insertA11oyCognitiveDeploymentSchema = createInsertSchema(
  a11oyCognitiveDeploymentsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertA11oyCognitiveDeployment = z.infer<typeof insertA11oyCognitiveDeploymentSchema>;
export type A11oyCognitiveDeployment = typeof a11oyCognitiveDeploymentsTable.$inferSelect;

export const insertA11oyGuardrailRejectionSchema = createInsertSchema(
  a11oyGuardrailRejectionsTable,
).omit({ id: true, createdAt: true });
export type InsertA11oyGuardrailRejection = z.infer<typeof insertA11oyGuardrailRejectionSchema>;
export type A11oyGuardrailRejection = typeof a11oyGuardrailRejectionsTable.$inferSelect;
