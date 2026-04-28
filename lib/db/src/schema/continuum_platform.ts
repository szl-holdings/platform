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

export const alloyWorkflowsTable = pgTable(
  'platform_workflows',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    trigger: text('trigger', { enum: ['manual', 'signal', 'schedule', 'webhook', 'api'] })
      .notNull()
      .default('manual'),
    triggerConfig: jsonb('trigger_config'),
    steps: jsonb('steps'),
    outputType: text('output_type', {
      enum: ['artifact', 'notification', 'action', 'report', 'none'],
    })
      .notNull()
      .default('artifact'),
    requiresApproval: boolean('requires_approval').notNull().default(false),
    approverRole: text('approver_role'),
    isActive: boolean('is_active').notNull().default(true),
    runCount: integer('run_count').notNull().default(0),
    lastRunAt: timestamp('last_run_at'),
    createdBy: integer('created_by').references(() => usersTable.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('platform_workflows_org_idx').on(table.orgId),
    index('platform_workflows_active_idx').on(table.isActive),
  ],
);

export const alloySignalsTable = pgTable(
  'platform_signals',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    workflowId: integer('workflow_id').references(() => alloyWorkflowsTable.id, {
      onDelete: 'set null',
    }),
    source: text('source').notNull(),
    sourceType: text('source_type', {
      enum: ['connector', 'webhook', 'api', 'manual', 'scheduled', 'monitoring'],
    }).notNull(),
    severity: text('severity', { enum: ['critical', 'high', 'medium', 'low', 'info'] })
      .notNull()
      .default('info'),
    title: text('title').notNull(),
    body: text('body'),
    status: text('status', { enum: ['new', 'processing', 'processed', 'failed', 'ignored'] })
      .notNull()
      .default('new'),
    normalizedScore: numeric('normalized_score', { precision: 5, scale: 2 }),
    valueAtRisk: numeric('value_at_risk', { precision: 15, scale: 2 }),
    metadata: jsonb('metadata'),
    receivedAt: timestamp('received_at').notNull().defaultNow(),
    processedAt: timestamp('processed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('platform_signals_org_idx').on(table.orgId),
    index('platform_signals_status_idx').on(table.status),
    index('platform_signals_severity_idx').on(table.severity),
    index('platform_signals_received_idx').on(table.receivedAt),
  ],
);

export const alloyWorkflowRunsTable = pgTable(
  'platform_workflow_runs',
  {
    id: serial('id').primaryKey(),
    workflowId: integer('workflow_id')
      .notNull()
      .references(() => alloyWorkflowsTable.id, { onDelete: 'cascade' }),
    signalId: integer('signal_id').references(() => alloySignalsTable.id, { onDelete: 'set null' }),
    triggeredBy: integer('triggered_by').references(() => usersTable.id, { onDelete: 'set null' }),
    state: text('state', {
      enum: ['queued', 'running', 'waiting_approval', 'completed', 'failed', 'canceled'],
    })
      .notNull()
      .default('queued'),
    stateHistory: jsonb('state_history'),
    input: jsonb('input'),
    output: jsonb('output'),
    errorMessage: text('error_message'),
    retryCount: integer('retry_count').notNull().default(0),
    maxRetries: integer('max_retries').notNull().default(3),
    durationMs: integer('duration_ms'),
    queuedAt: timestamp('queued_at').notNull().defaultNow(),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('platform_runs_workflow_idx').on(table.workflowId),
    index('platform_runs_state_idx').on(table.state),
    index('platform_runs_queued_idx').on(table.queuedAt),
  ],
);

