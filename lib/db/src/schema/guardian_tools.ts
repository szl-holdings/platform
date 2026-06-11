import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { usersTable } from './auth.js';
import { organizationsTable } from './organizations.js';

const GUARDIAN_TIER_ENUM = [
  'advisory',
  'supervised',
  'operator-approved',
  'dual-approved',
  'regulated',
  'sovereign',
] as const;

const RULE_ACTION_ENUM = [
  'allow',
  'deny',
  'require-approval',
  'require-dual-approval',
  'log',
  'redact',
  'escalate',
  'block',
] as const;

export const guardianPoliciesTable = pgTable(
  'guardian_policies',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    tier: text('tier', { enum: GUARDIAN_TIER_ENUM }).notNull(),
    conditions: jsonb('conditions').notNull().default([]),
    action: text('action', { enum: RULE_ACTION_ENUM }).notNull(),
    priority: integer('priority').notNull().default(100),
    enabled: boolean('enabled').notNull().default(true),
    owner: text('owner'),
    tags: jsonb('tags').notNull().default([]),
    allowedModels: jsonb('allowed_models'),
    allowedTools: jsonb('allowed_tools'),
    createdById: integer('created_by_id').references(() => usersTable.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('guardian_policies_org_idx').on(table.orgId),
    index('guardian_policies_tier_idx').on(table.tier),
    index('guardian_policies_enabled_idx').on(table.enabled),
    index('guardian_policies_priority_idx').on(table.priority),
  ],
);

export const guardianPolicyAssignmentsTable = pgTable(
  'guardian_policy_assignments',
  {
    id: serial('id').primaryKey(),
    policyId: integer('policy_id')
      .notNull()
      .references(() => guardianPoliciesTable.id, { onDelete: 'cascade' }),
    subjectType: text('subject_type', {
      enum: ['user', 'agent', 'team', 'role', 'org', 'workflow'],
    }).notNull(),
    subjectId: text('subject_id').notNull(),
    context: jsonb('context').notNull().default({}),
    grantedById: integer('granted_by_id').references(() => usersTable.id, { onDelete: 'set null' }),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('guardian_policy_assignments_policy_idx').on(table.policyId),
    index('guardian_policy_assignments_subject_idx').on(table.subjectType, table.subjectId),
    uniqueIndex('guardian_policy_assignments_unique_idx').on(
      table.policyId,
      table.subjectType,
      table.subjectId,
    ),
  ],
);

