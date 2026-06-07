import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { usersTable } from './auth';
import { organizationsTable } from './organizations';

export const alloyRuntimeWorkflowsTable = pgTable(
  'alloy_runtime_workflows',
  {
    id: serial('id').primaryKey(),
    workflowId: text('workflow_id').notNull().unique(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    domain: text('domain').notNull().default('general'),
    executionMode: text('execution_mode', {
      enum: ['manual', 'semi_auto', 'autonomous'],
    })
      .notNull()
      .default('manual'),
    policyTier: text('policy_tier'),
    stepsDefinition: jsonb('steps_definition').default([]),
    rollbackPolicy: text('rollback_policy', {
      enum: ['none', 'step', 'full'],
    })
      .notNull()
      .default('step'),
    requiresExplicitApproval: boolean('requires_explicit_approval').notNull().default(true),
    isDryRunCapable: boolean('is_dry_run_capable').notNull().default(true),
    estimatedCostUsd: numeric('estimated_cost_usd', { precision: 10, scale: 4 }),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: integer('created_by').references(() => usersTable.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('alloy_wf_org_idx').on(t.orgId),
    index('alloy_wf_domain_idx').on(t.domain),
    index('alloy_wf_mode_idx').on(t.executionMode),
    index('alloy_wf_active_idx').on(t.isActive),
    index('alloy_wf_created_idx').on(t.createdAt),
  ],
);

export const alloyRuntimeWorkflowStepsTable = pgTable(
  'alloy_runtime_workflow_steps',
  {
    id: serial('id').primaryKey(),
    workflowId: text('workflow_id').notNull(),
    stepId: text('step_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    handler: text('handler').notNull(),
    stepOrder: integer('step_order').notNull().default(0),
    executionMode: text('execution_mode', {
      enum: ['manual', 'semi_auto', 'autonomous'],
    })
      .notNull()
      .default('manual'),
    requiresApproval: boolean('requires_approval').notNull().default(false),
    approverRole: text('approver_role'),
    parameters: jsonb('parameters').default({}),
    rollbackHandler: text('rollback_handler'),
    timeoutMs: integer('timeout_ms'),
    retryCount: integer('retry_count').notNull().default(0),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('alloy_wf_step_wf_idx').on(t.workflowId),
    index('alloy_wf_step_order_idx').on(t.workflowId, t.stepOrder),
  ],
);

export const alloyRuntimeWorkflowRunsTable = pgTable(
  'alloy_runtime_workflow_runs',
  {
    id: serial('id').primaryKey(),
    runId: text('run_id').notNull().unique(),
    workflowId: text('workflow_id').notNull(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'set null' }),
    initiatedBy: integer('initiated_by').references(() => usersTable.id, { onDelete: 'set null' }),
    executionMode: text('execution_mode', {
      enum: ['manual', 'semi_auto', 'autonomous'],
    })
      .notNull()
      .default('manual'),
    status: text('status', {
      enum: [
        'pending_approval',
        'approved',
        'running',
        'completed',
        'failed',
        'rolled_back',
        'cancelled',
      ],
    })
      .notNull()
      .default('pending_approval'),
    isDryRun: boolean('is_dry_run').notNull().default(false),
    isSimulation: boolean('is_simulation').notNull().default(false),
    currentStepIndex: integer('current_step_index').notNull().default(0),
    approvalState: text('approval_state', {
      enum: ['none', 'pending', 'approved', 'rejected'],
    })
      .notNull()
      .default('none'),
    approvedBy: integer('approved_by').references(() => usersTable.id, { onDelete: 'set null' }),
    approvedAt: timestamp('approved_at'),
    rejectedAt: timestamp('rejected_at'),
    rejectionReason: text('rejection_reason'),
    steps: jsonb('steps').default([]),
    auditTrail: jsonb('audit_trail').default([]),
    policyEvaluation: jsonb('policy_evaluation'),
    traceId: text('trace_id'),
    recommendationId: text('recommendation_id'),
    estimatedCostUsd: numeric('estimated_cost_usd', { precision: 10, scale: 4 }),
    actualCostUsd: numeric('actual_cost_usd', { precision: 10, scale: 4 }),
    errorMessage: text('error_message'),
    output: jsonb('output'),
    metadata: jsonb('metadata').default({}),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('alloy_run_workflow_idx').on(t.workflowId),
    index('alloy_run_status_idx').on(t.status),
    index('alloy_run_org_idx').on(t.orgId),
    index('alloy_run_initiated_idx').on(t.initiatedBy),
    index('alloy_run_approval_idx').on(t.approvalState),
    index('alloy_run_created_idx').on(t.createdAt),
  ],
);

export const alloyRuntimeAgentsTable = pgTable(
  'alloy_runtime_agents',
  {
    id: serial('id').primaryKey(),
    agentId: text('agent_id').notNull().unique(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    domain: text('domain').notNull().default('general'),
    policyTier: text('policy_tier').notNull().default('internal-workflow'),
    defaultModel: text('default_model'),
    capabilities: jsonb('capabilities').default([]),
    toolAccess: jsonb('tool_access').default([]),
    maxCostPerRunUsd: numeric('max_cost_per_run_usd', { precision: 10, scale: 4 }),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: integer('created_by').references(() => usersTable.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('alloy_agent_org_idx').on(t.orgId),
    index('alloy_agent_domain_idx').on(t.domain),
    index('alloy_agent_active_idx').on(t.isActive),
  ],
);

export const alloyRuntimeAgentVersionsTable = pgTable(
  'alloy_runtime_agent_versions',
  {
    id: serial('id').primaryKey(),
    agentId: text('agent_id').notNull(),
    version: text('version').notNull(),
    changelog: text('changelog'),
    snapshot: jsonb('snapshot').notNull(),
    isDeployed: boolean('is_deployed').notNull().default(false),
    deployedAt: timestamp('deployed_at'),
    createdBy: integer('created_by').references(() => usersTable.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('alloy_agent_ver_agent_idx').on(t.agentId),
    index('alloy_agent_ver_deployed_idx').on(t.isDeployed),
  ],
);

export const alloyRuntimePromptsTable = pgTable(
  'alloy_runtime_prompts',
  {
    id: serial('id').primaryKey(),
    promptId: text('prompt_id').notNull().unique(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    domain: text('domain').notNull().default('general'),
    template: text('template').notNull(),
    variables: jsonb('variables').default([]),
    tags: jsonb('tags').default([]),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: integer('created_by').references(() => usersTable.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('alloy_prompt_org_idx').on(t.orgId),
    index('alloy_prompt_domain_idx').on(t.domain),
    index('alloy_prompt_active_idx').on(t.isActive),
  ],
);

export const alloyRuntimePromptVersionsTable = pgTable(
  'alloy_runtime_prompt_versions',
  {
    id: serial('id').primaryKey(),
    promptId: text('prompt_id').notNull(),
    version: text('version').notNull(),
    template: text('template').notNull(),
    variables: jsonb('variables').default([]),
    changelog: text('changelog'),
    isDeployed: boolean('is_deployed').notNull().default(false),
    deployedAt: timestamp('deployed_at'),
    createdBy: integer('created_by').references(() => usersTable.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('alloy_prompt_ver_prompt_idx').on(t.promptId),
    index('alloy_prompt_ver_deployed_idx').on(t.isDeployed),
  ],
);

export const alloyRuntimeModelsTable = pgTable(
  'alloy_runtime_models',
  {
    id: serial('id').primaryKey(),
    modelId: text('model_id').notNull().unique(),
    name: text('name').notNull(),
    provider: text('provider').notNull(),
    modelFamily: text('model_family'),
    contextWindow: integer('context_window'),
    costPerInputToken: numeric('cost_per_input_token', { precision: 12, scale: 8 }),
    costPerOutputToken: numeric('cost_per_output_token', { precision: 12, scale: 8 }),
    avgLatencyMs: integer('avg_latency_ms'),
    capabilities: jsonb('capabilities').default([]),
    supportedTiers: jsonb('supported_tiers').default([]),
    isActive: boolean('is_active').notNull().default(true),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('alloy_model_provider_idx').on(t.provider),
    index('alloy_model_active_idx').on(t.isActive),
  ],
);

export const alloyRuntimeModelVersionsTable = pgTable(
  'alloy_runtime_model_versions',
  {
    id: serial('id').primaryKey(),
    modelId: text('model_id').notNull(),
    version: text('version').notNull(),
    releaseNotes: text('release_notes'),
    snapshot: jsonb('snapshot').notNull(),
    isDeployed: boolean('is_deployed').notNull().default(false),
    deployedAt: timestamp('deployed_at'),
    deprecatedAt: timestamp('deprecated_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('alloy_model_ver_model_idx').on(t.modelId),
    index('alloy_model_ver_deployed_idx').on(t.isDeployed),
  ],
);

export const alloyRuntimeModelRoutesTable = pgTable(
  'alloy_runtime_model_routes',
  {
    id: serial('id').primaryKey(),
    routeId: text('route_id').notNull().unique(),
    name: text('name').notNull(),
    matchTier: text('match_tier'),
    matchDomain: text('match_domain'),
    matchTask: text('match_task'),
    preferredModelId: text('preferred_model_id'),
    fallbackModelId: text('fallback_model_id'),
    maxLatencyMs: integer('max_latency_ms'),
    maxCostUsd: numeric('max_cost_usd', { precision: 10, scale: 4 }),
    priority: integer('priority').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('alloy_model_route_tier_idx').on(t.matchTier),
    index('alloy_model_route_domain_idx').on(t.matchDomain),
    index('alloy_model_route_priority_idx').on(t.priority),
    index('alloy_model_route_active_idx').on(t.isActive),
  ],
);

export const alloyRuntimeSignalsTable = pgTable(
  'alloy_runtime_signals',
  {
    id: serial('id').primaryKey(),
    signalId: text('signal_id').notNull().unique(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    domain: text('domain').notNull().default('general'),
    title: text('title').notNull(),
    description: text('description'),
    severity: text('severity', {
      enum: ['info', 'low', 'medium', 'high', 'critical'],
    })
      .notNull()
      .default('medium'),
    status: text('status', {
      enum: ['new', 'processing', 'processed', 'escalated', 'ignored'],
    })
      .notNull()
      .default('new'),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    payload: jsonb('payload').default({}),
    metadata: jsonb('metadata').default({}),
    receivedAt: timestamp('received_at').notNull().defaultNow(),
    processedAt: timestamp('processed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('alloy_signal_org_idx').on(t.orgId),
    index('alloy_signal_domain_idx').on(t.domain),
    index('alloy_signal_severity_idx').on(t.severity),
    index('alloy_signal_status_idx').on(t.status),
    index('alloy_signal_entity_idx').on(t.entityType, t.entityId),
    index('alloy_signal_received_idx').on(t.receivedAt),
  ],
);

export const alloyRuntimeSignalSourcesTable = pgTable(
  'alloy_runtime_signal_sources',
  {
    id: serial('id').primaryKey(),
    sourceId: text('source_id').notNull().unique(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    sourceType: text('source_type', {
      enum: ['connector', 'webhook', 'api', 'manual', 'scheduled', 'monitoring', 'sensor'],
    })
      .notNull()
      .default('api'),
    domain: text('domain').notNull().default('general'),
    endpoint: text('endpoint'),
    isActive: boolean('is_active').notNull().default(true),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('alloy_sig_source_org_idx').on(t.orgId),
    index('alloy_sig_source_type_idx').on(t.sourceType),
    index('alloy_sig_source_active_idx').on(t.isActive),
  ],
);

export const alloyRuntimeSignalScoresTable = pgTable(
  'alloy_runtime_signal_scores',
  {
    id: serial('id').primaryKey(),
    signalId: text('signal_id').notNull(),
    scorerModel: text('scorer_model'),
    normalizedScore: numeric('normalized_score', { precision: 5, scale: 4 }),
    urgencyScore: numeric('urgency_score', { precision: 5, scale: 4 }),
    confidenceScore: numeric('confidence_score', { precision: 5, scale: 4 }),
    impactScore: numeric('impact_score', { precision: 5, scale: 4 }),
    reasoning: text('reasoning'),
    scoredAt: timestamp('scored_at').notNull().defaultNow(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('alloy_sig_score_signal_idx').on(t.signalId),
    index('alloy_sig_score_scored_idx').on(t.scoredAt),
  ],
);

export const alloyRuntimeActionsTable = pgTable(
  'alloy_runtime_actions',
  {
    id: serial('id').primaryKey(),
    actionId: text('action_id').notNull().unique(),
    runId: text('run_id'),
    stepId: text('step_id'),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'set null' }),
    actorId: integer('actor_id').references(() => usersTable.id, { onDelete: 'set null' }),
    type: text('type', {
      enum: [
        'tool-call',
        'approval',
        'checkpoint',
        'rollback',
        'model-selection',
        'workflow-start',
        'workflow-end',
        'memory-write',
        'memory-read',
        'signal-emitted',
        'recommendation-created',
      ],
    }).notNull(),
    description: text('description').notNull(),
    domain: text('domain').notNull().default('general'),
    status: text('status', {
      enum: ['pending', 'completed', 'failed', 'rolled_back'],
    })
      .notNull()
      .default('completed'),
    isImmutable: boolean('is_immutable').notNull().default(true),
    payload: jsonb('payload').default({}),
    metadata: jsonb('metadata').default({}),
    executedAt: timestamp('executed_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('alloy_action_run_idx').on(t.runId),
    index('alloy_action_type_idx').on(t.type),
    index('alloy_action_org_idx').on(t.orgId),
    index('alloy_action_actor_idx').on(t.actorId),
    index('alloy_action_domain_idx').on(t.domain),
    index('alloy_action_executed_idx').on(t.executedAt),
  ],
);

export const insertAlloyRuntimeWorkflowSchema = createInsertSchema(alloyRuntimeWorkflowsTable).omit(
  { id: true, createdAt: true, updatedAt: true },
);
export type InsertAlloyRuntimeWorkflow = z.infer<typeof insertAlloyRuntimeWorkflowSchema>;
export type AlloyRuntimeWorkflow = typeof alloyRuntimeWorkflowsTable.$inferSelect;

export const insertAlloyRuntimeWorkflowStepSchema = createInsertSchema(
  alloyRuntimeWorkflowStepsTable,
).omit({ id: true, createdAt: true });
export type InsertAlloyRuntimeWorkflowStep = z.infer<typeof insertAlloyRuntimeWorkflowStepSchema>;
export type AlloyRuntimeWorkflowStep = typeof alloyRuntimeWorkflowStepsTable.$inferSelect;

export const insertAlloyRuntimeWorkflowRunSchema = createInsertSchema(
  alloyRuntimeWorkflowRunsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAlloyRuntimeWorkflowRun = z.infer<typeof insertAlloyRuntimeWorkflowRunSchema>;
export type AlloyRuntimeWorkflowRun = typeof alloyRuntimeWorkflowRunsTable.$inferSelect;

export const insertAlloyRuntimeAgentSchema = createInsertSchema(alloyRuntimeAgentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAlloyRuntimeAgent = z.infer<typeof insertAlloyRuntimeAgentSchema>;
export type AlloyRuntimeAgent = typeof alloyRuntimeAgentsTable.$inferSelect;

export const insertAlloyRuntimeAgentVersionSchema = createInsertSchema(
  alloyRuntimeAgentVersionsTable,
).omit({ id: true, createdAt: true });
export type InsertAlloyRuntimeAgentVersion = z.infer<typeof insertAlloyRuntimeAgentVersionSchema>;
export type AlloyRuntimeAgentVersion = typeof alloyRuntimeAgentVersionsTable.$inferSelect;

export const insertAlloyRuntimePromptSchema = createInsertSchema(alloyRuntimePromptsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAlloyRuntimePrompt = z.infer<typeof insertAlloyRuntimePromptSchema>;
export type AlloyRuntimePrompt = typeof alloyRuntimePromptsTable.$inferSelect;

export const insertAlloyRuntimePromptVersionSchema = createInsertSchema(
  alloyRuntimePromptVersionsTable,
).omit({ id: true, createdAt: true });
export type InsertAlloyRuntimePromptVersion = z.infer<typeof insertAlloyRuntimePromptVersionSchema>;
export type AlloyRuntimePromptVersion = typeof alloyRuntimePromptVersionsTable.$inferSelect;

export const insertAlloyRuntimeModelSchema = createInsertSchema(alloyRuntimeModelsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAlloyRuntimeModel = z.infer<typeof insertAlloyRuntimeModelSchema>;
export type AlloyRuntimeModel = typeof alloyRuntimeModelsTable.$inferSelect;

export const insertAlloyRuntimeModelVersionSchema = createInsertSchema(
  alloyRuntimeModelVersionsTable,
).omit({ id: true, createdAt: true });
export type InsertAlloyRuntimeModelVersion = z.infer<typeof insertAlloyRuntimeModelVersionSchema>;
export type AlloyRuntimeModelVersion = typeof alloyRuntimeModelVersionsTable.$inferSelect;

export const insertAlloyRuntimeModelRouteSchema = createInsertSchema(
  alloyRuntimeModelRoutesTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAlloyRuntimeModelRoute = z.infer<typeof insertAlloyRuntimeModelRouteSchema>;
export type AlloyRuntimeModelRoute = typeof alloyRuntimeModelRoutesTable.$inferSelect;

export const insertAlloyRuntimeSignalSchema = createInsertSchema(alloyRuntimeSignalsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAlloyRuntimeSignal = z.infer<typeof insertAlloyRuntimeSignalSchema>;
export type AlloyRuntimeSignal = typeof alloyRuntimeSignalsTable.$inferSelect;

export const insertAlloyRuntimeSignalSourceSchema = createInsertSchema(
  alloyRuntimeSignalSourcesTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAlloyRuntimeSignalSource = z.infer<typeof insertAlloyRuntimeSignalSourceSchema>;
export type AlloyRuntimeSignalSource = typeof alloyRuntimeSignalSourcesTable.$inferSelect;

export const insertAlloyRuntimeSignalScoreSchema = createInsertSchema(
  alloyRuntimeSignalScoresTable,
).omit({ id: true, createdAt: true });
export type InsertAlloyRuntimeSignalScore = z.infer<typeof insertAlloyRuntimeSignalScoreSchema>;
export type AlloyRuntimeSignalScore = typeof alloyRuntimeSignalScoresTable.$inferSelect;

export const insertAlloyRuntimeActionSchema = createInsertSchema(alloyRuntimeActionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAlloyRuntimeAction = z.infer<typeof insertAlloyRuntimeActionSchema>;
export type AlloyRuntimeAction = typeof alloyRuntimeActionsTable.$inferSelect;

export const inferenceLogTable = pgTable(
  'inference_log',
  {
    id: serial('id').primaryKey(),
    model: text('model').notNull(),
    agentId: text('agent_id'),
    action: text('action').notNull().default('inference'),
    entityType: text('entity_type').notNull().default('llm-call'),
    entityId: text('entity_id'),
    actor: text('actor').notNull().default('system'),
    platform: text('platform').notNull().default('Internal'),
    confidence: numeric('confidence', { precision: 5, scale: 4 }),
    latencyMs: integer('latency_ms'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('inf_log_model_idx').on(t.model),
    index('inf_log_agent_idx').on(t.agentId),
    index('inf_log_actor_idx').on(t.actor),
    index('inf_log_created_idx').on(t.createdAt),
  ],
);

export const insertInferenceLogSchema = createInsertSchema(inferenceLogTable).omit({
  id: true,
  createdAt: true,
});
export type InsertInferenceLog = z.infer<typeof insertInferenceLogSchema>;
export type InferenceLog = typeof inferenceLogTable.$inferSelect;