export const alloyArtifactsTable = pgTable(
  'platform_artifacts',
  {
    id: serial('id').primaryKey(),
    workflowRunId: integer('workflow_run_id').references(() => alloyWorkflowRunsTable.id, {
      onDelete: 'cascade',
    }),
    workflowId: integer('workflow_id').references(() => alloyWorkflowsTable.id, {
      onDelete: 'set null',
    }),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    artifactType: text('artifact_type', {
      enum: ['report', 'recommendation', 'alert', 'summary', 'document', 'data_export'],
    }).notNull(),
    content: jsonb('content'),
    status: text('status', {
      enum: ['draft', 'pending_review', 'approved', 'rejected', 'published'],
    })
      .notNull()
      .default('draft'),
    approvalStatus: text('approval_status', {
      enum: ['not_required', 'pending', 'approved', 'rejected'],
    })
      .notNull()
      .default('not_required'),
    reviewedBy: integer('reviewed_by').references(() => usersTable.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at'),
    reviewNotes: text('review_notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('platform_artifacts_run_idx').on(table.workflowRunId),
    index('platform_artifacts_org_idx').on(table.orgId),
    index('platform_artifacts_status_idx').on(table.status),
  ],
);

export const alloyApprovalsTable = pgTable(
  'platform_approvals',
  {
    id: serial('id').primaryKey(),
    workflowRunId: integer('workflow_run_id')
      .notNull()
      .references(() => alloyWorkflowRunsTable.id, { onDelete: 'cascade' }),
    artifactId: integer('artifact_id').references(() => alloyArtifactsTable.id, {
      onDelete: 'set null',
    }),
    requestedFrom: text('requested_from').notNull(),
    status: text('status', { enum: ['pending', 'approved', 'rejected', 'expired'] })
      .notNull()
      .default('pending'),
    decision: text('decision'),
    decisionBy: integer('decision_by').references(() => usersTable.id, { onDelete: 'set null' }),
    decisionAt: timestamp('decision_at'),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('platform_approvals_run_idx').on(table.workflowRunId),
    index('platform_approvals_status_idx').on(table.status),
  ],
);

export const alloyAuditLogTable = pgTable(
  'platform_audit_log',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    userId: integer('user_id').references(() => usersTable.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    resourceType: text('resource_type').notNull(),
    resourceId: text('resource_id'),
    before: jsonb('before'),
    after: jsonb('after'),
    correlationId: text('correlation_id'),
    serviceAttribution: text('service_attribution'),
    adminActionClass: text('admin_action_class'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('platform_audit_org_idx').on(table.orgId),
    index('platform_audit_action_idx').on(table.action),
    index('platform_audit_created_idx').on(table.createdAt),
    index('platform_audit_correlation_idx').on(table.correlationId),
    index('platform_audit_service_idx').on(table.serviceAttribution),
  ],
);

export const alloyPoliciesTable = pgTable(
  'platform_continuum_policies',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    kind: text('kind', {
      enum: [
        'approval_matrix',
        'model_routing',
        'cost_control',
        'agent_permission',
        'compliance_template',
      ],
    }).notNull(),
    status: text('status', { enum: ['active', 'draft', 'archived'] })
      .notNull()
      .default('draft'),
    rules: jsonb('rules').notNull().default({}),
    description: text('description'),
    createdBy: integer('created_by').references(() => usersTable.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('platform_policies_org_idx').on(table.orgId),
    index('platform_policies_kind_idx').on(table.kind),
    index('platform_policies_status_idx').on(table.status),
  ],
);

export const alloyGovernanceIncidentsTable = pgTable(
  'platform_governance_incidents',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    policyId: integer('policy_id').references(() => alloyPoliciesTable.id, {
      onDelete: 'set null',
    }),
    workflowRunId: integer('workflow_run_id').references(() => alloyWorkflowRunsTable.id, {
      onDelete: 'set null',
    }),
    severity: text('severity', { enum: ['low', 'medium', 'high', 'critical'] })
      .notNull()
      .default('medium'),
    type: text('type', {
      enum: [
        'policy_violation',
        'unexpected_result',
        'user_override',
        'cost_threshold',
        'model_blocked',
      ],
    }).notNull(),
    description: text('description').notNull(),
    resolution: text('resolution'),
    resolvedBy: integer('resolved_by').references(() => usersTable.id, { onDelete: 'set null' }),
    resolvedAt: timestamp('resolved_at'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('platform_incidents_org_idx').on(table.orgId),
    index('platform_incidents_policy_idx').on(table.policyId),
    index('platform_incidents_severity_idx').on(table.severity),
    index('platform_incidents_created_idx').on(table.createdAt),
  ],
);

export const alloyUsageEventsTable = pgTable(
  'platform_usage_events',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    workflowRunId: integer('workflow_run_id').references(() => alloyWorkflowRunsTable.id, {
      onDelete: 'set null',
    }),
    eventType: text('event_type', {
      enum: [
        'agent_run',
        'skill_invocation',
        'artifact_generated',
        'browser_task',
        'model_tokens',
        'approval_request',
      ],
    }).notNull(),
    quantity: integer('quantity').notNull().default(1),
    model: text('model'),
    agentId: text('agent_id'),
    skillSlug: text('skill_slug'),
    costCents: integer('cost_cents').notNull().default(0),
    billedAt: timestamp('billed_at'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('platform_usage_org_idx').on(table.orgId),
    index('platform_usage_event_type_idx').on(table.eventType),
    index('platform_usage_created_idx').on(table.createdAt),
  ],
);

export const insertAlloyWorkflowSchema = createInsertSchema(alloyWorkflowsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  runCount: true,
});
export type InsertAlloyWorkflowPlatform = z.infer<typeof insertAlloyWorkflowSchema>;
export type AlloyWorkflowPlatform = typeof alloyWorkflowsTable.$inferSelect;

export const insertAlloySignalSchema = createInsertSchema(alloySignalsTable).omit({
  id: true,
  createdAt: true,
  receivedAt: true,
});
export type InsertAlloySignalPlatform = z.infer<typeof insertAlloySignalSchema>;
export type AlloySignalPlatform = typeof alloySignalsTable.$inferSelect;

export const insertAlloyWorkflowRunSchema = createInsertSchema(alloyWorkflowRunsTable).omit({
  id: true,
  createdAt: true,
  queuedAt: true,
});
export type InsertAlloyWorkflowRunPlatform = z.infer<typeof insertAlloyWorkflowRunSchema>;
export type AlloyWorkflowRunPlatform = typeof alloyWorkflowRunsTable.$inferSelect;

export const insertAlloyArtifactSchema = createInsertSchema(alloyArtifactsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAlloyArtifactPlatform = z.infer<typeof insertAlloyArtifactSchema>;
export type AlloyArtifactPlatform = typeof alloyArtifactsTable.$inferSelect;

export const insertAlloyApprovalSchema = createInsertSchema(alloyApprovalsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAlloyApprovalPlatform = z.infer<typeof insertAlloyApprovalSchema>;
export type AlloyApprovalPlatform = typeof alloyApprovalsTable.$inferSelect;

export const insertAlloyAuditLogSchema = createInsertSchema(alloyAuditLogTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAlloyAuditLogPlatform = z.infer<typeof insertAlloyAuditLogSchema>;
export type AlloyAuditLogPlatform = typeof alloyAuditLogTable.$inferSelect;

export const insertAlloyPolicySchema = createInsertSchema(alloyPoliciesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAlloyPolicy = z.infer<typeof insertAlloyPolicySchema>;
export type AlloyPolicy = typeof alloyPoliciesTable.$inferSelect;

export const insertAlloyGovernanceIncidentSchema = createInsertSchema(
  alloyGovernanceIncidentsTable,
).omit({ id: true, createdAt: true });
export type InsertAlloyGovernanceIncident = z.infer<typeof insertAlloyGovernanceIncidentSchema>;
export type AlloyGovernanceIncident = typeof alloyGovernanceIncidentsTable.$inferSelect;

export const insertAlloyUsageEventSchema = createInsertSchema(alloyUsageEventsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAlloyUsageEvent = z.infer<typeof insertAlloyUsageEventSchema>;
export type AlloyUsageEvent = typeof alloyUsageEventsTable.$inferSelect;