export const guardianActionsTable = pgTable(
  'guardian_actions',
  {
    id: serial('id').primaryKey(),
    requestId: text('request_id').notNull().unique(),
    agentId: text('agent_id'),
    sessionId: text('session_id'),
    workflowId: text('workflow_id'),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    tier: text('tier', { enum: GUARDIAN_TIER_ENUM }).notNull(),
    action: text('action').notNull(),
    toolId: text('tool_id'),
    model: text('model'),
    environment: text('environment'),
    outcome: text('outcome', {
      enum: ['allow', 'require-approval', 'require-dual-approval', 'block'],
    }).notNull(),
    matchedRuleId: text('matched_rule_id'),
    reason: text('reason').notNull(),
    rollbackRequired: boolean('rollback_required').notNull().default(false),
    rollbackToken: text('rollback_token'),
    redactApplied: boolean('redact_applied').notNull().default(false),
    controlViolations: jsonb('control_violations').notNull().default([]),
    payload: jsonb('payload').notNull().default({}),
    decidedAt: timestamp('decided_at').notNull().defaultNow(),
    executedAt: timestamp('executed_at'),
    rolledBackAt: timestamp('rolled_back_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('guardian_actions_agent_idx').on(table.agentId),
    index('guardian_actions_session_idx').on(table.sessionId),
    index('guardian_actions_tier_idx').on(table.tier),
    index('guardian_actions_outcome_idx').on(table.outcome),
    index('guardian_actions_org_idx').on(table.orgId),
    index('guardian_actions_created_idx').on(table.createdAt),
  ],
);

export const rollbackEventsTable = pgTable(
  'rollback_events',
  {
    id: serial('id').primaryKey(),
    actionId: text('action_id').notNull(),
    requestId: text('request_id').notNull(),
    agentId: text('agent_id'),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    tier: text('tier', { enum: GUARDIAN_TIER_ENUM }).notNull(),
    triggeredBy: text('triggered_by').notNull(),
    reason: text('reason').notNull(),
    status: text('status', {
      enum: ['pending', 'in-progress', 'completed', 'failed'],
    })
      .notNull()
      .default('pending'),
    metadata: jsonb('metadata').notNull().default({}),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('rollback_events_action_idx').on(table.actionId),
    index('rollback_events_request_idx').on(table.requestId),
    index('rollback_events_org_idx').on(table.orgId),
    index('rollback_events_status_idx').on(table.status),
    index('rollback_events_created_idx').on(table.createdAt),
  ],
);

export const guardianApprovalRequestsTable = pgTable(
  'guardian_approval_requests',
  {
    id: serial('id').primaryKey(),
    requestId: text('request_id').notNull().unique(),
    agentId: text('agent_id'),
    sessionId: text('session_id'),
    workflowId: text('workflow_id'),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    tier: text('tier', { enum: GUARDIAN_TIER_ENUM }).notNull(),
    action: text('action').notNull(),
    toolId: text('tool_id'),
    approvalType: text('approval_type', { enum: ['single', 'dual'] }).notNull(),
    status: text('status', {
      enum: ['pending', 'approved', 'rejected', 'expired', 'cancelled'],
    })
      .notNull()
      .default('pending'),
    requiredApprovers: jsonb('required_approvers').notNull().default([]),
    approvals: jsonb('approvals').notNull().default([]),
    payload: jsonb('payload').notNull().default({}),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('guardian_approval_requests_agent_idx').on(table.agentId),
    index('guardian_approval_requests_tier_idx').on(table.tier),
    index('guardian_approval_requests_status_idx').on(table.status),
    index('guardian_approval_requests_org_idx').on(table.orgId),
    index('guardian_approval_requests_created_idx').on(table.createdAt),
  ],
);

export const toolMeshToolsTable = pgTable(
  'tool_mesh_tools',
  {
    id: serial('id').primaryKey(),
    toolId: text('tool_id').notNull().unique(),
    name: text('name').notNull(),
    version: text('version').notNull().default('1.0.0'),
    description: text('description').notNull(),
    domainTags: jsonb('domain_tags').notNull().default([]),
    policyTier: text('policy_tier', { enum: GUARDIAN_TIER_ENUM }).notNull(),
    allowedEnvironments: jsonb('allowed_environments')
      .notNull()
      .default(['development', 'staging', 'production']),
    inputSchema: jsonb('input_schema'),
    outputSchema: jsonb('output_schema'),
    rateLimits: jsonb('rate_limits').notNull().default({}),
    timeoutMs: integer('timeout_ms').notNull().default(30000),
    failureModes: jsonb('failure_modes').notNull().default([]),
    approvalRequired: boolean('approval_required').notNull().default(false),
    owner: text('owner'),
    observabilityHooks: jsonb('observability_hooks').notNull().default({}),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('tool_mesh_tools_policy_tier_idx').on(table.policyTier),
    index('tool_mesh_tools_enabled_idx').on(table.enabled),
  ],
);

export const toolMeshToolVersionsTable = pgTable(
  'tool_mesh_tool_versions',
  {
    id: serial('id').primaryKey(),
    toolDbId: integer('tool_db_id')
      .notNull()
      .references(() => toolMeshToolsTable.id, { onDelete: 'cascade' }),
    version: text('version').notNull(),
    changelog: text('changelog'),
    schemaSnapshot: jsonb('schema_snapshot').notNull().default({}),
    publishedById: integer('published_by_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('tool_mesh_tool_versions_tool_idx').on(table.toolDbId),
    uniqueIndex('tool_mesh_tool_versions_tool_version_idx').on(table.toolDbId, table.version),
  ],
);

export const toolMeshToolPermissionsTable = pgTable(
  'tool_mesh_tool_permissions',
  {
    id: serial('id').primaryKey(),
    toolDbId: integer('tool_db_id')
      .notNull()
      .references(() => toolMeshToolsTable.id, { onDelete: 'cascade' }),
    subjectType: text('subject_type', {
      enum: ['user', 'agent', 'team', 'role', 'org'],
    }).notNull(),
    subjectId: text('subject_id').notNull(),
    permission: text('permission', {
      enum: ['invoke', 'read-schema', 'manage'],
    })
      .notNull()
      .default('invoke'),
    grantedById: integer('granted_by_id').references(() => usersTable.id, { onDelete: 'set null' }),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('tool_mesh_tool_permissions_tool_idx').on(table.toolDbId),
    index('tool_mesh_tool_permissions_subject_idx').on(table.subjectType, table.subjectId),
    uniqueIndex('tool_mesh_tool_permissions_unique_idx').on(
      table.toolDbId,
      table.subjectType,
      table.subjectId,
      table.permission,
    ),
  ],
);

export const toolMeshActionApprovalsTable = pgTable(
  'tool_mesh_action_approvals',
  {
    id: serial('id').primaryKey(),
    requestId: text('request_id').notNull().unique(),
    toolId: text('tool_id').notNull(),
    action: text('action').notNull(),
    agentId: text('agent_id'),
    sessionId: text('session_id'),
    workflowId: text('workflow_id'),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    status: text('status', {
      enum: ['pending', 'approved', 'rejected', 'expired', 'cancelled'],
    })
      .notNull()
      .default('pending'),
    policyId: integer('policy_id').references(() => guardianPoliciesTable.id, {
      onDelete: 'set null',
    }),
    decisionReason: text('decision_reason'),
    requestedById: integer('requested_by_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    approvedById: integer('approved_by_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    approvedAt: timestamp('approved_at'),
    rejectedById: integer('rejected_by_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    rejectedAt: timestamp('rejected_at'),
    expiresAt: timestamp('expires_at'),
    payload: jsonb('payload').notNull().default({}),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('tool_mesh_action_approvals_tool_idx').on(table.toolId),
    index('tool_mesh_action_approvals_status_idx').on(table.status),
    index('tool_mesh_action_approvals_org_idx').on(table.orgId),
    index('tool_mesh_action_approvals_agent_idx').on(table.agentId),
    index('tool_mesh_action_approvals_created_idx').on(table.createdAt),
  ],
);

export type GuardianPolicy = typeof guardianPoliciesTable.$inferSelect;
export type InsertGuardianPolicy = typeof guardianPoliciesTable.$inferInsert;

export type GuardianPolicyAssignment = typeof guardianPolicyAssignmentsTable.$inferSelect;
export type InsertGuardianPolicyAssignment = typeof guardianPolicyAssignmentsTable.$inferInsert;

export type GuardianAction = typeof guardianActionsTable.$inferSelect;
export type InsertGuardianAction = typeof guardianActionsTable.$inferInsert;

export type RollbackEvent = typeof rollbackEventsTable.$inferSelect;
export type InsertRollbackEvent = typeof rollbackEventsTable.$inferInsert;

export type GuardianApprovalRequest = typeof guardianApprovalRequestsTable.$inferSelect;
export type InsertGuardianApprovalRequest = typeof guardianApprovalRequestsTable.$inferInsert;

export type ToolMeshTool = typeof toolMeshToolsTable.$inferSelect;
export type InsertToolMeshTool = typeof toolMeshToolsTable.$inferInsert;

export type ToolMeshToolVersion = typeof toolMeshToolVersionsTable.$inferSelect;
export type InsertToolMeshToolVersion = typeof toolMeshToolVersionsTable.$inferInsert;

export type ToolMeshToolPermission = typeof toolMeshToolPermissionsTable.$inferSelect;
export type InsertToolMeshToolPermission = typeof toolMeshToolPermissionsTable.$inferInsert;

export type ToolMeshActionApproval = typeof toolMeshActionApprovalsTable.$inferSelect;
export type InsertToolMeshActionApproval = typeof toolMeshActionApprovalsTable.$inferInsert;

// ============================================================
// GUARDIAN TIERS — persisted tier definitions (controls + risk)
// Replaces in-memory `TIER_CONTROLS` constant when present.
// orgId NULL = global default tier definition.
// ============================================================

export const guardianTiersTable = pgTable(
  'guardian_tiers',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    tier: text('tier', { enum: GUARDIAN_TIER_ENUM }).notNull(),
    tierNumber: integer('tier_number').notNull(),
    description: text('description').notNull(),
    riskLevel: integer('risk_level').notNull(),
    controls: jsonb('controls').notNull().default({}),
    enabled: boolean('enabled').notNull().default(true),
    updatedById: integer('updated_by_id').references(() => usersTable.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('guardian_tiers_org_tier_idx').on(table.orgId, table.tier),
    index('guardian_tiers_enabled_idx').on(table.enabled),
  ],
);

export type GuardianTier = typeof guardianTiersTable.$inferSelect;
export type InsertGuardianTier = typeof guardianTiersTable.$inferInsert;

// ============================================================
// GUARDRAIL CONFIGS — persisted runtime guardrail configurations.
// Each row is a configurable guardrail (content filter, rate limit,
// tool restriction, DLP, model restriction, custom). Survives restart.
// orgId NULL = global default guardrail.
// ============================================================

const GUARDRAIL_TYPE_ENUM = [
  'content_filter',
  'rate_limit',
  'tool_restriction',
  'data_loss_prevention',
  'model_restriction',
  'custom',
] as const;

const GUARDRAIL_ENFORCEMENT_ENUM = ['enforce', 'monitor', 'disabled'] as const;

export const guardrailConfigsTable = pgTable(
  'guardrail_configs',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    guardrailId: text('guardrail_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    guardrailType: text('guardrail_type', { enum: GUARDRAIL_TYPE_ENUM }).notNull(),
    config: jsonb('config').notNull().default({}),
    appliesToTier: text('applies_to_tier', { enum: GUARDIAN_TIER_ENUM }),
    enforcement: text('enforcement', { enum: GUARDRAIL_ENFORCEMENT_ENUM })
      .notNull()
      .default('enforce'),
    enabled: boolean('enabled').notNull().default(true),
    createdById: integer('created_by_id').references(() => usersTable.id, { onDelete: 'set null' }),
    updatedById: integer('updated_by_id').references(() => usersTable.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('guardrail_configs_org_guardrail_idx').on(table.orgId, table.guardrailId),
    index('guardrail_configs_type_idx').on(table.guardrailType),
    index('guardrail_configs_tier_idx').on(table.appliesToTier),
    index('guardrail_configs_enabled_idx').on(table.enabled),
  ],
);

export type GuardrailConfig = typeof guardrailConfigsTable.$inferSelect;
export type InsertGuardrailConfig = typeof guardrailConfigsTable.$inferInsert;
