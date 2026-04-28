import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { usersTable } from './auth';

// ─── Owner ────────────────────────────────────────────────────────────────────

export const continuumOwners = pgTable(
  'continuum_owners',
  {
    id: serial('id').primaryKey(),
    externalId: text('external_id').unique(),
    name: text('name').notNull(),
    type: text('type', { enum: ['user', 'team', 'system', 'external'] })
      .notNull()
      .default('user'),
    email: text('email'),
    domain: text('domain'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('continuum_owners_domain_idx').on(t.domain), index('continuum_owners_type_idx').on(t.type)],
);

// ─── Signal ───────────────────────────────────────────────────────────────────

export const continuumSignals = pgTable(
  'continuum_signals',
  {
    id: serial('id').primaryKey(),
    externalId: text('external_id').unique(),
    source: text('source').notNull(),
    sourceType: text('source_type', {
      enum: ['webhook', 'batch', 'manual', 'scheduled', 'demo', 'api'],
    })
      .notNull()
      .default('api'),
    domain: text('domain').notNull(),
    rawPayload: jsonb('raw_payload'),
    title: text('title').notNull(),
    summary: text('summary'),
    category: text('category'),
    severity: text('severity', {
      enum: ['info', 'low', 'medium', 'high', 'critical'],
    })
      .notNull()
      .default('medium'),
    score: real('score').default(0),
    confidence: real('confidence').default(0.5),
    tags: jsonb('tags').default([]),
    ownerId: integer('owner_id').references(() => continuumOwners.id),
    ownerUserId: integer('owner_user_id').references(() => usersTable.id),
    status: text('status', {
      enum: ['raw', 'normalized', 'scored', 'triaged', 'archived'],
    })
      .notNull()
      .default('raw'),
    normalizedAt: timestamp('normalized_at'),
    scoredAt: timestamp('scored_at'),
    dedupeKey: text('dedupe_key'),
    environment: text('environment', { enum: ['development', 'staging', 'production'] }).default(
      'production',
    ),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('continuum_signals_domain_idx').on(t.domain),
    index('continuum_signals_severity_idx').on(t.severity),
    index('continuum_signals_status_idx').on(t.status),
    index('continuum_signals_source_type_idx').on(t.sourceType),
    index('continuum_signals_owner_idx').on(t.ownerId),
    index('continuum_signals_created_idx').on(t.createdAt),
    index('continuum_signals_dedupe_idx').on(t.dedupeKey),
  ],
);

// ─── Workflow ──────────────────────────────────────────────────────────────────

export const continuumWorkflows = pgTable(
  'continuum_workflows',
  {
    id: serial('id').primaryKey(),
    externalId: text('external_id').unique(),
    name: text('name').notNull(),
    type: text('type', {
      enum: [
        'investigation',
        'remediation',
        'escalation',
        'review',
        'notification',
        'report',
        'custom',
      ],
    })
      .notNull()
      .default('investigation'),
    domain: text('domain').notNull(),
    triggerId: integer('trigger_signal_id').references(() => continuumSignals.id),
    triggerType: text('trigger_type', { enum: ['signal', 'schedule', 'manual', 'escalation'] })
      .notNull()
      .default('signal'),
    status: text('status', {
      enum: [
        'draft',
        'pending',
        'running',
        'waiting_approval',
        'approved',
        'rejected',
        'completed',
        'failed',
        'cancelled',
      ],
    })
      .notNull()
      .default('draft'),
    priority: text('priority', { enum: ['low', 'medium', 'high', 'critical'] })
      .notNull()
      .default('medium'),
    ownerId: integer('owner_id').references(() => continuumOwners.id),
    ownerUserId: integer('owner_user_id').references(() => usersTable.id),
    assignedUserId: integer('assigned_user_id').references(() => usersTable.id),
    steps: jsonb('steps').default([]),
    currentStep: integer('current_step').default(0),
    inputs: jsonb('inputs').default({}),
    outputs: jsonb('outputs').default({}),
    context: jsonb('context').default({}),
    retryCount: integer('retry_count').notNull().default(0),
    maxRetries: integer('max_retries').notNull().default(3),
    requiresApproval: boolean('requires_approval').notNull().default(false),
    approvalState: text('approval_state', {
      enum: ['none', 'pending', 'approved', 'rejected'],
    }).default('none'),
    confidenceScore: real('confidence_score').default(0.5),
    errorMessage: text('error_message'),
    scheduledAt: timestamp('scheduled_at'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    environment: text('environment', { enum: ['development', 'staging', 'production'] }).default(
      'production',
    ),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('continuum_workflows_domain_idx').on(t.domain),
    index('continuum_workflows_status_idx').on(t.status),
    index('continuum_workflows_type_idx').on(t.type),
    index('continuum_workflows_owner_idx').on(t.ownerId),
    index('continuum_workflows_priority_idx').on(t.priority),
    index('continuum_workflows_created_idx').on(t.createdAt),
  ],
);

// ─── Workflow Run History ─────────────────────────────────────────────────────

export const continuumWorkflowRuns = pgTable(
  'continuum_workflow_runs',
  {
    id: serial('id').primaryKey(),
    workflowId: integer('workflow_id')
      .notNull()
      .references(() => continuumWorkflows.id, { onDelete: 'cascade' }),
    runNumber: integer('run_number').notNull().default(1),
    status: text('status', {
      enum: ['started', 'completed', 'failed', 'cancelled'],
    })
      .notNull()
      .default('started'),
    trigger: text('trigger'),
    inputs: jsonb('inputs').default({}),
    outputs: jsonb('outputs').default({}),
    stepsExecuted: jsonb('steps_executed').default([]),
    ownerUserId: integer('owner_user_id').references(() => usersTable.id),
    approvalState: text('approval_state', {
      enum: ['none', 'pending', 'approved', 'rejected'],
    }).default('none'),
    approvedByUserId: integer('approved_by_user_id').references(() => usersTable.id),
    retryCount: integer('retry_count').notNull().default(0),
    errorMessage: text('error_message'),
    durationMs: integer('duration_ms'),
    startedAt: timestamp('started_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
    metadata: jsonb('metadata').default({}),
  },
  (t) => [
    index('continuum_workflow_runs_workflow_idx').on(t.workflowId),
    index('continuum_workflow_runs_status_idx').on(t.status),
    index('continuum_workflow_runs_started_idx').on(t.startedAt),
  ],
);

// ─── Approval ─────────────────────────────────────────────────────────────────

export const continuumApprovals = pgTable(
  'continuum_approvals',
  {
    id: serial('id').primaryKey(),
    workflowId: integer('workflow_id')
      .notNull()
      .references(() => continuumWorkflows.id, { onDelete: 'cascade' }),
    runId: integer('run_id').references(() => continuumWorkflowRuns.id),
    requestedByUserId: integer('requested_by_user_id').references(() => usersTable.id),
    reviewerUserId: integer('reviewer_user_id').references(() => usersTable.id),
    status: text('status', {
      enum: ['pending', 'approved', 'rejected', 'expired'],
    })
      .notNull()
      .default('pending'),
    reason: text('reason'),
    reviewNote: text('review_note'),
    requiredRoles: jsonb('required_roles').default([]),
    expiresAt: timestamp('expires_at'),
    reviewedAt: timestamp('reviewed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('continuum_approvals_workflow_idx').on(t.workflowId),
    index('continuum_approvals_status_idx').on(t.status),
    index('continuum_approvals_reviewer_idx').on(t.reviewerUserId),
  ],
);

// ─── Action ───────────────────────────────────────────────────────────────────

export const continuumActions = pgTable(
  'continuum_actions',
  {
    id: serial('id').primaryKey(),
    externalId: text('external_id').unique(),
    workflowId: integer('workflow_id').references(() => continuumWorkflows.id),
    signalId: integer('signal_id').references(() => continuumSignals.id),
    type: text('type', {
      enum: [
        'alert',
        'notify',
        'escalate',
        'assign',
        'resolve',
        'suppress',
        'review',
        'remediate',
        'report',
        'custom',
      ],
    }).notNull(),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status', {
      enum: ['queued', 'in_progress', 'completed', 'failed', 'cancelled', 'skipped'],
    })
      .notNull()
      .default('queued'),
    priority: text('priority', { enum: ['low', 'medium', 'high', 'critical'] })
      .notNull()
      .default('medium'),
    assignedUserId: integer('assigned_user_id').references(() => usersTable.id),
    ownerId: integer('owner_id').references(() => continuumOwners.id),
    payload: jsonb('payload').default({}),
    result: jsonb('result'),
    errorMessage: text('error_message'),
    dueAt: timestamp('due_at'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('continuum_actions_workflow_idx').on(t.workflowId),
    index('continuum_actions_signal_idx').on(t.signalId),
    index('continuum_actions_status_idx').on(t.status),
    index('continuum_actions_type_idx').on(t.type),
    index('continuum_actions_assigned_idx').on(t.assignedUserId),
  ],
);

// ─── Artifact (Output) ────────────────────────────────────────────────────────

export const continuumArtifacts = pgTable(
  'continuum_artifacts',
  {
    id: serial('id').primaryKey(),
    externalId: text('external_id').unique(),
    workflowId: integer('workflow_id').references(() => continuumWorkflows.id),
    signalId: integer('signal_id').references(() => continuumSignals.id),
    type: text('type', {
      enum: [
        'summary',
        'alert',
        'proposal',
        'brief',
        'action_queue',
        'readiness',
        'report',
        'note',
        'custom',
      ],
    }).notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    format: text('format', { enum: ['text', 'markdown', 'json', 'html'] })
      .notNull()
      .default('markdown'),
    confidenceScore: real('confidence_score').default(0.5),
    requiresApproval: boolean('requires_approval').notNull().default(false),
    approvalState: text('approval_state', {
      enum: ['none', 'pending', 'approved', 'rejected'],
    }).default('none'),
    approvedByUserId: integer('approved_by_user_id').references(() => usersTable.id),
    version: integer('version').notNull().default(1),
    parentArtifactId: integer('parent_artifact_id'),
    tags: jsonb('tags').default([]),
    domain: text('domain').notNull(),
    ownerId: integer('owner_id').references(() => continuumOwners.id),
    ownerUserId: integer('owner_user_id').references(() => usersTable.id),
    metadata: jsonb('metadata').default({}),
    publishedAt: timestamp('published_at'),
    archivedAt: timestamp('archived_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('continuum_artifacts_workflow_idx').on(t.workflowId),
    index('continuum_artifacts_signal_idx').on(t.signalId),
    index('continuum_artifacts_type_idx').on(t.type),
    index('continuum_artifacts_domain_idx').on(t.domain),
    index('continuum_artifacts_owner_idx').on(t.ownerId),
    index('continuum_artifacts_approval_idx').on(t.approvalState),
  ],
);

// ─── Audit Log ────────────────────────────────────────────────────────────────

export const continuumAuditLog = pgTable(
  'continuum_audit_log',
  {
    id: serial('id').primaryKey(),
    entityType: text('entity_type', {
      enum: ['signal', 'workflow', 'action', 'artifact', 'approval', 'owner'],
    }).notNull(),
    entityId: integer('entity_id').notNull(),
    action: text('action').notNull(),
    actorUserId: integer('actor_user_id').references(() => usersTable.id),
    actorType: text('actor_type', { enum: ['user', 'system', 'agent'] })
      .notNull()
      .default('system'),
    previousState: jsonb('previous_state'),
    newState: jsonb('new_state'),
    diff: jsonb('diff'),
    notes: text('notes'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    correlationId: text('correlation_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('continuum_audit_log_entity_idx').on(t.entityType, t.entityId),
    index('continuum_audit_log_actor_idx').on(t.actorUserId),
    index('continuum_audit_log_created_idx').on(t.createdAt),
    index('continuum_audit_log_action_idx').on(t.action),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const alloySignalsRelations = relations(continuumSignals, ({ one, many }) => ({
  owner: one(continuumOwners, { fields: [continuumSignals.ownerId], references: [continuumOwners.id] }),
  ownerUser: one(usersTable, { fields: [continuumSignals.ownerUserId], references: [usersTable.id] }),
  workflows: many(continuumWorkflows),
  actions: many(continuumActions),
  artifacts: many(continuumArtifacts),
}));

export const alloyWorkflowsRelations = relations(continuumWorkflows, ({ one, many }) => ({
  triggerSignal: one(continuumSignals, {
    fields: [continuumWorkflows.triggerId],
    references: [continuumSignals.id],
  }),
  owner: one(continuumOwners, { fields: [continuumWorkflows.ownerId], references: [continuumOwners.id] }),
  ownerUser: one(usersTable, { fields: [continuumWorkflows.ownerUserId], references: [usersTable.id] }),
  assignedUser: one(usersTable, {
    fields: [continuumWorkflows.assignedUserId],
    references: [usersTable.id],
  }),
  runs: many(continuumWorkflowRuns),
  approvals: many(continuumApprovals),
  actions: many(continuumActions),
  artifacts: many(continuumArtifacts),
}));

export const alloyWorkflowRunsRelations = relations(continuumWorkflowRuns, ({ one }) => ({
  workflow: one(continuumWorkflows, {
    fields: [continuumWorkflowRuns.workflowId],
    references: [continuumWorkflows.id],
  }),
  ownerUser: one(usersTable, {
    fields: [continuumWorkflowRuns.ownerUserId],
    references: [usersTable.id],
  }),
  approvedByUser: one(usersTable, {
    fields: [continuumWorkflowRuns.approvedByUserId],
    references: [usersTable.id],
  }),
}));

export const alloyApprovalsRelations = relations(continuumApprovals, ({ one }) => ({
  workflow: one(continuumWorkflows, {
    fields: [continuumApprovals.workflowId],
    references: [continuumWorkflows.id],
  }),
  run: one(continuumWorkflowRuns, {
    fields: [continuumApprovals.runId],
    references: [continuumWorkflowRuns.id],
  }),
  requestedByUser: one(usersTable, {
    fields: [continuumApprovals.requestedByUserId],
    references: [usersTable.id],
  }),
  reviewerUser: one(usersTable, {
    fields: [continuumApprovals.reviewerUserId],
    references: [usersTable.id],
  }),
}));

export const alloyActionsRelations = relations(continuumActions, ({ one }) => ({
  workflow: one(continuumWorkflows, {
    fields: [continuumActions.workflowId],
    references: [continuumWorkflows.id],
  }),
  signal: one(continuumSignals, { fields: [continuumActions.signalId], references: [continuumSignals.id] }),
  assignedUser: one(usersTable, {
    fields: [continuumActions.assignedUserId],
    references: [usersTable.id],
  }),
  owner: one(continuumOwners, { fields: [continuumActions.ownerId], references: [continuumOwners.id] }),
}));

export const alloyArtifactsRelations = relations(continuumArtifacts, ({ one }) => ({
  workflow: one(continuumWorkflows, {
    fields: [continuumArtifacts.workflowId],
    references: [continuumWorkflows.id],
  }),
  signal: one(continuumSignals, { fields: [continuumArtifacts.signalId], references: [continuumSignals.id] }),
  approvedByUser: one(usersTable, {
    fields: [continuumArtifacts.approvedByUserId],
    references: [usersTable.id],
  }),
  owner: one(continuumOwners, { fields: [continuumArtifacts.ownerId], references: [continuumOwners.id] }),
  ownerUser: one(usersTable, { fields: [continuumArtifacts.ownerUserId], references: [usersTable.id] }),
}));

// ─── Decision Objects ─────────────────────────────────────────────────────────

export const alloyDecisions = pgTable(
  'alloy_decisions',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    summary: text('summary'),
    verdict: text('verdict'),
    confidence: integer('confidence'),
    approvalStatus: text('approval_status', {
      enum: ['propose_only', 'approval_required', 'approved_execute', 'blocked_by_policy'],
    })
      .notNull()
      .default('propose_only'),
    evidence: jsonb('evidence').default([]),
    agentId: text('agent_id'),
    agentName: text('agent_name'),
    modelUsed: text('model_used'),
    workflowRunId: integer('workflow_run_id').references(() => continuumWorkflowRuns.id),
    reviewedBy: text('reviewed_by'),
    reviewedAt: timestamp('reviewed_at'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('alloy_decisions_approval_status_idx').on(t.approvalStatus),
    index('alloy_decisions_agent_id_idx').on(t.agentId),
    index('alloy_decisions_created_idx').on(t.createdAt),
  ],
);

// ─── Skill Registry ───────────────────────────────────────────────────────────

export const alloySkills = pgTable(
  'alloy_skills',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    version: text('version').notNull().default('1.0.0'),
    category: text('category').notNull(),
    description: text('description').notNull(),
    approvalClass: text('approval_class', {
      enum: ['auto', 'review', 'admin_only'],
    })
      .notNull()
      .default('auto'),
    isInternal: boolean('is_internal').notNull().default(true),
    isEnabled: boolean('is_enabled').notNull().default(true),
    dryRunSupported: boolean('dry_run_supported').notNull().default(false),
    inputSchema: jsonb('input_schema'),
    outputSchema: jsonb('output_schema'),
    tags: jsonb('tags').default([]),
    usageCount: integer('usage_count').notNull().default(0),
    lastUsedAt: timestamp('last_used_at'),
    deprecatedAt: timestamp('deprecated_at'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('alloy_skills_slug_version_idx').on(t.slug, t.version),
    index('alloy_skills_category_idx').on(t.category),
    index('alloy_skills_approval_class_idx').on(t.approvalClass),
    index('alloy_skills_enabled_idx').on(t.isEnabled),
  ],
);

export const alloySkillRuns = pgTable(
  'alloy_skill_runs',
  {
    id: serial('id').primaryKey(),
    skillId: integer('skill_id')
      .references(() => alloySkills.id)
      .notNull(),
    workflowRunId: integer('workflow_run_id').references(() => continuumWorkflowRuns.id),
    agentId: text('agent_id'),
    input: jsonb('input'),
    output: jsonb('output'),
    status: text('status', { enum: ['pending', 'running', 'success', 'failed', 'dry_run'] })
      .notNull()
      .default('pending'),
    durationMs: integer('duration_ms'),
    errorMessage: text('error_message'),
    modelUsed: text('model_used'),
    costCents: integer('cost_cents'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('alloy_skill_runs_skill_id_idx').on(t.skillId),
    index('alloy_skill_runs_workflow_run_id_idx').on(t.workflowRunId),
    index('alloy_skill_runs_created_idx').on(t.createdAt),
  ],
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlloySignal = typeof continuumSignals.$inferSelect;
export type InsertAlloySignal = typeof continuumSignals.$inferInsert;
export type AlloyWorkflow = typeof continuumWorkflows.$inferSelect;
export type InsertAlloyWorkflow = typeof continuumWorkflows.$inferInsert;
export type AlloyWorkflowRun = typeof continuumWorkflowRuns.$inferSelect;
export type InsertAlloyWorkflowRun = typeof continuumWorkflowRuns.$inferInsert;
export type AlloyApproval = typeof continuumApprovals.$inferSelect;
export type InsertAlloyApproval = typeof continuumApprovals.$inferInsert;
export type AlloyAction = typeof continuumActions.$inferSelect;
export type InsertAlloyAction = typeof continuumActions.$inferInsert;
export type AlloyArtifact = typeof continuumArtifacts.$inferSelect;
export type InsertAlloyArtifact = typeof continuumArtifacts.$inferInsert;
export type AlloyAuditLogEntry = typeof continuumAuditLog.$inferSelect;
export type InsertAlloyAuditLogEntry = typeof continuumAuditLog.$inferInsert;
export type AlloyOwner = typeof continuumOwners.$inferSelect;
export type InsertAlloyOwner = typeof continuumOwners.$inferInsert;
